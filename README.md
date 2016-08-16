# stream-hasher

[![npm version](https://img.shields.io/npm/v/stream-hasher.svg?style=flat-square)](https://www.npmjs.com/package/stream-hasher)
[![Build Status](https://secure.travis-ci.org/tapirdata/stream-hasher.png?branch=master)](https://travis-ci.org/tapirdata/stream-hasher) 
[![Dependency Status](https://david-dm.org/tapirdata/stream-hasher.svg)](https://david-dm.org/tapirdata/stream-hasher)
[![devDependency Status](https://david-dm.org/tapirdata/stream-hasher/dev-status.svg)](https://david-dm.org/tapirdata/stream-hasher#info=devDependencies)

> A transform-stream that emits hash-digests of streams or vinyl-file-streams

## Features

Works with vinyl-streams in buffer- and stream-mode, optionally renames files.

## Usage

### Single Data Stream

``` js
import fs from 'fs';
import streamHasher from 'stream-hasher';

const hasher = streamHasher({single: true});
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
import vinylFs from 'vinyl-fs';
import streamHasher from 'stream-hasher';

const hasher = streamHasher();
hasher.on('digest', function(digest, tag) {
  console.log('digest=%s tag=%s', digest, tag)
});

vinylFs.src(['src/**/*.js'], {buffer: false}) // works with 'buffer: true', too 
  .pipe(hasher)
  .pipe(vinylFs.dest('dist'));

```

## API

#### const hasher = streamHasher(options);

Creates a new hasher. Recognized options are:

- `algorithm` (string, default: `'sha1'`): the hash-algorithm to be used. See [crypto.createHash](https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm) for available algorithms.
- `digestEncoding` (string, default: `'hex'`): how the resulting digest is encoded. See [Buffer#toString](https://nodejs.org/api/buffer.html#buffer_buf_tostring_encoding_start_end) for available encodings. Use 'buffer' to get a bare buffer.
- `digestLength` (number): if supplied, the digest length is limited to this length.
- `single` (boolean, default: `false`): If true, create a hasher that transforms a single data-stream. If false, create a hasher to transform a vinyl-file-stream. In latter case, the following additional options are recognized:
  - `tagger` (`function(file)`): a function that generates the **tag** from the processed vinyl-file. Defaults to a function that returns `file.path`.
  - `optioner` (`function(file)`): a function that generates an object to overwrite options per vinyl-file.
  - `rename`: (`function(basename, digest)` or string): a function that takes the original file name (without extension) and the calculated digest and should return a replacement file name. The strings 'postfix' and 'prefix' can be used, too. They expose some standard replacers.
  - `renameFile` (`function (file)`): to obtain even finer control of renaming supply a function that takes a vinyl-file and the digest to directly manipulate the file's path. 
  - `maxSingleSize` (number): In the special case of an stream-file to be renamed, the digest must me emitted before the file can be passed forward. Then is value is used to set the `highWaterMark` for processing that file to prevent deadlocking. Default is 16MB.

### Event 'digest'

is emitted for every calculated hash-digest

- `digest`: the calculated digest
- `tag`: the file's **tag**
- `newTag`: if renaming was specified, this is the file's **tag** after renaming


