'use strict';

const gulp = require('gulp');
const sassModule = require('sass');
const gulpSass = require('gulp-sass')(sassModule);
const globbing = require('gulp-css-globbing');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const csswring = require('csswring');

const sass = gulpSass(sassModule);

const themes_folder = 'web/themes';

const path = {
  theme: `${themes_folder}/beaker/`,
  sass: 'sass',
  css: 'css',
  js: 'js',
  img: 'images',
  tpl: 'templates',
  fonts: 'fonts'
};

path.sass = path.theme + path.sass;
path.css = path.theme + path.css;
path.js = path.theme + path.js;
path.img = path.theme + path.img;
path.tpl = path.theme + path.tpl;
path.fonts = path.theme + path.fonts;

function sassTask() {
  const selectedProcessors = [
    autoprefixer({ overrideBrowserslist: ['last 10 versions'] }),
    csswring
  ];

  return gulp
    .src(`${path.sass}/**/*.scss`)
    .pipe(globbing({ extensions: ['.scss'] }))
    .pipe(postcss(selectedProcessors, { syntax: require('postcss-scss') }))
    .pipe(gulp.dest(`./${path.css}`));
}

function watchFiles() {
  gulp.watch(`${path.sass}/**/*.scss`, sassTask);
}

const watch = gulp.series(sassTask, watchFiles);
const compile = gulp.series(sassTask);
const defaultTask = gulp.series(watch);

exports.sass = sassTask;
exports.compile = compile;
exports.build = compile;
exports.watch = watch;
exports.default = defaultTask;
