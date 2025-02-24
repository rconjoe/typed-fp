import { EOL } from 'os'

import type { SourceFile } from 'ts-morph'

function findImportDeclaration(sourceFile: SourceFile, moduleSpecifier: string) {
  return sourceFile.getImportDeclaration((x) => x.getModuleSpecifierValue() === moduleSpecifier)
}

export function appendText(sourceFile: SourceFile, text: string) {
  return sourceFile.insertText(sourceFile.getFullWidth(), EOL + text)
}

export function addNamedImport(
  sourceFile: SourceFile,
  names: readonly string[],
  moduleSpecifier: string,
  typeOnly = false,
) {
  const importDeclaration = findImportDeclaration(sourceFile, moduleSpecifier)

  if (importDeclaration) {
    const currentNames = new Set(importDeclaration.getNamedImports().map((x) => x.getName()))

    importDeclaration.addNamedImports(names.filter((x) => !currentNames.has(x)))

    return
  }

  sourceFile.addImportDeclaration({
    namedImports: [...names],
    moduleSpecifier,
    isTypeOnly: typeOnly,
  })
}

export function addNamespaceImport(
  sourceFile: SourceFile,
  name: string,
  moduleSpecifier: string,
  isTypeOnly = false,
) {
  const importDeclaration = findImportDeclaration(sourceFile, moduleSpecifier)

  if (importDeclaration) {
    if (importDeclaration.isTypeOnly() && !isTypeOnly) {
      importDeclaration.setIsTypeOnly(false)
    }

    return
  }

  sourceFile.addImportDeclaration({
    namespaceImport: name,
    moduleSpecifier,
    isTypeOnly,
  })
}
