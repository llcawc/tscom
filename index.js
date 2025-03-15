// import modules
import compile from './plugin/tscom.js'

// scripts task
async function scripts() {
  await compile({
    src: 'src/ts/main.ts',
    dist: 'dist/js/main.min.js',
    minify: false,
    sourcemap: true,
    tsOptions: {
      compilerOptions: { lib: ['ESNext', 'DOM', 'DOM.Iterable'], target: 'ESNext' },
      include: ['src/ts/*'],
    },
  })
}

await scripts()
