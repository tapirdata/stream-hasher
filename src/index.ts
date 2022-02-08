import { HasherOptions } from './options';
import { SingleHasher } from './singleHasher';
import { VinylHasher } from './vinylHasher';

export interface Factory {
  (options: HasherOptions): SingleHasher | VinylHasher;
}

const factory: Factory = (options: HasherOptions) => {
  if (options && options.single) {
    return new SingleHasher(options);
  } else {
    return new VinylHasher(options);
  }
};

export default factory;
export { HasherOptions, SingleHasher, VinylHasher };
