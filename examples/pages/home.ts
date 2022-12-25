import { Main } from '@typed/framework/Module.js'

import { html } from '@typed/html/index.js'
import * as Route from '@typed/route/index.js'

export const route = Route.home

export const main = Main.make(route)(() => html`<h1>Home</h1>`)
