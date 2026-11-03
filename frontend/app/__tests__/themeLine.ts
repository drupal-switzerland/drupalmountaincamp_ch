import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ThemeLine from '../components/ThemeLine/index.vue'

const source = (path: string) =>
  readFileSync(join(process.cwd(), 'app', path), 'utf8')

describe('theme line', () => {
  // Tests render text keys, so "theme.label: theme.name" stands for
  // "2027 theme: Humans with AI in the Loop".
  it('names the theme and tells screen readers what it is', async () => {
    const line = (await mountSuspended(ThemeLine)).get('p')

    expect(line.text().replace(/\s+/g, ' ')).toBe('theme.label: theme.name')
    expect(line.get('.sr-only').text()).toBe('theme.label:')
  })

  it('is plain text, not a link or an image', async () => {
    const wrapper = await mountSuspended(ThemeLine)

    expect(wrapper.findAll('a, button, img, svg')).toHaveLength(0)
  })

  it.each([
    'components/HomeHero/index.vue',
    'components/PageHero/index.vue',
    'components/Node/PressRelease/index.vue',
  ])('is shown in %s', (path) => {
    expect(source(path)).toContain('<ThemeLine')
  })

  it('comes right after the title in both heroes', () => {
    for (const path of [
      'components/HomeHero/index.vue',
      'components/PageHero/index.vue',
    ]) {
      const hero = source(path)
      const title = hero.lastIndexOf('</h1>')

      expect(title, path).toBeGreaterThan(-1)
      expect(hero.indexOf('<ThemeLine'), path).toBeGreaterThan(title)
    }
  })

  // The landing image hero's overlay sizes to its title, which squeezed and
  // clipped the theme.
  it('stays off the landing image hero', () => {
    expect(source('components/Node/Page/Landing/index.vue')).not.toContain(
      '<ThemeLine',
    )
  })

  it('is ice on the dark heroes and brand blue on white', () => {
    const css = source('assets/css/components/brand.css')

    expect(css).toMatch(
      /\.theme-line \{\s*@apply [^;]*text-primary-400[^;]*;\s*:where\(\.on-dark\) & \{\s*@apply text-primary-100;/,
    )
  })
})
