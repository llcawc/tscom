import type File from 'vinyl'

import { Buffer } from 'node:buffer'
import { Transform } from 'node:stream'

import { glob } from 'glob'
import PluginError from 'plugin-error'
import { rolldown } from 'rolldown'

type Format = 'es' | 'cjs' | 'iife' | 'umd' | 'module' | 'esm' | 'commonjs' | undefined
type Minify = 'dce-only' | boolean | undefined
type SourceMap = boolean | 'inline' | 'hidden' | undefined

interface CompileOptions {
  input: string | string[]
  dir?: string | undefined
  format?: Format
  minify?: Minify
  sourcemap?: SourceMap
}

interface FileCompileOptions {
  filename: string
  dir?: string | undefined
  format?: Format
  minify?: Minify
  sourcemap?: SourceMap
}

interface DefineOptionsResult {
  inputOptions: {
    input: string
  }
  outputOptions: {
    dir?: string | undefined
    format?: Format
    sourcemap?: SourceMap
    minify?: Minify
  }
}

interface TscomOptions {
  tsconfig?: string | undefined
  format?: Format
  minify?: Minify
}

// Define options
function defineOptions({
  filename, // file name for compile
  dir = 'dist', // output dir for bundle.write
  format = 'esm', // format output files (default: 'esm')
  minify = 'dce-only', // (default: 'dce-only') minify output files
  sourcemap = false, // may be need source map
}: FileCompileOptions): DefineOptionsResult {
  // Sets options for input files.
  const inputOptions = {
    input: filename,
  }

  // Sets options for output files.
  const outputOptions = {
    dir,
    format,
    sourcemap,
    minify,
  }

  return { inputOptions, outputOptions }
}

/**
 * Gulp plugin for compiles, bundles and minify JavaScript or TypeScript files using Rolldown.
 * @param format - The output format for the compiled files.
 * @param minify - Whether to minify the compiled files.
 * @returns - Transform stream
 */
function tscom({
  format = 'esm', // format output files (default: 'esm')
  minify = 'dce-only', //  minify output files (default: 'dce-only')
}: TscomOptions = {}): Transform {
  const stream = new Transform({ objectMode: true })

  stream._transform = async function (file: File, _enc, callback) {
    // Skip null files
    if (file.isNull()) {
      return callback(null, file)
    }

    // Reject streams
    if (file.isStream()) {
      callback(new PluginError('tscom', 'Streams are not supported'))
      return
    }

    // run compiler
    if (file.isBuffer()) {
      const filename = file.path
      const dir = undefined
      const sourcemap = file.sourceMap ? 'hidden' : false

      try {
        // Check extension
        if (!/\.js$|\.ts$/i.test(filename)) {
          throw new Error('Only file extensions ".js" or ".ts" are supported!')
        }
        // Define options
        const { inputOptions, outputOptions } = defineOptions({
          filename,
          dir,
          format,
          minify,
          sourcemap,
        })

        // Creates a bundle using the rollup function and writes it to the file.
        const bundle = await rolldown(inputOptions)
        const { output } = await bundle.generate(outputOptions)
        const chunk = output[0]

        // If the file name ends in .ts, rename extname file
        if (/\.ts$/i.test(filename)) {
          file.extname = '.js'
        }

        file.contents = Buffer.from(chunk.code)
        if (sourcemap && chunk.map) {
          file.sourceMap = chunk.map
        }

        callback(null, file)
      } catch (err) {
        const opts = Object.assign({}, { fileName: file.path })
        const error = new PluginError('tscom', err as string, opts)
        callback(error)
      }
    }
  }
  return stream
}

/**
 * Compiles, bundles and minify JavaScript or TypeScript files using Rolldown.
 * @param input - The glob input file or files to compile.
 * @param dir - The output directory for the compiled files.
 * @param format - The output format for the compiled files.
 * @param minify - Whether to minify the compiled files.
 * @param sourcemap - Whether to generate source maps for the compiled files.
 * @returns - Promise<void>
 *
 * @example
 *
 * ```js
 * // import modules
 * import { compile } from "tscom";
 *
 * const compileConfig = {
 *   input: ["src/ts/*.*", "!src/ts/test.js"], // glob input
 *   dir: "dist/js",
 *   format: "es",
 *   minify: false,
 *   sourcemap: true,
 * };
 *
 * // scripts task
 * export async function scripts() {
 *   await compile(compileConfig);
 * }
 *
 * // run scripts
 * await scripts();
 * ```
 */

async function compile({
  input, // glob input file or files to compile
  dir = 'dist', // output dir for bundle.write (default: 'dist')
  format = 'esm', // format output files (default: 'esm')
  minify = 'dce-only', // minify output files (default: 'dce-only')
  sourcemap = false, // may be need source map (default: false)
}: CompileOptions): Promise<void> {
  // Gets a list of files to compile
  const pathList = await getFiles(input)
  // Check input files
  if (!input || pathList.length === 0) {
    throw new Error('Not found input file/s')
  }
  // Creates a promise that executes the compile function for each path in the path list.
  await Promise.all(pathList.map((filename) => compileFile({ filename, dir, format, minify, sourcemap })))
}

// The compile file function
async function compileFile({ filename, dir, format, minify, sourcemap }: FileCompileOptions) {
  // Check extension
  if (!/\.js$|\.ts$/i.test(filename)) {
    throw new Error(`Only file extensions ".js" or ".ts" are supported!\nDetails:\n  filename: ${filename}`)
  }

  // Define options
  const { inputOptions, outputOptions } = defineOptions({
    filename,
    dir,
    format,
    minify,
    sourcemap,
  })

  // Creates a bundle using the rollup function and writes it to the output directory.
  const bundle = await rolldown(inputOptions)
  await bundle.write(outputOptions)
}

// Gets a list of paths to files to compile
async function getFiles(inputFiles: string | string[]): Promise<string[]> {
  let patterns: string | string[] = inputFiles
  let ignoreList: string[] | undefined = undefined
  if (Array.isArray(inputFiles)) {
    // Separate patterns and ignore patterns
    const positivePatterns = inputFiles.filter((file) => !/!/.test(file))
    const negativePatterns = inputFiles.filter((file) => /!/.test(file)).map((item) => item.replace(/!/, ''))
    patterns = positivePatterns.length > 0 ? positivePatterns : []
    ignoreList = negativePatterns.length > 0 ? negativePatterns : undefined
  }
  // Gets a list of paths to files to compile using the glob function.
  return await glob(patterns, { ignore: ignoreList })
}

// export
export { compile, tscom, defineOptions, getFiles }
export type { CompileOptions, FileCompileOptions, DefineOptionsResult, TscomOptions }
