import * as FxT from '@fp/FxT'
import { Provide4, ProvideAll4, ProvideSome4, UseAll4, UseSome4 } from '@fp/Provide'
import * as SRTE from '@fp/StateReaderTaskEither'
import { Applicative4 } from 'fp-ts/Applicative'
import { Apply4 } from 'fp-ts/Apply'
import { Chain4 } from 'fp-ts/Chain'
import { ChainRec4 } from 'fp-ts/ChainRec'
import { flow } from 'fp-ts/function'
import { Functor4 } from 'fp-ts/Functor'
import { Monad4 } from 'fp-ts/Monad'
import { Pointed4 } from 'fp-ts/Pointed'

import { Fx } from './Fx'

export const of = FxT.of(SRTE.Pointed)
export const ap = FxT.ap({ ...SRTE.MonadRec, ...SRTE.Apply })
export const chain = FxT.chain<SRTE.URI>()
export const chainRec = FxT.chainRec(SRTE.MonadRec)
export const doStateReaderTaskEither = FxT.getDo<SRTE.URI>()
export const liftStateReaderTaskEither = FxT.liftFx<SRTE.URI>()
export const map = FxT.map<SRTE.URI>()
export const toStateReaderTaskEither = FxT.toMonad<SRTE.URI>(SRTE.MonadRec)
export const ask = FxT.ask(SRTE.FromReader)
export const asks = FxT.fromNaturalTransformation(SRTE.FromReader.fromReader)
export const fromIO = FxT.fromNaturalTransformation(SRTE.FromIO.fromIO)
export const fromEither = FxT.fromNaturalTransformation(SRTE.FromEither.fromEither)
export const fromState = FxT.fromNaturalTransformation(SRTE.FromState.fromState)
export const fromTask = FxT.fromNaturalTransformation(SRTE.FromTask.fromTask)
export const useSome = FxT.useSome({ ...SRTE.UseSome, ...SRTE.MonadRec })
export const useAll = FxT.useAll({ ...SRTE.UseAll, ...SRTE.MonadRec })
export const provideSome = FxT.provideSome({ ...SRTE.ProvideSome, ...SRTE.MonadRec })
export const provideAll = FxT.provideAll({ ...SRTE.ProvideAll, ...SRTE.MonadRec })
export const Do = flow(doStateReaderTaskEither, toStateReaderTaskEither)

export const URI = '@typed/fp/Fx/StateReaderTaskEither'
export type URI = typeof URI

export interface FxStateReaderTaskEither<S, R, E, A>
  extends Fx<SRTE.StateReaderTaskEither<S, R, E, unknown>, A> {}

declare module 'fp-ts/HKT' {
  export interface URItoKind4<S, R, E, A> {
    [URI]: FxStateReaderTaskEither<S, R, E, A>
  }
}

export const Pointed: Pointed4<URI> = {
  of,
}

export const Functor: Functor4<URI> = {
  map,
}

export const Apply: Apply4<URI> = {
  ...Functor,
  ap,
}

export const Applicative: Applicative4<URI> = {
  ...Apply,
  ...Pointed,
}

export const Chain: Chain4<URI> = {
  ...Functor,
  chain,
}

export const Monad: Monad4<URI> = {
  ...Chain,
  ...Pointed,
}

export const ChainRec: ChainRec4<URI> = {
  chainRec,
}

export const UseSome: UseSome4<URI> = {
  useSome,
}

export const UseAll: UseAll4<URI> = {
  useAll,
}

export const ProvideSome: ProvideSome4<URI> = {
  provideSome,
}

export const ProvideAll: ProvideAll4<URI> = {
  provideAll,
}

export const Provide: Provide4<URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}
