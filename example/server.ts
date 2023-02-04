// For support of our virtual modules
/// <reference types="@typed/framework" />

import * as Effect from '@effect/io/Effect'
import * as express from '@typed/framework/express'
import * as api from 'api:./api'
import * as indexHtml from 'html:./index'
import * as otherHtml from 'html:./other'
import * as otherPages from 'runtime:./other-pages'
import * as pages from 'runtime:./pages'
import httpDevServer from 'vavite/http-dev-server'

const getParentElement = (d: Document) => d.getElementById('application')

const main = express.app(
  Effect.gen(function* ($) {
    if (import.meta.env.PROD) {
      yield* $(
        express.assets('/', import.meta.url, [indexHtml, otherHtml], {
          serveStatic: { maxAge: 31536000, cacheControl: true },
        }),
      )
    }

    yield* $(express.api('/api', api.handlers))

    yield* $(express.html('/other', otherPages, otherHtml, getParentElement))
    yield* $(express.html('/', pages, indexHtml, getParentElement))

    const { port } = yield* $(express.listen({ port: 3000, httpDevServer }))

    yield* $(Effect.logInfo(`Server listening at port ${port}`))
  }),
)

Effect.runFork(main)
