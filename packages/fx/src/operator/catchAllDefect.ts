import { pipe } from '@effect/data/Function'
import { match } from '@effect/data/Option'
import * as Chunk from '@effect/data/Chunk'
import * as Cause from '@effect/io/Cause'

import type { Fx } from '../Fx.js'
import { failCause } from '../constructor/failCause.js'

import { catchAllCause } from './catchAllCause.js'

export function catchAllDefect<R2, E2, B>(f: (defect: unknown) => Fx<R2, E2, B>) {
  return <R, E, A>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, A | B> =>
    pipe(
      fx,
      catchAllCause(
        (cause): Fx<R2, E | E2, B> =>
          pipe(
           Chunk.get(Cause.defects(cause), 0),
            match(() => failCause(cause), f),
          ),
      ),
    )
}
