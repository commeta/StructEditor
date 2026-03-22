# Change Log

## 22.03.2026

FIX #1  <small>, <big>, <address>, <pre>, <summary> добавлены в LEAF_CONTAINERS / TEXT_TAGS — больше нет "неподдерживаемого тега". Расширен ATTR_MAP до полного HTML5 (video,audio,iframe,embed, object,source,track,time,data,form,button).

FIX #2 Тег <a> получает тип 'both': textarea для текста ссылки + поля href / target (select) / rel. Оверлей и buildRow учитывают это. Новая функция buildAttrInput() рисует <select> для target.

FIX #3  fillCards() — добавлена карточка «Прочее» для orphan-элементов (элементов вне section/header/…). В walkMark() <a> с текстом всегда получает тип 'both', а не 'attrs'. 
