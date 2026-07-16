# Getting Started

Getting up and running with the blökkli starterkit is straightforward. You can quickly spin up a demo site on your local
machine.

## Installation Requirements

You need to install either [DDEV](https://ddev.com/) or [Lando](https://lando.dev/) in order to run the starterkit.

### DDEV

1. Follow the instruction to install DDEV on your machine (if not already installed):
   https://ddev.readthedocs.io/en/stable/users/install/ddev-installation/
2. After installing DDEV, check if the `ddev` command is working in your terminal
3. Make sure you have run `mkcert --install` to set up local SSL certificates

You are ready to use the automated setup script in the next section.

### Lando

1. On OSX, follow the documentation: https://docs.lando.dev/install/macos.html
2. On Linux, follow the documentation: https://docs.lando.dev/install/linux.html
3. On Windows, install Lando inside a WSL2 enabled distro: https://docs.lando.dev/install/windows.html
4. As soon as the lando command is working in your terminal

You are ready to use the automated setup script in the next section.

## Automated Setup Script

This script setups up a working local environment with Drupal and Nuxt frontend in a few minutes.

It is recommended to create a free account on [rokka.io](https://rokka.io/dashboard/#/signup) and get your API key to
use the image CDN.
During the setup process, you will be asked to provide the API key and the organisation name.

### Setup rokka.io for image handling

All image handling, processing and optimization is done by rokka.io.
You can create a free account and set up a new organization at https://rokka.io/dashboard/#/signup.

You will get an API key and an organisation name.

### Run the installer

Start script and provided the desired setup type (ddev or lando).

```bash
./scripts/local/init-project.sh (ddev | lando)
```

This will:

- Set up the necessary `.env` files.
- Run `composer install` within the container.
- Import demo database.
- Upload some demo images to rokka.io and set up the image styles.
- Install all frontend dependencies with a clean state using `bun install`.
- Rebuild all styles.
- Ask you to start the frontend in development mode.

After running the script, you can log in in the Drupal backend using one of the URLs:

- https://starterkit.ddev.site/user (for DDEV)
- https://starterkit.lndo.site/user (for Lando)

with the credentials generated during installation. Defaults to `admin` / `password`.

Now you can visit the frontpage and start building your first page with blökkli.

## Regular DDEV commands

| Command         | Description                                                                                                                       |
|:----------------|:----------------------------------------------------------------------------------------------------------------------------------|
| `ddev launch`   | Opens the site in a new browser window.<br/>Note: You won't see the Nuxt frontend unless you have started it with `ddev frontend` |
| `ddev frontend` | Start the frontend. Same as running `ddev bun run dev`.                                                                           |
| `ddev restart`  | Restart ddev.                                                                                                                     |
| `ddev poweroff` | Powers off ddev.                                                                                                                  |

## Scripts

| Script description                      | DDEV                                     | Lando                                     |
|:----------------------------------------|:-----------------------------------------|:------------------------------------------|
| Copy live to self                       | `ddev copy-live-to-self`                 | `lando drupal:copy-live-to-self`          |
| Copy stage to self                      | `ddev copy-stage-to-self`                | `lando drupal:copy-stage-to-self`         |
| Regenerates the Nginx configurations    | `ddev regenerate-nginx-config`           | `lando regenerate-nginx-config`           |
| Check and update locales (translations) | `ddev drupal-check-and-update-locale`    | `lando drupal:check-and-update-locale`    |
| Re-index Search API indices             | `ddev drupal-reindex-search-api-indices` | `lando drupal:reindex-search-api-indices` |
| Composer Update Info                    | `ddev drupal-composer-update-info`       | `lando drupal:composer-update-info`       |

## Routing and Nginx Configuration

Both Drupal and the frontend app are accessible on the same domain:
https://starterkit.ddev.site (for DDEV) or https://starterkit.lndo.site (for Lando).

The requests are routed to the correct app. For example, `/de` is routed to the frontend and `/admin` is routed to
Drupal.

This means that if the frontend is not running, `exped.lndo.site` will
automatically fall back to the Drupal backend. Drupal is available via `/admin`.

### Add Drupal routes in the frontend

#### Step 1: Add routes

Add the routes you would you like to be handled in drupal inside `scripts/nginx-conf-generator/config/base.yml` file.

#### Step 2: Regenerate Nginx configuration

##### Using a script

Run `ddev regenerate-nginx-config` (for DDEV) or `lando regenerate-nginx-config` (for Lando)

##### Manually

1. SSH into the container using `ddev ssh` (for DDEV) or `lando ssh -s frontend` (for Lando)
2. Run `npm ci && npm start`.

#### Step 3: Restart/Reload nginx

Simply run `ddev restart` (for DDEV) or `lando reload` (for Lando)
