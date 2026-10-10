import { beforeAll, describe, expect, it } from 'vitest'

// Reference copies of the regex implementation that replaceColors and
// extractSymbol replaced. They are super-linear, which is fine for a test.
/* eslint-disable sonarjs/super-linear-regex */
function legacyReplaceColors(markup = '') {
  return markup
    .replaceAll(
      /(?<=<\b[^<>]*)\s*\bfill=(["'](?!none)).*?\1/g,
      ` fill="currentColor"`,
    )
    .replaceAll(
      /(?<=<\b[^<>]*)\s*\bstroke=(["'](?!none)).*?\1/g,
      ` stroke="currentColor"`,
    )
}

function legacyExtractSymbol(source = '') {
  const [, parsedAttributes, content] =
    source.match(/<svg(.*?)>(.*?)<\/svg>/is) || []
  const matches = (parsedAttributes || '').match(
    /([\w-:]+)(=)?("[^<>"]*"|'[^<>']*'|[\w-:]+)/g,
  )
  const attributes =
    matches?.reduce<Record<string, string>>((acc, attribute) => {
      const [name, unformattedValue] = attribute.split('=')
      if (name) {
        acc[name] = unformattedValue
          ? unformattedValue.replace(/['"]/g, '')
          : 'true'
      }
      return acc
    }, {}) || {}
  return { attributes, content: content || '' }
}
/* eslint-enable sonarjs/super-linear-regex */

const LINEAR_TIME_BUDGET_MS = 1000
const RANDOM_SEED = 0x5eed
const RANDOM_CASES = 5000
const MAX_RANDOM_TOKENS = 40
const RANDOM_TOKENS = [
  '<',
  '>',
  '</',
  '/>',
  '<svg',
  '<SVG',
  '</svg>',
  'svg',
  'path',
  'g',
  'a',
  'x',
  '-',
  '_',
  '=',
  ' ',
  '  ',
  '\t',
  '\n',
  '\r',
  '\u00a0',
  '\u2028',
  '"',
  "'",
  'fill=',
  ' fill=',
  'stroke=',
  ' stroke=',
  'fill="',
  "stroke='",
  'none',
  'red',
  '"none"',
  'data-fill=',
  'fill-rule=',
  'viewBox="0 0 1 1"',
]

function mulberry32(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randomMarkup(random: () => number) {
  const length = Math.floor(random() * MAX_RANDOM_TOKENS)
  let markup = ''
  for (let i = 0; i < length; i++) {
    markup += RANDOM_TOKENS[Math.floor(random() * RANDOM_TOKENS.length)]
  }
  return markup
}

function randomCases() {
  const random = mulberry32(RANDOM_SEED)
  return Array.from({ length: RANDOM_CASES }, () => randomMarkup(random))
}

const ADVERSARIAL_COLOR_CASES = [
  '<a fill="<b fill=\'red\'" x>',
  '<a fill="<b fill=\'red\'">',
  '<a fill="<b stroke=\'red\'" stroke="blue">',
  '<a stroke="<b fill=\'red\'" fill="blue">',
  '<a fill="x<b fill="red">',
  '<a fill=\'x<b fill="red" y\'>',
  '<a fill="<b>" fill="red">',
  '<a fill="<b" fill="red">',
  '<a fill="<1" fill="red">',
  '<a fill=">" fill="red">',
  '<a fill="x>" <b fill="red">',
  '<a fill="red" fill="red" fill="red">',
  '<a fill="red"fill="red"stroke="red"stroke="red">',
  '<a fill="\'" fill=\'"\' fill="\'\'">',
  '<a fill=\'"fill="red"\'>',
  '<a fill=" fill=\'red\' " stroke=" stroke=\'red\' ">',
  '<a stroke="fill=\'red\'">',
  '<a fill="stroke=\'red\'">',
  '<a fill="<b fill=\'<c fill=&quot;red&quot;\'">',
  '<<a fill="red">',
  '<a <b fill="red">',
  '<a> fill="red" <b fill="red">',
  '<a fill="red\n" fill="blue">',
  '<a fill="none" fill="red">',
  '<a\u00a0fill="red">',
  '<a\u2028fill="red">',
]

const ADVERSARIAL_SYMBOL_CASES = [
  '<svg a="1">x</svg>',
  '<svg<svg a="1">x</svg>',
  '<svg a=">">x</svg>',
  '<svgx a="1">x</svg>',
  '<svg>x</SVG><svg>y</svg>',
  '<svg a="1">x</svg',
  '<svg\na="1"\n>\nx\n</svg>',
  "<SvG a='1'>x</sVg>",
  '<svg a="1" b c=d>x</svg>',
]

function legacyReplaceColorsSamples() {
  return [...EXISTING_COLOR_CASES, ...ADVERSARIAL_COLOR_CASES, ...randomCases()]
}

function legacyExtractSymbolSamples() {
  return [
    ...EXISTING_SYMBOL_CASES,
    ...ADVERSARIAL_SYMBOL_CASES,
    ...randomCases(),
  ]
}

type IconApi = typeof import('../../server/api/icon/[...params]')

let replaceColors: IconApi['replaceColors']
let extractSymbol: IconApi['extractSymbol']
let parseIconId: IconApi['parseIconId']
let processIcon: IconApi['processIcon']

// The module reads the runtime config on import, which needs the Nuxt app.
beforeAll(async () => {
  ;({ replaceColors, extractSymbol, parseIconId, processIcon } =
    await import('../../server/api/icon/[...params]'))
})

describe('parseIconId', () => {
  it.each([
    ['7', '7'],
    ['7.svg', '7'],
    ['7--.svg', '7'],
    ['123--amazee-io-logo.svg', '123'],
    ['42--snake_case-1', '42'],
  ])('reads the id from %j', (params, id) => {
    expect(parseIconId(params)).toBe(id)
  })

  it.each([
    undefined,
    null,
    7,
    ['7'],
    '',
    'abc',
    '-1',
    '7a',
    '7-slug.svg',
    '7--slug.png',
    '7--slug/x.svg',
    '../7',
    '7/../../user/1',
    '..%2F7',
    '7?x=1',
    '7--slug.svg#icon',
    ' 7',
    '7\n',
  ])('rejects %j', (params) => {
    expect(parseIconId(params)).toBeUndefined()
  })
})

describe('processIcon', () => {
  const XLINK = 'xmlns:xlink="http://www.w3.org/1999/xlink"'

  it('keeps the rendered parts of a normal icon', () => {
    expect(
      processIcon(
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><title>Logo</title><path fill="#f00" d="M0 0h24v24H0z"/><circle cx="12" cy="12" r="4" stroke="#000" fill="none"/></svg>',
      ),
    ).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg"><symbol id="icon" viewBox="0 0 24 24"><path fill="currentColor" d="M0 0h24v24H0z"/><circle cx="12" cy="12" r="4" stroke="currentColor" fill="none"/></symbol></svg>',
    )
  })

  it('keeps fragment links and inline raster images', () => {
    const result = processIcon(
      `<svg xmlns="http://www.w3.org/2000/svg" ${XLINK} viewBox="0 0 2 2"><defs><path id="p" d="M0 0h1v1H0z"/></defs><use xlink:href="#p"/><use href="#p" x="1"/><image href="data:image/png;base64,AAAA" width="1" height="1"/></svg>`,
    )
    expect(result).toContain('<use xlink:href="#a"/><use href="#a" x="1"/>')
    expect(result).toContain('href="data:image/png;base64,AAAA"')
  })

  it.each([
    [
      'script element',
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><path d="M0 0h1v1z"/></svg>',
    ],
    [
      'onload attribute',
      '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><path onclick="alert(1)" ONMOUSEOVER="alert(1)" d="M0 0h1v1z"/></svg>',
    ],
    [
      'javascript link',
      `<svg xmlns="http://www.w3.org/2000/svg" ${XLINK}><a xlink:href="javascript:alert(1)"><path d="M0 0h1v1z"/></a><a href=" JavaScript:alert(1)"><path d="M0 0h1v1z"/></a></svg>`,
    ],
    [
      'foreignObject with script',
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><script>alert(1)</script><img src="x" onerror="alert(1)"/></body></foreignObject><path d="M0 0h1v1z"/></svg>',
    ],
    [
      'namespaced html script',
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:h="http://www.w3.org/1999/xhtml"><h:script>alert(1)</h:script><h:iframe src="javascript:alert(1)"/><path d="M0 0h1v1z"/></svg>',
    ],
    [
      'animation rewriting a link',
      '<svg xmlns="http://www.w3.org/2000/svg"><a><set attributeName="href" to="javascript:alert(1)"/><animate attributeName="xlink:href" values="javascript:alert(1)"/><path d="M0 0h1v1z"/></a></svg>',
    ],
    [
      'external use and data svg image',
      `<svg xmlns="http://www.w3.org/2000/svg" ${XLINK}><use xlink:href="https://evil.example/x.svg#a"/><image href="data:image/svg+xml;base64,PHN2Zz4="/><path d="M0 0h1v1z"/></svg>`,
    ],
    [
      'doctype declaring an entity',
      '<!DOCTYPE svg [<!ENTITY x "<svg onload=\'alert(1)\'><script>alert(1)</script></svg>">]><svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1v1z"/></svg>',
    ],
    [
      'script element before the root',
      '<script>alert(1)</script><svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1v1z"/></svg>',
    ],
    [
      'preserved comment holding an svg before the root',
      '<!--! <svg onload="alert(1)"><script>alert(1)</script></svg> --><svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1v1z"/></svg>',
    ],
    [
      'preserved comment inside the root',
      '<svg xmlns="http://www.w3.org/2000/svg"><!--! <script>alert(1)</script> --><path d="M0 0h1v1z"/></svg>',
    ],
    [
      'processing instruction holding an svg',
      '<?xml version="1.0"?><?x <svg onload="alert(1)"><script>alert(1)</script></svg> ?><svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1v1z"/></svg>',
    ],
    [
      'processing instruction inside the root',
      '<svg xmlns="http://www.w3.org/2000/svg"><?x <script>alert(1)</script> ?><path d="M0 0h1v1z"/></svg>',
    ],
  ])('strips a %s', (_, markup) => {
    const result = processIcon(markup)
    expect(result).toContain('<path d="M0 0h1v1z"/>')
    expect(result).not.toMatch(
      /script|javascript|\bon\w+=|foreignObject|iframe|evil|svg\+xml|<set|<animate|<!|<\?|&x;/i,
    )
  })

  // The handler turns a parser error into the empty sprite.
  const SVGO_PARSER_ERROR = /Invalid character entity|outside of root node/
  it.each([
    [
      'doctype entity expanding to markup',
      '<!DOCTYPE svg [<!ENTITY x "<svg onload=\'alert(1)\'><script>alert(1)</script></svg>">]><svg xmlns="http://www.w3.org/2000/svg"><text>&x;</text><path d="M0 0h1v1z"/></svg>',
    ],
    [
      'entity declared outside the doctype',
      '<!DOCTYPE svg []><svg xmlns="http://www.w3.org/2000/svg"><!-- <!ENTITY x "<script>alert(1)</script>"> --><path d="M0 0h1v1z" data-x="&x;"/></svg>',
    ],
    [
      'second root svg',
      '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1v1z"/></svg><svg onload="alert(1)"><script>alert(1)</script></svg>',
    ],
  ])('fails to parse a %s', (_, markup) => {
    expect(() => processIcon(markup)).toThrow(SVGO_PARSER_ERROR)
  })
})

const EXISTING_COLOR_CASES = [
  '<path fill="#ff0000" stroke=\'red\' d="M0 0"/>',
  '<path fill="none" stroke="none" d="M0 0"/>',
  '<text>fill="red"</text>',
  "<path fill='none'/>",
  '<path fill="nonzero"/>',
  '<path fill="none2"/>',
  '<path fill=""/>',
  '<path fill="a\'b"/>',
  '<path\n  fill="red"/>',
  '<path fill=red/>',
  '<path fill="re\nd"/>',
  '<path fill-rule="evenodd"/>',
  '<path data-fill="red"/>',
  '<path xfill="red"/>',
  '<fill="red"/>',
  '</g fill="red">',
  '<g>x fill="red"</g>',
  '<a fill="x>" fill="red">',
  'p fill="<b" fill="red">',
  '<a fill="x>" stroke="red">',
  "<path stroke='none'/>",
  "<path stroke='#000'/>",
  '<path stroke-width="2"/>',
  '<path\tstroke="red"/>',
]

const EXISTING_SYMBOL_CASES = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden>\n<path d="M0 0"/>\n</svg>',
  '<SVG\n  viewBox=\'0 0 8 8\'\n  data-x="1">\n<g/></SVG>',
  'x<svg a="1"><svg b="2"></svg><p/></svg>',
  '<svg></svg>',
  '',
  '<div>not an svg</div>',
  '<svg viewBox="0 0 1 1">',
  '<svg</svg>',
]

describe('equivalence with the legacy regex implementation', () => {
  it('replaceColors matches the legacy output', () => {
    const mismatches = legacyReplaceColorsSamples().filter(
      (markup) => replaceColors(markup) !== legacyReplaceColors(markup),
    )
    expect(mismatches).toEqual([])
  })

  it('extractSymbol matches the legacy output', () => {
    const mismatches = legacyExtractSymbolSamples().filter(
      (source) =>
        JSON.stringify(extractSymbol(source)) !==
        JSON.stringify(legacyExtractSymbol(source)),
    )
    expect(mismatches).toEqual([])
  })

  it('replaceColors stays linear on long adversarial input', () => {
    const markup = '<a' + ' '.repeat(50_000) + 'fill="' + '<b '.repeat(50_000)
    const started = performance.now()
    replaceColors(markup)
    expect(performance.now() - started).toBeLessThan(LINEAR_TIME_BUDGET_MS)
  })
})

describe('replaceColors', () => {
  it('turns fill and stroke colours into currentColor', () => {
    expect(
      replaceColors('<path fill="#ff0000" stroke=\'red\' d="M0 0"/>'),
    ).toBe('<path fill="currentColor" stroke="currentColor" d="M0 0"/>')
  })

  it('keeps fill and stroke set to none', () => {
    const markup = '<path fill="none" stroke="none" d="M0 0"/>'
    expect(replaceColors(markup)).toBe(markup)
  })

  it('leaves text outside of tags alone', () => {
    expect(replaceColors('<text>fill="red"</text>')).toBe(
      '<text>fill="red"</text>',
    )
  })

  it('handles missing markup', () => {
    expect(replaceColors()).toBe('')
  })

  it.each([
    ["<path fill='none'/>", "<path fill='none'/>"],
    ['<path fill="nonzero"/>', '<path fill="currentColor"/>'],
    ['<path fill="none2"/>', '<path fill="none2"/>'],
    ['<path fill=""/>', '<path fill="currentColor"/>'],
    ['<path fill="a\'b"/>', '<path fill="currentColor"/>'],
    ['<path\n  fill="red"/>', '<path fill="currentColor"/>'],
    ['<path fill=red/>', '<path fill=red/>'],
    ['<path fill="re\nd"/>', '<path fill="re\nd"/>'],
    ['<path fill-rule="evenodd"/>', '<path fill-rule="evenodd"/>'],
    ['<path data-fill="red"/>', '<path data- fill="currentColor"/>'],
    ['<path xfill="red"/>', '<path xfill="red"/>'],
    ['<fill="red"/>', '< fill="currentColor"/>'],
    ['</g fill="red">', '</g fill="red">'],
    ['<g>x fill="red"</g>', '<g>x fill="red"</g>'],
    ['<a fill="x>" fill="red">', '<a fill="currentColor" fill="red">'],
    ['p fill="<b" fill="red">', 'p fill="<b" fill="currentColor">'],
    [
      '<a fill="x>" stroke="red">',
      '<a fill="currentColor" stroke="currentColor">',
    ],
  ])('replaces colours in %j', (markup, expected) => {
    expect(replaceColors(markup)).toBe(expected)
  })

  it.each([
    ["<path stroke='none'/>", "<path stroke='none'/>"],
    ["<path stroke='#000'/>", '<path stroke="currentColor"/>'],
    ['<path stroke-width="2"/>', '<path stroke-width="2"/>'],
    ['<path\tstroke="red"/>', '<path stroke="currentColor"/>'],
  ])('replaces stroke colours in %j', (markup, expected) => {
    expect(replaceColors(markup)).toBe(expected)
  })
})

describe('extractSymbol', () => {
  it('reads the svg attributes and inner markup', () => {
    const result = extractSymbol(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden>\n<path d="M0 0"/>\n</svg>',
    )

    expect(result.attributes).toEqual({
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      'aria-hidden': 'true',
    })
    expect(result.content).toBe('\n<path d="M0 0"/>\n')
  })

  it('reads single quoted attributes and multi-line opening tags', () => {
    const result = extractSymbol(
      '<SVG\n  viewBox=\'0 0 8 8\'\n  data-x="1">\n<g/></SVG>',
    )

    expect(result.attributes).toEqual({ viewBox: '0 0 8 8', 'data-x': '1' })
    expect(result.content).toBe('\n<g/>')
  })

  it('stops the content at the first closing svg tag', () => {
    expect(extractSymbol('x<svg a="1"><svg b="2"></svg><p/></svg>')).toEqual({
      attributes: { a: '1' },
      content: '<svg b="2">',
    })
  })

  it('reads an svg without attributes or content', () => {
    expect(extractSymbol('<svg></svg>')).toEqual({
      attributes: {},
      content: '',
    })
  })

  it.each([
    undefined,
    '',
    '<div>not an svg</div>',
    '<svg viewBox="0 0 1 1">',
    '<svg</svg>',
  ])('returns an empty symbol for %j', (source) => {
    expect(extractSymbol(source)).toEqual({ attributes: {}, content: '' })
  })
})
