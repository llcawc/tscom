# tscom

> Gulp plugin and asynchronous function for JavaScript or TypeScript transformation – bundles, compiles and minifies `.js`, `.mjs`, `.cjs`, `.jsx`, `.ts`, `.tsx` files with Rolldown.
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
function script() {
  return src(["app/scripts/*.js", "!app/scripts/test.js"], { sourcemaps: true })
    .pipe(tscom({ format: "module", minify: { format: { comments: "some" } } }))
    .pipe(dest("dist/js", { sourcemaps: true })); // for inline source map
  // or { sourcemaps: '.' } for outline source map
}

// export
export { script };
```

### `tscom` options

```js
{
  format?: "es" | "cjs" | "iife" | "umd" | "module" | "esm" | "commonjs" | undefined;
  // output format (default: 'esm')
  minify?: boolean | import('terser').MinifyOptions | undefined;
  // minify output using Terser (default: true)
  // When `true`, default Terser options are applied.
  // When an object, it is passed directly to Terser.
  // When `false`, minification is skipped.
}
```

**Note:** The `tscom` plugin uses [Terser](https://github.com/terser/terser) for minification. If `minify` is `true` or an options object, the bundled code is passed through Terser after Rolldown bundling. Source maps are preserved when `sourcemaps` are enabled in the Gulp pipeline.

## 2. Standalone API `compile`

```js
// import modules
import { compile } from "tscom";

const compileConfig = {
  input: "app/ts/main.ts",
  dir: "dist/js",
  format: "umd",
  minify: false,
  sourcemap: "inline",
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
  minify?: boolean | "dce-only" | undefined;
  // minify output using Rolldown's built‑in minifier (default: true)
  // When `true`, Rolldown performs full minification.
  // When `"dce-only"`, only dead‑code elimination is applied.
  // When `false`, minification is disabled.
  sourcemap?: boolean | "inline" | "hidden" | undefined;
  // generate source maps (default: false)
}
```

**Note:** The `compile` function relies on Rolldown's internal minification, which is different from the Terser‑based minification used by the `tscom` plugin. Rolldown's minifier is faster but may produce slightly different output.

## Supported file extensions

The plugin accepts the following extensions:

- `.js`, `.mjs`, `.cjs`, `.jsx`
- `.ts`, `.tsx`

All other extensions will cause an error.

## Minification behavior

| Function  | Minification engine | Default | Options                             |
| --------- | ------------------- | ------- | ----------------------------------- |
| `tscom`   | Terser              | `true`  | `boolean` or `terser.MinifyOptions` |
| `compile` | Rolldown built‑in   | `true`  | `boolean` or `"dce-only"`           |

If you need fine‑grained control over minification (e.g., preserving certain comments, mangling options), use the `tscom` plugin with a Terser options object. For faster builds with basic minification, use `compile` with `minify: true` or `"dce-only"`.

---

MIT License © 2026 by pasmurno from [llcawc](https://github.com/llcawc).
Made with <span style="color:red;">❤</span> for beautiful architecture.
