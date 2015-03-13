fs = require 'fs'
path = require 'path'
_ = require 'lodash'
vinylFs = require 'vinyl-fs'
chai = require 'chai'
expect = chai.expect

VinylTap = require './vinyl-tap'
streamHasher = require '../src'


fileCount = 2

expectedDigests =
  'fixtures/eels.txt': '15390ef2ebb49260800bde88fda1e054791bb5fb'
  'fixtures/lorem.txt': '7b11c5dd6b01cea150834856c25840d84500d79a'


makeTests = (title, options) ->

  originalPath = (renamedPath) ->
    if options.rename
      parts = path.parse renamedPath
      name = parts.name.replace /\-[a-z0-9]+$/, ''
      path.join parts.dir, name + parts.ext
    else
      renamedPath


  describe title, ->

    tapResults = {}
    digests = {}

    before (done) ->
      hasher = streamHasher
        rename: options.rename
        digestLength: options.digestLength
      hasher.on 'digest', (digest, tag) ->
        digests[path.relative __dirname, tag] = digest

      tap = new VinylTap needBuffer: true, isLast: true
      tap.on 'tap', (file, buffer) ->
        # console.log 'file=', file
        tapResults[file.relative] = 
          file: file
          buffer: buffer

      well = vinylFs.src 'fixtures/**/*',
        cwd: __dirname
        buffer: options.useBuffer
      well
        .pipe hasher
        .pipe tap
        .on 'end', done

    it 'should pass all files', ->
      expect(_.keys tapResults).to.have.length fileCount

    it 'should hash all files', ->
      expect(_.keys digests).to.have.length fileCount

    it 'should pass file types unmodified', ->
      for tag, {file: file, buffer: buffer} of tapResults
        expect(file.isBuffer()).to.be.equal options.useBuffer

    it 'should pass file contents unmodified', ->
      for tag, {file: file, buffer: buffer} of tapResults
        expect(fs.readFileSync (originalPath file.path), 'utf8').to.be.equal buffer.toString 'utf8'

    it 'should emit the correct hashes', ->
      for tag, expectedDigest of expectedDigests
        if options.digestLength
          expectedDigest = expectedDigest.slice 0, options.digestLength
        expect(digests[tag]).to.be.equal expectedDigest



describe 'stream-hasher for vinly-stream', ->

  makeTests 'with buffer-files',
    useBuffer: true
    rename: false

  makeTests 'with stream-files',
    useBuffer: false
    rename: false

  makeTests 'with buffer-files, rename',
    useBuffer: true
    rename: 'postfix'

  makeTests 'with stream-files, rename',
    useBuffer: false
    rename: 'postfix'

  makeTests 'with stream-files, rename, short digest',
    useBuffer: false
    rename: 'postfix'
    digestLength: 8

