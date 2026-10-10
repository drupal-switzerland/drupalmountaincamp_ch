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
import type { CustomPlugin, XastChild, XastElement, XastParent } from 'svgo'
import { MAX_AGE, resolveQueryTimeout } from '../../helpers'

const config = useRuntimeConfig()

const WORD_CHAR = /\w/
const WHITESPACE = /\s/
const LINE_TERMINATOR = /[\n\r\u2028\u2029]/
const QUOTES = new Set(['"', "'"])
const SKIPPED_VALUE = 'none'

const isWordChar = (char: string | undefined) =>
  char !== undefined && WORD_CHAR.test(char)
const isWhitespace = (char: string | undefined) =>
  char !== undefined && WHITESPACE.test(char)

/**
 * Returns the end of a `\s*\bname=(["'])(?!none).*?\1` match at start, or -1.
 */
function attributeMatchEnd(markup: string, start: number, name: string) {
  let nameStart = start
  while (isWhitespace(markup[nameStart])) {
    nameStart++
  }
  if (nameStart === start && isWordChar(markup[start - 1])) {
    return -1
  }
  if (!markup.startsWith(name + '=', nameStart)) {
    return -1
  }
  const quoteIndex = nameStart + name.length + 1
  const quote = markup[quoteIndex]
  if (!quote || !QUOTES.has(quote)) {
    return -1
  }
  if (markup.startsWith(SKIPPED_VALUE, quoteIndex + 1)) {
    return -1
  }
  for (let i = quoteIndex + 1; i < markup.length; i++) {
    if (markup[i] === quote) {
      return i + 1
    }
    if (LINE_TERMINATOR.test(markup[i]!)) {
      return -1
    }
  }
  return -1
}

/**
 * Replaces `name="…"` attributes inside opening tags with the replacement.
 *
 * Mirrors `/(?<=<\b[^<>]*)\s*\bname=(["'](?!none)).*?\1/g` in one forward
 * pass: a position is inside an opening tag when the last "<" or ">" of the
 * original markup before it is a "<" followed by a word character. Replaced
 * text is never examined again. Starts inside a whitespace run are skipped:
 * they fail exactly when the start of the run failed.
 */
function replaceAttributeInOpeningTags(
  markup: string,
  name: string,
  replacement: string,
) {
  let output = ''
  let copiedUpTo = 0
  let lastBoundary = -1
  let position = 0

  while (position < markup.length) {
    const inOpeningTag =
      markup[lastBoundary] === '<' && isWordChar(markup[lastBoundary + 1])
    const startsWhitespaceRun = !isWhitespace(markup[position - 1])
    const matchEnd =
      inOpeningTag && startsWhitespaceRun
        ? attributeMatchEnd(markup, position, name)
        : -1

    const nextPosition = matchEnd === -1 ? position + 1 : matchEnd
    if (matchEnd !== -1) {
      output += markup.slice(copiedUpTo, position) + replacement
      copiedUpTo = matchEnd
    }
    for (let i = position; i < nextPosition; i++) {
      if (markup[i] === '<' || markup[i] === '>') {
        lastBoundary = i
      }
    }
    position = nextPosition
  }

  return output + markup.slice(copiedUpTo)
}

export function replaceColors(markup = '') {
  return replaceAttributeInOpeningTags(
    replaceAttributeInOpeningTags(markup, 'fill', ' fill="currentColor"'),
    'stroke',
    ' stroke="currentColor"',
  )
}

type ParsedSymbol = {
  attributes: Record<string, string>
  content: string
}

function splitSvg(source: string) {
  const openingTagStart = source.search(/<svg/i)
  if (openingTagStart === -1) {
    return {}
  }
  const attributesStart = openingTagStart + '<svg'.length
  const openingTagEnd = source.indexOf('>', attributesStart)
  if (openingTagEnd === -1) {
    return {}
  }
  const rest = source.slice(openingTagEnd + 1)
  const closingTagIndex = rest.search(/<\/svg>/i)
  if (closingTagIndex === -1) {
    return {}
  }
  return {
    parsedAttributes: source.slice(attributesStart, openingTagEnd),
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

const ENTITY_DECLARATION = /<!ENTITY/gi

function removeChild(node: XastChild, parentNode: XastParent) {
  parentNode.children = parentNode.children.filter((child) => child !== node)
}

const isRootSvg = (node: XastChild) =>
  node.type === 'element' && localName(node.name) === 'svg'

/**
 * Backs up svgo's removeScripts: keeps only the root svg element, drops
 * doctypes, processing instructions and comments anywhere, namespaced and
 * embedding elements, animations that rewrite links or handlers, every on*
 * attribute and any href that is not a fragment or an inline raster image.
 */
const removeActiveContent: CustomPlugin = {
  name: 'removeActiveContent',
  fn: () => ({
    root: {
      enter: (root) => {
        const svg = root.children.find(isRootSvg)
        root.children = svg ? [svg] : []
      },
    },
    doctype: { enter: removeChild },
    instruction: { enter: removeChild },
    comment: { enter: removeChild },
    element: {
      enter: (node, parentNode) => {
        if (isActiveElement(node)) {
          removeChild(node, parentNode)
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
  const optimized = optimize(markup.replaceAll(ENTITY_DECLARATION, ''), {
    plugins: [
      'removeDoctype',
      'removeXMLProcInst',
      { name: 'removeComments', params: { preservePatterns: false } },
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
      'removeTitle',
      'removeDesc',
      'removeMetadata',
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
    timeout: resolveQueryTimeout(config.backendQueryTimeoutMs),
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
  // Not cacheable unless an icon was loaded: a 400 or an empty icon after a
  // Drupal failure must not be kept by a browser or the CDN.
  setHeader(event, 'cache-control', 'no-store')
  useCDNHeaders((v) => v.private(), event)

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
