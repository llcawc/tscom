import { RollupTypescriptOptions } from '@rollup/plugin-typescript';
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
 * import compile from 'tscom'
 * // scripts task
 * async function scripts() {
 *   return compile({
 *     input: 'src/ts/main.ts',
 *     dir: 'dist/js',
 *     format: 'umd',
 *     minify: false,
 *     sourcemap: true,
 *     tsOptions: {
 *       compilerOptions: { lib: ['ESNext', 'DOM', 'DOM.Iterable'], target: 'ESNext' },
 *       include: ['src/ts/*'],
 *     },
 *   })
 * }
 * // run scripts
 * const list = await scripts()
 * // list of compiled files
 * console.log(list)
 * ```
 */
export default function tscom({ input, dir, format, minify, sourcemap, tsOptions, }: {
    input: string | string[];
    dir: string | undefined;
    format: 'amd' | 'cjs' | 'es' | 'iife' | 'umd';
    minify: boolean | undefined;
    sourcemap: boolean | undefined;
    tsOptions: RollupTypescriptOptions | undefined;
}): Promise<string[] | undefined>;
