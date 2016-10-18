# textSelector

jQuery плагин

используется для произведения действий над выделенным текстом.

пример использования

```
$('[data-search]').textSelect({
    container: '[data-text]',
    buttonType: 'popup',
    clickAction: function (q) {
        $('[data-search-field]').val(q).closest('form').find('button[type=submit]').click();
    }
});
```

поддерживает 2 типа кнопок 'popup' и 'single'

container - контейнер где расположен текст

clickAction - что делать с текстом
