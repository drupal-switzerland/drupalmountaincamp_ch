/** Show the next page's breadcrumb and hero state once it has rendered. */
export default defineNuxtPlugin((nuxtApp) => {
  const commit = usePageChromeCommit()
  nuxtApp.hook('page:finish', commit)
})
