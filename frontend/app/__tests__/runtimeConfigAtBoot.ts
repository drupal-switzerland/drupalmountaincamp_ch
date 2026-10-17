// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  assertBackendUrl,
  resolveGraphqlToken,
  serverConfigWarnings,
} from '../../server/utils/runtimeConfigAtBoot'

const COMPLETE = {
  backendUrl: 'https://drupal.test',
  requestHost: 'drupalmountaincamp.ch',
  drupalGraphqlToken: 'token',
}

describe('resolveGraphqlToken', () => {
  it('prefers the Nuxt override', () => {
    expect(
      resolveGraphqlToken(
        { NUXT_DRUPAL_GRAPHQL_TOKEN: 'nuxt', DRUPAL_GRAPHQL_TOKEN: 'drupal' },
        'built',
      ),
    ).toBe('nuxt')
  })

  it('then the variable Drupal reads at runtime', () => {
    expect(
      resolveGraphqlToken({ DRUPAL_GRAPHQL_TOKEN: 'drupal' }, 'built'),
    ).toBe('drupal')
  })

  it('then the value read at build time', () => {
    expect(resolveGraphqlToken({}, 'built')).toBe('built')
  })

  it('treats empty variables as unset', () => {
    expect(
      resolveGraphqlToken(
        { NUXT_DRUPAL_GRAPHQL_TOKEN: '', DRUPAL_GRAPHQL_TOKEN: '' },
        'built',
      ),
    ).toBe('built')
  })
})

describe('assertBackendUrl', () => {
  it('accepts a backend URL', () => {
    expect(() => assertBackendUrl(COMPLETE)).not.toThrow()
  })

  it('refuses to start without one, naming the variable', () => {
    expect(() => assertBackendUrl({ ...COMPLETE, backendUrl: '' })).toThrow(
      'NUXT_BACKEND_URL',
    )
  })
})

describe('serverConfigWarnings', () => {
  it('has none for a complete config', () => {
    expect(serverConfigWarnings(COMPLETE)).toEqual([])
  })

  it.each([
    ['requestHost', 'NUXT_REQUEST_HOST'],
    ['drupalGraphqlToken', 'DRUPAL_GRAPHQL_TOKEN'],
  ])('names an empty %s and its variable', (key, variable) => {
    const warnings = serverConfigWarnings({ ...COMPLETE, [key]: '' })

    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain(key)
    expect(warnings[0]).toContain(variable)
  })
})
