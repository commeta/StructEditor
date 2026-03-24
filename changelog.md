# Change Log

## 25.03.2026

1. **`getPathFromAncestor` + `followPath`** — две чистые вспомогательные функции. Строят структурный путь (массив индексов дочерних элементов) от помеченного контейнера до кликнутого элемента в iframe, затем воспроизводят этот путь в `S.doc` — находя соответствующий живой узел для сохранения.

2. **Перехват атомарных элементов в режиме Визуальный:** перед вызовом `openEdit` добавлен второй проход по DOM (от `e.target` вверх до `marked`). Если на пути встречается элемент из `CFG.ATTR_MAP` без собственной маркировки (`a`, `img`, `video`, `iframe`, `embed`…) — строится синтетический `info`-объект и вызывается `showOvl` напрямую с редактором объекта. 


---

## 23.03.2026

Вся логика экспорта обёрнута в if (W._sev8testMode) { ... } — в продакшне этот флаг никогда не выставляется, код мёртв.

Перед загрузкой struct-editor.js выставляется window._sev8testMode = true. Патч дописывает в конец IIFE блок экспорта window._sev8 = { tokenize, detokenize, simpleHash, parseAndMark, serialize, fmtHTML, ... }. Unit-тесты вызывают se().tokenize(...) — это реальная функция из struct-editor.js.

---

## 22.03.2026

FIX #1  
```
<small>, <big>, <address>, <pre>, <summary> добавлены в LEAF_CONTAINERS / TEXT_TAGS — больше нет "неподдерживаемого тега". Расширен ATTR_MAP до полного HTML5 (video,audio,iframe,embed, object,source,track,time,data,form,button).
```

FIX #2 
```
Тег <a> получает тип 'both': textarea для текста ссылки + поля href / target (select) / rel. Оверлей и buildRow учитывают это. Новая функция buildAttrInput() рисует <select> для target.
```

FIX #3
```
fillCards() — добавлена карточка «Прочее» для orphan-элементов (элементов вне section/header/…). В walkMark() <a> с текстом всегда получает тип 'both', а не 'attrs'. 
```
