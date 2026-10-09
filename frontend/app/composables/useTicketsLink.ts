import { TICKETS_PATH } from '~/helpers/navigation'

/**
 * The Tickets link from the Drupal main menu, wherever editors placed it.
 * Header, mobile menu, homepage hero and footer all point to it, so a missing
 * menu item hides every Tickets button instead of leaving a dead link.
 */
export async function useTicketsLink() {
  const data = await useInitData()
  return computed(() =>
    data.value.mainMenuLinks.find(
      (link) => link.link.url?.path === TICKETS_PATH,
    ),
  )
}
