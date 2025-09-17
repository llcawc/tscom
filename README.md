# tscom

> gulp plugin or asynchronous function for javascript or typescript transformation - bundles, compiles and minimizes ".js" and ".ts" files with Rollup, Babel and Rollup plugins.
> this can be used as a galp plugin with return or with callback

Rollup and babel plugins used:

- "@babel/core",
- "@babel/preset-env",
- "@rollup/plugin-babel",
- "@rollup/plugin-commonjs",
- "@rollup/plugin-node-resolve",
- "@rollup/plugin-terser",
- "@rollup/plugin-typescript",

install:

```
npm add -D tscom
```

options:

```
{
    input: string | string[]; // input file or files (glob patterns)
    dir: string | undefined;  // folder for output files (default: same folder)
    format: 'amd' | 'cjs' | 'es' | 'iife' | 'umd'; // format output files (default: 'iife')
    minify: boolean | undefined; // (default: true) minify output files
    sourcemap: boolean | undefined; // (default: false) include sourcemap files
    tsOptions: RollupTypescriptOptions | undefined; // tsconfig for typescript files
}

default tsOptions:
  {
    compilerOptions: { lib: ['ESNext', 'DOM', 'DOM.Iterable'], target: 'ESNext' },
    include: [dirname(filename) + '/**/*'],
  }
```

sample:

```js
// import modules
import { compile } from "tscom";

const compileConfig = {
  input: "app/ts/main.ts",
  dir: "dist/js",
  format: "es",
  minify: false,
  sourcemap: true,
  tsOptions: {
    compilerOptions: { target: "ES6" },
    include: ["app/ts/**/*"],
  },
};

// scripts task
export async function scripts() {
  await compile(compileConfig);
}

// run scripts
await scripts();
```

---

MIT License ©2025 by pasmurno from [llcawc](https://github.com/llcawc). Made with <span style="color:red;">❤</span> to beautiful architecture.
