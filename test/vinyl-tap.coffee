'use strict'

stream = require 'readable-stream'
bl = require 'bl'


class VinylTap extends stream.Transform
  constructor: (options) ->
    super objectMode: true
    @needBuffer = options.needBuffer  

  _transform: (file, enc, next) ->
    if @needBuffer
      @getBuffer file, (err, buffer) =>
        if err
          next err
          return
        @report file, buffer
        next null, file
    else  
      @report file
      next null, file

  getBuffer: (file, cb) ->
    if file.isNull()
      cb null, null
      return
    if file.isBuffer()
      cb null, file.contents
      return
    file.contents.pipe bl (err, data) ->
      if err
        cb err
      cb null, data  
      return
     
  report: (file, buffer) ->
    # console.log 'VinylTap file%s, buffer=%s', file, buffer.length
    @emit 'tap', file, buffer


module.exports = VinylTap


    

