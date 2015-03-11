# stream-hasher [![Build Status](https://secure.travis-ci.org/tapirdata/stream-hasher.png?branch=master)](https://travis-ci.org/tapirdata/stream-hasher) [![Dependency Status](https://david-dm.org/tapirdata/stream-hasher.svg)](https://david-dm.org/tapirdata/stream-hasher) [![devDependency Status](https://david-dm.org/tapirdata/stream-hasher/dev-status.svg)](https://david-dm.org/tapirdata/stream-hasher#info=devDependencies)
> A transform-stream that emits hash-digest of streams or vinyl-file-streams 

## Features

Works with buffer- and file- vinyl-streams.

## Usage

### Single Data Stream

``` js
var fs = require('fs');
var StreamHasher = require('stream-hasher');

var hasher = new StreamHasher.SingleHasher();
hasher.on('digest', function(digest) {
  console.log('digest=%s', digest)
});

fs.createReadStream('package.json')
  .pipe(hasher)
  .resume();  // or pipe it along
```

### File Stream

``` js
var vinylFs = require('vinyl-fs');
var StreamHasher = require('stream-hasher');

var hasher = new StreamHasher.MultiHasher();
hasher.on('digest', function(digest, name) {
  console.log('digest=%s name=%s', digest, name)
});

vinylFs.src(['./**/*.js'], {buffer: false}) // works with 'buffer: true', too 
  .pipe(hasher)
  .pipe(vinylFs.dest('tmp'))
```

## API

#### var hasher = new SingleStream(options);

creates a new hasher-object. Avaialbe options:

`options.algorithm`: the hash-algorithm to be used (default: 'sha1')

`options.digestEncoding`: the encoding



`options.fileNamer`: a function  



