import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt().override('nuxt/vue/rules', {
  rules: {
    'vue/no-v-html': 0,
  },
})
