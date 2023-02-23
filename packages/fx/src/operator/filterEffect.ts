import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'

import { Fx } from '../Fx.js'

export function filterEffect<A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, A> => {
    return new FilterEffectFx(fx, predicate)
  }
}

class FilterEffectFx<R, E, A, R2, E2>
  extends Fx.Variance<R | R2, E | E2, A>
  implements Fx<R | R2, E | E2, A>
{
  constructor(
    readonly fx: Fx<R, E, A>,
    readonly predicate: (a: A) => Effect.Effect<R2, E2, boolean>,
  ) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E | E2, A>) {
    return this.fx.run(new FilterEffectSink(sink, this.predicate))
  }
}

class FilterEffectSink<R, E, A, R2, E2> implements Fx.Sink<R | R2, E, A> {
  constructor(
    readonly sink: Fx.Sink<R, E | E2, A>,
    readonly predicate: (a: A) => Effect.Effect<R2, E2, boolean>,
  ) {}

  event = (a: A) => {
    return pipe(
      this.predicate(a),
      Effect.matchCauseEffect(this.sink.error, (b) => (b ? this.sink.event(a) : Effect.unit())),
    )
  }

  error = this.sink.error
  end = this.sink.end
}
