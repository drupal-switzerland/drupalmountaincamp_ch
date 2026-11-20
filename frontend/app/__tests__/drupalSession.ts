// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { hasDrupalSessionCookie } from '../helpers/drupalSession'

const HASH = '0123456789abcdef0123456789abcdef'

describe('hasDrupalSessionCookie', () => {
  it.each([
    ['the HTTPS name', `SSESS${HASH}=id`],
    ['the plain HTTP name', `SESS${HASH}=id`],
    ['after other cookies', `consent=1; theme=dark; SSESS${HASH}=id`],
    ['before other cookies', `SSESS${HASH}=id; consent=1`],
    ['without a space after the separator', `consent=1;SSESS${HASH}=id`],
    ['with a shorter hash', 'SSESSabc123=id'],
    ['in lower case', `ssess${HASH}=id`],
    // Looser than core's name on purpose; a miss here could cache a session.
    ['a cookie literally named SESSION', 'SESSION=abc'],
    ['in a header sent as a list', ['consent=1', `SSESS${HASH}=id`]],
  ])('finds a session cookie: %s', (_label, header) => {
    expect(hasDrupalSessionCookie(header)).toBe(true)
  })

  it.each([
    ['no header', undefined],
    ['null', null],
    ['an empty header', ''],
    ['an empty list', []],
    ['unrelated cookies', 'consent=1; theme=dark'],
    ['"SSESS" in a cookie value', `ref=SSESS${HASH}`],
    ['"SSESS" inside another name', 'XSSESSION=1; MYSESS1=2'],
    ['the bare prefix as a name', 'SSESS=1; SESS=2'],
  ])('finds none for %s', (_label, header) => {
    expect(hasDrupalSessionCookie(header)).toBe(false)
  })
})
