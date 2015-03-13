# stream-hasher [![Build Status](https://secure.travis-ci.org/tapirdata/stream-hasher.png?branch=master)](https://travis-ci.org/tapirdata/stream-hasher) [![Dependency Status](https://david-dm.org/tapirdata/stream-hasher.svg)](https://david-dm.org/tapirdata/stream-hasher) [![devDependency Status](https://david-dm.org/tapirdata/stream-hasher/dev-status.svg)](https://david-dm.org/tapirdata/stream-hasher#info=devDependencies)
> A transform-stream that emits hash-digest of streams or vinyl-file-streams 

## Features

Works with buffer- and file- vinyl-streams, optionally renames files.

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
  .resume();  // it's a stream2, so pipe it along or dump it, otherwise it will stuck.
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

#### var hasher = new SingleStream(options);

creates a new hasher-object. Avaialbe options:

`options.algorithm`: the hash-algorithm to be used (default: 'sha1')

`options.digestEncoding`: the encoding



`options.fileNamer`: a function  



