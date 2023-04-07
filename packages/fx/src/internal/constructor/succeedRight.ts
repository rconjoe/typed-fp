import { methodWithTrace } from '@effect/data/Debug'

import { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'
import type { Either } from '@typed/fx/internal/externals'
import { Effect } from '@typed/fx/internal/externals'

export const succeedRight: <A>(a: A) => Fx<never, never, Either.Either<never, A>> = methodWithTrace(
  (trace) =>
    <A>(a: A) =>
      fromEffect(Effect.succeedRight(a)).traced(trace),
)
