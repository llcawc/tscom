import type File from 'vinyl'

import { Buffer } from 'node:buffer'
import { Transform } from 'node:stream'

import PluginError from 'plugin-error'
import { type OutputOptions, type InputOptions, rolldown } from 'rolldown'
import { type MinifyOptions, minify as terserMinify } from 'terser'
import { glob } from 'tinyglobby'

interface CompileOptions {
  input: string | string[]
  dir?: string | undefined
  format?: 'es' | 'cjs' | 'iife' | 'umd' | 'module' | 'esm' | 'commonjs' | undefined
  minify?: boolean | 'dce-only' | undefined
  sourcemap?: boolean | 'inline' | 'hidden' | undefined
}

interface FileCompileOptions {
  filename: string
  dir?: string | undefined
  format?: 'es' | 'cjs' | 'iife' | 'umd' | 'module' | 'esm' | 'commonjs' | undefined
  minify?: boolean | 'dce-only' | undefined
  sourcemap?: boolean | 'inline' | 'hidden' | undefined
}

interface TscomOptions {
  format?: 'es' | 'cjs' | 'iife' | 'umd' | 'module' | 'esm' | 'commonjs' | undefined
  minify?: MinifyOptions | boolean | undefined
}

/**
 * Gulp plugin for compiles, bundles and minify JavaScript or TypeScript files using Rolldown.
 * @param format - The output format for the compiled files. (default: 'esm')
 * @param minify - Whether to minify the compiled files. (default: true)
 * @returns Transform stream
 */
function tscom({
  format = 'esm', // format output files (default: 'esm')
  minify = true, //  minify output files (default: true)
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
      const isMap = file.sourceMap ? true : false
      const isMin = minify ? true : false

      try {
        // Check extension
        if (!truExt(filename)) {
          throw new Error('Only file extensions ".js" or ".ts" are supported!')
        }

        // Define input options
        const inputOptions: InputOptions = {
          input: filename,
        }
        // Define output options
        const outputOptions: OutputOptions = {
          format,
          minify: false,
          sourcemap: isMap ? 'hidden' : false,
        }

        // Creates a bundle using the rollup function and writes it to the file.
        const bundle = await rolldown(inputOptions)
        const { output } = await bundle.generate(outputOptions)
        const chunk = output[0]

        // If the file name ends not in .js, rename extname file
        if (!/\.js$/i.test(filename)) {
          file.extname = '.js'
        }

        // Terser Map Options
        const terserMap = {
          content: chunk.map ? JSON.stringify(chunk.map) : undefined,
          url: undefined,
        }

        // Terser Options
        const minOptions: MinifyOptions =
          typeof minify === 'object'
            ? {
                ...minify,
                sourceMap: terserMap,
              }
            : {
                sourceMap: terserMap,
                format: { comments: false },
              }

        // Terser Minify is need
        if (isMin) {
          const { code, map } = await terserMinify(chunk.code, minOptions)
          file.contents = Buffer.from(code ?? chunk.code)
          if (isMap && map) {
            try {
              file.sourceMap = JSON.parse(typeof map === 'string' ? map : JSON.stringify(map))
            } catch {
              if (chunk.map) {
                file.sourceMap = chunk.map
              }
            }
          }
        } else {
          file.contents = Buffer.from(chunk.code)
          if (isMap && chunk.map) {
            file.sourceMap = chunk.map
          }
        }

        callback(null, file)
      } catch (err) {
        const opts = Object.assign({}, { fileName: file.path })
        const error = new PluginError('tscom', err instanceof Error ? err.message : String(err), opts)

        callback(error)
      }
    }
  }
  return stream
}

/**
 * Compiles, bundles and minify JavaScript or TypeScript files using Rolldown.
 * @param input - The glob input file or files to compile.
 * @param dir - The output directory for the compiled files. (default: 'dist')
 * @param format - The output format for the compiled files. (default: 'esm')
 * @param minify - Whether to minify the compiled files. (default: 'true)
 * @param sourcemap - Whether to generate source maps for the compiled files. (default: false)
 * @returns Promise void
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
  minify = true, // minify output files (default: 'true)
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
  if (!truExt(filename)) {
    throw new Error(`Only file extensions ".js" or ".ts" are supported!\nDetails:\n  filename: ${filename}`)
  }

  // Define options
  const inputOptions: InputOptions = {
    input: filename,
  }

  // Define output options
  const outputOptions: OutputOptions = {
    dir,
    format,
    minify,
    sourcemap,
    comments: minify === true ? false : true,
  }

  // Creates a bundle using the rollup function and writes it to the output directory.
  const bundle = await rolldown(inputOptions)
  await bundle.write(outputOptions)
}

// Check extension
function truExt(filename: string): boolean {
  if (/\.js$|\.mjs$|\.cjs$|\.jsx$|\.ts$|\.tsx$/i.test(filename)) {
    return true
  }
  return false
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
export { compile, tscom, getFiles }
export type { OutputOptions, InputOptions, MinifyOptions, CompileOptions, TscomOptions }
