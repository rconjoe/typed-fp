import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'

export function withEarlyExit<R, E, A, R2, E2, B>(
  f: (_: Effect.Effect<never, never, never>) => Effect.Effect<R, E, A>,
  onEnd: Effect.Effect<R2, E2, B>,
): Effect.Effect<R | R2, E | E2, A | B> {
  return Effect.asyncEffect((cb) =>
    pipe(
      Effect.sync(() => cb(onEnd)),
      Effect.flatMap(Effect.never),
      f,
      Effect.onExit((exit) => Effect.sync(() => cb(Effect.done(exit)))),
    ),
  )
}
