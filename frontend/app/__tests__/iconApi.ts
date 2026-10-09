import { beforeAll, describe, expect, it } from 'vitest'

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
  ])('strips a %s', (_, markup) => {
    const result = processIcon(markup)
    expect(result).toContain('<path d="M0 0h1v1z"/>')
    expect(result).not.toMatch(
      /script|javascript|\bon\w+=|foreignObject|iframe|evil|svg\+xml|<set|<animate/i,
    )
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
