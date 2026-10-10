import { dedupeKey } from 'unhead/utils'
import { ogDescriptionFallback, shareImageAltTags } from '~/helpers/shareTags'
import { SHARE_IMAGE_ALT, SHARE_IMAGE_PATH } from '~/helpers/site'

/**
 * Runs once the head's tags are resolved and de-duplicated, on the server and
 * in the browser, so it sees the tags that actually win: Drupal's metatags, a
 * page's own, or the site default from nuxt.config.
 */
export default defineNuxtPlugin(() => {
  injectHead().hooks?.hook('tags:resolve', (context) => {
    const fallback = ogDescriptionFallback(context.tags)
    const added = [
      ...(fallback ? [fallback] : []),
      ...shareImageAltTags(
        fallback ? [...context.tags, fallback] : context.tags,
        SHARE_IMAGE_PATH,
        SHARE_IMAGE_ALT,
      ),
    ]
    // The key unhead gives its own tags: the browser matches the tag the
    // server rendered by it, instead of adding a second one, and removes it
    // when a later page doesn't need it.
    context.tags.push(...added.map((tag) => ({ ...tag, _d: dedupeKey(tag) })))
  })
})
