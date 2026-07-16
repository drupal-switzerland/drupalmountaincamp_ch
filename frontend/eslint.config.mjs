import withNuxt from './.nuxt/eslint.config.mjs'
import tailwind from 'eslint-plugin-tailwindcss'
import sonarjs from 'eslint-plugin-sonarjs'

export default withNuxt([
  ...tailwind.configs['flat/recommended'],
  sonarjs.configs.recommended,
  {
    settings: {
      tailwindcss: {
        config: './tailwind.config.ts',
      },
    },
  },
])
  .override('nuxt/vue/rules', {
    rules: {
      'vue/no-v-html': 0,
      'vue/no-empty-component-block': 'error',
      'vue/padding-line-between-blocks': 'error',
      'vue/no-v-for-template-key': 'error',
      'vue/prefer-true-attribute-shorthand': 'error',
      'vue/component-api-style': 'error',
      'vue/block-lang': [
        'error',
        {
          script: {
            lang: 'ts',
          },
        },
      ],
      'vue/block-order': [
        'error',
        {
          order: [['script', 'template'], 'style'],
        },
      ],
      'vue/html-self-closing': [
        'error',
        {
          html: {
            void: 'always',
          },
        },
      ],
      'vue/no-deprecated-slot-attribute': [
        'error',
        {
          ignore: [
            'celum-adapter',
            'anura-lightbox',
            'anura-details',
            'anura-asset',
            'span',
            'div',
          ],
        },
      ],
    },
  })
  .override('nuxt/typescript/rules', {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  })
  .override('tailwindcss:rules', {
    rules: {
      'tailwindcss/classnames-order': 'off',
      'tailwindcss/no-custom-classname': [
        'error',
        {
          callees: ['twMerge'],
          cssFiles: ['./assets/css/**/*.css'],
          whitelist: [
            'bk-main-canvas',
            'close-launcher',
            'open-launcher',
            'launcher',
            'select',
            'page-header',
            'info-box',
            'search-result',
            'info-box-floater',
            'carousel.*',
            'launcher-visible',
            'breadcrumb-.*',
            'pagination-page',
            'content-fullscreen-header',
            'is-previous',
            'is-active',
            'is-next',
            'paragraph-expand-section',
            'search-input',
            'pagination-buttons',
            'formkit-.*',
            'breadcrumb',
            'editor_image',
            'close-icon-.*',
            'grid-area-.*',
            'page-.*',
            'swiper-.*',
            'paragraph-.*',
            'is-slider-mobile',
            'is-slider-desktop',
            'is-staggered',
          ],
        },
      ],
    },
  })
