# tscom

> Gulp plugin and asynchronous function for JavaScript or TypeScript transformation – bundles, compiles and minifies `.js` and `.ts` files with Rolldown.
> Can be used as a Gulp plugin (stream) or as a standalone compile function.

## Install

```bash
npm add -D tscom
```

## 1. Gulp plugin `tscom`

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

### `tscom` options

```js
{
  format?: "es" | "cjs" | "iife" | "umd" | "module" | "esm" | "commonjs" | undefined;
  // output format (default: 'esm')
  minify?: "dce-only" | boolean | undefined;
  // minify output (default: 'dce-only')
}
```

## 2. Standalone API `compile`

```js
// import modules
import { compile } from "tscom";

const compileConfig = {
  input: "app/ts/main.ts",
  dir: "dist/js",
  format: "es",
  minify: false,
  sourcemap: true,
};

// scripts task
export async function scripts() {
  await compile(compileConfig);
}

// run scripts
await scripts();
```

### `compile` options

```js
{
  input: string | string[];          // input file(s) – glob patterns supported
  dir?: string | undefined;          // output folder (default: 'dist')
  format?: "es" | "cjs" | "iife" | "umd" | "module" | "esm" | "commonjs" | undefined;
  // output format (default: 'esm')
  minify?: "dce-only" | boolean | undefined;
  // minify output (default: 'dce-only')
  sourcemap?: boolean | "inline" | "hidden" | undefined;
  // generate source maps (default: false)
}
```

---

MIT License © 2026 by pasmurno from [llcawc](https://github.com/llcawc).
Made with <span style="color:red;">❤</span> for beautiful architecture.
