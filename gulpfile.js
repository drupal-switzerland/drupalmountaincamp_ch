'use strict';

const path = require('path');
const gulp = require('gulp');
const sassModule = require('sass');
const gulpSass = require('gulp-sass')(sassModule);
const globbing = require('gulp-css-globbing');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const csswring = require('csswring');

const themes_folder = 'web/themes';

const paths = {
  theme: `${themes_folder}/beaker/`,
  sass: 'sass',
  css: 'css',
  js: 'js',
  img: 'images',
  tpl: 'templates',
  fonts: 'fonts'
};

paths.sass = paths.theme + paths.sass;
paths.css = paths.theme + paths.css;
paths.js = paths.theme + paths.js;
paths.img = paths.theme + paths.img;
paths.tpl = paths.theme + paths.tpl;
paths.fonts = paths.theme + paths.fonts;

function sassTask() {
  const selectedProcessors = [
    autoprefixer({ overrideBrowserslist: ['last 10 versions'] }),
    csswring
  ];

  return gulp
    .src(`${paths.sass}/**/*.scss`)
    .pipe(globbing({ extensions: ['.scss'] }))
    .pipe(gulpSass({
      includePaths: [path.resolve(__dirname, 'node_modules')]
    }).on('error', gulpSass.logError))
    .pipe(postcss(selectedProcessors, { syntax: require('postcss-scss') }))
    .pipe(gulp.dest(`./${paths.css}`));
}

function watchFiles() {
  gulp.watch(`${paths.sass}/**/*.scss`, sassTask);
}

const watch = gulp.series(sassTask, watchFiles);
const compile = gulp.series(sassTask);
const defaultTask = gulp.series(watch);

exports.sass = sassTask;
exports.compile = compile;
exports.build = compile;
exports.watch = watch;
exports.default = defaultTask;
