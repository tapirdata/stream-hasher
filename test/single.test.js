import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import chai from 'chai';
let { expect } = chai;

import streamHasher from '../src';

let expectedDigests = {
  'fixtures/eels.txt': '15390ef2ebb49260800bde88fda1e054791bb5fb',
  'fixtures/lorem.txt': '7b11c5dd6b01cea150834856c25840d84500d79a'
};


function makeTests(title, options) {

  describe(title, function() {

    let digest = null;

    before((done) => {
      let hasher = streamHasher({single: true});
      hasher.on('digest', _digest => digest = _digest
      );

      return fs.createReadStream(path.join(__dirname, options.relPath))
      .pipe(hasher)
      .on('end', done)
      .resume();
    });
     
    return it('should emit the correct hash', () =>
      expect(digest).to.be.equal(expectedDigests[options.relPath])
    );
  });
}



describe('stream-hasher for single stream', function() {

  makeTests('with short file',
    {relPath: 'fixtures/eels.txt'}
  );

  return makeTests('with long file',
    {relPath: 'fixtures/lorem.txt'}
  );
}
);


