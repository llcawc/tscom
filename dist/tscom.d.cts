import { Transform } from "node:stream";
import { InputOptions, OutputOptions } from "rolldown";
import { MinifyOptions } from "terser";

//#region src/tscom.d.ts
interface CompileOptions {
  input: string | string[];
  dir?: string | undefined;
  format?: 'es' | 'cjs' | 'iife' | 'umd' | 'module' | 'esm' | 'commonjs' | undefined;
  minify?: boolean | 'dce-only' | undefined;
  sourcemap?: boolean | 'inline' | 'hidden' | undefined;
}
interface TscomOptions {
  format?: 'es' | 'cjs' | 'iife' | 'umd' | 'module' | 'esm' | 'commonjs' | undefined;
  minify?: MinifyOptions | boolean | undefined;
}
/**
 * Gulp plugin for compiles, bundles and minify JavaScript or TypeScript files using Rolldown.
 * @param format - The output format for the compiled files. (default: 'esm')
 * @param minify - Whether to minify the compiled files. (default: true)
 * @returns Transform stream
 */
declare function tscom({
  format,
  // format output files (default: 'esm')
  minify
}?: TscomOptions): Transform;
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
declare function compile({
  input,
  // glob input file or files to compile
  dir,
  // output dir for bundle.write (default: 'dist')
  format,
  // format output files (default: 'esm')
  minify,
  // minify output files (default: 'true)
  sourcemap
}: CompileOptions): Promise<void>;
declare function getFiles(inputFiles: string | string[]): Promise<string[]>;
//#endregion
export { type CompileOptions, type InputOptions, type MinifyOptions, type OutputOptions, type TscomOptions, compile, getFiles, tscom };