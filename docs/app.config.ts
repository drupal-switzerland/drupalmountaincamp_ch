// https://github.com/nuxt-themes/docus/blob/main/nuxt.schema.ts
export default defineAppConfig({
  docus: {
    title: 'blökkli starterkit for Drupal',
    description:
      'Interactive page building experience for Drupal based on paragraphs.',
    image: 'https://blokk.li/editor-screenshot.png',
    aside: {
      level: 0,
      collapsed: false,
      exclude: [],
    },
    main: {
      padded: true,
      fluid: false,
    },
    header: {
      logo: true,
      showLinkIcon: true,
      exclude: [],
      fluid: false,
    },
    footer: {
      credits: {
        icon: '',
        text: '',
        href: 'https://blokk.li',
      },
      textLinks: [],
      iconLinks: [],
      fluid: true,
    },
    socials: {},
  },
})
