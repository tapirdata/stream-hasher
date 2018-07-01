import _ = require("lodash")
import path = require("path")
import stream = require("stream")
import File = require("vinyl")

import { Cb, HasherOptions, Rename, RenameFile, Tagger } from "./options"

function createRenameFile(rename: Rename): RenameFile {
  return (file: File, digest: string) => {
    const ext = path.extname(file.path)
    const name = rename(path.basename(file.path, ext), digest)
    file.path = path.join(path.dirname(file.path), name + ext)
  }
}

export class VinylHasher extends stream.Transform {

  protected tagger: Tagger
  protected optioner?: (file: File) => any
  protected maxSingleSize: number
  protected defaultFileOptions: any

  constructor(options: HasherOptions = {}) {
    super({objectMode: true})
    this.tagger = options.tagger || ((file) => file.path)
    this.optioner = options.optioner
    this.maxSingleSize = options.maxSingleSize || (16 * 1024 * 1024)
    this.defaultFileOptions = this.createDefaultFileOptions(options)
  }

  public _transform(file: File, enc: string, next: Cb) {
    let options: HasherOptions
    try {
      options = this.getFileOptions(file)
    } catch (err) {
      next(err)
      return
    }
    const tag = this.tagger(file)
    const singleHasher = this.createSingleHasher(tag, options)

    const hashIt = (done: Cb) => {
      if (file.isStream()) {
        file.contents = file.contents.pipe(singleHasher)
        done()
      } else {
        singleHasher.end(file.contents, null, () => {
          done()
        })
        singleHasher.resume()
      }
    }

    if (options.renameFile as RenameFile) {
      singleHasher.on("digest", (digest: string, tag1: string) => {
        (options.renameFile as RenameFile)(file, digest)
        this.emit("digest", digest, tag1, this.tagger(file))
        next(null, file)
      })
      hashIt(() => null)
    } else {
      singleHasher.on("digest", (digest: string, tag1: string) => {
        return this.emit("digest", digest, tag1)
      },
      )
      hashIt(() => next(null, file))
    }
  }
  protected createDefaultFileOptions(options: HasherOptions) {
    const fileOptions: any = _.pick(options, (this.constructor as any).SingleClass.optionNames)
    fileOptions.renameFile = options.renameFile
    fileOptions.rename = options.rename
    return fileOptions
  }

  protected getFileOptions(file: File) {
    const options = _.clone(this.defaultFileOptions)
    if (this.optioner) {
      _.merge(options, this.optioner(file))
    }
    if (options.renameFile) {
      if (typeof options.renameFile !== "function") {
        throw new Error(`renameFile must be a function, got ${options.renameFile}`)
      }
    } else if (options.rename) {
      let { rename } = options
      if (typeof rename !== "function") {
        rename = (this as any).standardRenames[rename]
        if (rename == null) {
          throw new Error(`no standard rename: '${options.rename}'`)
        }
      }
      options.renameFile = createRenameFile(rename)
    }
    if (options.renameFile) {
      // if we want to rename, singleHasher must see the whole
      // file before it emits the hash, that we need for renaming
      options.highWaterMark = this.maxSingleSize
    }
    return options
  }

  protected createSingleHasher(tag: string, options: HasherOptions) {
    return new (this.constructor as any).SingleClass(tag, options)
  }

}
