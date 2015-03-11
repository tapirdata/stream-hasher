var fs = require('fs');
var StreamHasher = require('stream-hasher');

var hasher = new StreamHasher.SingleHasher();
hasher.on('digest', function(digest) {
  console.log('digest=%s', digest)
});

fs.createReadStream('package.json')
  .pipe(hasher)
  .resume();  // or pipe it along


