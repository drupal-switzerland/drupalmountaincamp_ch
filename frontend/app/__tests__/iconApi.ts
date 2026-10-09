import { beforeAll, describe, expect, it } from 'vitest'

type IconApi = typeof import('../../server/api/icon/[...params]')

let replaceColors: IconApi['replaceColors']
let extractSymbol: IconApi['extractSymbol']

// The module reads the runtime config on import, which needs the Nuxt app.
beforeAll(async () => {
  ;({ replaceColors, extractSymbol } =
    await import('../../server/api/icon/[...params]'))
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

  it.each([undefined, '', '<div>not an svg</div>'])(
    'returns an empty symbol for %j',
    (source) => {
      expect(extractSymbol(source)).toEqual({ attributes: {}, content: '' })
    },
  )
})
