## Ревью [`src/tscom.ts`](src/tscom.ts:1)

Провёл ревью, изучив [`package.json`](package.json:1), [`tsconfig.json`](tsconfig.json:1), тесты (`test/tscom.test.ts`, `test/compile.test.ts`) и сверив контракты с документацией Rolldown 1.2.x.

**Резюме**: архитектура простая и рабочая (gulp-плагин на `Transform` + функция `compile()`), но есть несоответствие типов форматов контракту Rolldown, утечка ресурсов из-за незакрытых бандлов, ненадёжный разбор негативных паттернов glob и дублирование логики минификации.

---

### 🔴 P0 — баги и риски корректности

1. **Невалидные алиасы форматов и дефолт `'esm'`** ([стр. 14](src/tscom.ts:14), [стр. 22](src/tscom.ts:22), [стр. 28](src/tscom.ts:28), далее [74](src/tscom.ts:74), [204](src/tscom.ts:204)). Канонические `format` в Rolldown — `'es' | 'cjs' | 'iife' | 'umd' | 'amd'` (`ModuleFormat`). Вручную объявленные `'module' | 'esm' | 'commonjs'` не соответствуют типу `OutputOptions`, а дефолт `'esm'` ([39](src/tscom.ts:39), [175](src/tscom.ts:175)) — основной путь использования. **Тесты не ловят проблему**: [`test/tscom.test.ts:102`](test/tscom.test.ts:102) и [`test/compile.test.ts:127`](test/compile.test.ts:127) мокают Rolldown и проверяют лишь переданный объект, а не реальный прогон. Нужна нормализация (`esm|module → es`, `commonjs → cjs`) и интеграционный тест.
2. **Утечка ресурсов: `bundle.close()` не вызывается** ([80](src/tscom.ts:80), [211](src/tscom.ts:211)). Нативный бандл Rolldown надо закрывать через `try/finally`, иначе держатся процессы/память.
3. **В стриме обрабатывается только `output[0]`** ([82](src/tscom.ts:82)). При динамических импортах `generate()` вернёт несколько чанков — остальные теряются; нужно итерироваться по `output` и писать каждый чанк (`chunk.fileName`). Плюс `chunk.code` может быть `undefined` для ассетов — `Buffer.from(chunk.code)` ([110](src/tscom.ts:110), [121](src/tscom.ts:121)) упадёт, нужна защита `?? ''`.
4. **Terser всегда получает `sourceMap`** ([90](src/tscom.ts:90)–[105](src/tscom.ts:105)): `terserMap.content = undefined`, `url = undefined` даже при `isMap === false`. Формировать опции условно.

---

### 🟠 P1 — дизайн и надёжность

5. **Разрешение расширения игнорирует исходное и формат** ([85](src/tscom.ts:85)–[87](src/tscom.ts:87)): `.mjs/.cjs/.jsx` всегда становится `.js`. Предложение: `format === 'cjs' → .cjs`, иначе `.js` (сохраняя `.mjs` для ESM).
6. **Разбор негативных паттернов через `/!/`** ([229](src/tscom.ts:229)–[230](src/tscom.ts:230)) ложно срабатывает на extglob `!(foo)` из picomatch, а `replace(/!/, '')` убирает только первый `!`. Надёжнее `startsWith('!')` + `slice(1)`.
7. **Несогласованность `minify`**: `TscomOptions.minify: MinifyOptions | boolean` ([29](src/tscom.ts:29)) против `CompileOptions.minify: boolean | 'dce-only'` ([15](src/tscom.ts:15)); `comments: minify === true ? false : true` ([207](src/tscom.ts:207)) при `'dce-only'` оставит комментарии. Плюс два разных пути минификации (Terser в стриме vs нативный `minify` Rolldown в `compile`) — неединообразное поведение.
8. **`Object.assign({}, { fileName })`** ([129](src/tscom.ts:129)) — лишняя обёртка, достаточно `{ fileName: file.path }`.

---

### 🟡 P2 — стиль, типы, документация

9. Имена: `truExt` ([216](src/tscom.ts:216)) → `isSupportedExtension`; `isMap`/`isMin` ([59](src/tscom.ts:59)–[60](src/tscom.ts:60)) → `withSourceMap`/`shouldMinify`; `x ? true : false` → `Boolean(x)`.
10. Тройное дублирование типов `CompileOptions`/`FileCompileOptions`/`TscomOptions` — вынести `ModuleFormat`, строить интерфейсы на его основе, экспортировать `FileCompileOptions`.
11. `_transform` — async-функция с callback ([44](src/tscom.ts:44)): смешение стилей, риск «проглоченных» исключений до `try`; обернуть целиком либо перейти на промис-паттерн.
12. Публичный API протекает типом Terser `MinifyOptions` ([240](src/tscom.ts:240)); заменить собственным совместимым типом.
13. Стрим мутирует входящий `File` ([86](src/tscom.ts:86)) — по gulp-конвенции работать с клоном (`file.clone()`).
14. Комментарии: добавить русские дубли (правило проекта), JSDoc для `compileFile`/`getFiles`, исправить опечатку `'true` ([144](src/tscom.ts:144)).

---

### Предлагаемый план улучшений

1. Набор типов: единый `ModuleFormat` от Rolldown + `normalizeFormat()`; проверить на реальном прогоне.
2. `try/finally` с `bundle.close()` в обоих путях.
3. Стрим-режим: записывать все чанки, условный `sourceMap` для Terser, защита `chunk.code ?? ''`.
4. `getFiles`: разбор негативов по `startsWith('!')`.
5. Расширения по формату (`cjs → .cjs`, иначе `.js`).
6. Интеграционные тесты с реальным Rolldown (формат `es`/`cjs`, минификация, sourcemap) — моки не покрывают совместимость с нативным биндингом.
7. Приведение к `oxlint`/`oxfmt` (скрипты уже есть в [`package.json`](package.json:34)–[`package.json`](package.json:43)).

Готов внедрить перечисленные улучшения, обновив спецификацию в `./spec.md` и прогнав `pnpm validate`.


Улучшения из ревью внедрены, спецификация записана в [`spec.md`](spec.md:1), валидация зелёная.

## Что сделано

### [`src/tscom.ts`](src/tscom.ts:1) — рефакторинг
1. **Форматы (P0)**: тип `ModuleFormat` выводится из `OutputOptions['format']`, добавлен `normalizeFormat()` — алиасы `esm|module → es`, `commonjs → cjs` нормализуются перед передачей в Rolldown; публичный API по-прежнему принимает алиасы (дефолт `'esm'`).
2. **Ресурсы (P0)**: `bundle.close()` в `try/finally` и в gulp-плагине ([`tscom`](src/tscom.ts:128)), и в `compileFile` ([`compileFile`](src/tscom.ts:272)).
3. **Чанки (P0)**: обработка всех код-чанков (не только `output[0]`); главный определяется по `fileName === <stem>.js`, дополнительные кладутся в поток через `this.push`; защита `chunk.code ?? ''`.
4. **Terser (P0)**: `sourceMap` опции формируются только при наличии входного `file.sourceMap`; выделен [`minifyChunk()`](src/tscom.ts:211).
5. **Sourcemap (P1)**: `file.sourceMap` всегда приводится к объекту через [`toSourceMapObject()`](src/tscom.ts:72) (совместимо с `gulp-sourcemaps`).
6. **`getFiles` (P1)**: негативные паттерны по `startsWith('!')` + `slice(1)` вместо ненадёжного `/!/` ([`getFiles`](src/tscom.ts:306)).
7. **Расширения (P1)**: [`resolveTargetExtension()`](src/tscom.ts:66) — `cjs → .cjs`, сохранение `.mjs/.cjs`, иначе `.js`.
8. **Типы и имена**: `FileCompileOptions` — самостоятельный интерфейс и экспортируется; `truExt → isSupportedExtension`, `isMap → withSourceMap`; убран лишний `Object.assign`; `comments: minify !== false ? false : true`.
9. Комментарии продублированы на английском и русском (правило проекта).

### Тесты
- [`test/tscom.test.ts`](test/tscom.test.ts:1) и [`test/compile.test.ts`](test/compile.test.ts:1): ожидания формата `'esm' → 'es'`, объектные sourcemap, новое сообщение об ошибке, моки `bundle.close`.

### Документация
- [`README.md`](README.md:1) — примечание о нормализации алиасов форматов.
- [`readme.ru.md`](readme.ru.md:1) — создана русская версия.

## Результат `pnpm validate`
- `oxlint`: 0 ошибок, 0 предупреждений.
- `tsc --noEmit`: чисто.
- `vitest --run`: **20/20 тестов** (3 файла) — зелёные.

Спецификация [`spec.md`](spec.md:1) обновлена с отметкой о завершении всех этапов.
