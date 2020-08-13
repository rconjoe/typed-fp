import { disposeAll, disposeNone } from '@most/disposable'
import { Disposable } from '@most/types'
import { number } from 'io-ts'

export * from '@most/disposable'
export { Disposable } from '@most/types'

export interface LazyDisposable extends Disposable {
  readonly disposed: boolean
  readonly addDisposable: (d: Disposable) => Disposable
}

export const lazy = (): LazyDisposable => {
  let disposed = false
  let disposables: Disposable[] | undefined = []

  const dispose = () => {
    if (disposed) {
      return
    }

    disposed = true
    disposeAll(disposables!).dispose()
    disposables = void 0 // small memory optimization..we may make a lot of these
  }

  const addDisposable = (d: Disposable) => {
    if (d === disposeNone()) {
      return d
    }

    if (disposed) {
      d.dispose()

      return disposeNone()
    }

    disposables!.push(d)

    const dispose = () => {
      const index = disposables!.indexOf(d)

      if (number.is(index) && index > -1) {
        disposables?.splice(index, 1)
      }
    }

    return { dispose }
  }

  return {
    get disposed() {
      return disposed
    },
    dispose,
    addDisposable,
  }
}
