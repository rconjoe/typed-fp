import type { TypeLambda } from '@fp-ts/core/HKT'

import type { Fx } from '../Fx.js'

export interface FxTypeLambda extends TypeLambda {
  readonly type: Fx<this['Out2'], this['Out1'], this['Target']>
}
