# Amazee Drupal 8 Starter

A Drupal 8 starter project built with Composer.

## Installing contrib modules

```composer require drupal/{MODULE_NAME}:~8.0```

## Installing custom modules from Github repository

First edit the `repositories` section of the `composer.json` file and add the following:

```
        {
            "type":"package",
            "package": {
                "name": "drupal/{MODULE_NAME}",
                "version": "8.1.0-dev",
                "type": "drupal-module",
                "source": {
                    "type": "git",
                    "url": "git@github.com:{REPOSITORY/NAME}.git",
                    "reference": "{BRANCH-NAME}"
                }
            }
        },
```
It is important that this repository is added before the `packagist.drupal-composer.org`.

When the `composer.json` is updated, `composer require` can be used as usual. Composer should take the custom module version even if there is a contrib module with the same name.

## Updating Drupal core/modules

1. Run `composer update`
1. Review changes made to `composer.lock`, there you'll see package version changes
1. If everything is fine, run `drush -y updb`
1. Export possible config changes with `drush -y config-export`
1. Check via Git if there are any changes made to the Drupal core files (this can be done by `drupal-scaffold`), review them carefully, ensure that all Amazee-specific stuff is still on its place
1. Commit/push changes
