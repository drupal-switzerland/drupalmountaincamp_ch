const mix = require('laravel-mix');

mix.js('src/js/app.js', 'dist/js')
    .postCss('src/css/app.css', 'dist/css', [
      require("tailwindcss"),
    ]);
