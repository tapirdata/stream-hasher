import { Hash, createHash } from 'crypto';
import { Transform, TransformCallback } from 'stream';

import { HasherOptions } from './options';

export class SingleHasher extends Transform {
  protected tag: string;
  protected algorithm: string;
  protected digestEncoding: BufferEncoding | 'buffer';
  protected digestLength?: number;
  protected hashStream: Hash;

  constructor(tag: string | HasherOptions, options: HasherOptions = {}) {
    super(options);
    if (typeof tag === 'object') {
      options = tag;
      tag = options.tag as string;
    } else {
      options = options || {};
    }
    this.tag = tag;
    this.algorithm = options.algorithm || 'sha1';
    this.digestEncoding = options.digestEncoding || 'hex';
    this.digestLength = options.digestLength;
    this.hashStream = this.createHashStream();
    this.on('finish', () => {
      this.hashStream.end();
      let digest: Buffer | string = this.hashStream.read() as Buffer;
      if (this.digestEncoding !== 'buffer') {
        digest = digest.toString(this.digestEncoding);
      }
      if (this.digestLength != null) {
        digest = digest.slice(0, this.digestLength);
      }
      this.emit('digest', digest, this.tag);
    });
  }

  public _transform(chunk: Buffer, enc: BufferEncoding, next: TransformCallback): void {
    this.hashStream.write(chunk, enc, () => {
      next(null, chunk);
    });
  }

  protected createHashStream(): Hash {
    return createHash(this.algorithm);
  }

  static optionNames = ['algorithm', 'digestEncoding', 'digestLength'];
}

export interface SingleHasherClass {
  new (tag: string | HasherOptions, options: HasherOptions): SingleHasher;
  optionNames: string[];
}
