import crypto = require("crypto")
import stream = require("stream")
import { Cb, HasherOptions } from "./options"

export class SingleHasher extends stream.Transform {

  protected tag: string
  protected algorithm: string
  protected digestEncoding: string
  protected digestLength?: number
  protected hashStream: crypto.Hash

  constructor(tag: string | HasherOptions, options?: HasherOptions) {
    super(options)
    if (typeof tag === "object") {
      options = (tag as HasherOptions)
      tag = options.tag as string
    } else {
      options = options || {}
    }
    this.tag = tag as string
    this.algorithm = options.algorithm || "sha1"
    this.digestEncoding = options.digestEncoding || "hex"
    this.digestLength = options.digestLength
    this.hashStream = this.createHashStream()
    this.on("finish", () => {
      this.hashStream.end()
      let digest: Buffer | string  = this.hashStream.read() as Buffer
      if (this.digestEncoding !== "buffer") {
        digest = digest.toString(this.digestEncoding)
      }
      if (this.digestLength != null) {
        digest = digest.slice(0, this.digestLength)
      }
      this.emit("digest", digest, this.tag)
    })
  }

  public _transform(chunk: Buffer, enc: string, next: Cb) {
    return this.hashStream.write(chunk as any, enc, () => {
      next(null, chunk)
    })
  }

  protected createHashStream() {
    return crypto.createHash(this.algorithm)
  }

}

(SingleHasher as any).optionNames = ["algorithm", "digestEncoding", "digestLength"]
