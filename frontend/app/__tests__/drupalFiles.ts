// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { toDrupalFilePath } from '../helpers/drupalFiles'

const DERIVATIVE =
  '/sites/default/files/styles/wide/public/field/image/photo%20one.png.webp?itok=zWpwZOz0'

describe('toDrupalFilePath', () => {
  it.each([
    [
      'the internal Lagoon host',
      'https://frontend.prod.drupalmountaincamp-ch.ch4.amazee.io',
    ],
    ['the public host', 'https://drupalmountaincamp.ch'],
    ['a host with a port', 'https://drupalmountaincamp-ch-pr126.ddev.site:80'],
    // Drupal answers the frontend's internal requests over plain http.
    // eslint-disable-next-line sonarjs/no-clear-text-protocols
    ['plain http', 'http://nginx:8080'],
  ])('drops %s from a derivative URL', (_label, origin) => {
    expect(toDrupalFilePath(`${origin}${DERIVATIVE}`)).toBe(DERIVATIVE)
  })

  it('keeps private file paths', () => {
    expect(
      toDrupalFilePath('https://frontend.prod.example/system/files/doc.pdf'),
    ).toBe('/system/files/doc.pdf')
  })

  it('leaves paths that are already root-relative', () => {
    expect(toDrupalFilePath(DERIVATIVE)).toBe(DERIVATIVE)
  })

  it('leaves external images on their own host', () => {
    const remote = 'https://i.ytimg.com/vi/abc/hqdefault.jpg'
    expect(toDrupalFilePath(remote)).toBe(remote)
  })

  it('passes through missing values', () => {
    expect(toDrupalFilePath(undefined)).toBeUndefined()
    expect(toDrupalFilePath(null)).toBeUndefined()
    expect(toDrupalFilePath('')).toBe('')
  })
})
