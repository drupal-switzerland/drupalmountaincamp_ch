// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const PAGES_DIR = join(process.cwd(), 'app/pages')
const ROUTING_CONFIG = join(
  process.cwd(),
  '../drupal/config/default/frontend_routing.settings.yml',
)
const ROUTE_KEY = /^ {2}([\w-]+):$/gm
const PAGE_NAME = /name:\s*'([\w-]+)'/g

const listVueFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return listVueFiles(path)
    return entry.name.endsWith('.vue') ? [path] : []
  })

const fixedPathPages = listVueFiles(PAGES_DIR).filter((path) =>
  readFileSync(path, 'utf8').includes('drupalFrontendRoute: true'),
)

const routeNamesOf = (path: string) =>
  [...readFileSync(path, 'utf8').matchAll(PAGE_NAME)].map((m) => m[1])

describe('Drupal frontend routing', () => {
  it('exports a route key only for a page that declares it', () => {
    const configKeys = [
      ...readFileSync(ROUTING_CONFIG, 'utf8').matchAll(ROUTE_KEY),
    ].map((m) => m[1])
    const pageNames = fixedPathPages.flatMap(routeNamesOf)
    for (const key of configKeys) {
      expect(pageNames).toContain(key)
    }
  })

  it('ships no example pages', () => {
    const examples = listVueFiles(PAGES_DIR)
      .map((path) => relative(PAGES_DIR, path))
      .filter((path) => /example/i.test(path))
    expect(examples).toEqual([])
  })
})
