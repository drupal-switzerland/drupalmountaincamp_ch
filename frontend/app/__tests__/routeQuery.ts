import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { useRouteQuery } from '../composables/routeQuery'
import { routeQueryError } from '../helpers/backendUnavailable'

// import.meta.url is not a file URL in the nuxt test environment; vitest
// runs from frontend/.
const PAGES_DIR = join(process.cwd(), 'app/pages')
// Handles a failed query itself: answers 503 with an inline message.
const HANDLES_FAILURE_ITSELF = ['news/index.vue']

function pageFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      return pageFiles(path)
    }
    return entry.name.endsWith('.vue') ? [path] : []
  })
}

describe('route query', () => {
  it('returns the loaded data', async () => {
    const data = await useRouteQuery('route-query-ok', async () => ({
      route: 'found',
    }))

    expect(data.value).toEqual({ route: 'found' })
  })

  it('keeps the status of a failed request instead of an empty result', async () => {
    const failed = useRouteQuery('route-query-503', () =>
      Promise.reject(
        createError({ statusCode: 503, statusMessage: 'Unavailable' }),
      ),
    )

    await expect(failed).rejects.toMatchObject({
      statusCode: 503,
      statusMessage: 'Unavailable',
      fatal: true,
    })
  })

  it('answers 500 for a failure without a status', () => {
    expect(routeQueryError({})).toEqual({
      statusCode: 500,
      statusMessage: undefined,
      fatal: true,
    })
  })

  it('is how every page loads the query it gives useDrupalRoute', () => {
    const offenders = pageFiles(PAGES_DIR)
      .map((path) => ({
        name: relative(PAGES_DIR, path),
        source: readFileSync(path, 'utf8'),
      }))
      .filter(({ name }) => !HANDLES_FAILURE_ITSELF.includes(name))
      .filter(
        ({ source }) =>
          source.includes('useDrupalRoute') &&
          !source.includes('useRouteQuery('),
      )
      .map(({ name }) => name)

    expect(offenders).toEqual([])
  })
})
