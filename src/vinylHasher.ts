import _ from 'lodash';
import path from 'path';
import { Transform, TransformCallback } from 'stream';
import File from 'vinyl';
import { SingleHasher } from '.';

type Done = (error?: Error) => void;

import { HasherOptions, Rename, RenameFile, RenamesBag, Tagger } from './options';
import { SingleHasherClass } from './singleHasher';

function createRenameFile(rename: Rename): RenameFile {
  return (file: File, digest: string) => {
    const ext = path.extname(file.path);
    const name = rename(path.basename(file.path, ext), digest);
    file.path = path.join(path.dirname(file.path), name + ext);
  };
}

export class VinylHasher extends Transform {
  protected tagger: Tagger;
  protected optioner?: (file: File) => unknown;
  protected maxSingleSize: number;
  protected defaultFileOptions: HasherOptions;

  getSingleClass(): SingleHasherClass {
    return SingleHasher;
  }

  constructor(options: HasherOptions = {}) {
    super({ objectMode: true });
    this.tagger = options.tagger || ((file) => file.path);
    this.optioner = options.optioner;
    this.maxSingleSize = options.maxSingleSize || 16 * 1024 * 1024;
    this.defaultFileOptions = this.createDefaultFileOptions(options);
  }

  protected createSingleHasher(tag: string, options: HasherOptions): SingleHasher {
    const SingleClass = this.getSingleClass();
    return new SingleClass(tag, options);
  }

  public _transform(file: File, enc: BufferEncoding, next: TransformCallback): void {
    let options: HasherOptions;
    try {
      options = this.getFileOptions(file);
    } catch (err) {
      if (err instanceof Error) {
        next(err);
      } else {
        throw err;
      }
      return;
    }
    const tag = this.tagger(file);
    const singleHasher = this.createSingleHasher(tag, options);

    const hashIt = (done: Done) => {
      if (file.isStream()) {
        file.contents = file.contents.pipe(singleHasher);
        done();
      } else {
        singleHasher.end(file.contents, undefined, () => {
          done();
        });
        singleHasher.resume();
      }
    };

    if (options.renameFile as RenameFile) {
      singleHasher.on('digest', (digest: string, tag1: string) => {
        (options.renameFile as RenameFile)(file, digest);
        this.emit('digest', digest, tag1, this.tagger(file));
        next(null, file);
      });
      hashIt(() => null);
    } else {
      singleHasher.on('digest', (digest: string, tag1: string) => {
        return this.emit('digest', digest, tag1);
      });
      hashIt(() => next(null, file));
    }
  }

  protected createDefaultFileOptions(options: HasherOptions): HasherOptions {
    const SingleClass = this.getSingleClass();
    const fileOptions = _.pick(options, SingleClass.optionNames);
    fileOptions.renameFile = options.renameFile;
    fileOptions.rename = options.rename;
    return fileOptions;
  }

  protected getFileOptions(file: File): HasherOptions {
    const options = _.clone(this.defaultFileOptions);
    if (this.optioner) {
      _.merge(options, this.optioner(file));
    }
    if (options.renameFile) {
      if (typeof options.renameFile !== 'function') {
        throw new Error(`renameFile must be a function, got ${JSON.stringify(options.renameFile)}`);
      }
    } else if (options.rename) {
      let { rename } = options;
      if (typeof rename !== 'function') {
        rename = this.getStandardRenames()[rename];
        if (rename == null) {
          throw new Error(`no standard rename: '${JSON.stringify(options.rename)}'`);
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

  getStandardRenames(): RenamesBag {
    return {
      postfix(name: string, digest: string): string {
        return `${name}-${digest}`;
      },
      prefix(name: string, digest: string): string {
        return `${digest}-${name}`;
      },
    };
  }
}
