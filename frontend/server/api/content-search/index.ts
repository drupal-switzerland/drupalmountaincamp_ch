/**
 * Provides the endpoint for the content search.
 *
 */
import type { QueryObject, QueryValue } from 'ufo'
import { getQuery } from 'h3'
import type { estypes } from '@elastic/elasticsearch'
import { Client } from '@elastic/elasticsearch'
import { nonNullable } from '#vuepal/helpers/type'

const runtimeConfig = useRuntimeConfig()

function getSingleQueryValue(
  v: QueryValue | QueryValue[],
  defaultValue: any = '',
): string {
  if (Array.isArray(v)) {
    return getSingleQueryValue(v[0], defaultValue)
  }
  if (typeof v === 'string') {
    return v
  } else if (typeof v === 'number') {
    return v.toString()
  }
  return defaultValue
}

const config = useRuntimeConfig()

export const client = new Client({
  node: config.elasticsearchUrl,
})

type ContentSearchItem = {
  id: string
  title: string
  text: string
  langcode: string
  url: string
}

interface SearchDocument {
  nid?: string[]
  field_teaser?: string[]
  title?: string[]
  langcode?: string[]
  entity_url?: string[]
}

function simpleHighlight(rgx: RegExp, text = ''): string {
  return text.replace(rgx, (match) => `<em>${match}</em>`)
}

type Highlight = {
  title?: string[]
  text?: string[]
}

function mapSearchItem(
  rgx: RegExp,
  doc: SearchDocument,
  highlight?: Highlight,
): ContentSearchItem {
  return {
    id: doc.nid?.[0] || '',
    title: doc.title?.[0] || '',
    text:
      highlight?.text?.[0] || simpleHighlight(rgx, doc.field_teaser?.[0]) || '',
    langcode: doc.langcode?.[0] || '',
    url: doc.entity_url?.[0] || '',
  }
}

/**
 * The fulltext Elasticsearch search.
 */
export default defineEventHandler<Promise<ContentSearchItem[]>>(
  async (event) => {
    try {
      const query: QueryObject = getQuery(event)
      const text = getSingleQueryValue(query.text)
      const index = runtimeConfig.elasticsearchPrefix + 'content_search'

      const filter: estypes.QueryDslQueryContainer[] = []

      const response = await client.search<SearchDocument>({
        index,
        size: 30,
        query: {
          bool: {
            filter,
            must: [
              {
                bool: {
                  should: [
                    {
                      multi_match: {
                        query: text,
                        fields: ['text', 'title'],
                      },
                    },
                    {
                      wildcard: {
                        title: {
                          value: `*${text}*`,
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        highlight: {
          fields: {
            title: {
              force_source: true,
              number_of_fragments: 0,
              highlight_query: {
                match_phrase: {
                  title: text,
                },
              },
            },
            text: {
              force_source: true,
              number_of_fragments: 0,
              highlight_query: {
                match_phrase: {
                  text,
                },
              },
            },
          },
        },
      })
      const words = text
        .split(' ')
        .map((word) => word.trim())
        .filter(Boolean)
      const pattern = words
        .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|')

      const rgx = new RegExp(pattern, 'gi')
      return response.hits.hits
        .map((v) =>
          v._source ? mapSearchItem(rgx, v._source, v.highlight) : undefined,
        )
        .filter(nonNullable)
    } catch (e) {
      setResponseStatus(event, 400)
      if (e && typeof e === 'object' && 'meta' in e) {
        return (e as any).meta.body
      }
      console.log(e)
    }
  },
)
