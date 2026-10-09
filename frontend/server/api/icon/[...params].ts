import {
  getRouterParams,
  getHeaders,
  defaultContentType,
  defineEventHandler,
  setHeader,
  setResponseStatus,
} from 'h3'
import type { H3Event } from 'h3'
import { optimize } from 'svgo'
import type { CustomPlugin, XastElement } from 'svgo'
import { MAX_AGE } from '../../helpers'

const config = useRuntimeConfig()

const TAG_START = /<(?=\w)/g
const TAG_BOUNDARY_OR_FILL = /[<>]|(?<!\s)\s*\bfill=(["'])(?!none).*?\1/g
const TAG_BOUNDARY_OR_STROKE = /[<>]|(?<!\s)\s*\bstroke=(["'])(?!none).*?\1/g

function lastTagBoundary(text: string) {
  return Math.max(text.lastIndexOf('<'), text.lastIndexOf('>'))
}

/**
 * Replaces attribute matches inside opening tags: after a "<" followed by a
 * word character, with no "<" or ">" in between. A quoted value may contain
 * "<" or ">", which then decides whether the scan is still inside a tag.
 */
function replaceInOpeningTags(
  markup: string,
  boundaryOrAttribute: RegExp,
  replacement: string,
) {
  let output = ''
  let copiedUpTo = 0
  TAG_START.lastIndex = 0

  while (TAG_START.exec(markup)) {
    boundaryOrAttribute.lastIndex = TAG_START.lastIndex
    let match = boundaryOrAttribute.exec(markup)
    while (match && lastTagBoundary(match[0]) === -1) {
      output += markup.slice(copiedUpTo, match.index) + replacement
      copiedUpTo = boundaryOrAttribute.lastIndex
      match = boundaryOrAttribute.exec(markup)
    }

    if (!match) {
      break
    }
    const isAttribute = match[0].length > 1
    if (isAttribute) {
      output += markup.slice(copiedUpTo, match.index) + replacement
      copiedUpTo = boundaryOrAttribute.lastIndex
    }
    TAG_START.lastIndex = match.index + lastTagBoundary(match[0])
  }

  return output + markup.slice(copiedUpTo)
}

export function replaceColors(markup = '') {
  return replaceInOpeningTags(
    replaceInOpeningTags(markup, TAG_BOUNDARY_OR_FILL, ' fill="currentColor"'),
    TAG_BOUNDARY_OR_STROKE,
    ' stroke="currentColor"',
  )
}

type ParsedSymbol = {
  attributes: Record<string, string>
  content: string
}

function splitSvg(source: string) {
  const openingTag = /<svg([^>]*)>/i.exec(source)
  if (!openingTag) {
    return {}
  }
  const rest = source.slice(openingTag.index + openingTag[0].length)
  const closingTagIndex = rest.search(/<\/svg>/i)
  if (closingTagIndex === -1) {
    return {}
  }
  return {
    parsedAttributes: openingTag[1],
    content: rest.slice(0, closingTagIndex),
  }
}

export function extractSymbol(source = ''): ParsedSymbol {
  const { parsedAttributes, content } = splitSvg(source)
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

  return {
    attributes,
    content: content || '',
  }
}

const ICON_PARAMS = /^(\d+)(?:--[\w-]*)?(?:\.svg)?$/

/** Returns the media ID from "{id}--{slug}.svg", or undefined if malformed. */
export function parseIconId(params: unknown): string | undefined {
  if (typeof params !== 'string') {
    return
  }
  return ICON_PARAMS.exec(params)?.[1]
}

const ACTIVE_ELEMENTS = new Set(['script', 'foreignobject', 'iframe', 'embed'])
const ANIMATION_ELEMENTS = new Set([
  'set',
  'animate',
  'animatemotion',
  'animatetransform',
])
const SAFE_HREF = /^(?:#|data:image\/(?:png|jpe?g|gif|webp)[;,])/i

function localName(name: string) {
  return name.slice(name.lastIndexOf(':') + 1).toLowerCase()
}

function isHrefAttribute(name: string) {
  return localName(name) === 'href'
}

function isEventAttribute(name: string) {
  return localName(name).startsWith('on')
}

function isActiveElement(node: XastElement) {
  if (node.name.includes(':') || ACTIVE_ELEMENTS.has(localName(node.name))) {
    return true
  }
  if (!ANIMATION_ELEMENTS.has(localName(node.name))) {
    return false
  }
  const target = node.attributes.attributeName ?? ''
  return isHrefAttribute(target) || isEventAttribute(target)
}

/**
 * Backs up svgo's removeScripts: drops namespaced and embedding elements,
 * animations that rewrite links or handlers, every on* attribute and any
 * href that is not a fragment or an inline raster image.
 */
const removeActiveContent: CustomPlugin = {
  name: 'removeActiveContent',
  fn: () => ({
    element: {
      enter: (node, parentNode) => {
        if (isActiveElement(node)) {
          parentNode.children = parentNode.children.filter(
            (child) => child !== node,
          )
          return
        }
        node.attributes = Object.fromEntries(
          Object.entries(node.attributes).filter(
            ([name, value]) =>
              !isEventAttribute(name) &&
              (!isHrefAttribute(name) || SAFE_HREF.test(value.trim())),
          ),
        )
      },
    },
  }),
}

/**
 * Process the raw SVG markup to be a <symbol>.
 */
export function processIcon(markup = '') {
  const optimized = optimize(markup, {
    plugins: [
      'removeScripts',
      {
        name: 'inlineStyles',
        params: {
          onlyMatchedOnce: false,
        },
      },
      'convertStyleToAttrs',
      'cleanupIds',
      'cleanupAttrs',
      'removeComments',
      'removeTitle',
      'removeDesc',
      'removeMetadata',
      'removeComments',
      'removeUselessDefs',
      'removeUselessStrokeAndFill',
      'mergePaths',
      'removeDimensions',
      removeActiveContent,
    ],
  }).data
  const { content, attributes } = extractSymbol(optimized)
  const attributesString = Object.keys(attributes)
    .filter((v) => v !== 'id' && v !== 'xmlns')
    .map((v) => {
      return `${v}="${attributes[v] ?? ''}"`
    })
    .join(' ')
  return replaceColors(
    `<svg xmlns="http://www.w3.org/2000/svg"><symbol id="icon" ${attributesString}>` +
      content +
      '</symbol></svg>',
  )
}

type BuiltIcon = {
  markup: string
  tagsCdn: string[]
}

/**
 * Given the media entity ID, load the entity via GraphQL, fetch the file and
 * return the SVG's markup.
 *
 * The result of this is cached in the data cache using the ID as the key.
 */
async function getIcon(
  id: string,
  event: H3Event,
): Promise<BuiltIcon | undefined> {
  if (!config.backendUrl) {
    return
  }

  const { value, addToCache } = await useDataCache<BuiltIcon>(
    'api-icon-sanitised-' + id,
    event,
  )

  if (value) {
    return value
  }

  const requestHeaders = getHeaders(event)
  const host = requestHeaders.host || ''

  // Fetch the SVG markup. Icons are public, so the visitor's cookie is not
  // forwarded and the cached result never depends on who requested it.
  const url = `${config.backendUrl}/media/${id}/icon`
  const response = await $fetch.raw<Blob>(url, {
    headers: {
      host,
      referer: requestHeaders.referer || '',
    },
  })

  const cacheability = extractCacheability(response, event)

  const svgMarkup = await response._data?.text()

  if (!svgMarkup) {
    return
  }

  const markup = processIcon(svgMarkup)

  const builtIcon: BuiltIcon = {
    markup,
    tagsCdn: cacheability.tagsCdn,
  }

  // Store it in the data cache.
  await addToCache(builtIcon, cacheability.tagsNuxt)

  return builtIcon
}

const EMPTY_RESPONSE = '<svg></svg>'

const SECURITY_HEADERS = {
  'content-security-policy':
    "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  'x-content-type-options': 'nosniff',
}

/**
 * Returns an icon media entity as a SVG sprite with the media's SVG as the
 * single <symbol>.
 */
export default defineEventHandler(async (event) => {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    setHeader(event, name, value)
  }
  defaultContentType(event, 'image/svg+xml')

  try {
    const id = parseIconId(getRouterParams(event, { decode: true }).params)
    if (!id) {
      setResponseStatus(event, 400)
      return EMPTY_RESPONSE
    }

    const result = await getIcon(id, event)
    if (!result) {
      console.log('Failed to load icon from Drupal: ' + id)
      return EMPTY_RESPONSE
    }

    useCDNHeaders((v) => {
      v.public()
        .setNumeric('maxAge', MAX_AGE.ONE_YEAR)
        .addTags(result.tagsCdn)
        .addTags(['nuxt:api:icon'])
        .set('staleIfError', MAX_AGE.ONE_DAY)
    }, event)

    // Set content type.
    defaultContentType(event, 'image/svg+xml')

    // Requests from the frontend include the changed date of the media entity
    // as a query param. This means we can set a very high max age for our
    // response.
    setHeader(event, 'cache-control', 'public, max-age=604800')
    return result.markup
  } catch (e) {
    console.log(e)
    console.log('Failed to load icon from Drupal.', e)
    // We don't want to return a message here, only an empty response.
    return EMPTY_RESPONSE
  }
})
