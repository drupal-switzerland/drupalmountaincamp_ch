// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { canRenderWithRokka } from '../helpers/rokka'

describe('canRenderWithRokka', () => {
  it('uses rokka for a file with a hash when a host is set', () => {
    expect(canRenderWithRokka('52a463b2', 'mountaincamp.rokka.io')).toBe(true)
  })

  it.each([
    ['no hash', null, 'mountaincamp.rokka.io'],
    ['an empty hash', '', 'mountaincamp.rokka.io'],
    ['no host', '52a463b2', undefined],
    ['an empty host', '52a463b2', ''],
  ])('falls back to the Drupal derivatives with %s', (_, hash, host) => {
    expect(canRenderWithRokka(hash, host)).toBe(false)
  })
})
