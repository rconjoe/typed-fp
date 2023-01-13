import * as Effect from '@effect/io/Effect'
import type * as Exit from '@effect/io/Exit'
import type * as Fiber from '@effect/io/Fiber'
import type { Cancel } from '@effect/io/Runtime'
import type * as Scope from '@effect/io/Scope'

import type { Fx } from '../Fx.js'

import { drain } from './drain.js'

export const unsafeRunAsync = <E, A>(fx: Fx<never, E, A>): Cancel<E, void> =>
  Effect.unsafeRun(drain(fx))

export const unsafeRunAsyncWith =
  <E>(f: (exit: Exit.Exit<E, void>) => void) =>
  <A>(fx: Fx<never, E, A>): Cancel<E, void> =>
    Effect.unsafeRun(drain(fx), f)

export const unsafeFork = <E, A>(fx: Fx<never, E, A>): Fiber.RuntimeFiber<E, void> =>
  Effect.unsafeFork(drain(fx))

export const unsafeRunPromise = <E, A>(fx: Fx<never, E, A>): Promise<void> =>
  Effect.unsafeRunPromise(drain(fx))

export const unsafeRunPromiseExit = <E, A>(fx: Fx<never, E, A>): Promise<Exit.Exit<E, void>> =>
  Effect.unsafeRunPromiseExit(drain(fx))

export const fork = <R, E, A>(
  fx: Fx<R, E, A>,
): Effect.Effect<R, never, Fiber.RuntimeFiber<E, void>> => Effect.fork(drain(fx))

export const forkDaemon = <R, E, A>(
  fx: Fx<R, E, A>,
): Effect.Effect<R, never, Fiber.RuntimeFiber<E, void>> => Effect.forkDaemon(drain(fx))

export const forkScoped = <R, E, A>(
  fx: Fx<R, E, A>,
): Effect.Effect<R | Scope.Scope, never, Fiber.RuntimeFiber<E, void>> =>
  Effect.forkScoped(drain(fx))
