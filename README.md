# stream-hasher [![Build Status](https://secure.travis-ci.org/tapirdata/stream-hasher.png?branch=master)](https://travis-ci.org/tapirdata/stream-hasher) [![Dependency Status](https://david-dm.org/tapirdata/stream-hasher.svg)](https://david-dm.org/tapirdata/stream-hasher) [![devDependency Status](https://david-dm.org/tapirdata/stream-hasher/dev-status.svg)](https://david-dm.org/tapirdata/stream-hasher#info=devDependencies)
> A transform-stream that emits hash-digests of streams or vinyl-file-streams

## Features

Works with vinyl-streams in buffer- and stream-mode, optionally renames files.

## Usage

### Single Data Stream

``` js
var fs = require('fs');
var streamHasher = require('stream-hasher');

var hasher = streamHasher({single: true});
hasher.on('digest', function(digest) {
  console.log('digest=%s', digest)
});

fs.createReadStream('package.json')
  .pipe(hasher)
  .resume();
  // it's a stream2, so pipe it along or dump it, otherwise it will stuck.
```

### Vinyl File Stream

``` js
var vinylFs = require('vinyl-fs');
var streamHasher = require('stream-hasher');

var hasher = streamHasher();
hasher.on('digest', function(digest, tag) {
  console.log('digest=%s tag=%s', digest, tag)
});

vinylFs.src(['src/**/*.js'], {buffer: false}) // works with 'buffer: true', too 
  .pipe(hasher)
  .pipe(vinylFs.dest('dist'));
```

## API

#### var hasher = streamHasher(options);

creates a new hasher. Recognized options are:

- `options.algorithm`: the hash-algorithm to be used (default: 'sha1'). See [crypto.createHash](https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm) for available algorithms.
- `options.digestEncoding`: how the resulting digest is encoded (default: 'hex'). See [Buffer#toString](https://nodejs.org/api/buffer.html#buffer_buf_tostring_encoding_start_end) for available encodings. Use 'buffer' to get a bare buffer.
- `options.digestLength`: if supplied, the digest length is limited to this length
- `options.single`: If true, create a hasher that transforms a single data-stream. If false (default), create a hasher to transform a vinyl-file-stream. In latter case, the following additional options are recognized:
  - `options.tagger`: a `function(file)` that generates the *tag* from the processed vinyl-file. Defaults to a function that returns `file.path`.
  - `options.optioner`: a `function(file)` that generates an object to overwrite options per vinyl-file
  - `options.rename`: a function that takes the original file name (without extension) and the calculated digest and should a replacement file name. The strings 'postfix' and 'prefix' can be used, too. They expose some standard replacers.
  - `options.renameFile`: to obtain even finer contol of renaming supply a function that take a viny-file and the digest to directly manipulate the file's path. 
  - `options.maxSingleSize`: In the special case of an stream-file to be renamed, the digest must me emmitted before the file can be passed forward. Then is value is used to set the `highWaterMark` for processing that file to prevent deadlocking. Default is 16MB.

### Event 'digest'

is emmitted for every calculated hash-digest

- `digest`: the calculated digest
- `tag`: the file's tag
- `newTag`: if renaming was specified, this is the file's *tag* after renaming


