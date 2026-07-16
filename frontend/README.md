# Setup

## Base Frontend Setup

- Move the `frontend/.env.example` file to `frontend/.env` and adapt the
  variables if needed.
- Install the frontend dependencies `lando npm ci`.
- Start the frontend using `lando npm run dev`.

## Start the frontend

The frontend runs in a dedicated node container, one container per site. Login
and start it by running:

```sh
lando ssh -s frontend
npm ci # install dependencies if not already done
npm run dev
```

You can also use the tooling commands which is mapped to the frontend container:

```
lando npm run dev
```

You can now access the frontend at https://starterkit.lndo.site.

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
