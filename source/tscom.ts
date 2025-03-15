// import modules
import { babel } from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript, { RollupTypescriptOptions } from '@rollup/plugin-typescript'
import { dirname } from 'node:path'
import { rollup } from 'rollup'

export default async function tscom({
  src,
  dist,
  minify,
  sourcemap,
  tsOptions,
}: {
  src: string
  dist: string
  minify: boolean | undefined
  sourcemap: boolean | undefined
  tsOptions: RollupTypescriptOptions | undefined
}) {
  try {
    const bundle = await rollup({
      input: src,
      plugins: [
        typescript(
          tsOptions ?? {
            compilerOptions: { lib: ['ESNext', 'DOM', 'DOM.Iterable'], target: 'ESNext' },
            include: [dirname(src) + '/**/*'],
          }
        ),
        resolve(),
        commonjs({ include: 'node_modules/**' }),
        babel({ babelHelpers: 'bundled' }),
      ],
    })
    await bundle.write({
      file: dist,
      format: 'iife',
      name: 'main',
      plugins: [(minify ?? true) ? terser({ format: { comments: false } }) : false],
      sourcemap: sourcemap ?? false,
    })
  } catch (e) {
    console.log(e)
  }
}
