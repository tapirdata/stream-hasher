fs = require 'fs'
path = require 'path'
_ = require 'lodash'
vinylFs = require 'vinyl-fs'
vinylTapper = require 'vinyl-tapper'
chai = require 'chai'
expect = chai.expect
streamHasher = require '../src'


fileCount = 2

expectedDigests =
  'fixtures/eels.txt': '15390ef2ebb49260800bde88fda1e054791bb5fb'
  'fixtures/lorem.txt': '7b11c5dd6b01cea150834856c25840d84500d79a'


makeTests = (title, options) ->

  describe title, ->

    tapResults = {}
    digests = {}

    tagger = (file) -> path.relative __dirname, file.path

    before (done) ->
      hasher = streamHasher
        rename: options.rename
        digestLength: options.digestLength
        optioner: options.optioner
        tagger: tagger
      hasher.on 'digest', (digest, tag) ->
        digests[tag] = digest

      tapper = vinylTapper
        provideBuffer: true
        terminate: true
      tapper.on 'tap', (file, buffer) ->
        # console.log 'file=', file
        tapResults[tagger file] = 
          file: file
          buffer: buffer

      well = vinylFs.src 'fixtures/**/*',
        cwd: __dirname
        buffer: options.useBuffer
      well
        .pipe hasher
        .pipe tapper
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
        originalPath = file.history[0]
        expect(fs.readFileSync originalPath, 'utf8').to.be.equal buffer.toString 'utf8'

    it 'should emit the correct hashes', ->
      for tag, expectedDigest of expectedDigests
        if options.digestLength
          expectedDigest = expectedDigest.slice 0, options.digestLength
        expect(digests[tag]).to.be.equal expectedDigest
    
    if options.rename or options.optioner
      it 'should rename files', ->
        for tag, {file: file, buffer: buffer} of tapResults
          originalTag = path.relative __dirname, file.history[0]
          expectedDigest = expectedDigests[originalTag]
          if options.digestLength
            expectedDigest = expectedDigest.slice 0, options.digestLength
          console.log 'rename:', tag, expectedDigest
          expect(tag).to.contain expectedDigest


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

  makeTests 'with stream-files, rename function',
    useBuffer: false
    rename: (name, digest) ->
      "#{name}-#{digest}"

  makeTests 'with stream-files, use optioner',
    useBuffer: false
    optioner: (file) ->
      rename: 'postfix'

  makeTests 'with stream-files, rename, short digest',
    useBuffer: false
    rename: 'postfix'
    digestLength: 8

