import { Transform } from "node:stream";

//#region src/tscom.d.ts
type Format = 'es' | 'cjs' | 'iife' | 'umd' | 'module' | 'esm' | 'commonjs' | undefined;
type Minify = 'dce-only' | boolean | undefined;
type SourceMap = boolean | 'inline' | 'hidden' | undefined;
interface CompileOptions {
  input: string | string[];
  dir?: string | undefined;
  format?: Format;
  minify?: Minify;
  sourcemap?: SourceMap;
}
interface FileCompileOptions {
  filename: string;
  dir?: string | undefined;
  format?: Format;
  minify?: Minify;
  sourcemap?: SourceMap;
}
interface DefineOptionsResult {
  inputOptions: {
    input: string;
  };
  outputOptions: {
    dir?: string | undefined;
    format?: Format;
    sourcemap?: SourceMap;
    minify?: Minify;
  };
}
interface TscomOptions {
  tsconfig?: string | undefined;
  format?: Format;
  minify?: Minify;
}
declare function defineOptions({
  filename,
  // file name for compile
  dir,
  // output dir for bundle.write
  format,
  // format output files (default: 'esm')
  minify,
  // (default: 'dce-only') minify output files
  sourcemap
}: FileCompileOptions): DefineOptionsResult;
/**
 * Gulp plugin for compiles, bundles and minify JavaScript or TypeScript files using Rolldown.
 * @param format - The output format for the compiled files.
 * @param minify - Whether to minify the compiled files.
 * @returns - Transform stream
 */
declare function tscom({
  format,
  // format output files (default: 'esm')
  minify
}?: TscomOptions): Transform;
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
declare function compile({
  input,
  // glob input file or files to compile
  dir,
  // output dir for bundle.write (default: 'dist')
  format,
  // format output files (default: 'esm')
  minify,
  // minify output files (default: 'dce-only')
  sourcemap
}: CompileOptions): Promise<void>;
declare function getFiles(inputFiles: string | string[]): Promise<string[]>;
//#endregion
export { type CompileOptions, type DefineOptionsResult, type FileCompileOptions, type TscomOptions, compile, defineOptions, getFiles, tscom };