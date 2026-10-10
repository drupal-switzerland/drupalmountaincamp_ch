// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { withTrustedForwardedHost } from '../../server/utils/trustedHost'

const INTERNAL = 'frontend.prod.drupalmountaincamp-ch.ch4.amazee.io'
const base = { 'x-drupal-graphql-token': 'token', 'x-forwarded-port': '3000' }

describe('withTrustedForwardedHost on production', () => {
  const trusted = (host?: string) =>
    withTrustedForwardedHost(
      host === undefined ? base : { ...base, 'x-forwarded-host': host },
      'production',
    )

  it.each([
    'drupalmountaincamp.ch',
    'www.drupalmountaincamp.ch',
    'cfp.drupalmountaincamp.ch',
  ])('passes the public host %s through unchanged', (host) => {
    expect(trusted(host)).toEqual({ ...base, 'x-forwarded-host': host })
  })

  it.each([
    ['the internal Lagoon route', INTERNAL],
    ['a spoofed host', 'evil.example'],
    ['a look-alike host', 'drupalmountaincamp.ch.evil.example'],
    ['no host', undefined],
  ])('replaces %s with the canonical public host', (_label, host) => {
    expect(trusted(host)).toEqual({
      ...base,
      'x-forwarded-host': 'drupalmountaincamp.ch',
      'x-forwarded-proto': 'https',
      'x-forwarded-port': '443',
    })
  })

  it('accepts case, a port and a proxy chain on a public host', () => {
    const host = 'WWW.drupalmountaincamp.ch:443, nginx'
    expect(trusted(host)['x-forwarded-host']).toBe(host)
  })
})

describe('withTrustedForwardedHost elsewhere', () => {
  it.each([undefined, 'development'])(
    'leaves headers alone when the environment type is %s',
    (environmentType) => {
      const headers = { ...base, 'x-forwarded-host': INTERNAL }
      expect(withTrustedForwardedHost(headers, environmentType)).toBe(headers)
    },
  )
})
