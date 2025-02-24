import { methodWithTrace } from '@effect/data/Debug'
import type { Scope } from '@effect/io/Scope'

import type { Sink } from './Fx.js'
import { Fx } from './Fx.js'
import type { Cause } from './externals.js'
import { Deferred, Effect, Runtime } from './externals.js'

export function fromEmitter<E, A, R, E2>(
  f: (emitter: Emitter<E, A>) => Effect.Effect<R | Scope, E2, void>,
): Fx<Exclude<R, Scope>, E | E2, A> {
  return Fx(
    <R2>(sink: Sink<R2, E | E2, A>): Effect.Effect<Exclude<R, Scope> | R2, never, void> =>
      Effect.scoped(
        Effect.gen(function* ($) {
          // Use to signal this emitter has completed.
          const deferred = yield* $(Deferred.make<never, void>())

          // Construct an Emitter which uses the current runtime and scope
          // to run the effects it emits while exposing itself to external APIs
          // like DOM event listeners and other imperative APIs.
          const forkIn = Effect.forkIn(yield* $(Effect.scope()))
          const run = Runtime.runCallback(yield* $(Effect.runtime<R | R2>()))
          const emitter: Emitter<E, A> = {
            event: methodWithTrace((trace) => (a) => run(forkIn(sink.event(a)).traced(trace))),
            error: methodWithTrace(
              (trace) => (cause) =>
                run(forkIn(Effect.intoDeferred(sink.error(cause), deferred)).traced(trace)),
            ),
            end: methodWithTrace(
              (trace) => () => run(Deferred.succeed(deferred, undefined).traced(trace)),
            ),
          }

          // Run your Effect with this emitter using the same scope as all
          // of the emitted effects.
          yield* $(forkIn(Effect.catchAllCause(f(emitter), sink.error)))

          // Wait for this Stream to end before returning
          return yield* $(Deferred.await(deferred))
        }),
      ),
  )
}

export interface Emitter<E, A> {
  readonly event: (a: A) => void
  readonly error: (cause: Cause.Cause<E>) => void
  readonly end: () => void
}
