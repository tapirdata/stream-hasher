var vinylFs = require('vinyl-fs');
var streamHasher = require('stream-hasher');

var hasher = streamHasher();
hasher.on('digest', function(digest, tag) {
  console.log('digest=%s tag=%s', digest, tag)
});

vinylFs.src(['src/**/*.js'], {buffer: false})
// works with 'buffer: true', too
  .pipe(hasher)
  .pipe(vinylFs.dest('dist'));

