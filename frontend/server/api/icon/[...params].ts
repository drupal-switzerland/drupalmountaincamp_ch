import {
  getRouterParams,
  getHeaders,
  defaultContentType,
  defineEventHandler,
  setHeader,
} from 'h3'
import type { H3Event } from 'h3'
import { optimize } from 'svgo'
import { MAX_AGE } from '../../helpers'

const config = useRuntimeConfig()

export function replaceColors(markup = '') {
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

type ParsedSymbol = {
  attributes: Record<string, string>
  content: string
}

export function extractSymbol(source = ''): ParsedSymbol {
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

  return {
    attributes,
    content: content || '',
  }
}

/**
 * Process the raw SVG markup to be a <symbol>.
 *
 * @TODO: Needs a more reliable solution.
 */
function processIcon(markup = '') {
  const optimized = optimize(markup, {
    plugins: [
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
  id: string | undefined,
  event: H3Event,
): Promise<BuiltIcon | undefined> {
  if (!id || !config.backendUrl) {
    return
  }

  const { value, addToCache } = await useDataCache<BuiltIcon>(
    'api-icon-' + id,
    event,
  )

  if (value) {
    return value
  }

  const requestHeaders = getHeaders(event)
  const host = requestHeaders.host || ''

  // Fetch the SVG markup.
  const url = `${config.backendUrl}/media/${id}/icon`
  const response = await $fetch.raw<Blob>(url, {
    headers: {
      host,
      cookie: requestHeaders.cookie || '',
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

/**
 * Returns an icon media entity as a SVG sprite with the media's SVG as the
 * single <symbol>.
 */
export default defineEventHandler(async (event) => {
  try {
    const routerParams = getRouterParams(event)
    const paramsValue = routerParams?.params
    const paramsStr =
      typeof paramsValue === 'string'
        ? paramsValue
        : Array.isArray(paramsValue)
          ? paramsValue[0]
          : undefined

    if (!paramsStr) {
      return EMPTY_RESPONSE
    }

    const id = paramsStr.split('--')[0]

    defaultContentType(event, 'image/svg+xml')

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
