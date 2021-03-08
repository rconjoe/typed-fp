import { FromIO, MonadAsk, URI, UseSome } from '@typed/fp/Env'
import * as H from '@typed/fp/hooks'

const env = { ...MonadAsk, ...FromIO }

export const getNextIndex = H.createGetNextIndex(env)()
export const getNextSymbol = H.createGetNextSymbol(env)()
export const resetIndex = H.createResetIndex(env)()

export const getSharedState = H.createGetSharedState(env)

export const useRef = H.createUseRef(env)
export const useState = H.createUseState(env)

export const NamespaceDisposable = H.createNamespaceDisposable(FromIO)
export const hooksHandlers: H.HooksHandlers<URI> = H.createHooksHandlers({ ...env, ...UseSome })
