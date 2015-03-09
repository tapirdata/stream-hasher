fs = require 'fs'
path = require 'path'
_ = require 'lodash'
through2 = require 'through2'
vinylFs = require 'vinyl-fs'
vinylBuffer = require 'vinyl-buffer'
chai = require 'chai'
expect = chai.expect

StreamHasher = require '../src'


vCheck = (checkFile) ->
  transformFunction = (file, enc, cb) ->
    if file
      # console.log 'vCheck file:', file.isStream(), file.path
      # if file.isBuffer()
      #   console.log 'length=', file.contents.length

      if checkFile
        checkFile(file)
    else
      console.log 'vCheck no file'
    cb()

  flushFunction = through2.obj (cb) ->
    console.log 'vCheck end'
    cb()

  through2.obj transformFunction, flushFunction  


expectedDigests =
  'fixtures/eels.txt': '15390ef2ebb49260800bde88fda1e054791bb5fb'

makeTests = (title, options) ->

  describe title, ->
    hasher = new StreamHasher()
    vStream = null
    before ->
      vStream = vinylFs.src 'fixtures/**/*',
        cwd: __dirname
        buffer: options.useBuffer
      vStream = vStream.pipe hasher.createVinylStream()

    it 'should pass target unmodified', (done) ->
      vStream = vStream
        .pipe vinylBuffer()
        .pipe vCheck (file) ->
          expect(fs.readFileSync file.path, 'utf8').to.be.equal file.contents.toString 'utf8'
        .on 'unpipe', -> done()
   

describe 'stream-hasher', ->

  # makeTests 'Buffer',
  #   useBuffer: true

  makeTests 'Stream',
    useBuffer: false

