import path from 'path'
import { promises as fsp } from 'fs'
import { describe, it, expect } from 'vitest'
import { glob } from 'glob'
import * as ts from 'typescript'
import { parse as parseSfc } from '@vue/compiler-sfc'

// Parse a Vue SFC and check if the component's script calls the given function at least once.
function functionIsCalledAtLeastOnce(
  vueFileContents: string,
  functionName: string,
): boolean {
  const result = parseSfc(vueFileContents)
  const script = result.descriptor.scriptSetup?.content
  if (!script) {
    return false
  }
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    script,
    ts.ScriptTarget.ES2015,
    true,
  )

  let isCalled = false

  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(sourceFile) === functionName
    ) {
      isCalled = true
    }

    if (!isCalled) {
      ts.forEachChild(node, visit)
    }
  }

  ts.forEachChild(sourceFile, visit)

  return isCalled
}

describe('The Nuxt page component', async () => {
  const pageComponentFiles = await glob(
    path.resolve(__dirname, './../**/*.vue'),
    {
      ignore: [path.resolve(__dirname, './../blokkli/**/*.vue')],
    },
  ).then((pageFilePaths) => {
    console.log(pageFilePaths)
    return Promise.all(
      pageFilePaths.map((filePath) => {
        return fsp.readFile(filePath, { encoding: 'utf8' }).then((content) => {
          return {
            filePath,
            content,
          }
        })
      }),
    )
  })

  pageComponentFiles.forEach(({ filePath, content }) => {
    it(`"${filePath}" should call useDrupalRouteQuery()`, () => {
      expect(functionIsCalledAtLeastOnce(content, 'useDrupalRoute')).toEqual(
        true,
      )
    })
    it(`"${filePath}" should call setBreadcrumbLinksFromRoute()`, () => {
      expect(
        functionIsCalledAtLeastOnce(content, 'setBreadcrumbLinksFromRoute') ||
          functionIsCalledAtLeastOnce(content, 'setBreadcrumbLinks') ||
          functionIsCalledAtLeastOnce(content, 'useDrupalRoute'),
      ).toEqual(true)
    })
  })
})
