type HeadTagLike = { tag: string; props: Record<string, string> }
type MetaTag = { tag: 'meta'; props: Record<string, string> }

// Only the path of an image URL is compared; the base is never used.
const ANY_ORIGIN = 'https://share.invalid'

const isMeta = (tag: HeadTagLike, key: 'name' | 'property', value: string) =>
  tag.tag === 'meta' && tag.props[key] === value

/**
 * The og:description to add to a resolved head: the page's own description,
 * when nothing (Drupal's metatags, a page) has set an og:description. Share
 * previews then always have a text, and one from Drupal still wins.
 */
export function ogDescriptionFallback(
  tags: HeadTagLike[],
): MetaTag | undefined {
  if (tags.some((tag) => isMeta(tag, 'property', 'og:description'))) {
    return undefined
  }
  const content = tags
    .find((tag) => isMeta(tag, 'name', 'description'))
    ?.props.content?.trim()
  return content
    ? { tag: 'meta', props: { property: 'og:description', content } }
    : undefined
}

function isImageAt(url: string | undefined, path: string): boolean {
  if (!url || !URL.canParse(url, ANY_ORIGIN)) {
    return false
  }
  return new URL(url, ANY_ORIGIN).pathname === path
}

/**
 * The alt tags to add to a resolved head when its only share image is the
 * site's default one: og:image:alt, and twitter:image:alt if the page sends
 * Twitter tags. A page with an image of its own gets none, even where Drupal
 * lists the default as a second og:image, and alts already set are kept.
 */
export function shareImageAltTags(
  tags: HeadTagLike[],
  defaultImagePath: string,
  alt: string,
): MetaTag[] {
  const images = tags.filter((tag) => isMeta(tag, 'property', 'og:image'))
  const onlyDefault =
    images.length > 0 &&
    images.every((tag) => isImageAt(tag.props.content, defaultImagePath))
  if (!onlyDefault) {
    return []
  }
  const added: MetaTag[] = []
  if (!tags.some((tag) => isMeta(tag, 'property', 'og:image:alt'))) {
    added.push({
      tag: 'meta',
      props: { property: 'og:image:alt', content: alt },
    })
  }
  const sendsTwitterTags = tags.some(
    (tag) => tag.tag === 'meta' && tag.props.name?.startsWith('twitter:'),
  )
  if (
    sendsTwitterTags &&
    !tags.some((tag) => isMeta(tag, 'name', 'twitter:image:alt'))
  ) {
    added.push({
      tag: 'meta',
      props: { name: 'twitter:image:alt', content: alt },
    })
  }
  return added
}
