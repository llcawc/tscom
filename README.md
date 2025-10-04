# tscom

> gulp plugin and asynchronous function for javascript or typescript transformation - bundles, compiles and minimizes ".js" and ".ts" files with Rollup, Babel and Rollup plugins.
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

### 1. For gulp use `tscom`

```js
// import modules
import { dest, src } from "gulp";
import { tscom } from "tscom";

// scripts task
function js() {
  return src(["app/scripts/*.js", "!app/scripts/main.js"], { sourcemaps: true })
    .pipe(tscom())
    .pipe(dest("dist/js", { sourcemaps: true })); // for inline source map
}

// export
export { js };
```

`tscom` options:

```js
{
  format: "amd" | "cjs" | "es" | "iife" | "umd"; // format output files (default: 'iife')
  minify: boolean | undefined; // (default: true) minify output files
  tsOptions: RollupTypescriptOptions | undefined; // tsconfig for typescript files
}
```

### 2. For api use `compile`

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

`compile` options:

```js
{
input: string | string[]; // input file or files (glob patterns)
dir: string | undefined; // folder for output files (default: same folder)
format: 'amd' | 'cjs' | 'es' | 'iife' | 'umd'; // format output files (default: 'iife')
minify: boolean | undefined; // (default: true) minify output files
sourcemap: boolean | 'inline' | 'hidden' | undefined; // (default: false) include sourcemap files
tsOptions: RollupTypescriptOptions | undefined; // tsconfig for typescript files
}
```

default tsOptions:

```js
{
compilerOptions: { lib: ['ESNext', 'DOM', 'DOM.Iterable'], target: 'ESNext' },
include: [dirname(filename) + '/**/*'],
}

```

---

MIT License ©2025 by pasmurno from [llcawc](https://github.com/llcawc). Made with <span style="color:red;">❤</span> to beautiful architecture.
