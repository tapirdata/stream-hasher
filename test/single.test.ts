import fs = require("fs")
import path = require("path")
import _ = require("lodash")
import { expect } from "chai"

import streamHasher from "../src"
import { HasherOptions } from "../src"

const expectedDigests: { [key: string]: string } = {
  "fixtures/eels.txt": "15390ef2ebb49260800bde88fda1e054791bb5fb",
  "fixtures/lorem.txt": "7b11c5dd6b01cea150834856c25840d84500d79a",
}

function makeTests(title: string, options: any) {

  describe(title, () => {

    let digest: string | null = null

    before((done) => {
      const hasher = streamHasher({single: true})
      hasher.on("digest", (aDigest: string) => {
        digest = aDigest
      })

      return fs.createReadStream(path.join(__dirname, options.relPath))
      .pipe(hasher)
      .on("end", done)
      .resume()
    })

    return it("should emit the correct hash", () =>
      expect(digest).to.be.equal(expectedDigests[options.relPath]),
    )
  })
}

describe("stream-hasher for single stream", () => {

  makeTests("with short file",
    {relPath: "fixtures/eels.txt"},
  )

  return makeTests("with long file",
    {relPath: "fixtures/lorem.txt"},
  )
},
)
