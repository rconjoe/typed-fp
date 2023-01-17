/// <reference types="@typed/framework" />

import { pipe } from '@fp-ts/data/Function'
import * as Fx from '@typed/fx'
// Browser virtual modules are extensions of RuntimeModule
// which expose an additional 'render' function which takes a parentElement
// and returns an Fx which will render your application into the parentElement.
import { render } from 'browser:./pages'

const parentElement = document.getElementById('application')

if (!parentElement) {
  throw new Error('Could not find #application element')
}

pipe(render(parentElement), Fx.unsafeRunAsyncWith(console.log))
