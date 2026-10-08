/**
 * Whether the full-screen phone menu is open. The layout makes the page behind
 * it inert, so keyboard focus can't leave the menu.
 */
export function useMainMenuOpen() {
  return useState<boolean>('mainMenuOpen', () => false)
}
