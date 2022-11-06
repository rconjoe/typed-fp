import * as Effect from '@effect/core/io/Effect'
import { millis } from '@tsplus/stdlib/data/Duration'
import { pipe } from '@tsplus/stdlib/data/Function'

import { Document } from './DOM/Document.js'
import { RenderContext } from './HTML/RenderContext.js'
import { render } from './HTML/render.js'
import { html } from './HTML/tag.js'

const template = (name: string) => html`<h1>Hello, ${name}!</h1>`

const program = pipe(
  Effect.gen(function* ($) {
    yield* $(render(document.body, yield* $(template('foo'))))
    yield* $(Effect.sleep(millis((3 * 1000) as any)))
    yield* $(render(document.body, yield* $(template('bar'))))
  }),
  RenderContext.provide('client'),
  Effect.provideService(Document.Tag, document),
)

Effect.unsafeRunAsync(program)
