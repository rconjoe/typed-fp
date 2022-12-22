import * as Effect from '@effect/io/Effect'

import { Fx } from '../Fx.js'

import { fromFxEffect } from './fromFxEffect.js'

export type EffectAdapter = <R, E, A>(
  effect: Effect.Effect<R, E, A>,
) => Generator<Effect.EffectGen<R, E, A>, A, A>

/**
 * A helper for running a generator function that yields effects, and returns an Fx.
 * This allows using yield* to represent all of your setup, but then constructing
 * some sort of Fx to represent changes over time. This can be useful for things like
 * initializing a component and/or keeping local states.
 */
export function gen<Eff extends Effect.EffectGen<any, any, any>, R, E, A, N = unknown>(
  f: (adapter: EffectAdapter) => Generator<Eff, Fx<R, E, A>, N>,
): Fx<
  | R
  | ([Eff] extends [never]
      ? never
      : [Eff] extends [Effect.EffectGen<infer R, any, any>]
      ? R
      : never),
  | E
  | ([Eff] extends [never]
      ? never
      : [Eff] extends [Effect.EffectGen<any, infer E, any>]
      ? E
      : never),
  A
> {
  return fromFxEffect(Effect.gen(f as any))
}
