# Patches

Patches to Drupal core and contributed projects are applied by
[cweagans/composer-patches](https://github.com/cweagans/composer-patches)
during `composer install`. They are declared under `extra.patches` in
`drupal/composer.json` and recorded in `drupal/patches.lock.json`.

- Both are empty: no patch is applied.
- The `.patch` and `.diff` files in this directory are not referenced by
  either file.
