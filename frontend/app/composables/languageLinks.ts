import type {
  LanguageSwitchLinkFragment,
  RouteNodeCanonicalQuery,
} from '#graphql-operations'

export function setLanguageLinksFromFragment(
  links: LanguageSwitchLinkFragment[],
) {
  const route = useRoute()

  definePageLanguageLinks(
    links.reduce<Record<string, string>>((acc, v) => {
      if (v.language.id && v.url.path) {
        acc[v.language.id] = v.url.path
      }
      return acc
    }, {}),
  )
}

export function setLanguageLinksFromRoute(
  query?: RouteNodeCanonicalQuery | null,
) {
  if (query && query.route && 'languageSwitchLinks' in query.route) {
    setLanguageLinksFromFragment(query.route.languageSwitchLinks)
    return
  }
  const route = useRoute()
  definePageLanguageLinks({} as Record<string, string>)
}
