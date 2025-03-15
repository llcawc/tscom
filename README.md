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
    src: string; // input file include "imports" instructions
    dist: string; // output bundele file
    minify: boolean | undefined; // (default: true) minify output file
    sourcemap: boolean | undefined; // (default: false) include sourcemap file
    tsOptions: RollupTypescriptOptions | undefined; // tsconfig for typescript files
}

default tsOptions:
  {
    compilerOptions: { lib: ['ESNext', 'DOM', 'DOM.Iterable'], target: 'ESNext' },
    include: [dirname(src) + '/**/*'],
  }
```

sample:

```
import compile from 'tscom'

// scripts task
function scripts() {
  return compile({
    src: 'src/scripts/main.ts',
    dist: 'dist/js/main.min.js',
  })
}

export { scripts }
```

---

MIT License ©2025 by pasmurno from [llcawc](https://github.com/llcawc). Made with <span style="color:red;">❤</span> to beautiful architecture.
