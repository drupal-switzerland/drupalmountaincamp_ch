// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROBOTS_TXT = join(process.cwd(), 'public/robots.txt')
const RULE = /^(allow|disallow):/i

const groupFor = (agent: string) => {
  const lines = readFileSync(ROBOTS_TXT, 'utf8')
    .split('\n')
    .map((line) => line.trim())
  const start = lines.indexOf(`User-agent: ${agent}`)
  const end = lines.findIndex((line, i) => i > start && line === '')
  return lines.slice(start + 1, end === -1 ? undefined : end)
}

describe('robots.txt', () => {
  it('gives the wildcard group a rule line (RFC 9309)', () => {
    expect(groupFor('*').some((line) => RULE.test(line))).toBe(true)
  })

  it('blocks no path', () => {
    const rules = groupFor('*').filter((line) => RULE.test(line))
    expect(rules).toEqual(['Disallow:'])
  })
})
