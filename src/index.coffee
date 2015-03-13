'use strict'
path = require 'path'
events = require 'events'
crypto = require 'crypto'
stream = require 'readable-stream'
_ = require 'lodash'

class SingleHasher extends stream.Transform

  @optionNames = ['algorithm', 'digestEncoding', 'digestLength']

  constructor: (tag, options) ->
    super options
    if typeof tag == 'object'
      options = tag
      tag = options.tag
    else    
      options = options or {}
    @tag = tag
    @algorithm = options.algorithm or 'sha1'
    @digestEncoding = options.digestEncoding or 'hex'
    @digestLength = options.digestLength
    @hashStream = @createHashStream()
    @on 'finish', ->
      @hashStream.end()
      digest = @hashStream.read()
      if @digestEncoding != 'buffer'
        digest = digest.toString @digestEncoding
      if @digestLength?
        digest = digest.slice 0, @digestLength
      @emit 'digest', digest, @tag
      return
    return

  createHashStream: ->  
    crypto.createHash @algorithm
    
  _transform: (chunk, enc, next) ->
    @hashStream.write chunk, enc, ->
      next null, chunk
      return

createRenameFile = (rename) ->
  if typeof path.parse == 'function'
    (file, digest) ->
      parts = path.parse file.path
      name = rename parts.name, digest
      file.path = path.join parts.dir, name + parts.ext
  else   
    (file, digest) ->
      ext = path.extname file.path
      name = path.basename file.path, ext
      name = rename name, digest
      file.path = path.join path.dirname(file.path), name + ext


class VinylHasher extends stream.Transform

  @SingleClass = SingleHasher

  constructor: (options) ->
    super objectMode: true
    options = options or {}
    @tagger = options.tagger or (file) -> file.path
    if options.renameFile
      renameFile = options.renameFile
      if typeof renameFile != 'function'
        throw new Error 'renameFile must be a function'
    else if options.rename
      rename = options.rename
      if typeof rename != 'function'
        _rename = @standardRenames[rename]
        if not _rename?
          throw new Error "no standard rename: '#{rename}'"
        rename = _rename
        renameFile = createRenameFile rename
    @renameFile = renameFile
    @singleOptions = @createSingleOptions options

  createSingleOptions: (options) ->
    sopt = _.pick options, @constructor.SingleClass.optionNames
    if @renameFile
      # if we want to rename, singleHasher must see the whole
      # file before it emits the hash, that we need for renaming
      sopt.highWaterMark = options.maxSingleSize || 16 * 1024 * 1024
    sopt

  standardRenames:
    postfix: (name, digest) -> "#{name}-#{digest}"
    prefix: (name, digest) -> "#{digest}-#{name}"

  createSingleHasher: (tag) ->
    singleHasher = new @constructor.SingleClass tag, @singleOptions
    singleHasher.on 'digest', (digest, tag) =>
      @emit 'digest', digest, tag

  _transform: (file, enc, next) ->
    singleHasher = @createSingleHasher @tagger file

    ho = (complete) ->
      if file.isStream()
        file.contents = file.contents.pipe singleHasher
        complete()
      else
        singleHasher.end file.contents, null, ->
          singleHasher.resume()
          complete()
          return
      return

    if @renameFile
      singleHasher.on 'digest', (digest) =>
        @renameFile file, digest
        next null, file
        return
      ho ->
    else
      ho -> next null, file
    return


factory = (options) ->
  if options and options.single
    new SingleHasher options
  else  
    new VinylHasher options

factory.SingleHasher = SingleHasher
factory.VinylHasher = VinylHasher
module.exports = factory


