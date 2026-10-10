# Drupal Mountain Camp

Drupal 11 backend (`drupal/`) and Nuxt frontend (`frontend/`), run locally with
[DDEV](https://ddev.com/) and hosted on Lagoon.

- `.lando.yml` and `lando/` are legacy and unmaintained; use DDEV.

## Requirements

- [DDEV](https://ddev.readthedocs.io/en/stable/users/install/ddev-installation/)
  and `mkcert -install` for local HTTPS.

## Local setup

- `ddev start`: web container (PHP 8.3, nginx, Node and bun), MariaDB,
  Elasticsearch and memcached. The site is <https://mountaincamp.ddev.site>.
- `ddev composer install`: Drupal dependencies into `drupal/vendor`.
- `ddev bun install`: frontend dependencies into `frontend/node_modules`.
- Database, one of:
  - `ddev init-db`: drops the local database, imports
    `drupal/dump/init.sql.gz` and runs `drush deploy`.
  - `ddev copy-live-to-self` or `ddev copy-stage-to-self`: pulls a Lagoon
    environment (needs Lagoon access).
- After pulling new code: `ddev drush deploy` (updb, cim, cr and deploy
  hooks), or `ddev drush cim -y` for configuration only.
- `ddev drush uli`: one-time admin login link.
- Images work without rokka: uploads go to `public://`.

## Frontend dev server

- In the container: `ddev frontend` runs `bun run dev` in `frontend/` on port
  3000; nginx serves it at <https://mountaincamp.ddev.site> and sends Drupal
  paths (`/admin`, `/user`, `/graphql`, files) to Drupal.
- On the host, set the backend variables yourself:

  ```bash
  cd frontend
  NUXT_BACKEND_URL=http://127.0.0.1:<web port> \
  DRUPAL_GRAPHQL_TOKEN=local-development \
  NUXT_MULTI_CACHE_API_AUTHORIZATION_TOKEN=local-development \
  NUXT_REQUEST_HOST=localhost:3000 \
  node node_modules/.bin/nuxi dev
  ```

  - `<web port>` is the host port mapped to `web:80` in `ddev describe`.
  - `NUXT_BACKEND_URL` must be the plain `http://` port: the `https://` URL
    fails on the local certificate.
  - Without `DRUPAL_GRAPHQL_TOKEN=local-development`, Drupal rejects the
    GraphQL requests and every page fails to load.
  - Inside the container `.ddev/config.yaml` sets these variables already.

## Tests

- Frontend: `ddev bun run test:ci` (vitest). CI runs the same in
  `.github/workflows/frontend-tests.yml`.
- Backend:
  `ddev exec -d /var/www/html/drupal env -u SIMPLETEST_BASE_URL vendor/bin/phpunit`.
  - `env -u SIMPLETEST_BASE_URL` makes phpunit use the `http://localhost`
    fallback in `drupal/phpunit.xml`, which reaches Drupal from inside the
    container. A base URL from your shell (often the `https://` site URL)
    breaks the ExistingSite tests.
  - Pass a path to run part of the suite, e.g.
    `docroot/modules/custom/blokkli_starterkit/tests/src/Unit`.

## Lint

- Frontend: `ddev bun run lint`, `ddev bun run prettier` and
  `ddev bun run typecheck` (what `scripts/ci/lint-tests.sh` runs).
- Backend: `ddev exec vendor/bin/phpcs` and `ddev exec vendor/bin/phpstan`
  (run from `drupal/`).

## Deploy

- Lagoon builds on push to `prod` (`.lagoon.yml`, `docker-compose.yml`).
- Post-rollout on the cli container: `drush updb`, `drush cr`, `drush cim`,
  `drush cr`, then `drush search-api:index`.
- Configuration lives in `drupal/config/default`; export changes with
  `ddev drush cex` and commit only the files you meant to change.

## DDEV commands

| Command                                  | What it does                                     |
| :--------------------------------------- | :----------------------------------------------- |
| `ddev frontend`                          | Start the Nuxt dev server (`bun run dev`)        |
| `ddev bun …` / `ddev npm …`              | Run bun or npm in `frontend/`                    |
| `ddev f`                                 | Shell in `frontend/`                             |
| `ddev phpunit …`                         | Run phpunit in `drupal/`                         |
| `ddev init-db`                           | Replace the database with the bundled dump       |
| `ddev copy-live-to-self`                 | Copy the live database to local                  |
| `ddev copy-stage-to-self`                | Copy the stage database to local                 |
| `ddev regenerate-nginx-config`           | Regenerate the nginx routing                     |
| `ddev drupal-check-and-update-locale`    | Check and update translations                    |
| `ddev drupal-reindex-search-api-indices` | Re-index Search API                              |
| `ddev drupal-composer-update-info`       | List outdated Composer packages                  |

## Routing

- Drupal and the frontend share <https://mountaincamp.ddev.site>; nginx sends
  each path to the right app (`.ddev/nginx_full/nginx-site.conf`).
- If the frontend isn't running, frontend paths fall back to Drupal.
- To send another path to Drupal: add it to
  `scripts/nginx-conf-generator/config/base.yml`, run
  `ddev regenerate-nginx-config`, then `ddev restart`.

## AI modules (drupal/ai + amazee.ai provider)

`drush cim` on deploy enables `ai`, `ai_api_explorer`, `ai_ckeditor`, `ai_context`, `key` and
`ai_provider_amazeeio`. No secret is committed: the amazee.ai API key is the Key entity
`amazeeai_api_key`, which reads the `AMAZEEAI_API_KEY` environment variable. The region specific LLM
endpoint is passed through `AMAZEEAI_HOST` (see `settings.php`); it falls back to the provider default.

Set the variables per Lagoon environment before deploying:

```bash
lagoon add variable -p drupalmountaincamp-ch -e prod -N AMAZEEAI_API_KEY -V <key> -S runtime
lagoon add variable -p drupalmountaincamp-ch -e prod -N AMAZEEAI_HOST -V https://<region>.api.amazee.ai -S runtime
# Vector database (PostgreSQL); the password is read by the Key entity `amazeeio_ai_database`.
lagoon add variable -p drupalmountaincamp-ch -e prod -N AMAZEEAI_POSTGRES_PASSWORD -V <password> -S runtime
lagoon add variable -p drupalmountaincamp-ch -e prod -N AMAZEEAI_POSTGRES_HOST -V <host> -S runtime
lagoon add variable -p drupalmountaincamp-ch -e prod -N AMAZEEAI_POSTGRES_PORT -V 5432 -S runtime
lagoon add variable -p drupalmountaincamp-ch -e prod -N AMAZEEAI_POSTGRES_DEFAULT_DATABASE -V <database> -S runtime
lagoon add variable -p drupalmountaincamp-ch -e prod -N AMAZEEAI_POSTGRES_USERNAME -V <user> -S runtime
```

Locally, add the same variables to `.ddev/config.local.yaml` under `web_environment`.
