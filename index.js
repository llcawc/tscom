// import modules
import compile from './plugin/tscom.js'

// scripts task
async function scripts() {
  return compile({
    input: 'src/ts/main.ts',
    dir: 'dist/js',
    format: 'umd',
    minify: false,
    sourcemap: true,
    tsOptions: {
      compilerOptions: { lib: ['ESNext', 'DOM', 'DOM.Iterable'], target: 'ESNext' },
      include: ['src/ts/*'],
    },
  })
}

// run scripts
const list = await scripts()

// list of compiled files
console.log(list)
