import {
  FunctionSignature,
  HKTParam,
  HKTPlaceholder,
  Interface,
  InterfaceProperty,
  Kind,
  KindReturn,
  StaticTypeParam,
  Tuple,
} from '../AST'

export const hkt = new HKTParam('T')
export const placeholder = new HKTPlaceholder(hkt)
export const aTypeParam = new StaticTypeParam('A')
export const bTypeParam = new StaticTypeParam('B')

export const node = new Interface(
  'CommutativeBoth',
  [hkt],
  [
    new InterfaceProperty(
      'both',
      new FunctionSignature(
        '',
        [placeholder, bTypeParam],
        [new Kind('second', hkt, [placeholder, bTypeParam])],
        new FunctionSignature(
          '',
          [aTypeParam],
          [new Kind('first', hkt, [placeholder, aTypeParam])],
          new KindReturn(hkt, [placeholder, new Tuple([aTypeParam, bTypeParam])]),
        ),
      ),
    ),
  ],
)
