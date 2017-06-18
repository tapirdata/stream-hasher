import stream = require("stream")
import File = require("vinyl")

export type Cb = (err?: any, val?: any) => void
export type Tagger = (file: File) => string
export type Rename = (name: string, digest: string) => string
export type RenameFile = (file: File, digest: string) => void

export interface HasherOptions extends stream.TransformOptions {
  tag?: string
  algorithm?: string
  digestEncoding?: string
  digestLength?: number
  tagger?: Tagger
  optioner?: (file: File) => any
  maxSingleSize?: number
  single?: boolean
  rename?: string | Rename
  renameFile?: RenameFile
}
