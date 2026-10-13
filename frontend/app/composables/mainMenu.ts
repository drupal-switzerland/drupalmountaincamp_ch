/**
 * Whether the full-screen phone menu is open. The layout makes the page behind
 * it inert, so keyboard focus can't leave the menu.
 */
export function useMainMenuOpen() {
  return useState<boolean>('mainMenuOpen', () => false)
}

/**
 * The main menu link whose submenu covers the phone menu, if any. Everything
 * the open submenu covers is inert, so focus stays on the submenu.
 */
export function usePhoneSubmenuOpen() {
  return useState<number | null>('phoneSubmenuOpen', () => null)
}

/**
 * Counts the requests to move keyboard focus to the button that opens the
 * phone menu. The page header owns that button and answers each request.
 */
export function useMainMenuToggleFocusRequests() {
  return useState<number>('mainMenuToggleFocusRequests', () => 0)
}
