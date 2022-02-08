import { TransformOptions } from 'stream';
import File from 'vinyl';

export type Tagger = (file: File) => string;
export type Rename = (name: string, digest: string) => string;
export type RenameFile = (file: File, digest: string) => void;
export type Optioner = (file: File) => HasherOptions;

export type RenamesBag = Record<string, Rename>;

export interface HasherOptions extends TransformOptions {
  tag?: string;
  algorithm?: string;
  digestEncoding?: BufferEncoding | 'buffer';
  digestLength?: number;
  tagger?: Tagger;
  optioner?: Optioner;
  maxSingleSize?: number;
  single?: boolean;
  rename?: string | Rename;
  renameFile?: null | RenameFile;
}
