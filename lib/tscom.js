// import modules
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { glob } from 'glob';
import { Buffer } from 'node:buffer';
import { basename, dirname, extname } from 'node:path';
import { Transform } from 'node:stream';
import PluginError from 'plugin-error';
import { rollup } from 'rollup';
// Define options
function defineOptions({ filename, // file name for compile
dir = undefined, // output dir for bundle.write
format = 'iife', // format output files (default: 'iife')
minify = true, // (default: true) minify output files
sourcemap = false, // may be need source map
tsOptions = undefined, // tsconfig for typescript files
 }) {
    // Installs plugins for input files.
    let inputPlugins = [resolve(), commonjs({ include: 'node_modules/**' }), babel({ babelHelpers: 'bundled' })];
    // Typescript options default
    tsOptions = tsOptions ?? {
        compilerOptions: { lib: ['ESNext', 'DOM', 'DOM.Iterable'], target: 'ESNext' },
        include: [dirname(filename) + '/**/*'],
    };
    // If the file name ends in .ts, adds the TypeScript plugin to the list of plugins.
    if (/\.ts$/i.test(filename)) {
        inputPlugins = [typescript(tsOptions), ...inputPlugins];
    }
    // Sets options for input files.
    const inputOptions = {
        input: filename,
        plugins: [...inputPlugins],
    };
    // Sets options for output files.
    const outputOptions = {
        dir,
        format,
        name: basename(filename, extname(filename)),
        sourcemap,
        plugins: minify ? [terser({ format: { comments: false } })] : [],
    };
    return { inputOptions, outputOptions };
}
/**
 * Gulp plugin for compiles, bandles and minify JavaScript or TypeScript files using Rollup.
 * @param format - The output format for the compiled files.
 * @param minify - Whether to minify the compiled files.
 * @param tsOptions - Options for the TypeScript compiler.
 * @returns - Transform stream
 */
function tscom({ format = 'iife', // format output files (default: 'iife')
minify = true, // (default: true) minify output files
tsOptions = undefined, // tsconfig for typescript files
 } = {}) {
    const stream = new Transform({ objectMode: true });
    stream._transform = async function (file, _enc, callback) {
        // Skip null files
        if (file.isNull()) {
            return callback(null, file);
        }
        // Reject streams
        if (file.isStream()) {
            callback(new PluginError('tscom', 'Streams are not supported'));
            return;
        }
        // run compiler
        if (file.isBuffer()) {
            const filename = file.path;
            const dir = undefined;
            const sourcemap = file.sourceMap ? 'hidden' : false;
            try {
                // Check extersion
                if (!/\.js$|\.ts$/i.test(filename)) {
                    throw new Error('Only file extensions ".js" or ".ts" are supported!');
                }
                // Define options
                const { inputOptions, outputOptions } = defineOptions({
                    filename,
                    dir,
                    format,
                    minify,
                    sourcemap,
                    tsOptions,
                });
                // Creates a bundle using the rollup function and writes it to the file.
                const bundle = await rollup(inputOptions);
                const { output } = await bundle.generate(outputOptions);
                const chunk = output[0];
                // If the file name ends in .ts, rename extname file
                if (/\.ts$/i.test(filename)) {
                    file.extname = '.js';
                }
                file.contents = Buffer.from(chunk.code);
                if (sourcemap && chunk.map) {
                    file.sourceMap = chunk.map;
                }
                callback(null, file);
            }
            catch (err) {
                const opts = Object.assign({}, { fileName: file.path });
                const error = new PluginError('tscom', err, opts);
                callback(error);
                throw error;
            }
        }
    };
    return stream;
}
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
async function compile({ input, dir, format, minify, sourcemap, tsOptions, }) {
    try {
        // Gets a list of files to compile
        const pathList = await getFiles(input);
        // Creates a promise that executes the compile function for each path in the path list.
        Promise.all(pathList.map((path) => compileFile(path, dir, format, minify, sourcemap, tsOptions)));
    }
    catch (error) {
        // Reports an error
        console.error(error);
    }
}
// The compile file function
async function compileFile(filename, dir, format, minify, sourcemap, tsOptions) {
    try {
        // Check extersion
        if (!/\.js$|\.ts$/i.test(filename)) {
            throw new Error(`Only file extensions ".js" or ".ts" are supported!\nDetails:\n  filename: ${filename}`);
        }
        // Define options
        const { inputOptions, outputOptions } = defineOptions({
            filename,
            dir: dir ?? dirname(filename),
            format,
            minify,
            sourcemap,
            tsOptions,
        });
        // Creates a bundle using the rollup function and writes it to the output directory.
        const bundle = await rollup(inputOptions);
        await bundle.write(outputOptions);
        return;
    }
    catch (error) {
        console.error(error);
    }
}
// Gets a list of paths to files to compile
async function getFiles(inputFiles) {
    let ignoreList = undefined;
    if (Array.isArray(inputFiles)) {
        // Filters the list of files to ignore and removes the ! character from file names.
        ignoreList = inputFiles.filter((file) => /!/.test(file)).map((item) => item.replace(/!/, ''));
    }
    // Gets a list of paths to files to compile using the glob function.
    return await glob(inputFiles, { ignore: ignoreList });
}
// export
export { compile, tscom };
