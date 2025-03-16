import { RollupTypescriptOptions } from '@rollup/plugin-typescript';
export default function tscom({ input, dir, format, minify, sourcemap, tsOptions, }: {
    input: string | string[];
    dir: string | undefined;
    format: 'amd' | 'cjs' | 'es' | 'iife' | 'umd';
    minify: boolean | undefined;
    sourcemap: boolean | undefined;
    tsOptions: RollupTypescriptOptions | undefined;
}): Promise<void>;
