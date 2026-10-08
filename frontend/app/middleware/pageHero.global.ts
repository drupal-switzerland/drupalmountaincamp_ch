/**
 * Pages opt in to the hero band per route (see composables/pageHero.ts), so
 * every navigation starts without it.
 */
export default defineNuxtRouteMiddleware(() => {
  setPageHasHero(false)
})
