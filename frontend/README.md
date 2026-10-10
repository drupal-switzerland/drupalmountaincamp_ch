# Frontend

Nuxt app for the site. Setup, the dev server and tests are in the
[root README](../README.md); the short version:

- `ddev bun install`: install dependencies.
- `ddev frontend`: dev server on port 3000, served at
  <https://mountaincamp.ddev.site>.
- `ddev bun run test:ci`: vitest.
- `ddev bun run lint`, `ddev bun run prettier`, `ddev bun run typecheck`.
- `frontend/.env` (from `.env.example`) only needs rokka values if you use
  rokka; images work without it.
- Running `nuxi dev` on the host needs `NUXT_BACKEND_URL` set to the plain
  `http://` port of the ddev web container and
  `DRUPAL_GRAPHQL_TOKEN=local-development`; see the root README.

## Add a route template only for a specific content type bundle

Create a new folder with an alias. On Drupal you will have to setup the matching
Alias pattern:

```
definePageMeta({
    path: '/medienmitteilung/:slug(.*)*',
    languageMapping: {
      fr: '/fr/communiques-de-presse/:slug(.*)*',
      en: '/en/press-release/:slug(.*)*',
    },
})
```

Now you can add a route fragment that only contains the page related fragments.
