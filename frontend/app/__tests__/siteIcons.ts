// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { SITE_NAME, SITE_TITLE } from '../helpers/site'
import { brand } from '../../tailwind.config'

type HeadLink = { rel: string; href: string; sizes?: string }
type ManifestIcon = {
  src: string
  sizes: string
  type: string
  purpose?: string
}

const PUBLIC_DIR = join(process.cwd(), 'public')
const PNG_SIGNATURE = '89504e470d0a1a0a'
const PNG_WIDTH_OFFSET = 16
const PNG_HEIGHT_OFFSET = 20
const COLOUR_TYPE_OFFSET = 25
// Greyscale with alpha and RGBA; type 2 is RGB without alpha.
const PNG_ALPHA_COLOUR_TYPES = [4, 6]
// A palette or RGB PNG carries its transparency in this chunk.
const PNG_TRANSPARENCY_CHUNK = 'tRNS'
const ICO_COUNT_OFFSET = 4
const ICO_HEADER_SIZE = 6
const ICO_ENTRY_SIZE = 16
// An ICO entry stores 256 as 0.
const ICO_MAX_SIDE = 256

const publicFile = (href: string) => join(PUBLIC_DIR, href)

function pngSize(path: string) {
  const data = readFileSync(path)
  expect(data.subarray(0, 8).toString('hex'), path).toBe(PNG_SIGNATURE)
  return `${data.readUInt32BE(PNG_WIDTH_OFFSET)}x${data.readUInt32BE(PNG_HEIGHT_OFFSET)}`
}

function pngHasAlpha(path: string) {
  const data = readFileSync(path)
  return (
    PNG_ALPHA_COLOUR_TYPES.includes(data[COLOUR_TYPE_OFFSET] ?? -1) ||
    data.includes(PNG_TRANSPARENCY_CHUNK)
  )
}

function icoSizes(path: string) {
  const data = readFileSync(path)
  const count = data.readUInt16LE(ICO_COUNT_OFFSET)
  return Array.from({ length: count }, (_, index) => {
    const entry = ICO_HEADER_SIZE + index * ICO_ENTRY_SIZE
    const side = (byte: number) => byte || ICO_MAX_SIDE
    return `${side(data[entry] ?? 0)}x${side(data[entry + 1] ?? 0)}`
  })
}

let links: HeadLink[]

beforeAll(async () => {
  vi.stubGlobal('defineNuxtConfig', (config: unknown) => config)
  const config = (await import('../../nuxt.config')).default as {
    app: { head: { link: HeadLink[] } }
  }
  links = config.app.head.link
  vi.unstubAllGlobals()
})

const linkFor = (rel: string) => links.find((link) => link.rel === rel)

describe('site icons in the page head', () => {
  it('links a favicon whose file holds exactly the declared sizes', () => {
    const icon = linkFor('icon')
    expect(icon?.href).toBe('/favicon.ico')
    const declared = icon?.sizes?.split(' ').sort()
    expect(icoSizes(publicFile(icon!.href)).sort()).toEqual(declared)
  })

  // iOS rounds the corners itself and shows transparency as black.
  it('links a 180px apple-touch-icon without transparency', () => {
    const href = linkFor('apple-touch-icon')!.href
    expect(pngSize(publicFile(href))).toBe('180x180')
    expect(pngHasAlpha(publicFile(href))).toBe(false)
  })

  it('links a manifest file that exists', () => {
    expect(existsSync(publicFile(linkFor('manifest')!.href))).toBe(true)
  })
})

describe('web manifest', () => {
  let manifest: {
    name: string
    short_name: string
    theme_color: string
    background_color: string
    icons: ManifestIcon[]
  }

  beforeAll(() => {
    manifest = JSON.parse(
      readFileSync(publicFile(linkFor('manifest')!.href), 'utf8'),
    )
  })

  it('names the site and uses the header navy', () => {
    expect(manifest.name).toBe(SITE_TITLE)
    expect(manifest.short_name).toBe(SITE_NAME)
    expect(manifest.theme_color).toBe(brand.navy)
    expect(manifest.background_color).toBe(brand.navy)
  })

  it('lists PNG icons whose files have the declared sizes', () => {
    for (const icon of manifest.icons) {
      expect(icon.type).toBe('image/png')
      expect(pngSize(publicFile(icon.src)), icon.src).toBe(icon.sizes)
    }
  })

  it('has 192 and 512 icons and an opaque maskable one', () => {
    const sizes = manifest.icons
      .filter((icon) => !icon.purpose)
      .map((icon) => icon.sizes)
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']))
    const maskable = manifest.icons.find((icon) => icon.purpose === 'maskable')
    expect(maskable).toBeDefined()
    expect(pngHasAlpha(publicFile(maskable!.src))).toBe(false)
  })
})
