import type {
  LanguageSwitchLinkFragment,
  RouteNodeCanonicalQuery,
} from '#graphql-operations'

function setLanguageLinksFromFragment(links: LanguageSwitchLinkFragment[]) {
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
  definePageLanguageLinks({} as Record<string, string>)
}
