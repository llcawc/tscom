# tscom

> Gulp-плагин и асинхронная функция для трансформации JavaScript и TypeScript — сборка, компиляция и минификация файлов `.js`, `.mjs`, `.cjs`, `.jsx`, `.ts`, `.tsx` с помощью Rolldown.
> Может использоваться как Gulp-плагин (поток) или как самостоятельная функция компиляции.

## Установка

```bash
npm add -D tscom
```

## 1. Gulp-плагин `tscom`

```js
// импорт модулей
import { dest, src } from "gulp";
import { tscom } from "tscom";

// задача scripts
function script() {
  return src(["app/scripts/*.js", "!app/scripts/test.js"], { sourcemaps: true })
    .pipe(tscom({ format: "module", minify: { format: { comments: "some" } } }))
    .pipe(dest("dist/js", { sourcemaps: true })); // для inline source map
  // или { sourcemaps: '.' } для отдельных source map
}

// экспорт
export { script };
```

### Опции `tscom`

```js
{
  format?: "es" | "cjs" | "iife" | "umd" | "module" | "esm" | "commonjs" | undefined;
  // формат вывода (по умолчанию: 'esm')
  minify?: boolean | import('terser').MinifyOptions | undefined;
  // минификация вывода с помощью Terser (по умолчанию: true)
  // При `true` применяются стандартные опции Terser.
  // При передаче объекта он передаётся в Terser напрямую.
  // При `false` минификация отключена.
}
```

**Примечание:** плагин `tscom` использует [Terser](https://github.com/terser/terser) для минификации. Если `minify` равен `true` или является объектом опций, собранный код пропускается через Terser после сборки Rolldown. Source map сохраняются, когда в пайплайне Gulp включены `sourcemaps`.

**Примечание:** алиасы форматов `esm` / `module` нормализуются в `es`, а `commonjs` — в `cjs` перед передачей опций в Rolldown.

## 2. Автономный API `compile`

```js
// импорт модулей
import { compile } from "tscom";

const compileConfig = {
  input: "app/ts/main.ts",
  dir: "dist/js",
  format: "umd",
  minify: false,
  sourcemap: "inline",
};

// задача scripts
export async function scripts() {
  await compile(compileConfig);
}

// запуск scripts
await scripts();
```

### Опции `compile`

```js
{
  input: string | string[];          // входной файл(ы) — поддерживаются glob-паттерны
  dir?: string | undefined;          // папка вывода (по умолчанию: 'dist')
  format?: "es" | "cjs" | "iife" | "umd" | "module" | "esm" | "commonjs" | undefined;
  // формат вывода (по умолчанию: 'esm')
  minify?: boolean | "dce-only" | undefined;
  // минификация вывода встроенным минификатором Rolldown (по умолчанию: true)
  // При `true` Rolldown выполняет полную минификацию.
  // При `"dce-only"` применяется только удаление мёртвого кода.
  // При `false` минификация отключена.
  sourcemap?: boolean | "inline" | "hidden" | undefined;
  // генерация source map (по умолчанию: false)
}
```

**Примечание:** функция `compile` использует встроенную минификацию Rolldown, которая отличается от минификации Terser в плагине `tscom`. Минификатор Rolldown быстрее, но может давать несколько иной результат.

## Поддерживаемые расширения файлов

Плагин принимает следующие расширения:

- `.js`, `.mjs`, `.cjs`, `.jsx`
- `.ts`, `.tsx`

Любые другие расширения вызовут ошибку.

## Поведение минификации

| Функция  | Движок минификации | По умолчанию | Опции                                 |
| -------- | ------------------ | ------------ | ------------------------------------- |
| `tscom`  | Terser             | `true`       | `boolean` или `terser.MinifyOptions`  |
| `compile`| Встроенный Rolldown| `true`       | `boolean` или `"dce-only"`            |

Если нужна тонкая настройка минификации (например, сохранение определённых комментариев, опции переименования), используйте плагин `tscom` с объектом опций Terser. Для более быстрой сборки с базовой минификацией используйте `compile` с `minify: true` или `"dce-only"`.

---

Лицензия MIT © 2026 pasmurno из [llcawc](https://github.com/llcawc).
Сделано с <span style="color:red;">❤</span> для красивой архитектуры.
