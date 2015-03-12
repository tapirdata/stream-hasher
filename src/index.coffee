'use strict'
path = require 'path'
events = require 'events'
crypto = require 'crypto'
stream = require 'readable-stream'


class SingleHasher extends stream.Transform
  constructor: (name, options) ->
    super()
    if typeof name == 'object'
      options = name
      name = options.name
    else    
      options = options or {}
    @name = name
    @algorithm = options.algorithm or 'sha1'
    @digestEncoding = options.digestEncoding or 'hex'
    @hashStream = @createHashStream()
    @on 'end', ->
      @hashStream.end()
      digest = @hashStream.read()
      if @digestEncoding != 'none'
        digest = digest.toString @digestEncoding
      @emit 'digest', digest, @name
      return
    return

  createHashStream: ->  
    crypto.createHash @algorithm
    
  _transform: (chunk, enc, next) ->
    @hashStream.write chunk, enc, ->
      next null, chunk
      return


class VinylHasher extends stream.Transform
  constructor: (options) ->
    super objectMode: true
    @options = options or {}
    @fileNamer = @options.fileNamer or (file) -> file.path

  createSingleHasher: (name) ->
    singleHasher = new SingleHasher name, @options
    singleHasher.on 'digest', (digest, name) =>
      @emit 'digest', digest, name

  _transform: (file, enc, next) ->
    singleHasher = @createSingleHasher @fileNamer file
    if file.isStream()
      file.contents = file.contents.pipe singleHasher
      next null, file
    else  
      singleHasher.end file.contents, null, ->
        singleHasher.resume()
        next null, file
        return
    return

factory = (options) ->
  if options and options.single
    new SingleHasher options
  else  
    new VinylHasher options

factory.SingleHasher = SingleHasher
factory.VinylHasher = VinylHasher
module.exports = factory


