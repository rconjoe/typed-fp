import * as E from '@fp/Env'
import { deepEqualsEq } from '@fp/Eq'
import * as P from '@fp/Provide'
import * as Ref from '@fp/Ref'
import { Endomorphism } from 'fp-ts/Endomorphism'
import { Eq } from 'fp-ts/Eq'
import { flow, identity, pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import { Ord } from 'fp-ts/Ord'
import { Predicate } from 'fp-ts/Predicate'
import * as RM from 'fp-ts/ReadonlyMap'
import { Refinement } from 'fp-ts/Refinement'

export interface RefMap<E, K, V> extends Ref.Wrapped<E, ReadonlyMap<K, V>> {
  readonly keyEq: Eq<K>
  readonly valueEq: Eq<V>
}

export type RefMapOptions<K, V> = Ref.RefOptions<ReadonlyMap<K, V>> & {
  readonly keyEq?: Eq<K>
  readonly valueEq?: Eq<V>
}

export const make = <E, K, V>(
  initial: E.Env<E, ReadonlyMap<K, V>>,
  options: RefMapOptions<K, V> = {},
): RefMap<E, K, V> => {
  const {
    id,
    keyEq = deepEqualsEq,
    valueEq = deepEqualsEq,
    eq = RM.getEq(keyEq, valueEq),
  } = options

  const ref = Ref.create(initial, { id, eq })

  return {
    ...ref,
    keyEq,
    valueEq,
  }
}

export const kv = <K, V>(keyEq: Eq<K> = deepEqualsEq, valueEq: Eq<V> = deepEqualsEq) =>
  make(
    E.fromIO(() => new Map()),
    { keyEq, valueEq },
  )

export const getOrCreate = <E1, K, V>(M: RefMap<E1, K, V>) => {
  const find = RM.lookup(M.keyEq)
  const upsert = RM.upsertAt(M.keyEq)

  return <E2>(k: K, orCreate: E.Env<E2, V>) =>
    pipe(
      E.Do,
      E.bindW('map', () => M.get),
      E.bindW('current', ({ map }) => pipe(map, find(k), E.of)),
      E.chainW(({ map, current }) =>
        pipe(
          current,
          O.matchW(
            () =>
              pipe(
                orCreate,
                E.chainFirstW((a) => pipe(map, upsert(k, a), M.set)),
              ),
            E.of,
          ),
        ),
      ),
    )
}

export const upsertAt = <E1, K, V>(M: RefMap<E1, K, V>) => {
  const upsert = RM.upsertAt(M.keyEq)

  return (k: K, v: V) => M.update(flow(upsert(k, v), E.of))
}

export const lookup = <E1, K, V>(M: RefMap<E1, K, V>) => {
  const find = RM.lookup(M.keyEq)

  return (k: K) => pipe(M.get, E.map(find(k)))
}

export const deleteAt = <E1, K, V>(M: RefMap<E1, K, V>) => {
  const del = RM.deleteAt(M.keyEq)

  return (k: K) =>
    M.update((current) =>
      pipe(
        current,
        del(k),
        O.matchW(() => current, identity),
        E.of,
      ),
    )
}

export const elem = <E1, K, V>(M: RefMap<E1, K, V>) => {
  const find = RM.elem(M.valueEq)

  return (v: V) => pipe(M.get, E.map(find(v)))
}

export const filter = <E1, K, V>(M: RefMap<E1, K, V>) => {
  function filterM<V2 extends V>(r: Refinement<V, V2>): E.Env<E1 & Ref.Refs, ReadonlyMap<K, V>>
  function filterM(r: Predicate<V>): E.Env<E1 & Ref.Refs, ReadonlyMap<K, V>>
  function filterM(r: Predicate<V>): E.Env<E1 & Ref.Refs, ReadonlyMap<K, V>> {
    return pipe(M.get, E.map(RM.filter(r)), E.chainW(M.set))
  }

  return filterM
}

export const insertAt = <E1, K, V>(M: RefMap<E1, K, V>) => {
  const insert = RM.insertAt(M.keyEq)

  return (k: K, v: V) =>
    M.update((m) =>
      pipe(
        m,
        insert(k, v),
        O.getOrElse(() => m),
        E.of,
      ),
    )
}

export const modifyAt = <E1, K, V>(M: RefMap<E1, K, V>) => {
  const modify = RM.modifyAt(M.keyEq)

  return (k: K, v: Endomorphism<V>) =>
    M.update((m) =>
      pipe(
        m,
        modify(k, v),
        O.getOrElse(() => m),
        E.of,
      ),
    )
}

export const updateAt = <E1, K, V>(M: RefMap<E1, K, V>) => {
  const update = RM.updateAt(M.keyEq)

  return (k: K, v: V) =>
    M.update((m) =>
      pipe(
        m,
        update(k, v),
        O.getOrElse(() => m),
        E.of,
      ),
    )
}

export const keys =
  <K>(O: Ord<K>) =>
  <E, V>(M: RefMap<E, K, V>) =>
    pipe(M.get, E.map(RM.keys(O)))

export const size = <E, K, V>(M: RefMap<E, K, V>) => pipe(M.get, E.map(RM.size))

export const toReadonlyArray =
  <K>(O: Ord<K>) =>
  <E, V>(M: RefMap<E, K, V>) =>
    pipe(M.get, E.map(RM.toReadonlyArray(O)))

export const values =
  <V>(O: Ord<V>) =>
  <E, K>(M: RefMap<E, K, V>) =>
    pipe(M.get, E.map(RM.values(O)))

export interface Wrapped<E, K, V> extends RefMap<E, K, V> {
  readonly getOrCreate: <E2>(k: K, orCreate: E.Env<E2, V>) => E.Env<E & Ref.Set & E2 & Ref.Get, V>
  readonly upsertAt: (k: K, v: V) => E.Env<E & Ref.Get & Ref.Set, ReadonlyMap<K, V>>
  readonly lookup: (k: K) => E.Env<E & Ref.Get, O.Option<V>>
  readonly elem: (v: V) => E.Env<E & Ref.Get, boolean>
  readonly filter: {
    <V2 extends V>(r: Refinement<V, V2>): E.Env<E & Ref.Refs, ReadonlyMap<K, V>>
    (r: Predicate<V>): E.Env<E & Ref.Refs, ReadonlyMap<K, V>>
  }
  readonly insertAt: (k: K, v: V) => E.Env<E & Ref.Get & Ref.Set, ReadonlyMap<K, V>>
  readonly updateAt: (k: K, v: V) => E.Env<E & Ref.Get & Ref.Set, ReadonlyMap<K, V>>
  readonly modifyAt: (k: K, v: Endomorphism<V>) => E.Env<E & Ref.Get & Ref.Set, ReadonlyMap<K, V>>
  readonly deleteAt: (k: K) => E.Env<E & Ref.Get & Ref.Set, ReadonlyMap<K, V>>
}

export function wrap<E, K, V>(M: RefMap<E, K, V>): Wrapped<E, K, V> {
  return {
    ...M,
    getOrCreate: getOrCreate(M),
    upsertAt: upsertAt(M),
    lookup: lookup(M),
    elem: elem(M),
    filter: filter(M),
    insertAt: insertAt(M),
    modifyAt: modifyAt(M),
    updateAt: updateAt(M),
    deleteAt: deleteAt(M),
  }
}

export const create = flow(make, wrap)

export const useSome =
  <E1>(provided: E1) =>
  <E2, K, V>(ref: Wrapped<E1 & E2, K, V>): Wrapped<E2, K, V> => {
    const provide = E.useSome(provided)

    return {
      ...Ref.useSome(provided)(ref),
      keyEq: ref.keyEq,
      valueEq: ref.valueEq,
      getOrCreate: flow(ref.getOrCreate, provide),
      upsertAt: flow(ref.upsertAt, provide),
      lookup: flow(ref.lookup, provide),
      elem: flow(ref.elem, provide),
      filter: flow(ref.filter, provide),
      insertAt: flow(ref.insertAt, provide),
      modifyAt: flow(ref.modifyAt, provide),
      updateAt: flow(ref.updateAt, provide),
      deleteAt: flow(ref.deleteAt, provide),
    }
  }

export const provideSome =
  <E1>(provided: E1) =>
  <E2, K, V>(ref: Wrapped<E1 & E2, K, V>): Wrapped<E2, K, V> => {
    const provide = E.provideSome(provided)

    return {
      ...Ref.provideSome(provided)(ref),
      keyEq: ref.keyEq,
      valueEq: ref.valueEq,
      getOrCreate: flow(ref.getOrCreate, provide),
      upsertAt: flow(ref.upsertAt, provide),
      lookup: flow(ref.lookup, provide),
      elem: flow(ref.elem, provide),
      filter: flow(ref.filter, provide),
      insertAt: flow(ref.insertAt, provide),
      modifyAt: flow(ref.modifyAt, provide),
      updateAt: flow(ref.updateAt, provide),
      deleteAt: flow(ref.deleteAt, provide),
    }
  }

export const provideAll: <E>(
  provided: E,
) => <K, V>(ref: Wrapped<E, K, V>) => Wrapped<unknown, K, V> = provideSome

export const useAll: <E>(provided: E) => <K, V>(ref: Wrapped<E, K, V>) => Wrapped<unknown, K, V> =
  useSome

export const WrappedURI = '@typed/fp/RefMap'
export type WrappedURI = typeof WrappedURI

declare module 'fp-ts/HKT' {
  export interface URItoKind3<R, E, A> {
    [WrappedURI]: Wrapped<R, E, A>
  }
}

declare module '@fp/Hkt' {
  export interface UriToVariance {
    [WrappedURI]: V<R, Contravariant>
  }
}

export const UseSome: P.UseSome3<WrappedURI> = {
  useSome,
}

export const UseAll: P.UseAll3<WrappedURI> = {
  useAll,
}

export const ProvideSome: P.ProvideSome3<WrappedURI> = {
  provideSome,
}

export const ProvideAll: P.ProvideAll3<WrappedURI> = {
  provideAll,
}

export const Provide: P.Provide3<WrappedURI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}
