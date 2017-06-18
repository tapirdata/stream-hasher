import fs = require("fs")
import path = require("path")
import _ = require("lodash")
import File = require("vinyl")
import vinylFs = require ("vinyl-fs")
import { expect } from "chai"
import vinylTapper from "vinyl-tapper"
import streamHasher from "../src"
import { HasherOptions } from "../src"

const fileCount = 2

const expectedDigests: { [key: string]: string } = {
  "fixtures/eels.txt": "15390ef2ebb49260800bde88fda1e054791bb5fb",
  "fixtures/lorem.txt": "7b11c5dd6b01cea150834856c25840d84500d79a",
}

function makeTests(title: string, options: any) {

  describe(title, () => {

    const tapResults: { [key: string]: { file: File, buffer: Buffer } } = {}
    const digests: { [key: string]: string } = {}
    const tagger = (file: File) => path.relative(__dirname, file.path)

    before((done) => {
      const hasher = streamHasher({
        rename: options.rename,
        digestLength: options.digestLength,
        optioner: options.optioner,
        tagger,
      } as HasherOptions)
      hasher.on("digest", (digest: string, tag: string) => digests[tag] = digest,
      )

      const tapper = vinylTapper({
        provideBuffer: true,
        terminate: true,
      })
      tapper.on("tap", (file: File, buffer: Buffer) =>
        tapResults[tagger(file)] = {
          file,
          buffer,
        },

      )

      const well = vinylFs.src("fixtures/**/*", {
        cwd: __dirname,
        buffer: options.useBuffer,
      },
      )
      return well
        .pipe(hasher)
        .pipe(tapper)
        .on("end", done)
    })

    it("should pass all files", () =>
      expect(_.keys(tapResults)).to.have.length(fileCount),
    )

    it("should hash all files", () =>
      expect(_.keys(digests)).to.have.length(fileCount),
    )

    it("should pass file types unmodified", () => {
      for (const tag of Object.keys(tapResults)) {
        const {file, buffer} = tapResults[tag]
        expect(file.isBuffer()).to.be.equal(options.useBuffer)
      }
    })

    it("should pass file contents unmodified", () => {
      for (const tag of Object.keys(tapResults)) {
        const {file, buffer} = tapResults[tag]
        const originalPath = file.history[0]
        expect(fs.readFileSync(originalPath, "utf8")).to.be.equal(buffer.toString("utf8"))
      }
    })

    it("should emit the correct hashes", () => {
      for (const tag of Object.keys(expectedDigests)) {
        let expectedDigest = expectedDigests[tag]
        if (options.digestLength) {
          expectedDigest = expectedDigest.slice(0, options.digestLength)
        }
        expect(digests[tag]).to.be.equal(expectedDigest)
      }
    })

    if (options.rename || options.optioner) {
      return it("should rename files", () => {
        for (const tag of Object.keys(tapResults)) {
          const {file, buffer} = tapResults[tag]
          const originalTag = path.relative(__dirname, file.history[0])
          let expectedDigest = expectedDigests[originalTag]
          if (options.digestLength) {
            expectedDigest = expectedDigest.slice(0, options.digestLength)
          }
          expect(tag).to.contain(expectedDigest)
        }
      })
    }
  },
  )
}

describe("stream-hasher for vinly-stream", () => {

  makeTests("with buffer-files", {
    useBuffer: true,
    rename: false,
  },
  )

  makeTests("with stream-files", {
    useBuffer: false,
    rename: false,
  },
  )

  makeTests("with buffer-files, rename", {
    useBuffer: true,
    rename: "postfix",
  },
  )

  makeTests("with stream-files, rename", {
    useBuffer: false,
    rename: "postfix",
  },
  )

  makeTests("with stream-files, rename function", {
    useBuffer: false,
    rename(name: string, digest: string) {
      return `${name}-${digest}`
    },
  },
  )

  makeTests("with stream-files, use optioner", {
    useBuffer: false,
    optioner(file: File) {
      return {rename: "postfix"}
    },
  },
  )

  return makeTests("with stream-files, rename, short digest", {
    useBuffer: false,
    rename: "postfix",
    digestLength: 8,
  },
  )
},
)
