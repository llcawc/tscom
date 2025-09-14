// import modules
import { babel } from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript, { RollupTypescriptOptions } from '@rollup/plugin-typescript'
import { glob } from 'glob'
import { basename, dirname, extname } from 'node:path'
import { OutputOptions, Plugin, rollup } from 'rollup'

/**
 * Compiles, bandles and minify JavaScript or TypeScript files using Rollup.
 * @param input - The input file or files to compile.
 * @param dir - The output directory for the compiled files.
 * @param format - The output format for the compiled files.
 * @param minify - Whether to minify the compiled files.
 * @param sourcemap - Whether to generate source maps for the compiled files.
 * @param tsOptions - Options for the TypeScript compiler.
 * @returns A promise that resolves to an array of the compiled file names.
 *
 * @example
 *
 * ```js
 * // import modules
 * import process from 'node:process'
 * import compile from './plugin/tscom.js'
 *
 * const compileConfig = {
 *   input: 'src/ts/main.ts',
 *   dir: 'dist/js',
 *   format: 'es',
 *   minify: false,
 *   sourcemap: true,
 *   tsOptions: {
 *     compilerOptions: { target: 'ESNext', lib: ['ESNext', 'DOM', 'DOM.Iterable'] },
 *     include: ['src/ts/*'],
 *   },
 * }
 *
 * // scripts task
 * export async function scripts() {
 *   try {
 *     const result = await compile(compileConfig)
 *     return result
 *   } catch (error) {
 *     console.error('❌ Compilation error:', error.message)
 *     throw error // Throwing an exception for external handling
 *   }
 * }
 *
 * // run scripts
 * try {
 *   const list = await scripts()
 *
 *   // Проверка результата
 *   if (Array.isArray(list)) {
 *     console.log('✅ Compiled files:', list.join('\n'))
 *   } else if (list === null) {
 *     console.warn('⚠️ Compilation completed without results')
 *   } else {
 *     console.warn('⚠️ Invalid compilation result format')
 *   }
 * } catch {
 *    process.exit(1) // Force termination on critical error
 * }
 * ```
 */

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
    // Sets the inputFiles variable to the value of the input property of the options object.
    const inputFiles = input

    // If inputFiles is an array, filters the list of files to ignore and removes the ! character from file names.
    let ignoreList: string[] | undefined = undefined
    if (Array.isArray(inputFiles)) {
      ignoreList = inputFiles.filter((file) => /!/.test(file))
      ignoreList = ignoreList.map((item) => item.replace(/!/, ''))
    }

    // Gets a list of paths to files to compile using the glob function.
    const pathList = await glob(inputFiles, { ignore: ignoreList })

    // Creates a promise that executes the compile function for each path in the path list.
    const list = Promise.all(pathList.map((path) => compile(path)))

    // The compile function
    async function compile(filename: string) {
      // Installs plugins for input files.
      let inputPlugins = [resolve(), commonjs({ include: 'node_modules/**' }), babel({ babelHelpers: 'bundled' })]

      // If the file name ends in .ts, adds the TypeScript plugin to the list of plugins.
      if (/\.ts$/i.test(filename)) {
        inputPlugins = [
          typescript(
            tsOptions ?? {
              compilerOptions: { lib: ['ESNext', 'DOM', 'DOM.Iterable'], target: 'ESNext' },
              include: [dirname(filename) + '/**/*'],
            }
          ),
          ...inputPlugins,
        ]
      }
      // Sets options for input files.
      const inputOptions = {
        input: filename,
        plugins: [...inputPlugins],
      }

      // Installs plugins for output files.
      let outputPlugins: Plugin<unknown>[] = []
      if (minify ?? true) {
        outputPlugins = [terser({ format: { comments: false } })]
      }
      // Sets options for output files.
      const outputOptions: OutputOptions = {
        dir: dir ?? dirname(filename),
        format: format ?? 'iife',
        name: basename(filename, extname(filename)),
        plugins: [...outputPlugins],
        sourcemap: sourcemap ?? false,
      }

      // Creates a bundle using the rollup function and writes it to the output directory.
      const bundle = await rollup(inputOptions)
      await bundle.write(outputOptions)

      // Returns the file name.
      return filename
    }
    // Returns a promise that resolves to an array of compiled file names.
    return list
  } catch (error) {
    // Reports an error
    console.error(error)
    throw error
  }
}
