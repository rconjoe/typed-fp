import { EOL } from 'os'
import { dirname } from 'path'

import type { Project } from 'ts-morph'

import { SourceFileModule } from './SourceFileModule.js'
import { buildImportsAndModules, runMatcherWithFallback } from './helpers.js'

export function buildClientSideEntrypoint(
  sourceFileModules: SourceFileModule[],
  project: Project,
  outFile: string,
) {
  const [imports, modules, fallback] = buildImportsAndModules(sourceFileModules, dirname(outFile))
  const shouldImportForEnvironment = modules.some((x) => x.includes('provideLayer'))
  const shouldImportModule = modules.length > 0

  const entrypoint = project.createSourceFile(
    outFile,
    `/* This file was auto-generated by @typed/compiler */

import * as F from '@fp-ts/data/Function'
${shouldImportForEnvironment ? EOL + `import * as Fx from '@typed/fx'` : ''}
${shouldImportForEnvironment ? EOL + `import * as Route from '@typed/route'` : ''}
import { ${
      shouldImportModule ? 'Module, ' : ''
    }buildModules, provideBrowserIntrinsics } from '@typed/framework'
import { renderInto } from '@typed/html'
${imports.join('\n')}

export const matcher = buildModules([
  ${modules.join(',' + EOL + '  ')}
])

export const main = ${fallback ? runMatcherWithFallback(fallback) : `matcher.run`}

export const render = <T extends HTMLElement>(parentElement: T) => F.pipe(
  main,
  renderInto(parentElement),
  provideBrowserIntrinsics(window, { parentElement }),
)
`,
    { overwrite: true },
  )

  const diagnostics = entrypoint.getPreEmitDiagnostics()

  if (diagnostics.length > 0) {
    console.info(entrypoint.getFullText())
    console.warn(project.formatDiagnosticsWithColorAndContext(diagnostics))
  }

  return entrypoint
}
