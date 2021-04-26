import { chain, fromIO } from '@fp/Env'
import { alwaysEqualsEq } from '@fp/Eq'
import { createRef, getRef, setRef_ } from '@fp/Ref'
import { Endomorphism } from 'fp-ts/Endomorphism'
import { pipe } from 'fp-ts/function'

import { usingFiberRefs } from '../Fiber'
import { Status } from '../Status'

const FIBER_STATUS = Symbol('FiberStatus')
export const FiberStatus = <A>() =>
  createRef(
    fromIO((): Status<A> => ({ type: 'queued' })),
    FIBER_STATUS,
    alwaysEqualsEq,
  )

export const getFiberStatus = <A>() => pipe(FiberStatus<A>(), getRef, usingFiberRefs)

export const setFiberStatus = <A>(status: Status<A>) =>
  pipe(FiberStatus<A>(), setRef_(status), usingFiberRefs)

export const modifyFiberStatus = <A>(f: Endomorphism<Status<A>>) =>
  pipe(
    FiberStatus<A>(),
    getRef,
    chain((a) => pipe(FiberStatus<A>(), pipe(a, f, setRef_))),
  )
