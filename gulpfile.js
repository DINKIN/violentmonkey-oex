const gulp = require('gulp');
const concat = require('gulp-concat');
const replace = require('gulp-replace');
const footer = require('gulp-footer');
const merge2 = require('merge2');
const cssnano = require('gulp-cssnano');
const gulpFilter = require('gulp-filter');
const eslint = require('gulp-eslint');
const svgSprite = require('gulp-svg-sprite');
const templateCache = require('./scripts/templateCache');
const i18n = require('./scripts/i18n');
const pkg = require('./package.json');

const paths = {
  cache: 'src/cache.js',
  manifest: 'src/config.xml',
  templates: 'src/**/templates/*.html',
  jsBg: 'src/background/**/*.js',
  jsOptions: 'src/options/**/*.js',
  jsPopup: 'src/popup/**/*.js',
  jsInjected: 'src/includes/*.js',
  locales: [
    'src/**/*.js',
    'src/**/*.html',
    'src/**/*.json',
    'src/**/*.yml',
  ],
  copy: [
    'src/*.js',
    '!src/cache.js',
    'src/public/**',
    'src/*.html',
    'src/*/*.html',
    'src/*/*.css',
  ],
};

gulp.task('watch', () => {
  gulp.watch([].concat(paths.cache, paths.templates), ['templates']);
  gulp.watch(paths.jsBg, ['js-bg']);
  gulp.watch(paths.jsOptions, ['js-options']);
  gulp.watch(paths.jsPopup, ['js-popup']);
  gulp.watch(paths.jsInjected, ['js-injected']);
  gulp.watch(paths.copy, ['copy-files']);
  gulp.watch(paths.locales, ['copy-i18n']);
});

gulp.task('eslint', () => (
  gulp.src([
    'src/**/*.js',
    '!src/public/**',
  ])
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError())
));

gulp.task('templates', () => (
  merge2([
    gulp.src(paths.cache),
    gulp.src(paths.templates).pipe(templateCache()),
  ]).pipe(concat('cache.js'))
  .pipe(gulp.dest('dist'))
));

gulp.task('js-bg', () => (
  gulp.src(paths.jsBg)
  .pipe(concat('background/app.js'))
  .pipe(footer(';define.use("app");'))
  .pipe(replace('__VERSION__', pkg.version))
  .pipe(gulp.dest('dist'))
));

gulp.task('js-options', () => (
  gulp.src(paths.jsOptions)
  .pipe(concat('options/app.js'))
  .pipe(footer(';define.use("app");'))
  .pipe(gulp.dest('dist'))
));

gulp.task('js-popup', () => (
  gulp.src(paths.jsPopup)
  .pipe(concat('popup/app.js'))
  .pipe(footer(';define.use("app");'))
  .pipe(gulp.dest('dist'))
));

gulp.task('js-injected', () => (
  gulp.src(paths.jsInjected)
  .pipe(concat('includes/injected.js'))
  .pipe(gulp.dest('dist'))
));

gulp.task('manifest', () => (
  gulp.src(paths.manifest, {base: 'src'})
  .pipe(replace('__VERSION__', pkg.version))
  .pipe(gulp.dest('dist'))
));

gulp.task('copy-files', () => {
  const cssFilter = gulpFilter(['**/*.css'], {restore: true});
  return gulp.src(paths.copy)
  .pipe(cssFilter)
  .pipe(cssnano({
    zindex: false,
  }))
  .pipe(cssFilter.restore)
  .pipe(gulp.dest('dist/'));
});

gulp.task('copy-i18n', () => (
  gulp.src(paths.locales)
  .pipe(i18n.extract({
    base: 'src',
    prefix: 'locales',
    touchedOnly: true,
    useDefaultLang: true,
    markUntouched: false,
    extension: '.json',
  }))
  .pipe(gulp.dest('dist'))
));

gulp.task('svg', () => (
  gulp.src('icons/*.svg')
  .pipe(svgSprite({
    mode: {
      symbol: {
        dest: '',
        sprite: 'sprite.svg',
      },
    },
  }))
  .pipe(gulp.dest('dist/images'))
));

gulp.task('build', [
  'templates',
  'js-bg',
  'js-options',
  'js-popup',
  'js-injected',
  'manifest',
  'copy-files',
  'copy-i18n',
  'svg',
]);

gulp.task('i18n', () => (
  gulp.src(paths.locales)
  .pipe(i18n.extract({
    base: 'src',
    prefix: 'locales',
    touchedOnly: false,
    useDefaultLang: false,
    markUntouched: true,
    extension: '.yml',
  }))
  .pipe(gulp.dest('src'))
));

gulp.task('default', ['build']);
