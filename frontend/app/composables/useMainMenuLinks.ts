import type { InitData } from '~/composables/useInitData'
import type { MenuLinkTreeFragment } from '#graphql-operations'

function isLinkTreeActive(
  tree: MenuLinkTreeFragment & { subtree?: Array<MenuLinkTreeFragment> },
  currentRoutePath: string,
): boolean {
  if (tree.link.url?.path === currentRoutePath) {
    return true
  }

  if (tree.subtree) {
    return tree.subtree.some((subtreeEl) =>
      isLinkTreeActive(subtreeEl, currentRoutePath),
    )
  }

  return false
}

export async function useMainMenuLinks() {
  const initData: Ref<InitData> = await useInitData()
  const currentRoute = useRoute()

  const links = computed(() => {
    return initData.value.mainMenuLinks
  })

  const currentActiveMainLink = computed(() => {
    return initData.value.mainMenuLinks.find((l) =>
      isLinkTreeActive(l, currentRoute.path),
    )
  })

  const activeLocalLink = computed(() => {
    return currentActiveMainLink.value?.subtree.find((l) =>
      isLinkTreeActive(l, currentRoute.path),
    )
  })

  const isHotelActive = computed(() => {
    const hotelLink = initData.value.mainMenuLinks[2]
    return hotelLink ? isLinkTreeActive(hotelLink, currentRoute.path) : false
  })

  return {
    links,
    currentActiveMainLink,
    activeLocalLink,
    isHotelActive,
  }
}
