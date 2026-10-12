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

## A route template for one content type

A folder under `app/pages/` named after a path prefix renders the Drupal paths
with that prefix. `app/pages/news/[...slug]/index.vue` does this for press
releases: it runs its own query, `query.routeNodePressRelease.graphql`, next to
it. Drupal has to give the content type aliases with the same prefix; for press
releases that is
`drupal/config/default/pathauto.pattern.node_press_release_en.yml`.
