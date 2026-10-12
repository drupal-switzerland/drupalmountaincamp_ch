// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postcss from 'postcss'
import nesting from 'tailwindcss/nesting/index.js'
import { brand, colors } from '../../tailwind.config'

const WHITE = '#FFFFFF'
const AA_TEXT = 4.5
const AA_LARGE_TEXT = 3
const AA_NON_TEXT = 3

// What a table's white panel contains, as the stylesheets spell it.
const IN_TABLE_PANEL =
  '.ck-content > table *, [data-scrollable-table] *, figure.table *'
const IN_BUTTON = 'a.button *'

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function contrast(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  )
  return (light! + 0.05) / (dark! + 0.05)
}

type FlatRule = { selector: string; body: string }

// The stylesheets nest; the nesting plugin the build uses turns them into the
// full selectors the browser gets, with @apply left as written.
function flatRules(name: string): FlatRule[] {
  const source = readFileSync(
    join(process.cwd(), 'app/assets/css/components', name),
    'utf8',
  )
  const root = postcss([nesting]).process(source, { from: undefined }).root
  const rules: FlatRule[] = []
  root.walkRules((rule) => {
    const body = rule.nodes
      .filter((node) => node.type !== 'rule')
      .map((node) => node.toString())
      .join('; ')
    for (const selector of rule.selectors) {
      rules.push({ selector: selector.replace(/\s+/g, ' ').trim(), body })
    }
  })
  return rules
}

const CK_CONTENT = flatRules('ck-content.css')
const BRAND = flatRules('brand.css')
const ALL = [...CK_CONTENT, ...BRAND]

function bodyOf(rules: FlatRule[], selector: string): string {
  const rule = rules.find((candidate) => candidate.selector === selector)
  expect(rule, `no rule for "${selector}"`).toBeDefined()
  return rule!.body
}

const UTILITY_COLOURS: Record<string, string> = {
  white: WHITE,
  'primary-100': colors.primary[100],
  'primary-300': colors.primary[300],
  'primary-400': colors.primary[400],
  'primary-500': colors.primary[500],
  link: colors.link.DEFAULT,
}

function textColour(body: string): string {
  const match = body.match(/(?:^|\s)text-(white|link|primary-\d+)\b/)
  expect(match, `no text colour in "${body}"`).not.toBeNull()
  return UTILITY_COLOURS[match![1]!]!
}

function outlineColour(body: string): string {
  if (/\boutline-white\b/.test(body)) {
    return WHITE
  }
  const match = body.match(/outline-color: theme\(colors\.brand\.(\w+)\)/)
  expect(match, `no outline colour in "${body}"`).not.toBeNull()
  return brand[match![1] as keyof typeof brand]
}

const notIn = (...lists: string[]) => `:not( :where( ${lists.join(', ')} ) )`
const squash = (selector: string) => selector.replace(/\s+/g, '')

describe('theme card (ice to lilac)', () => {
  it('rejects the link colour on its lilac end', () => {
    expect(contrast(colors.link.DEFAULT, brand.lilac)).toBeLessThan(AA_TEXT)
  })

  it('sets links in a colour that holds at both ends', () => {
    const link = textColour(
      bodyOf(CK_CONTENT, '.is-theme .ck-content a:not(.button)'),
    )

    expect(contrast(link, brand.ice)).toBeGreaterThanOrEqual(AA_TEXT)
    expect(contrast(link, brand.lilac)).toBeGreaterThanOrEqual(AA_TEXT)
  })
})

describe('navy band (navy to blue)', () => {
  const highlightRules = BRAND.filter(
    (rule) =>
      rule.selector.startsWith('.navy-band') &&
      rule.selector.includes('.highlight'),
  )

  it('rejects sky on its blue end, also as large text', () => {
    expect(contrast(brand.sky, brand.blue)).toBeLessThan(AA_LARGE_TEXT)
  })

  it('has one highlight colour, for headings and body text alike', () => {
    expect(highlightRules).toHaveLength(1)
    expect(squash(highlightRules[0]!.selector)).toBe(
      squash(
        `.navy-band .ck-content .highlight${notIn(IN_TABLE_PANEL, IN_BUTTON)}`,
      ),
    )
  })

  it('sets highlights in a colour that holds at both ends', () => {
    const highlight = textColour(highlightRules[0]!.body)

    expect(contrast(highlight, brand.navy)).toBeGreaterThanOrEqual(AA_TEXT)
    expect(contrast(highlight, brand.blue)).toBeGreaterThanOrEqual(AA_TEXT)
  })
})

describe("a table's white panel on a dark section", () => {
  // Rules that colour something on a dark section and can match inside the
  // panel. Not rich text, so not in a table: the ticket button. The panel's
  // own rules and the global focus ring are checked below.
  const NOT_RICH_TEXT = ['.on-dark .ticket-button']
  const PANEL_RULES = [
    '.on-dark .ck-content figure.table',
    '.on-dark .ck-content > table',
    ".on-dark .ck-content > [data-scrollable-table='wrapper']",
    '.on-dark .ck-content :is(.ck-content > table, [data-scrollable-table], figure.table) :focus-visible',
    '.on-dark .ck-content [data-scrollable-table]:focus-visible',
    '.on-dark :focus-visible',
  ]
  const darkRules = ALL.filter(
    (rule) =>
      rule.selector.includes('.on-dark') &&
      !NOT_RICH_TEXT.includes(rule.selector) &&
      !PANEL_RULES.includes(rule.selector),
  )

  it('finds the dark-section rules', () => {
    expect(darkRules.length).toBeGreaterThanOrEqual(7)
  })

  it.each(darkRules.map((rule) => [rule.selector]))(
    'is left out of %s',
    (selector) => {
      expect(squash(selector)).toContain(squash(`:where( ${IN_TABLE_PANEL}`))
    },
  )

  it.each(
    ALL.filter(
      (rule) =>
        rule.selector.includes('.highlight') &&
        /\.on-dark|\.navy-band/.test(rule.selector),
    ).map((rule) => [rule.selector]),
  )('leaves buttons out of %s', (selector) => {
    expect(squash(selector)).toContain(squash(IN_BUTTON))
  })

  it('lets a button colour a highlight inside it', () => {
    expect(bodyOf(CK_CONTENT, '.ck-content a.button .highlight')).toBe(
      'color: inherit',
    )
  })

  it.each(PANEL_RULES.slice(0, 3))('sets readable text on %s', (selector) => {
    const text = textColour(bodyOf(CK_CONTENT, selector))

    expect(contrast(text, WHITE)).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it('draws the focus ring of what is inside it in a colour visible on white', () => {
    const ring = outlineColour(bodyOf(CK_CONTENT, PANEL_RULES[3]!))

    expect(contrast(ring, WHITE)).toBeGreaterThanOrEqual(AA_NON_TEXT)
  })

  it('draws its own scroll ring in a colour visible on the band', () => {
    const ring = outlineColour(bodyOf(CK_CONTENT, PANEL_RULES[4]!))

    expect(contrast(ring, brand.navy)).toBeGreaterThanOrEqual(AA_NON_TEXT)
    expect(contrast(ring, brand.blue)).toBeGreaterThanOrEqual(AA_NON_TEXT)
  })
})
