import type File from 'vinyl'

import { Buffer } from 'node:buffer'
import { basename, dirname, resolve } from 'node:path'
import { Transform } from 'node:stream'

import PluginError from 'plugin-error'
import { type InputOptions, type OutputOptions, rolldown } from 'rolldown'
import { type MinifyOptions, minify as terserMinify } from 'terser'
import { glob } from 'tinyglobby'

/**
 * Canonical output formats supported by Rolldown.
 * Канонические форматы вывода, поддерживаемые Rolldown.
 */
type ModuleFormat = NonNullable<OutputOptions['format']>

/**
 * User-friendly format aliases accepted by the public API.
 * Дружественные алиасы форматов, принимаемые публичным API.
 */
type InputFormat = ModuleFormat | 'esm' | 'module' | 'commonjs'

interface CompileOptions {
  input: string | string[]
  dir?: string | undefined
  format?: InputFormat | undefined
  minify?: boolean | 'dce-only' | undefined
  sourcemap?: boolean | 'inline' | 'hidden' | undefined
}

interface FileCompileOptions {
  filename: string
  dir?: string | undefined
  format?: InputFormat | undefined
  minify?: boolean | 'dce-only' | undefined
  sourcemap?: boolean | 'inline' | 'hidden' | undefined
}

interface TscomOptions {
  format?: InputFormat | undefined
  minify?: MinifyOptions | boolean | undefined
}

/** Alias map from user-friendly formats to Rolldown canonical formats. Карта алиасов форматов. */
const FORMAT_ALIASES: Record<string, ModuleFormat> = {
  esm: 'es',
  module: 'es',
  commonjs: 'cjs',
}

/** Convert user-friendly format alias to a canonical Rolldown format. Нормализация формата. */
function normalizeFormat(format: InputFormat): ModuleFormat {
  return FORMAT_ALIASES[format] ?? format
}

/** Check whether the file extension is supported. Проверка поддержки расширения файла. */
function isSupportedExtension(filename: string): boolean {
  return /\.(js|mjs|cjs|jsx|ts|tsx)$/i.test(filename)
}

/**
 * Resolve the target extension for an entry file according to the output format.
 * Определение целевого расширения файла по формату вывода.
 */
function resolveTargetExtension(filename: string, format: ModuleFormat): string {
  if (format === 'cjs') {
    return '.cjs'
  }
  if (/\.mjs$/i.test(filename)) {
    return '.mjs'
  }
  if (/\.cjs$/i.test(filename)) {
    return '.cjs'
  }
  return '.js'
}

/** Normalize a source map value to an object. Приведение source map к объекту. */
function toSourceMapObject(map: unknown): unknown {
  if (typeof map === 'string') {
    try {
      return JSON.parse(map)
    } catch {
      return undefined
    }
  }
  return map
}

/**
 * Gulp plugin that compiles, bundles and minifies JavaScript or TypeScript files using Rolldown.
 * @param format - Output format for compiled files. (default: 'esm')
 * @param minify - Whether to minify compiled files. (default: true)
 * @returns Transform stream
 */
function tscom({ format = 'esm', minify = true }: TscomOptions = {}): Transform {
  const stream = new Transform({ objectMode: true })

  stream._transform = async function (file: File, _enc, callback) {
    // Skip null files // Пропускаем null-файлы
    if (file.isNull()) {
      callback(null, file)
      return
    }

    // Reject streams // Отклоняем потоки
    if (file.isStream()) {
      callback(new PluginError('tscom', 'Streams are not supported'))
      return
    }

    // Skip non-buffer files // Пропускаем не-buffer файлы
    if (!file.isBuffer()) {
      callback(null, file)
      return
    }

    try {
      const filename = file.path
      const withSourceMap = Boolean(file.sourceMap)
      const shouldMinify = minify !== false
      const normalizedFormat = normalizeFormat(format)

      // Check extension // Проверка расширения
      if (!isSupportedExtension(filename)) {
        throw new Error('Only file extensions ".js", ".mjs", ".cjs", ".jsx", ".ts" or ".tsx" are supported!')
      }

      const bundle = await rolldown({ input: filename })

      try {
        const { output } = await bundle.generate({
          format: normalizedFormat,
          minify: false,
          sourcemap: withSourceMap ? 'hidden' : false,
        })

        // Filter out assets, keep code chunks // Отбираем только код-чанки
        const chunks = output as Array<{ type: string; fileName?: string; code?: string; map?: unknown }>
        const codeChunks = chunks.filter((chunk) => chunk.type !== 'asset')
        const stem = basename(filename).replace(/\.[^.]+$/, '')
        const entryChunk = codeChunks.find((chunk) => chunk.fileName === `${stem}.js`) ?? codeChunks[0]

        if (!entryChunk) {
          throw new Error('No output chunks generated')
        }

        // Process every chunk (entry + code-split chunks) // Обрабатываем каждый чанк
        for (const chunk of codeChunks) {
          const { code, map } = await minifyChunk(
            chunk.code ?? '', // truncate into valid code / защита от undefined code
            chunk.map,
            withSourceMap,
            shouldMinify,
            minify,
          )
          const outputFile = chunk === entryChunk ? file : cloneChunkFile(file, chunk.fileName)
          outputFile.contents = Buffer.from(code)

          if (withSourceMap) {
            outputFile.sourceMap = toSourceMapObject(map) ?? toSourceMapObject(chunk.map)
          }

          if (chunk === entryChunk) {
            // Rename entry file extension according to output format // Расширение по формату
            const targetExt = resolveTargetExtension(filename, normalizedFormat)
            if (outputFile.extname !== targetExt) {
              outputFile.extname = targetExt
            }
            callback(null, outputFile)
          } else {
            this.push(outputFile)
          }
        }
      } finally {
        // Always release Rolldown resources // Всегда освобождаем ресурсы Rolldown
        await bundle.close()
      }
    } catch (err) {
      callback(new PluginError('tscom', err instanceof Error ? err.message : String(err), { fileName: file.path }))
    }
  }
  return stream
}

/** Minify chunk code with Terser (when enabled). Минификация кода чанка через Terser. */
async function minifyChunk(
  code: string,
  chunkMap: unknown,
  withSourceMap: boolean,
  shouldMinify: boolean,
  minify: TscomOptions['minify'],
): Promise<{ code: string; map?: unknown }> {
  if (!shouldMinify) {
    return { code, map: chunkMap }
  }

  const minOptions: MinifyOptions = typeof minify === 'object' ? { ...minify } : { format: { comments: false } }

  // Enable Terser source map only when input file provides one
  // Включаем source map в Terser только при наличии карты у входного файла
  if (withSourceMap) {
    minOptions.sourceMap = {
      content: chunkMap ? JSON.stringify(chunkMap) : undefined,
      url: undefined,
    }
  }

  const { code: minCode, map } = await terserMinify(code, minOptions)
  return { code: minCode ?? code, map: withSourceMap ? map : undefined }
}

/** Clone a File for an additional output chunk. Клонирование File для дополнительного чанка. */
function cloneChunkFile(file: File, fileName: string | undefined): File {
  const clone = file.clone({ contents: false })
  clone.path = resolve(dirname(file.path), fileName ?? basename(file.path))
  clone.sourceMap = undefined
  return clone
}

/**
 * Compiles, bundles and minifies JavaScript or TypeScript files using Rolldown.
 * @param input - The glob input file or files to compile.
 * @param dir - The output directory for compiled files. (default: 'dist')
 * @param format - The output format for compiled files. (default: 'esm')
 * @param minify - Whether to minify compiled files. (default: true)
 * @param sourcemap - Whether to generate source maps. (default: false)
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
  input, // glob input file or files to compile // glob-паттерн входных файлов
  dir = 'dist', // output dir for bundle.write (default: 'dist') // папка вывода
  format = 'esm', // format output files (default: 'esm') // формат вывода
  minify = true, // minify output files (default: true) // минифицировать вывод
  sourcemap = false, // may be need source map (default: false) // генерировать source map
}: CompileOptions): Promise<void> {
  // Gets a list of files to compile // Получаем список файлов
  const pathList = await getFiles(input)

  // Check input files // Проверка входных файлов
  if (pathList.length === 0) {
    throw new Error('Not found input file/s')
  }

  // Compiles every file concurrently // Компилируем файлы параллельно
  await Promise.all(pathList.map((filename) => compileFile({ filename, dir, format, minify, sourcemap })))
}

/** Compile a single file with Rolldown. Компиляция одного файла через Rolldown. */
async function compileFile({
  filename,
  dir = 'dist',
  format = 'esm',
  minify = true,
  sourcemap = false,
}: FileCompileOptions): Promise<void> {
  // Check extension // Проверка расширения
  if (!isSupportedExtension(filename)) {
    throw new Error(
      `Only file extensions ".js", ".mjs", ".cjs", ".jsx", ".ts" or ".tsx" are supported!\nDetails:\n  filename: ${filename}`,
    )
  }

  const bundle = await rolldown({
    input: filename,
  } satisfies InputOptions)

  try {
    await bundle.write({
      dir,
      format: normalizeFormat(format),
      minify,
      sourcemap,
      comments: minify !== false ? false : true,
    } satisfies OutputOptions)
  } finally {
    // Always release Rolldown resources // Всегда освобождаем ресурсы Rolldown
    await bundle.close()
  }
}

/** Gets a list of paths to files to compile. Получение списка путей файлов для компиляции. */
async function getFiles(inputFiles: string | string[]): Promise<string[]> {
  let patterns: string | string[] = inputFiles
  let ignoreList: string[] | undefined

  if (Array.isArray(inputFiles)) {
    // Separate positive patterns and ignore patterns // Отделяем позитивные и негативные паттерны
    const positivePatterns = inputFiles.filter((file) => !file.startsWith('!'))
    const negativePatterns = inputFiles.filter((file) => file.startsWith('!')).map((item) => item.slice(1))
    patterns = positivePatterns.length > 0 ? positivePatterns : []
    ignoreList = negativePatterns.length > 0 ? negativePatterns : undefined
  }

  // Gets a list of paths to files to compile using the glob function
  // Получаем список путей через glob
  return await glob(patterns, { ignore: ignoreList })
}

// export // экспорт
export { compile, tscom, getFiles }
export type { OutputOptions, InputOptions, MinifyOptions, CompileOptions, FileCompileOptions, TscomOptions, InputFormat }
