var vinylFs = require('vinyl-fs');
var StreamHasher = require('stream-hasher');

var hasher = new StreamHasher.MultiHasher();
hasher.on('digest', function(digest, name) {
  console.log('digest=%s name=%s', digest, name)
});

vinylFs.src(['./**/*.js'], {buffer: false}) // works with 'buffer: true', too 
  .pipe(hasher)
  .pipe(vinylFs.dest('tmp'))

