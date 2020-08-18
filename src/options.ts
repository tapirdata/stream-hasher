import { TransformOptions } from "stream"
import * as File from "vinyl"

export type Cb = (err?: any, val?: any) => void
export type Tagger = (file: File) => string
export type Rename = (name: string, digest: string) => string
export type RenameFile = (file: File, digest: string) => void

export interface HasherOptions extends TransformOptions {
  tag?: string
  algorithm?: string
  digestEncoding?: BufferEncoding | "buffer"
  digestLength?: number
  tagger?: Tagger
  optioner?: (file: File) => any
  maxSingleSize?: number
  single?: boolean
  rename?: string | Rename
  renameFile?: RenameFile
}
