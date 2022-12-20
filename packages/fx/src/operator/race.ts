import { interrupt } from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as ExecutionStrategy from '@effect/io/ExecutionStrategy'
import * as Exit from '@effect/io/Exit'
import * as Scope from '@effect/io/Scope'
import { Chunk } from '@fp-ts/data/Chunk'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'
import { asap } from '../_internal/RefCounter.js'
import { run } from '../run/run.js'

import { tap } from './tap.js'

export function raceAll<Streams extends readonly Fx<any, any, any>[]>(
  ...streams: Streams
): Fx<Fx.ResourcesOf<Streams[number]>, Fx.ErrorsOf<Streams[number]>, Fx.OutputOf<Streams[number]>> {
  return new RaceAllFx(streams)
}

export class RaceAllFx<Streams extends readonly Fx<any, any, any>[]>
  extends Fx.Variance<
    Fx.ResourcesOf<Streams[number]>,
    Fx.ErrorsOf<Streams[number]>,
    Fx.OutputOf<Streams[number]>
  >
  implements
    Fx<Fx.ResourcesOf<Streams[number]>, Fx.ErrorsOf<Streams[number]>, Fx.OutputOf<Streams[number]>>
{
  constructor(readonly streams: Streams) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, Fx.ErrorsOf<Streams[number]>, Fx.OutputOf<Streams[number]>>) {
    const { streams } = this

    return Effect.gen(function* ($) {
      const fiberId = yield* $(Effect.fiberId())
      const closeScope = Effect.forEachDiscard(Scope.close(Exit.failCause(interrupt(fiberId))))
      const scope = yield* $(Effect.scope())

      const scopes: Chunk<Scope.CloseableScope> = yield* $(
        pipe(
          streams,
          Effect.forEachWithIndex((s, i) =>
            pipe(
              scope,
              Scope.fork(ExecutionStrategy.sequential),
              Effect.flatMap((scope) =>
                pipe(
                  s,
                  tap(() => cleanupScopes(i)),
                  run(sink.event, sink.error, sink.end),
                  Effect.scheduleForked(asap),
                  Effect.as(scope),
                  Effect.provideService(Scope.Tag)(scope),
                ),
              ),
            ),
          ),
        ),
      )

      function cleanupScopes(i: number) {
        return Effect.gen(function* ($) {
          const currentFibers = Array.from(scopes)

          currentFibers.splice(i, 1)

          return yield* $(closeScope(currentFibers))
        })
      }
    })
  }
}
