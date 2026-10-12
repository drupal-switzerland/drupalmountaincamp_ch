# Working in this repository

Commands, gates and traps for anyone changing code here, human or agent. How
the parts fit together is in [ARCHITECTURE.md](ARCHITECTURE.md); setup is in
[README.md](README.md). Paths are relative to the repository root.

## Layout

| Path                    | Holds                                                   |
| :---------------------- | :------------------------------------------------------ |
| `frontend/`             | Nuxt app. See [frontend/README.md](frontend/README.md). |
| `drupal/`               | Drupal. See [drupal/README.md](drupal/README.md).       |
| `drupal/config/default` | Exported Drupal configuration.                          |
| `.ddev/`                | Local environment used by the READMEs.                  |
| `.lagoon/`              | Production images and nginx config.                     |
| `.github/workflows/`    | The four CI workflows.                                  |
| `scripts/ci/`           | Shell scripts; two of them are called by CI.            |

- CI calls `scripts/ci/nginx-headers.sh` and `scripts/ci/check-doc-paths.sh`.
  No workflow calls the other files in `scripts/ci/`.

Three local setups are in the repository. Use DDEV.

- `.ddev/` is the one [README.md](README.md) documents.
- `docker-compose.yml` is the service list Lagoon builds from; `.lagoon.yml`
  names it as `docker-compose-yaml`.
- `.lando.yml` and `lando/` are a Lando setup that [README.md](README.md)
  marks as legacy.
- CI uses none of them: the workflows install PHP, Node and bun on the runner.

## Gates

A change is ready when the commands of the parts it touches exit 0. Each
command below is a step of a workflow in `.github/workflows/`.

### Frontend

Run in `frontend/`. In DDEV:
`ddev exec -d /var/www/html/frontend <command>`.

| Command                                                              | CI job   |
| :------------------------------------------------------------------- | :------- |
| `bun install --frozen-lockfile`                                      | both     |
| `bun run test:coverage`                                              | `vitest` |
| `bun run lint`                                                       | `checks` |
| `bun run prettier`                                                   | `checks` |
| `bun run typecheck`                                                  | `checks` |
| `bun run build`                                                      | `checks` |
| `REQUIRE_BUILT_FONTS=1 bun run test:ci app/__tests__/fontPreload.ts` | `checks` |

- The last command compares the preloaded font files with the built CSS, so
  it needs the build. Without `REQUIRE_BUILT_FONTS` and without a build it
  skips the comparison and still exits 0.
- `bun run test:ci` runs the suite without coverage.

### Drupal

Run in `drupal/` inside DDEV: `ddev exec -d /var/www/html/drupal <command>`.

| Command                                                                                                                                |
| :------------------------------------------------------------------------------------------------------------------------------------- |
| `composer install --no-interaction --no-progress`                                                                                      |
| `vendor/bin/phpstan analyse docroot/modules/custom --no-progress`                                                                      |
| `vendor/bin/phpcs --standard=Drupal,DrupalPractice --extensions=php,inc,module,install,info,test,profile,theme docroot/modules/custom` |
| `vendor/bin/phpunit docroot/modules/custom/blokkli_starterkit/tests/src/Unit`                                                          |
| `vendor/bin/phpunit docroot/modules/custom/blokkli_starterkit/tests/src/Kernel`                                                        |

- CI sets `SIMPLETEST_DB=sqlite://localhost/:memory:` for these
  (`.github/workflows/drupal-tests.yml`). DDEV sets it to the local database
  in `.ddev/config.yaml`; [drupal/README.md](drupal/README.md) says what that
  means for Kernel tests. To run them as CI does, put
  `env SIMPLETEST_DB=sqlite://localhost/:memory:` before the command.

### nginx

- `scripts/ci/nginx-headers.sh` on the host. It needs Docker and runs the
  Lagoon nginx image with `.lagoon/nginx-lagoon.conf`.
- CI also runs `nginx -t` on that file in the same image
  (`.github/workflows/nginx-config.yml`).

### Documentation

- `scripts/ci/check-doc-paths.sh` on the host
  (`.github/workflows/docs.yml`). It checks that the paths in
  [ARCHITECTURE.md](ARCHITECTURE.md) and this file are tracked by git: inline
  code written from the repository root, and relative links. For a path with
  a placeholder it checks the directory before the placeholder. It does not
  check paths written relative to another directory, or anything else the
  text says.

## Conventions the code and CI enforce

- Frontend code passes ESLint (`frontend/eslint.config.mjs`), Prettier
  (`frontend/.prettierrc`) and `nuxi typecheck`.
- PHP in `drupal/docroot/modules/custom` passes phpcs with the `Drupal` and
  `DrupalPractice` standards and phpstan with `drupal/phpstan.neon`.
- Dependencies are installed from the lockfiles: `frontend/bun.lock` and
  `drupal/composer.lock`. CI fails when `frontend/bun.lock` does not match
  `frontend/package.json`.
- Drupal configuration is changed in Drupal and exported to
  `drupal/config/default`; deploy imports it with `drush cim` (`.lagoon.yml`).
  Export steps: [README.md](README.md), section "Deploy".
- The Kernel tests of the custom module carry
  `#[RunTestsInSeparateProcesses]`. Those that depend on site configuration
  read it from `drupal/config/default`, for example
  `drupal/docroot/modules/custom/blokkli_starterkit/tests/src/Kernel/PressReleaseStructuredDataTest.php`.
- GraphQL operations are `.graphql` files matched by `autoImportPatterns` in
  `frontend/config/graphqlMiddleware/index.ts`.
- A path that Drupal has to answer is added to both nginx configs:
  `.lagoon/nginx-lagoon.conf` by hand, and
  `.ddev/nginx_full/nginx-site.conf` through
  `scripts/nginx-conf-generator/config/base.yml`.

## Accessibility gates

These tests run in the `vitest` job. A change to the named area has to keep
them passing.

| Test file                                      | Covers                                         |
| :--------------------------------------------- | :--------------------------------------------- |
| `frontend/app/__tests__/colorContrast.ts`      | Contrast of the brand colour pairs.            |
| `frontend/app/__tests__/skipLink.ts`           | The skip link and its target.                  |
| `frontend/app/__tests__/menuKeyboard.ts`       | Keyboard use of the main menu, Drupal messages |
| `frontend/app/__tests__/stickyHeaderFocus.ts`  | Focused elements below the sticky header.      |
| `frontend/app/__tests__/landmarksAndTeaser.ts` | Navigation landmark name, news teaser link.    |

## Headers that can hide or cache the site

The three rules below set `X-Robots-Tag` or a cache header. Each is written
so that an input it does not expect gives no header, or the not-cacheable
one, and each has a test.

- `X-Robots-Tag` on admin paths: `$admin_robots_tag` in
  `.lagoon/nginx-lagoon.conf`, checked by `scripts/ci/nginx-headers.sh`.
- Error responses: `frontend/server/plugins/errorNotCacheable.ts`, checked by
  `frontend/app/__tests__/errorNotCacheable.ts`.
- Requests with a Drupal session: `frontend/server/middleware/spa.ts`, checked
  by `frontend/app/__tests__/spaMiddleware.ts`.

## Traps

| Trap                                                                 | Cause                                                                                                                                                                                                                                                           |
| :------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The dev server rewrites `frontend/schema.graphql`.                   | `downloadSchema: IS_DEV` in `frontend/config/graphqlMiddleware/index.ts` downloads the schema of the local Drupal. Commit it only when the schema change is intended.                                                                                           |
| Only one frontend is reachable through the DDEV hostname.            | `frontend_port` in `scripts/nginx-conf-generator/config/ddev.yml` is 3000, and the generated `@frontend` location proxies to `localhost:3000`. A second server answers only on its own port, on the host or in the container it was started in.                 |
| Regenerating the DDEV nginx config changes other files.              | `scripts/nginx-conf-generator/index.js` also writes `lando/nginx/custom.conf` and `deploy/nginx/ci/ci.conf`.                                                                                                                                                    |
| A build changes files under `drupal/`.                               | `bun run build` writes the CSS named in the `styles` scripts of `frontend/package.json`, the blökkli options file and `drupal/config/default/frontend_routing.settings.yml`.                                                                                    |
| A build passes although a dependency was removed.                    | Seen after `bun remove`: packages no longer in `frontend/bun.lock` stayed in the `node_modules` directory of `frontend/`, also after `bun install --frozen-lockfile`. Delete that directory, install and build again.                                           |
| phpstan reports hundreds of unknown Drupal classes and functions.    | Seen once after the first `composer install` in a new checkout: the `phpstan/extension-installer` plugin (allowed in `drupal/composer.json`) had not listed the Drupal extension. A second `composer install` fixed it. Why the first run did not is not known. |
| The local database differs from `drupal/config/default`.             | Configuration is imported by `drush cim` or `drush deploy`, not by pulling code. `ddev drush config:status` lists the differences.                                                                                                                              |
| A routing change works locally and not on production, or the reverse | The two nginx configs are separate files with different rules (see [ARCHITECTURE.md](ARCHITECTURE.md), "Request path").                                                                                                                                         |
