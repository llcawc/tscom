// import modules
import { pscss, rename } from '@pasmurno/pscss'
import { deleteAsync } from 'del'
import { dest, parallel, series, src } from 'gulp'
import { compile, tscom } from './lib/tscom.js'

// variables & paths
const purge = {
  content: [
    'app/*.html',
    'app/ts/**/*.ts',
    'app/scripts/**/*.js',
    'node_modules/bootstrap/js/dist/dom/*.js',
    'node_modules/bootstrap/js/dist/dropdown.js',
  ],
  fontFace: true,
  keyframes: true,
  variables: true,
  safelist: [/^show/],
}

// styles task
function styles() {
  return src(['app/styles/style.scss'])
    .pipe(pscss({ purgeCSSoptions: purge }))
    .pipe(rename({ basename: 'main.css' }))
    .pipe(dest('dist/css'))
}

// scripts task
async function scripts() {
  await compile({
    input: ['app/scripts/*.js', '!app/scripts/main.js'],
    dir: 'dist/js',
    format: 'es',
  })
}

function js() {
  return src(['app/scripts/*.jsx', '!app/scripts/main.js'], { sourcemaps: true })
    .pipe(tscom())
    .pipe(dest('dist/js', { sourcemaps: true }))
}

function ts() {
  return src(['app/ts/*.ts', '!app/ts/main.ts'], { sourcemaps: true })
    .pipe(tscom())
    .pipe(dest('dist/js', { sourcemaps: '.' }))
}

// clean task
function clean() {
  return deleteAsync(['dist'])
}

// copy task
function html() {
  return src(['app/*.html']).pipe(dest('dist'))
}

// assets task
function images() {
  return src(['app/images/**/*.*'], { encoding: false }).pipe(dest('dist/images'))
}
function fonts() {
  return src(
    [
      'app/vendor/bootstrap-icons/font/fonts/*.woff*',
      'app/vendor/fonts-libs/Inter/*.woff*',
      'app/vendor/fonts-libs/JetBrains/*.woff*',
    ],
    {
      encoding: false,
    }
  ).pipe(dest('dist/fonts'))
}

// export
export { clean, fonts, html, images, js, scripts, styles, ts }
export const copy = parallel(html, images, fonts)
export const build = series(clean, parallel(copy, styles, ts))
