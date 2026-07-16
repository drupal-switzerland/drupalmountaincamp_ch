export interface DrupalUser {
  fetched: boolean
  accessToolbar: boolean
}

export default function () {
  return useState<DrupalUser>('drupalUser', () => ({
    fetched: false,
    accessToolbar: false,
  }))
}
