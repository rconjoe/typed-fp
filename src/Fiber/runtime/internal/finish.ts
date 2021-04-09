import { doEnv, toEnv } from '@fp/Fx/Env'
import { right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { Fiber } from '../../Fiber'
import { Status } from '../../Status'
import { setFiberReturnValue } from '../FiberReturnValue'
import { sendStatus } from '../FiberSendEvent'
import { setFiberStatus } from '../FiberStatus'
import { complete } from './complete'

export function finish<A>(fiber: Fiber<A>, value: A) {
  const fx = doEnv(function* (_) {
    const status: Status<A> = { type: 'finished', value }

    yield* _(setFiberStatus(status))
    yield* _(setFiberReturnValue(right(value)))
    yield* _(sendStatus(status))
    yield* _(() => complete(fiber))
  })

  return pipe({ currentFiber: fiber }, toEnv(fx))
}
