# Спецификация: рефакторинг пакета tscom (src/tscom.ts)

## Цель

Устранить проблемы, выявленные при ревью `src/tscom.ts`, без изменения публичного контракта API (за исключением задокументированных улучшений), и прогнать `pnpm validate`.

## Задачи и статус

- [x] Ревью `src/tscom.ts` — выполнено (P0/P1/P2).
- [x] Нормализация форматов `esm|module → es`, `commonjs → cjs` (тип `InputFormat` + `normalizeFormat`).
- [x] `try/finally` + `bundle.close()` в gulp-плагине и в `compile()`.
- [x] Стрим-режим: обработка всех сгенерированных чанков (не только `output[0]`), защита от `chunk.code === undefined`, условный `sourceMap` для Terser.
- [x] `getFiles`: разбор негативных паттернов по `startsWith('!')` (вместо `/!/`).
- [x] Расширение выходного файла по формату (`cjs → .cjs`, ESM для `.mjs`, иначе `.js`).
- [x] Имена: `truExt → isSupportedExtension`, `isMap → withSourceMap`, `isMin → shouldMinify`, `Boolean()` вместо тернарников, упрощение `Object.assign`.
- [x] Единый тип `ModuleFormat` на основе канонических форматов Rolldown (`NonNullable<OutputOptions['format']>`); экспорт `FileCompileOptions`.
- [x] `comments: minify !== false ? false : true` в `compile()` (для `'dce-only'` тоже).
- [x] Обновить юнит-тесты под новое поведение (формат `'es'`, объектные sourcemap, новое сообщение об ошибке, моки `bundle.close`).
- [x] Обновить `README.md` (EN) и создать `readme.ru.md` (RU).
- [x] Прогнать `pnpm validate` (oxlint + tsc --noEmit + vitest) — зелёный статус: oxlint 0 ошибок, tsc чисто, 20/20 тестов.

## Ключевые решения

1. **Форматы**: публичный API принимает пользовательские алиасы (`esm`, `module`, `commonjs`), в Rolldown передаётся каноническое значение (`es`, `cjs`). Дефолт `format = 'esm'` сохраняется на уровне публичного API, но пакетно нормализуется.
2. **Sourcemap**: в стриме `file.sourceMap` всегда приводится к объекту через `JSON.parse` (при строковом входе), что совместимо с `gulp-sourcemaps`; при ошибке парсинга — fallback на `chunk.map`.
3. **Чанки**: `output` фильтруется по `type !== 'asset'`; главный чанк определяется по `fileName === <stem>.js`, остальные кладутся в поток через `this.push` с путём из `chunk.fileName`.
4. **Минификация**: Terser применяется к каждому чанку; `sourceMap` опции включаются только при наличии входного `file.sourceMap`.
5. **Ошибки**: сообщение о неподдерживаемых расширениях расширено до `".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx"`; тесты обновляются соответственно.

## Критерии приёмки

- `pnpm validate` проходит без ошибок.
- Все существующие + обновлённые тесты зелёные.
- Публичный экспорт: `compile`, `tscom`, `getFiles`, типы `OutputOptions`, `InputOptions`, `MinifyOptions`, `CompileOptions`, `TscomOptions`, `FileCompileOptions`.

## Ход выполнения

- Этап 1 (анализ тестов): завершён.
- Этап 2 (переписывание `src/tscom.ts`): завершён.
- Этап 3 (обновление тестов): завершён.
- Этап 4 (документация): завершён.
- Этап 5 (валидация): завершён — `pnpm validate` зелёный (oxlint 0 ошибок, `tsc --noEmit` чисто, vitest 20/20).
