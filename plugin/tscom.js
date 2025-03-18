// import modules
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { glob } from 'glob';
import { basename, dirname, extname } from 'node:path';
import { rollup } from 'rollup';
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
export default async function tscom({ input, dir, format, minify, sourcemap, tsOptions, }) {
    try {
        // Устанавливает переменную inputFiles в значение свойства input объекта параметров.
        const inputFiles = input;
        // Если inputFiles является массивом, фильтрует список файлов, которые нужно игнорировать, и удаляет символ ! из имен файлов.
        let ignoreList = undefined;
        if (Array.isArray(inputFiles)) {
            ignoreList = inputFiles.filter((file) => /!/.test(file));
            ignoreList = ignoreList.map((item) => item.replace(/!/, ''));
        }
        // Получает список путей к файлам, которые нужно скомпилировать, с помощью функции glob.
        const pathList = await glob(inputFiles, { ignore: ignoreList });
        // Создает промис, который выполняет функцию compile для каждого пути в списке путей.
        const list = Promise.all(pathList.map((path) => compile(path)));
        // Функция compile
        async function compile(filename) {
            // Устанавливает плагины для входных файлов.
            let inputPlugins = [resolve(), commonjs({ include: 'node_modules/**' }), babel({ babelHelpers: 'bundled' })];
            // Если имя файла заканчивается на .ts, добавляет плагин TypeScript к списку плагинов.
            if (/\.ts$/i.test(filename)) {
                inputPlugins = [
                    typescript(tsOptions ?? {
                        compilerOptions: { lib: ['ESNext', 'DOM', 'DOM.Iterable'], target: 'ESNext' },
                        include: [dirname(filename) + '/**/*'],
                    }),
                    ...inputPlugins,
                ];
            }
            // Устанавливает опции для входных файлов.
            const inputOptions = {
                input: filename,
                plugins: [...inputPlugins],
            };
            // Устанавливает плагины для выходных файлов.
            let outputPlugins = [];
            if (minify ?? true) {
                outputPlugins = [terser({ format: { comments: false } })];
            }
            // Устанавливает опции для выходных файлов.
            const outputOptions = {
                dir: dir ?? dirname(filename),
                format: format ?? 'iife',
                name: basename(filename, extname(filename)),
                plugins: [...outputPlugins],
                sourcemap: sourcemap ?? false,
            };
            // Создает бандл с помощью функции rollup и записывает его в выходную директорию.
            const bundle = await rollup(inputOptions);
            await bundle.write(outputOptions);
            // Возвращает имя файла.
            return filename;
        }
        // Возвращает промис, который разрешается в массив имен скомпилированных файлов.
        return list;
    }
    catch (error) {
        // Сообщает об ошибке
        console.error(error);
    }
}
