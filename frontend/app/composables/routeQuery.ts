import { routeQueryError } from '~/helpers/backendUnavailable'

/**
 * Loads the data of a route page. Every page that hands its query to
 * useDrupalRoute loads it through this, so a failed request shows its own
 * error (503 during an outage) and never a 404.
 */
export async function useRouteQuery<T>(key: string, load: () => Promise<T>) {
  const { data, error } = await useAsyncData(key, load)
  if (error.value) {
    throw createError(routeQueryError(error.value))
  }
  return data
}
