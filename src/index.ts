import { Cb, HasherOptions, Rename, RenameFile, Tagger } from "./options"
import { SingleHasher } from "./singleHasher"
import { VinylHasher } from "./vinylHasher"

(VinylHasher as any).SingleClass = SingleHasher;

(VinylHasher.prototype as any).standardRenames = {
  postfix(name: string, digest: string) { return `${name}-${digest}` },
  prefix(name: string, digest: string) { return `${digest}-${name}` },
}

export interface Factory {
  (options: HasherOptions): SingleHasher | VinylHasher,
  SingleHasher: typeof SingleHasher
  VinylHasher: typeof VinylHasher
}

const factory = ((options) => {
  if (options && options.single) {
    return new SingleHasher(options)
  } else {
    return new VinylHasher(options)
  }
}) as Factory

factory.SingleHasher = SingleHasher // legacy
factory.VinylHasher = VinylHasher // legacy

export default factory
export { HasherOptions, SingleHasher, VinylHasher }
