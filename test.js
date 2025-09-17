// import modules
import { compile } from './lib/tscom.js'

const compileConfig = {
  input: 'app/ts/main.ts',
  dir: 'dist/js',
  format: 'es',
  minify: false,
  sourcemap: true,
  tsOptions: {
    compilerOptions: { target: 'ES6' },
    include: ['app/ts/**/*'],
  },
}

// scripts task
export async function scripts() {
  await compile(compileConfig)
}

// run scripts
await scripts()
