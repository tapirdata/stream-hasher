'use strict'
path = require 'path'
events = require 'events'
crypto = require 'crypto'
stream = require 'readable-stream'


class DataThrough extends stream.Transform
  constructor: (@hasher, @name) ->
    super()
    @hashStream = crypto.createHash 'sha1'
    
    @on 'end', ->
      @hashStream.end()
      digest = @hashStream.read().toString 'hex'
      @hasher.emitDigest @name, digest

  _transform: (chunk, enc, next) ->
    # console.log 'DataThrough._transform name=%s, chunk=', @name, chunk
    @hashStream.write chunk, enc, ->
      next null, chunk


class FileThrough extends stream.Transform
  constructor: (@hasher) ->
    super objectMode: true

  _transform: (file, enc, next) ->
    dataThrough = @hasher.createDataThrough file
    # console.log 'FileThrough._transform file=', file
    if file.isStream()
      # file = file.clone()
      file.contents = file.contents.pipe dataThrough
      next null, file
    else  
      dataThrough.end file.contents, null, ->
        dataThrough.resume()
        next null, file


class StreamHasher extends events.EventEmitter
  constructor: (@options) ->

  createDataThrough: (file) ->
    new DataThrough @, file.path

  createFileThrough: ->
    new FileThrough @

  emitDigest: (name, digest) ->
    @emit 'digest', name, digest


module.exports = StreamHasher

