import path from 'path';
import events from 'events';
import crypto from 'crypto';
import stream from 'readable-stream';
import _ from 'lodash';

class SingleHasher extends stream.Transform {

  constructor(tag, options) {
    super(options);
    if (typeof tag === 'object') {
      options = tag;
      ({ tag } = options);
    } else {    
      options = options || {};
    }
    this.tag = tag;
    this.algorithm = options.algorithm || 'sha1';
    this.digestEncoding = options.digestEncoding || 'hex';
    this.digestLength = options.digestLength;
    this.hashStream = this.createHashStream();
    this.on('finish', function() {
      this.hashStream.end();
      let digest = this.hashStream.read();
      if (this.digestEncoding !== 'buffer') {
        digest = digest.toString(this.digestEncoding);
      }
      if (this.digestLength != null) {
        digest = digest.slice(0, this.digestLength);
      }
      this.emit('digest', digest, this.tag);
    }
    );
  }

  createHashStream() {  
    return crypto.createHash(this.algorithm);
  }
    
  _transform(chunk, enc, next) {
    return this.hashStream.write(chunk, enc, function() {
      next(null, chunk);
    }
    );
  }
}

SingleHasher.optionNames = ['algorithm', 'digestEncoding', 'digestLength'];


function createRenameFile (rename) {
  return function(file, digest) {
    const ext = path.extname(file.path);
    const name = rename(path.basename(file.path, ext), digest);
    file.path = path.join(path.dirname(file.path), name + ext);
  }
}
;


class VinylHasher extends stream.Transform {

  constructor(options = {}) {
    super({objectMode: true});
    this.tagger = options.tagger || (file => file.path);
    this.optioner = options.optioner;
    this.maxSingleSize = options.maxSingleSize || (16 * 1024 * 1024);
    this.defaultFileOptions = this.createDefaultFileOptions(options);
  }

  createDefaultFileOptions(options) {
    const fileOptions = _.pick(options, this.constructor.SingleClass.optionNames);
    fileOptions.renameFile = options.renameFile;
    fileOptions.rename = options.rename;
    return fileOptions;
  }

  getFileOptions(file) {
    const options = _.clone(this.defaultFileOptions);
    if (this.optioner) {
      _.merge(options, this.optioner(file));
    }
    if (options.renameFile) {
      if (typeof options.renameFile !== 'function') {
        throw new Error(`renameFile must be a function, got ${options.renameFile}`);
      }
    } else if (options.rename) {
      let { rename } = options;
      if (typeof rename !== 'function') {
        rename = this.standardRenames[rename];
        if (rename == null) {
          throw new Error(`no standard rename: '${options.rename}'`);
        }
      }
      options.renameFile = createRenameFile(rename);
    }
    if (options.renameFile) {
      // if we want to rename, singleHasher must see the whole
      // file before it emits the hash, that we need for renaming
      options.highWaterMark = this.maxSingleSize;
    }
    return options;
  }

  createSingleHasher(tag, options) {
    return new this.constructor.SingleClass(tag, options);
  }

  _transform(file, enc, next) {
    try {
      var options = this.getFileOptions(file);
    } catch (err) {  
      next(err);
      return;
    }
    const tag = this.tagger(file);
    const singleHasher = this.createSingleHasher(tag, options);

    const hashIt = function(done) {
      if (file.isStream()) {
        file.contents = file.contents.pipe(singleHasher);
        done();
      } else {
        singleHasher.end(file.contents, null, function() {
          done();
        }
        );
        singleHasher.resume();
      }
    };

    if (options.renameFile) {
      singleHasher.on('digest', (digest, tag) => {
        options.renameFile(file, digest);
        this.emit('digest', digest, tag, this.tagger(file));
        next(null, file);
      }
      );
      hashIt(function() {});
    } else {
      singleHasher.on('digest', (digest, tag) => {
        return this.emit('digest', digest, tag);
      }
      );
      hashIt(() => next(null, file));
    }
  }
}

VinylHasher.SingleClass = SingleHasher;

VinylHasher.prototype.standardRenames = {
  postfix(name, digest) { return `${name}-${digest}`; },
  prefix(name, digest) { return `${digest}-${name}`; }
};




const factory = function(options) {
  if (options && options.single) {
    return new SingleHasher(options);
  } else {  
    return new VinylHasher(options);
  }
};

factory.SingleHasher = SingleHasher;
factory.VinylHasher = VinylHasher;
export default factory;


