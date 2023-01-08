/* File auto-generated by @typed/compiler */

import { readFileSync } from 'fs'
import { IncomingMessage } from 'http'

import { makeServerWindow, ServerWindowOptions } from '@typed/framework'
export const assetDirectory =
  '/Users/TylorSteinberger/code/tylors/typed-fp/example/dist/client/assets'
export const htmlAttributes = { lang: 'en-us' }
export const docType = '<!DOCTYPE html>'
export const html = import.meta.env.PROD
  ? readFileSync(
      '/Users/TylorSteinberger/code/tylors/typed-fp/example/dist/client/index.html',
    ).toString()
  : `<!DOCTYPE html>
<html lang="en-us">
<head>
  <title>@typed/fp testing</title>
  <meta charset="utf-8" />
  <meta name="description" content="@typed/fp testing" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
  <div id="application"></div>
  <script type="module" src="./browser.ts"></script>
</body>
</html>
`
export function makeWindow(req: IncomingMessage, options?: ServerWindowOptions) {
  const win = makeServerWindow(req, options)
  const documentElement = window.document.documentElement
  documentElement.innerHTML = html
  for (const [key, value] of Object.entries(htmlAttributes)) {
    documentElement.setAttribute(key, value)
  }
  return win
}
