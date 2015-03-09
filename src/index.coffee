'use strict'
path = require 'path'
events = require 'events'
crypto = require 'crypto'
through2 = require 'through2'


class State
  constructor: (@hasher) ->
    @hashStream = crypto.createHash 'sha1'

  write: (chunk) ->  
    @hashStream.write chunk

  end: ->  
    @hashStream.end()
    digest = @hashStream.read().toString 'hex'
    # console.log 'digest=', digest
    @hasher.emit 'hashDigest', digest


class Hasher extends events.EventEmitter
  constructor: (@options) ->

  createState: ->  
    new State @

  createStream: ->
    state = @createState()
    stream = through2 (chunk, enc, cb) ->
      # console.log 'hasher', chunk.length
      state.write chunk
      @push chunk
      cb()
    stream.on 'end', ->
      state.end()
    stream

  createVinylStream: ->
    through2.obj (file, enc, cb) =>
      # console.log 'createVinylStream file:', file.isStream(), file.path
      if file.isStream()
        file.contents = file.contents.pipe @createStream()
      cb null, file
      return

module.exports = Hasher

