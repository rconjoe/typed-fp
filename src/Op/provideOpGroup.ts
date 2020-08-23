import { doEffect, Effect, EnvOf, memo, ZipEnvOf } from '@typed/fp/Effect'
import { GetOpEffect, Op, OpEnv, provideOp, ReturnOf } from '@typed/fp/Op'
import { pipe } from 'fp-ts/es6/pipeable'
import { mapWithIndex, reduce } from 'fp-ts/es6/ReadonlyArray'
import { IntersectOf } from 'Union/_api'

/**
 * Allows providing multiple operations together which may require shared state, resources, or
 * simply for convenience.
 */
export function provideOpGroup<OPS extends ReadonlyArray<Op>, G extends OpGroup<OPS>>(
  ops: OPS,
  opGroupEff: G,
) {
  const getOpGroup = memo(opGroupEff)

  return <E, A>(effect: Effect<E & OpEnvs<OPS>, A>): Effect<E & OpGroupEnv<G>, A> => {
    const eff = doEffect(function* () {
      const opGroup = yield* getOpGroup

      return pipe(
        ops,
        mapWithIndex((i, op) => provideOp(op, opGroup[i])),
        reduce(effect, (fx, provide) => provide(fx)),
      )
    })

    return (eff as unknown) as Effect<E & OpGroupEnv<G>, A>
  }
}

export type OpEnvs<OPS extends ReadonlyArray<Op>> = IntersectOf<
  {
    [K in keyof OPS]: OPS[K] extends Op ? OpEnv<OPS[K]> : never
  }[number]
>

export type OpGroup<OPS extends ReadonlyArray<Op> = ReadonlyArray<Op>> = Effect<
  any,
  {
    readonly [K in keyof OPS]: OPS[K] extends Op ? GetOpEffect<any, OPS[K]> : never
  }
>

export type OpGroupEnv<G extends OpGroup> = ReturnOf<G> extends ReadonlyArray<Effect<any, any>>
  ? EnvOf<G> & ZipEnvOf<ReturnOf<G>>
  : never
