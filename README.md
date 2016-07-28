# Amazee Drupal 8 Starter

A Drupal 8 starter project built with Composer.

The starter lives at http://d8-starter-composer.io.dev.dev1.compact.amazee.io/ (be sure to export/commit/push any config changes you make)

How to setup a new project from d8-starter-composer: http://confluence.amazeelabs.com/display/KNOWLEDGE/Create+new+Drupal+8+Composer+project

## Todo

- Switch `cweagans/composer-patches` to original repository once [#46](https://github.com/cweagans/composer-patches/pull/46) and [#57](https://github.com/cweagans/composer-patches/pull/57) get in.

## Recipes

The most recent version of the following recipes can be found at https://github.com/AmazeeLabs/d8-starter-composer#readme

### Installing contrib modules

- ```composer require drupal/<MODULE_NAME>:~8.0``` to get latest stable version (or latest dev, if there is no stable release)
- ```composer require drupal/<MODULE_NAME>:dev-<BRANCH_NAME>``` to get latest dev version
- ```composer require drupal/<MODULE_NAME>:dev-<BRANCH_NAME>#<COMMIT_HASH>``` to get specific version

### Updating Drupal core/modules

1. Run `composer update` (add `--dry-run` to just check for updates)
1. Run `drush -y updb`
1. Export possible config changes with `drush -y config-export`
1. Check via Git if there are any changes made to the Drupal core files (this can be done by `drupal-composer/drupal-scaffold`), review them carefully, ensure that all Amazee-specific stuff is still on its place
1. Commit/push changes

### Patching packages

```
    "extra": {
        "patches": {
            "<PACKAGE/NAME>": {
                "<PATCH DESCRIPTION>": "<PATH/TO/PATCH>",
                ...
            },
            ...
        },
        "composer-exit-on-patch-failure": true
    }
```

Example:

```
    "extra": {
        "patches": {
            "drupal/core": {
                "HEKS-102 Fix language detection": "patches/2189267-24.patch"
            }
        },
        "composer-exit-on-patch-failure": true
    }
```

### Installing custom/forked modules from Github repository

#### For the case if module reposiroty contains its own `composer.json`

```
    "repositories": [
        {
            "type": "vcs",
            "url": "https://github.com/<REPOSITORY/NAME>"
        },
        ...
    ],
```

Use `composer require drupal/<MODULE_NAME>:dev-<BRANCH_NAME>#<COMMIT_HASH>` to add the module.

#### For the case if `composer.json` is missing in the module reposiroty

```
    "repositories": [
        {
            "type": "package",
            "package": {
                "name": "drupal/<MODULE_NAME>",
                "version": "dev-amazee",
                "type": "drupal-module",
                "source": {
                    "type": "git",
                    "url": "git@github.com:<REPOSITORY/NAME>.git",
                    "reference": "<BRANCH-NAME>"
                }
            }
        },
        ...
    ],
```

Use `composer require drupal/<MODULE_NAME>:dev-amazee#<COMMIT_HASH>` to add the module.

#### For the case when destination path should be other than `modules/contrib/<MODULE_NAME>`

```
    "extra": {
        "installer-paths": {
            "web/modules/custom/<MODULE_NAME>": ["drupal/<MODULE_NAME>"],
            ...
        }
    }
```

### Add a JS library

Most of libraries can be added easily with composer. The tricky part is that most of Drupal modules require that libraries are saved under `libraries` directory while Composer installs them to `vendor`. The `composer/installers` can override package paths, but only for packages that depend on it. So, you'll need to write (or override) the `composer.json` file of the library stating that it has `composer/installers` dependency.

Example: https://github.com/AmazeeLabs/heks_ch/commit/e9b1aeb

### Switch a dependency package to a forked version

1. Add the forked repository to the `composer.json`
1. Change the package version to the branch name prefixed with `dev-`
1. Run `composer update <package/name>` (`composer.lock` will be updated)

Example: https://github.com/AmazeeLabs/d8-starter-composer/commit/cbe1481

### Update existing Drupal 8 project to use composer

You will need:
- Move files around, setup composer stuff, example: https://github.com/AmazeeLabs/heks_ch/compare/5a5af8c...031914d (better to view in a desktop app because of huge commit diffs), there is also a BackThursday video: https://youtu.be/QsxHAo4J69A?t=30s
- Ask @devops to update environment(s) configuration and deloyment script as for composer-based project
- After deployment, on server(s):
  - Manually move the `sites/default/files` directory to `web/sites/default/files`
  - Manually remove all leftover derictories that should not be there anymore (like `modules`, `themes`, etc)
  - Update bash aliases, example: https://github.com/AmazeeLabs/devops/commit/e257359
