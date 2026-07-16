import { defineVuepalAdapter } from 'vuepal/adapter'
import { useCurrentLanguage } from '#imports'

export default defineVuepalAdapter(() => {
  return {
    getAdminMenu() {
      return useGraphqlQuery('adminToolbar').then((v) => v.data)
    },
    getLocalTasks(path: string) {
      return useGraphqlQuery(
        'localTasks',
        { path },
        {
          graphqlCaching: {
            client: true,
          },
        },
      ).then((v) => {
        if (v.data.route && 'localTasks' in v.data.route) {
          return v.data.route.localTasks
        }
        return []
      })
    },
    getCurrentLanguage() {
      return useCurrentLanguage()
    },
  }
})
