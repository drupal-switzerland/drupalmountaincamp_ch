// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  buildInitData,
  fallbackInitData,
  getInitDataCacheTags,
} from '../helpers/initData'

type Query = Parameters<typeof buildInitData>[0]

const cacheable = {
  isCacheable: true,
  maxAge: 3600,
  tagsNuxt: ['config:system.menu.main', 'nuxt:init'],
  tagsCdn: ['abc'],
  tagsDrupal: ['config:system.menu.main'],
}

describe('getInitDataCacheTags', () => {
  it('gives the Nuxt tags of a cacheable response', () => {
    expect(getInitDataCacheTags(cacheable)).toEqual([
      'config:system.menu.main',
      'nuxt:init',
    ])
  })

  it('gives a cacheable response without tags an empty list', () => {
    expect(getInitDataCacheTags({ ...cacheable, tagsNuxt: [] })).toEqual([])
  })

  it.each([
    ['a response without cacheability', undefined],
    ['an uncacheable response', { ...cacheable, isCacheable: false }],
  ])('gives nothing for %s, so it is not stored', (_, cacheability) => {
    expect(getInitDataCacheTags(cacheability)).toBeUndefined()
  })
})

describe('buildInitData', () => {
  const mainLink = { link: { label: 'Programme' } }
  const footerLink = { link: { label: 'Imprint' } }

  it('takes menus, global config and texts from the response', () => {
    const data = buildInitData({
      mainMenu: { links: [mainLink] },
      footerMenu: { links: [footerLink] },
      globalConfig: { address: 'Davos' },
      translations: { footer__copyright: 'All rights reserved' },
    } as unknown as Query)

    expect(data).toEqual({
      mainMenuLinks: [mainLink],
      footerMenuLinks: [footerLink],
      globalConfig: { address: 'Davos' },
      translations: { 'footer.copyright': 'All rights reserved' },
    })
  })

  it('is empty, not broken, for a response without menus or texts', () => {
    expect(buildInitData({} as unknown as Query)).toEqual({
      mainMenuLinks: [],
      footerMenuLinks: [],
      globalConfig: {},
      translations: {},
    })
  })

  it('reads plural texts as a singular and plural pair', () => {
    const { translations } = buildInitData({
      translations: {
        news__results: { singular: '1 result', plural: '@count results' },
      },
    } as unknown as Query)

    expect(translations).toEqual({
      'news.results': ['1 result', '@count results'],
    })
  })

  it.each([
    ['only a singular', { singular: '1 result' }],
    ['only a plural', { plural: '@count results' }],
    ['no value', null],
  ])('leaves out a text with %s', (_, value) => {
    const { translations } = buildInitData({
      translations: { news__results: value, news__title: 'News' },
    } as unknown as Query)

    expect(translations).toEqual({ 'news.title': 'News' })
  })
})

describe('fallbackInitData', () => {
  it('has no menus and the given default texts', () => {
    expect(
      fallbackInitData({ 'footer.copyright': 'All rights reserved' }),
    ).toEqual({
      mainMenuLinks: [],
      footerMenuLinks: [],
      translations: { 'footer.copyright': 'All rights reserved' },
      globalConfig: {},
    })
  })

  it('has no texts without defaults', () => {
    expect(fallbackInitData().translations).toEqual({})
  })
})
