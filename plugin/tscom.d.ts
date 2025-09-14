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
export default function tscom({ input, dir, format, minify, sourcemap, tsOptions, }: {
    input: string | string[];
    dir: string | undefined;
    format: 'amd' | 'cjs' | 'es' | 'iife' | 'umd';
    minify: boolean | undefined;
    sourcemap: boolean | undefined;
    tsOptions: RollupTypescriptOptions | undefined;
}): Promise<string[]>;
