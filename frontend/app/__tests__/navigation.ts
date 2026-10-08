// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { isActivePath } from '../helpers/navigation'

describe('isActivePath', () => {
  it('is active on its own page', () => {
    expect(isActivePath('/davos', '/davos')).toBe(true)
  })

  it('is active on pages below it', () => {
    expect(isActivePath('/news/some-article', '/news')).toBe(true)
  })

  it('is not active on pages that only share a prefix', () => {
    expect(isActivePath('/newsletter', '/news')).toBe(false)
  })

  it('keeps the home link active on the homepage only', () => {
    expect(isActivePath('/', '/')).toBe(true)
    expect(isActivePath('/davos', '/')).toBe(false)
  })

  it('is never active without a path', () => {
    expect(isActivePath('/davos', undefined)).toBe(false)
    expect(isActivePath('/davos', null)).toBe(false)
  })
})
