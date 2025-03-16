// import modules
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { glob } from 'glob';
import { basename, dirname, extname } from 'node:path';
import { rollup } from 'rollup';
export default async function tscom({ input, dir, format, minify, sourcemap, tsOptions, }) {
    try {
        const src = input;
        let ignorList = undefined;
        if (typeof src === 'object') {
            ignorList = src.filter((file) => /!/.test(file));
            ignorList = ignorList.map((item) => item.replace(/!/, ''));
        }
        const pathList = await glob(src, { ignore: ignorList });
        pathList.forEach((path) => compile(path));
        async function compile(filename) {
            const inputOptions = {
                input: filename,
                plugins: [
                    typescript(tsOptions ?? {
                        compilerOptions: { lib: ['ESNext', 'DOM', 'DOM.Iterable'], target: 'ESNext' },
                        include: [dirname(filename) + '/**/*'],
                    }),
                    resolve(),
                    commonjs({ include: 'node_modules/**' }),
                    babel({ babelHelpers: 'bundled' }),
                ],
            };
            const outputOptions = {
                dir: dir ?? dirname(filename),
                format: format ?? 'iife',
                name: basename(filename, extname(filename)),
                plugins: [(minify ?? true) ? terser({ format: { comments: false } }) : false],
                sourcemap: sourcemap ?? false,
            };
            const bundle = await rollup(inputOptions);
            await bundle.write(outputOptions);
        }
    }
    catch (error) {
        console.error(error);
    }
}
