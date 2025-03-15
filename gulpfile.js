// import modules
import compile from './plugin/tscom.js'

import { deleteAsync } from 'del'
import { src, dest, series } from 'gulp'
import licss, { rename } from 'licss'

// variables & paths
const purge = {
  content: [
    'src/*.html',
    'src/ts/**/*.ts',
    'src/scripts/**/*.js',
    'node_modules/bootstrap/js/dist/dom/*.js',
    'node_modules/bootstrap/js/dist/dropdown.js',
  ],
  safelist: [/show/],
  keyframes: true,
}

// styles task
async function styles() {
  return src(['src/styles/main.scss'], { sourcemaps: false })
    .pipe(licss({ minify: true, purgeOptions: purge }))
    .pipe(rename({ suffix: '.min', extname: '.css' }))
    .pipe(dest('dist/css', { sourcemaps: '.' }))
}

// scripts task
function scripts() {
  return compile({
    src: 'src/scripts/main.js',
    dist: 'dist/js/main.min.js',
  })
}

// clean task
function clean() {
  return deleteAsync(['dist'])
}

// copy task
function copy() {
  return src(['src/*.html']).pipe(dest('dist'))
}

// assets task
function images() {
  return src(['src/assets/images/**/*.{ico,jpg,png,svg}'], { encoding: false }).pipe(dest('dist/images'))
}
function fonts() {
  return src(
    [
      'src/assets/fonts/bootstrap-icons/*.woff*',
      'src/assets/fonts/Inter/*.woff*',
      'src/assets/fonts/JetBrains/*.woff*',
    ],
    {
      encoding: false,
    }
  ).pipe(dest('dist/fonts'))
}

// export
export { clean, copy, images, fonts, styles, scripts }
export const assets = series(clean, copy, images, fonts)
export const build = series(assets, styles, scripts)
