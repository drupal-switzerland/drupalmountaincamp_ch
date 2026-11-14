import { isTicketsUrl, linkTarget, opensNewTab } from '~/helpers/navigation'

type MenuItem = Awaited<
  ReturnType<typeof useInitData>
>['value']['mainMenuLinks'][number]

export type TicketsLink = {
  item: MenuItem
  href: string
  label: string
  target: string
  opensNewTab: boolean
}

/**
 * The Tickets link from the Drupal main menu, wherever editors placed it,
 * pointing to the tickets page or the ticket shop. Header, mobile menu,
 * homepage hero and footer all use it, so a missing menu item hides every
 * Tickets button instead of leaving a dead link.
 */
export async function useTicketsLink() {
  const data = await useInitData()
  return computed<TicketsLink | undefined>(() => {
    const item = data.value.mainMenuLinks.find((link) =>
      isTicketsUrl(link.link.url?.path),
    )
    const href = item?.link.url?.path
    if (!item || !href) {
      return undefined
    }
    const target = linkTarget(href, item.link.attribute)
    return {
      item,
      href,
      label: item.link.label,
      target,
      opensNewTab: opensNewTab(target),
    }
  })
}
