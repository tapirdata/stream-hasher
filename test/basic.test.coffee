fs = require 'fs'
path = require 'path'
_ = require 'lodash'
vinylFs = require 'vinyl-fs'
chai = require 'chai'
expect = chai.expect

VinylTap = require './vinyl-tap'
StreamHasher = require '../src'


fileCount = 2

expectedDigests =
  'fixtures/eels.txt': '15390ef2ebb49260800bde88fda1e054791bb5fb'
  'fixtures/lorem.txt': '7b11c5dd6b01cea150834856c25840d84500d79a'


makeTests = (title, options) ->

  describe title, ->

    tapResults = {}
    digests = {}

    before (done) ->
      hasher = new StreamHasher()
      hasher.on 'digest', (name, digest) ->
        # console.log '!digest name=%s digest=%s', name, digest
        digests[path.relative __dirname, name] = digest

      tap = new VinylTap needBuffer: true
      tap.on 'tap', (file, buffer) ->
        tapResults[file.relative] = 
          file: file
          buffer: buffer

      well = vinylFs.src 'fixtures/**/*',
        cwd: __dirname
        buffer: options.useBuffer
      well
        .pipe hasher.createFileThrough()
        .pipe tap
        .on 'end', done
        .resume()

    it 'should pass all files', ->
      expect(_.keys tapResults).to.have.length fileCount

    it 'should hash all files', ->
      expect(_.keys digests).to.have.length fileCount

    it 'should pass file types unmodified', ->
      for name, {file: file, buffer: buffer} of tapResults
        expect(file.isBuffer()).to.be.equal options.useBuffer

    it 'should pass file contents unmodified', ->
      for name, {file: file, buffer: buffer} of tapResults
        expect(fs.readFileSync file.path, 'utf8').to.be.equal buffer.toString 'utf8'

    it 'should create the correct hashes', ->
      for name, expectedDigest of expectedDigests
        # console.log name, expectedDigest
        expect(digests[name]).to.be.equal expectedDigest



describe 'stream-hasher', ->

  makeTests 'Buffer',
    useBuffer: true

  makeTests 'Stream',
    useBuffer: false

