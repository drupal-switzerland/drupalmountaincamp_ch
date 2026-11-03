import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ThemeTicket from '../components/ThemeTicket/index.vue'

const source = (path: string) =>
  readFileSync(join(process.cwd(), 'app', path), 'utf8')

describe('theme ticket', () => {
  // Tests render text keys, so "theme.label: theme.name" stands for
  // "2027 theme: Humans with AI in the Loop".
  it('reads as one label, the stub and the name joined by a colon', async () => {
    const ticket = (await mountSuspended(ThemeTicket)).get('p')

    expect(ticket.text().replace(/\s+/g, ' ')).toBe('theme.label: theme.name')
    expect(ticket.get('.sr-only').text()).toBe(':')
  })

  it('is plain text, not a link or an image', async () => {
    const wrapper = await mountSuspended(ThemeTicket)

    expect(wrapper.findAll('a, button, img, svg')).toHaveLength(0)
  })

  it.each([
    'components/HomeHero/index.vue',
    'components/PageHero/index.vue',
    'components/Node/PressRelease/index.vue',
  ])('is shown in %s', (path) => {
    expect(source(path)).toContain('<ThemeTicket')
  })

  it('stacks when narrow and keeps an outline in forced colours', () => {
    const css = source('assets/css/components/brand.css')

    expect(css).toMatch(/\.theme-ticket-box\s*{\s*container-type: inline-size/)
    expect(css).toContain('@container (max-width: 22rem)')
    expect(css).toMatch(
      /forced-colors: active[\s\S]*\.theme-ticket\s*{\s*border-color: CanvasText;\s*mask: none;/,
    )
  })

  it('prints the stub label navy without its blue fill', () => {
    const css = source('assets/css/components/print.css')

    expect(css).toMatch(
      /\.theme-ticket-stub\s*{\s*color: theme\(colors\.brand\.navy\) !important;/,
    )
    expect(css).toMatch(
      /\.theme-ticket-stub\s*{\s*background: none !important;/,
    )
  })
})
