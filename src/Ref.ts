import * as A from '@fp/Adapter'
import * as E from '@fp/Env'
import { deepEqualsEq } from '@fp/Eq'
import * as O from '@fp/Option'
import * as P from '@fp/Provide'
import { Eq } from 'fp-ts/Eq'
import { flow, pipe } from 'fp-ts/function'
import { fst, snd } from 'fp-ts/Tuple2'

export interface Ref<E, A> extends Eq<A> {
  readonly id: PropertyKey
  readonly initial: E.Env<E, A>
}

export interface Of<A> extends Ref<unknown, A> {}

export type EnvOf<A> = [A] extends [Ref<infer R, any>] ? R : never

export type ValueOf<A> = [A] extends [Ref<any, infer R>] ? R : never

export type RefOptions<A> = {
  readonly eq?: Eq<A>
  readonly id?: PropertyKey
}

export function make<E, A>(initial: E.Env<E, A>, options: RefOptions<A> = {}): Ref<E, A> {
  const { eq = deepEqualsEq, id = Symbol() } = options

  return {
    id,
    initial,
    equals: eq.equals,
  }
}

export const get = <E, A>(ref: Ref<E, A>) => E.asksE((e: Get) => e.getRef(ref))

export interface Get {
  readonly getRef: <E, A>(ref: Ref<E, A>) => E.Env<E, A>
}

export const has = <E, A>(ref: Ref<E, A>) => E.asksE((e: Has) => e.hasRef(ref))

export interface Has {
  readonly hasRef: <E, A>(ref: Ref<E, A>) => E.Of<boolean>
}

export const set =
  <E, A>(ref: Ref<E, A>) =>
  (value: A) =>
    E.asksE((e: Set) => e.setRef(ref, value))

export interface Set {
  readonly setRef: <E, A>(ref: Ref<E, A>, value: A) => E.Env<E, A>
}

export const update =
  <E1, A>(ref: Ref<E1, A>) =>
  <E2>(f: (value: A) => E.Env<E2, A>) =>
    pipe(ref, get, E.chainW(f), E.chainW(set(ref)))

export const remove = <E, A>(ref: Ref<E, A>) => E.asksE((e: Remove) => e.removeRef(ref))

export interface Remove {
  readonly removeRef: <E, A>(ref: Ref<E, A>) => E.Env<E, O.Option<A>>
}

export interface Events {
  readonly refEvents: Adapter
}

export const getAdapter = E.asks((e: Events) => e.refEvents)

export const getSendEvent = pipe(getAdapter, E.map(fst))

export const sendEvent = <E, A>(event: Event<E, A>) => pipe(getSendEvent, E.apW(E.of(event)))

export const getRefEvents = pipe(getAdapter, E.map(snd))

export type Refs = Get & Has & Set & Remove & Events

export interface Wrapped<E, A> extends Ref<E, A> {
  readonly get: E.Env<E & Get, A>
  readonly has: E.Env<Has, boolean>
  readonly set: (value: A) => E.Env<E & Set, A>
  readonly update: <E2>(f: (value: A) => E.Env<E2, A>) => E.Env<E & Get & E2 & Set, A>
  readonly remove: E.Env<E & Remove, O.Option<A>>
}

export function wrap<E, A>(ref: Ref<E, A>): Wrapped<E, A> {
  return {
    id: ref.id,
    initial: ref.initial,
    equals: ref.equals,
    get: get(ref),
    has: has(ref),
    set: set(ref),
    update: update(ref),
    remove: remove(ref),
  } as const
}

export const provideSome =
  <E1>(provided: E1) =>
  <E2, A>(ref: Wrapped<E1 & E2, A>): Wrapped<E2, A> => {
    return {
      id: ref.id,
      equals: ref.equals,
      initial: pipe(ref.initial, E.provideSome(provided)),
      get: pipe(ref.get, E.provideSome(provided)),
      has: pipe(ref.has, E.provideSome(provided)),
      set: flow(ref.set, E.provideSome(provided)),
      update: flow(ref.update, E.provideSome(provided)),
      remove: pipe(ref.remove, E.provideSome(provided)),
    }
  }

export const provideAll: <E>(provided: E) => <A>(ref: Wrapped<E, A>) => Wrapped<unknown, A> =
  provideSome

export const useSome =
  <E1>(provided: E1) =>
  <E2, A>(ref: Wrapped<E1 & E2, A>): Wrapped<E2, A> => {
    return {
      id: ref.id,
      equals: ref.equals,
      initial: pipe(ref.initial, E.useSome(provided)),
      get: pipe(ref.get, E.useSome(provided)),
      has: pipe(ref.has, E.useSome(provided)),
      set: flow(ref.set, E.useSome(provided)),
      update: flow(ref.update, E.useSome(provided)),
      remove: pipe(ref.remove, E.useSome(provided)),
    }
  }

export const useAll: <E1>(provided: E1) => <A>(ref: Wrapped<E1, A>) => Wrapped<unknown, A> = useSome

export const WrappedURI = '@typed/fp/Ref'
export type WrappedURI = typeof WrappedURI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [WrappedURI]: Wrapped<E, A>
  }
}

declare module '@fp/Hkt' {
  export interface UriToVariance {
    [WrappedURI]: V<E, Contravariant>
  }
}

export const UseSome: P.UseSome2<WrappedURI> = {
  useSome,
}

export const UseAll: P.UseAll2<WrappedURI> = {
  useAll,
}

export const ProvideSome: P.ProvideSome2<WrappedURI> = {
  provideSome,
}

export const ProvideAll: P.ProvideAll2<WrappedURI> = {
  provideAll,
}

export const Provide: P.Provide2<WrappedURI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}

export const create = flow(make, wrap)

export type Adapter = A.Adapter<Event<any, any>>

export type Event<E, A> = Created<E, A> | Updated<E, A> | Removed<E, A>

export interface Created<E, A> {
  readonly _tag: 'Created'
  readonly ref: Ref<E, A>
  readonly value: A
}

export interface Updated<E, A> {
  readonly _tag: 'Updated'
  readonly ref: Ref<E, A>
  readonly previousValue: A
  readonly value: A
}

export interface Removed<E, A> {
  readonly _tag: 'Removed'
  readonly ref: Ref<E, A>
}

export function refs(options: RefsOptions = {}): Refs {
  const { initial = [], refEvents = A.create() } = options
  const references = new Map(initial)
  const sendEvent = createSendEvent(references, refEvents)

  return {
    ...makeGetRef(references, sendEvent),
    ...makeHasRef(references),
    ...makeSetRef(references, sendEvent),
    ...makeDeleteRef(references, sendEvent),
    refEvents: [sendEvent, refEvents[1]],
  }
}

export type RefsOptions = {
  readonly initial?: Iterable<readonly [any, any]>
  readonly refEvents?: Adapter
}

function createSendEvent(references: Map<any, any>, [push]: Adapter) {
  return (event: Event<any, any>) => {
    switch (event._tag) {
      case 'Created':
        references.set(event.ref.id, event.value)
        push(event)
        break
      case 'Updated':
        references.set(event.ref.id, event.value)

        if (!event.ref.equals(event.previousValue)(event.value)) {
          push(event)
        }
        break
      case 'Removed':
        references.delete(event.ref.id)
        push(event)
        break
    }
  }
}

function makeGetRef(references: Map<any, any>, sendEvent: (event: Event<any, any>) => void): Get {
  return {
    getRef(ref) {
      if (references.has(ref.id)) {
        return E.of(references.get(ref.id)!)
      }

      return pipe(
        ref.initial,
        E.chainFirstIOK((value) => () => sendEvent({ _tag: 'Created', ref, value })),
      )
    },
  }
}

function makeHasRef(references: Map<any, any>): Has {
  return {
    hasRef(ref) {
      return E.fromIO(() => references.has(ref.id))
    },
  }
}

function makeSetRef(references: Map<any, any>, sendEvent: (event: Event<any, any>) => void): Set {
  const { getRef } = makeGetRef(references, sendEvent)

  return {
    setRef(ref, value) {
      return pipe(
        ref,
        getRef,
        E.chainFirstIOK(
          (previousValue) => () => sendEvent({ _tag: 'Updated', ref, previousValue, value }),
        ),
        E.constant(value),
      )
    },
  }
}

function makeDeleteRef(
  references: Map<any, any>,
  sendEvent: (event: Event<any, any>) => void,
): Remove {
  return {
    removeRef(ref) {
      return pipe(
        E.fromIO(() => (references.has(ref.id) ? O.some(references.get(ref.id)) : O.none)),
        E.chainFirstIOK(() => () => sendEvent({ _tag: 'Removed', ref })),
      )
    },
  }
}
