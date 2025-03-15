import { RollupTypescriptOptions } from '@rollup/plugin-typescript';
export default function tscom({ src, dist, minify, sourcemap, tsOptions, }: {
    src: string;
    dist: string;
    minify: boolean | undefined;
    sourcemap: boolean | undefined;
    tsOptions: RollupTypescriptOptions | undefined;
}): Promise<void>;
