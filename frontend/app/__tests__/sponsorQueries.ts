// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const QUERIES = readFileSync(
  join(
    process.cwd(),
    'app/components/Paragraph/SponsorList/query.sponsorList.graphql',
  ),
  'utf8',
)

describe('sponsor queries', () => {
  it('filters the edition query by the year variable', () => {
    const editionQuery = QUERIES.slice(QUERIES.indexOf('query sponsorsOfYear'))

    expect(editionQuery).toContain('{ field: "field_year", value: [$year] }')
  })

  it('requests only the derivatives SponsorTile renders', () => {
    const styles = [...QUERIES.matchAll(/derivative\(style: (\w+)\)/g)]
      .map((match) => match[1])
      .sort()

    expect(styles).toEqual(['LARGE', 'WIDE'])
    expect(QUERIES).not.toContain('...imageItem')
  })
})
