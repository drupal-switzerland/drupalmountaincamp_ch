# Drupal

Setup and commands are in the [root README](../README.md).

## Running tests

- All: `ddev exec -d /var/www/html/drupal env -u SIMPLETEST_BASE_URL vendor/bin/phpunit`
- One directory:
  `ddev exec -d /var/www/html/drupal env -u SIMPLETEST_BASE_URL vendor/bin/phpunit docroot/modules/custom/blokkli_starterkit/tests/src/Unit`
- `env -u SIMPLETEST_BASE_URL` lets `phpunit.xml`'s `http://localhost` fallback
  apply, which reaches Drupal from inside the container.
- Kernel tests use `SIMPLETEST_DB` from `.ddev/config.yaml` (the local
  MariaDB, with prefixed tables they drop afterwards).

## Lint

- `ddev exec vendor/bin/phpcs`
- `ddev exec vendor/bin/phpstan`
