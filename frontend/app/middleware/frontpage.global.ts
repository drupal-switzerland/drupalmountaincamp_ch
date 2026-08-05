/**
 * The front page node's Drupal alias is /home, but the site serves it at "/"
 * (see pages/index.vue, which queries the alias directly). Redirect the alias
 * to the root so the homepage only exists under one URL. Query params are
 * kept so e.g. blokkli editing links keep working.
 *
 * No redirect loop is possible: "/" itself never redirects (index.vue renders
 * the entity directly), and the internal GraphQL request for /home does not
 * pass through this route middleware.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/home') {
    return navigateTo({ path: '/', query: to.query }, { redirectCode: 301 })
  }
})
