var vinylFs = require('vinyl-fs');
var streamHasher = require('stream-hasher');

var hasher = streamHasher();
hasher.on('digest', function(digest, name) {
  console.log('digest=%s name=%s', digest, name)
});

vinylFs.src(['./**/*.js'], {buffer: false}) // works with 'buffer: true', too 
  .pipe(hasher)
  .pipe(vinylFs.dest('dist'));

