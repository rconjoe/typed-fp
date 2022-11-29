import * as P from '@fp-ts/core/typeclass/Pointed'

import { Covariant } from './Covariant.js'
import { Of } from './Of.js'
import { CauseTypeLambda } from './TypeLambda.js'

export const Pointed: P.Pointed<CauseTypeLambda> = {
  ...Of,
  ...Covariant,
}
