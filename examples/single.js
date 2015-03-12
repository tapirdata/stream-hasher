var fs = require('fs');
var streamHasher = require('stream-hasher');

var hasher = streamHasher({single: true});
hasher.on('digest', function(digest) {
  console.log('digest=%s', digest)
});

fs.createReadStream('package.json')
  .pipe(hasher)
  .resume();  // or pipe it along


