import { RollupTypescriptOptions } from '@rollup/plugin-typescript';
/**
 * Compiles, bandles and minify JavaScript or TypeScript files using Rollup.
 * @param input - The input file or files to compile.
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
 *   input: "app/ts/main.ts",
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
    sourcemap: boolean | undefined;
    tsOptions: RollupTypescriptOptions | undefined;
}): Promise<void>;
export { compile };
