// import modules
import { babel } from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript, { RollupTypescriptOptions } from '@rollup/plugin-typescript'
import { glob } from 'glob'
import { basename, dirname, extname } from 'node:path'
import { rollup, OutputOptions } from 'rollup'

export default async function tscom({
  input,
  dir,
  format,
  minify,
  sourcemap,
  tsOptions,
}: {
  input: string | string[]
  dir: string | undefined
  format: 'amd' | 'cjs' | 'es' | 'iife' | 'umd'
  minify: boolean | undefined
  sourcemap: boolean | undefined
  tsOptions: RollupTypescriptOptions | undefined
}) {
  try {
    const src = input
    let ignorList: string[] | undefined = undefined

    if (typeof src === 'object') {
      ignorList = src.filter((file) => /!/.test(file))
      ignorList = ignorList.map((item) => item.replace(/!/, ''))
    }

    const pathList = await glob(src, { ignore: ignorList })
    pathList.forEach((path) => compile(path))

    async function compile(filename: string) {
      const inputOptions = {
        input: filename,
        plugins: [
          typescript(
            tsOptions ?? {
              compilerOptions: { lib: ['ESNext', 'DOM', 'DOM.Iterable'], target: 'ESNext' },
              include: [dirname(filename) + '/**/*'],
            }
          ),
          resolve(),
          commonjs({ include: 'node_modules/**' }),
          babel({ babelHelpers: 'bundled' }),
        ],
      }

      const outputOptions: OutputOptions = {
        dir: dir ?? dirname(filename),
        format: format ?? 'iife',
        name: basename(filename, extname(filename)),
        plugins: [(minify ?? true) ? terser({ format: { comments: false } }) : false],
        sourcemap: sourcemap ?? false,
      }

      const bundle = await rollup(inputOptions)
      await bundle.write(outputOptions)
    }
  } catch (error) {
    console.error(error)
  }
}
