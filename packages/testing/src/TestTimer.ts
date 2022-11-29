import { flow } from '@fp-ts/data/Function'
import * as C from '@typed/clock'
import { Disposable } from '@typed/disposable'
import { Time, UnixTime } from '@typed/time'
import { Timeline } from '@typed/timeline'
import { Timer } from '@typed/timer'

import { makeTestClock, TestClock } from './TestClock.js'

/**
 * A Timer which provides imperative access to progressing Time forward.
 */
export interface TestTimer extends Timer, TestClock {
  readonly fork: () => TestTimer
}

export function makeTestTimer(clock: TestClock = makeTestClock(), autoRun = true): TestTimer {
  const timeline = Timeline<(t: Time) => void>()
  const runReadyTimers = (t: Time) => (
    timeline.getReadyTasks(UnixTime(clock.startTime + t)).forEach((f) => f(t)), t
  )

  return {
    ...clock,
    setTimer: (f, delay) => {
      // If auto-run is enabled an delay is 0,
      // synchronously run the callback.
      if (autoRun && delay.millis === 0) {
        f(C.getTime(clock))

        return Disposable.unit
      }

      return timeline.add(C.delay(delay)(clock), f)
    },
    progressTimeBy: flow(clock.progressTimeBy, runReadyTimers),
    fork: () => makeTestTimer(clock.fork(), autoRun),
  }
}
