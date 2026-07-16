module.exports = {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': {},
    tailwindcss: {},
    'postcss-hexrgba': {
      colorFunctionNotation: 'modern',
      transformToBareValue: true,
    },
    cssnano: {
      preset: 'default',
    },
  },
}
