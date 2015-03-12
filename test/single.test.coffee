fs = require 'fs'
path = require 'path'
_ = require 'lodash'
chai = require 'chai'
expect = chai.expect

streamHasher = require '../src'

expectedDigests =
  'fixtures/eels.txt': '15390ef2ebb49260800bde88fda1e054791bb5fb'
  'fixtures/lorem.txt': '7b11c5dd6b01cea150834856c25840d84500d79a'


makeTests = (title, options) ->

  describe title, ->

    digest = null

    before (done) ->
      hasher = streamHasher single: true
      hasher.on 'digest', (_digest) ->
        digest = _digest

      fs.createReadStream path.join __dirname, options.relPath
      .pipe hasher
      .on 'end', done
      .resume()
     
    it 'should emit the correct hash', -> 
      expect(digest).to.be.equal expectedDigests[options.relPath]



describe 'stream-hasher createDataThrough', ->

  makeTests 'Short File',
    relPath: 'fixtures/eels.txt'

  makeTests 'Long File',
    relPath: 'fixtures/lorem.txt'


