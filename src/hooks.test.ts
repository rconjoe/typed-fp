import * as E from '@fp/Env'
import { pipe } from '@fp/function'
import * as RS from '@fp/ReaderStream'
import * as S from '@fp/Stream'
import * as Sc from '@most/scheduler'
import { describe, given, it } from '@typed/test'
import { Eq } from 'fp-ts/number'

import { mergeMapWithHooks, useRef, withHooks } from './hooks'
import * as Ref from './Ref'
import * as RefDisposable from './RefDisposable'
import { exec } from './Resume'

export const test = describe(`hooks`, [
  describe(withHooks.name, [
    given(`a Env using Refs`, [
      it(`converts this to a Stream`, async ({ equal }) => {
        const value = 0
        const ref = Ref.create(E.of(value))
        const refs = Ref.refs()
        const [sendEvent] = refs.refEvents

        const expected = [value, value + 1, value + 2]
        const actual = await pipe(
          refs,
          withHooks(ref.get),
          S.take(expected.length),
          S.tap((n) => sendEvent({ _tag: 'Updated', ref, previousValue: n, value: n + 1 })),
          S.collectEvents(Sc.newDefaultScheduler()),
        )

        equal(expected, actual)
      }),

      it(`converts self-updating component to a Stream`, async ({ equal }) => {
        const value = 0
        const scheduler = Sc.newDefaultScheduler()
        const refs = Ref.refs()

        const Component = pipe(
          E.Do,
          E.bindW('ref', () => useRef(E.of(value), Eq)),
          E.bindW('increment', ({ ref }) => E.askAndUse(ref.set(value + 1))),
          E.chainFirstW(({ increment }) =>
            RefDisposable.add(
              Sc.asap(
                S.createCallbackTask(() => pipe({}, increment, exec)),
                scheduler,
              ),
            ),
          ),
          E.chainW(({ ref }) => ref.get),
        )

        const values = await pipe(refs, withHooks(Component), S.take(2), S.collectEvents(scheduler))

        equal([value, value + 1], values)
      }),
    ]),
  ]),

  describe(mergeMapWithHooks.name, [
    it(`converts this to a Stream`, async ({ equal }) => {
      const scheduler = Sc.newDefaultScheduler()
      const Component = (x: number) =>
        pipe(
          E.Do,
          E.bindW('ref', () => useRef(E.of(x), Eq)),
          E.bindW('increment', ({ ref }) => E.askAndUse(ref.set(x + 1))),
          E.chainFirstW(({ increment }) =>
            x === 3
              ? RefDisposable.add(
                  Sc.asap(
                    S.createCallbackTask(() => pipe({}, increment, exec)),
                    scheduler,
                  ),
                )
              : E.of(null),
          ),
          E.chainW(({ ref }) => ref.get),
        )

      const values = await pipe(
        S.mergeArray([S.now([1, 2, 3]), S.at(200, [2, 3, 1]), S.at(400, [3, 2])]),
        RS.fromStream,
        mergeMapWithHooks(Eq)(Component),
        RS.take(4),
        RS.withStream(S.collectEvents(scheduler)),
      )(Ref.refs())

      equal(
        [
          [1, 2, 3],
          [1, 2, 4],
          [2, 4, 1],
          [4, 2],
        ],
        values,
      )
    }),
  ]),
])
