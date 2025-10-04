import { RollupTypescriptOptions } from '@rollup/plugin-typescript';
import { Transform } from 'node:stream';
/**
 * Gulp plugin for compiles, bandles and minify JavaScript or TypeScript files using Rollup.
 * @param format - The output format for the compiled files.
 * @param minify - Whether to minify the compiled files.
 * @param tsOptions - Options for the TypeScript compiler.
 * @returns - Transform stream
 */
declare function tscom({ format, // format output files (default: 'iife')
minify, // (default: true) minify output files
tsOptions, }?: {
    format?: 'amd' | 'cjs' | 'es' | 'iife' | 'umd' | undefined;
    minify?: boolean | undefined;
    tsOptions?: RollupTypescriptOptions | undefined;
}): Transform;
/**
 * Compiles, bandles and minify JavaScript or TypeScript files using Rollup.
 * @param input - The glob input file or files to compile.
 * @param dir - The output directory for the compiled files.
 * @param format - The output format for the compiled files.
 * @param minify - Whether to minify the compiled files.
 * @param sourcemap - Whether to generate source maps for the compiled files.
 * @param tsOptions - Options for the TypeScript compiler.
 * @returns - Promise<void>
 *
 * @example
 *
 * ```js
 * // import modules
 * import { compile } from "tscom";
 *
 * const compileConfig = {
 *   input: ["app/ts/*.ts", "!app/ts/main.ts"], // glob input
 *   dir: "dist/js",
 *   format: "es",
 *   minify: false,
 *   sourcemap: true,
 *   tsOptions: {
 *     compilerOptions: { target: "ES6" },
 *     include: ["app/ts/*"],
 *   },
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
declare function compile({ input, dir, format, minify, sourcemap, tsOptions, }: {
    input: string | string[];
    dir: string | undefined;
    format: 'amd' | 'cjs' | 'es' | 'iife' | 'umd';
    minify: boolean | undefined;
    sourcemap: boolean | 'inline' | 'hidden' | undefined;
    tsOptions: RollupTypescriptOptions | undefined;
}): Promise<void>;
export { compile, tscom };
