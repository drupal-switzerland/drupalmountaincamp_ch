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
