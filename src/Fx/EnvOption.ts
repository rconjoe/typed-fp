import * as E from '@fp/EnvOption'
import { flow } from '@fp/function'
import * as FxT from '@fp/FxT'
import { Provide2, ProvideAll2, ProvideSome2, UseAll2, UseSome2 } from '@fp/Provide'
import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { Chain2 } from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { Functor2 } from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'
import * as R from 'fp-ts/Reader'

import { Fx } from './Fx'

export const of = FxT.of(E.Pointed)
export const ap = FxT.ap({ ...E.MonadRec, ...E.Apply })
export const chain = FxT.chain<E.URI>()
export const chainRec = FxT.chainRec(E.MonadRec)
export const doEnvOption = FxT.getDo<E.URI>()
export const liftEnvOption = FxT.liftFx<E.URI>()
export const map = FxT.map<E.URI>()
export const toEnvOption = FxT.toMonad<E.URI>(E.MonadRec)
export const ask = FxT.ask(E.FromReader)
export const asks = FxT.fromNaturalTransformation<R.URI, E.URI>(E.FromReader.fromReader)
export const useSome = FxT.useSome({ ...E.UseSome, ...E.MonadRec })
export const useAll = FxT.useAll({ ...E.UseAll, ...E.MonadRec })
export const provideSome = FxT.provideSome({ ...E.ProvideSome, ...E.MonadRec })
export const provideAll = FxT.provideAll({ ...E.ProvideAll, ...E.MonadRec })
export const Do = flow(doEnvOption, toEnvOption)

export const URI = '@typed/fp/Fx/EnvOption'
export type URI = typeof URI

export interface FxEnvOption<E, A> extends Fx<E.EnvOption<E, unknown>, A> {}

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: FxEnvOption<E, A>
  }
}

export const Pointed: Pointed2<URI> = {
  of,
}

export const Functor: Functor2<URI> = {
  map,
}

export const Apply: Apply2<URI> = {
  ...Functor,
  ap,
}

export const Applicative: Applicative2<URI> = {
  ...Apply,
  ...Pointed,
}

export const Chain: Chain2<URI> = {
  ...Functor,
  chain,
}

export const Monad: Monad2<URI> = {
  ...Chain,
  ...Pointed,
}

export const ChainRec: ChainRec2<URI> = {
  chainRec,
}

export const UseSome: UseSome2<URI> = {
  useSome: useSome,
}

export const UseAll: UseAll2<URI> = {
  useAll: useAll,
}

export const ProvideSome: ProvideSome2<URI> = {
  provideSome: provideSome,
}

export const ProvideAll: ProvideAll2<URI> = {
  provideAll: provideAll,
}

export const Provide: Provide2<URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}
