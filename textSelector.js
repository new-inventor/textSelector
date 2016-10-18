/**
 * Created by george on 06.09.16.
 */

(function ($) {
    var availableButtonTypes = ['single', 'popup'];
    var elements = [];
    var defaultParams = {
        container: '[data-select-container]',
        buttonType: 'single',
        wrapper: 'span',
        wrapperDataAttr: 'data-selected-text',
        popupButtonOffset: {x: -18, y: 11},
        cursorMaxOffset: {x: 100, y: 0},
        clickAction: function () {
        }
    };

    var selection = null;
    var selectionText = '';
    var selectionValid = false;
    var actionConfig = null;

    var selectionChangeInited = false;

    var popupShowed = false;

    $.fn.textSelect = function (params) {
        var self = this;
        this.attr('data-text-selector-popup', '');

        var initElement = function (params) {
            if (!isValidButtonType(params)) {
                setDefaultButtonType(params);
            }
            var data = JSON.parse(JSON.stringify($.extend(true, defaultParams, params)));
            data.clickAction = params.clickAction;
            data.$element = $(self);
            elements.push(data);
        };
        var isValidButtonType = function (data) {
            return availableButtonTypes.indexOf(data.buttonType) !== -1;
        };
        var setDefaultButtonType = function (data) {
            data.buttonType = defaultParams.buttonType;
        };
        initElement(params);

        $(self).on('click', function (e) {
            e.stopPropagation();
            actionConfig.clickAction(selectionText);
            if (isPopup()) {
                hidePopup(e);
                clearWrappers();
            }
        });

        var checkSelectedElements = function () {
            selectionValid = false;
            var select = getSelection();
            var range = getRange(select);
            if (range === null) {
                return;
            }

            var container = getContainer(range);
            var config = getConfigByParent(container);

            if (isSelectionValid(config, range)) {
                selection = select;
                selectionText = selection.toString().trim();
                actionConfig = config;
                selectionValid = true;
            } else {
                clearWrappers();
            }
        };

        var processMouseUp = function (e) {
            if (!selectionValid) {
                return;
            }

            setTimeout(function () {
                var range = getRange(selection);
                if (range) {
                    addWrapper(range);

                    if (isPopup() && !popupShowed) {
                        showPopup(getPopupPosition(e));
                        clearWrappers();
                    }
                }
            }, 0);

        };

        var processClick = function (e) {

            if (!popupShowed) {
                return;
            }

            var $target  = $(e.target);
            if ($target.is('[data-text-selector-popup]') || $target.closest('[data-text-selector-popup]').length) {
                return;
            }

            setTimeout(function () {
                if (e.which === 3) {
                    var range = document.getSelection().getRangeAt(0);
                    if (range && !range.collapsed) {
                        $(document).one('mousedown keydown', processClick);
                        return;
                    }
                }
                hidePopup(e);
            }, 0)

        };

        var hidePopup = function () {
            actionConfig.$element.hide();
            popupShowed = false;
        };

        var showPopup = function (coordinates) {
            actionConfig.$element.css('top', coordinates.y + 'px').css('left', coordinates.x + 'px').show().find('span').text(selectionText);
            popupShowed = true;

            setTimeout(function () {
                $(document).one('mousedown keydown', processClick);
            }, 0)
        };

        var getPopupPosition = function (e) {
            var $wrapper = getWrappers();
            if ($wrapper.length !== 1) {
                return {x: 0, y: 0};
            }
            var wrapperOffset = $wrapper.offset();
            var wrapperHeight = $wrapper.height();
            var wrapperWidth = $wrapper.width();

            if(e.type === 'keyup'){
                return {
                    x: wrapperOffset.left + wrapperWidth + actionConfig.popupButtonOffset.x,
                    y: wrapperOffset.top + wrapperHeight + actionConfig.popupButtonOffset.y
                };
            }
            var mouseX = e.pageX;
            var mouseY = e.pageY;
            var x = 0, y = 0;
            if(mouseX - actionConfig.cursorMaxOffset.x > wrapperOffset.left + wrapperWidth){
                x = wrapperOffset.left + wrapperWidth;
            }else if (mouseX + actionConfig.cursorMaxOffset.x < wrapperOffset.left){
                x = wrapperOffset.left;
            }else{
                x = mouseX;
            }

            if((mouseY - actionConfig.cursorMaxOffset.y > wrapperOffset.top + wrapperHeight) || (mouseY + actionConfig.cursorMaxOffset.y < wrapperOffset.top)){
                y = wrapperOffset.top + wrapperHeight + 5;
            }else{
                y = mouseY + actionConfig.popupButtonOffset.y;
            }

            return {x: x + actionConfig.popupButtonOffset.x, y: y}
        };

        var clearWrappers = function () {
            var $wrappers = getWrappers();
            var $parents = $wrappers.parent();
            var count = $parents.length;
            for (var i = 0; i < count; i++) {
                $($parents[i]).text($($parents[i]).text());
            }
        };

        var addWrapper = function (range) {
            var span = document.createElement(actionConfig.wrapper);
            span.setAttribute(actionConfig.wrapperDataAttr, '');

            var start = range.startOffset;
            var end  = range.endOffset;

            range.surroundContents(span);

            var parent = $(span).parent().get(0);

            setTimeout(function () {
                var newRange = document.createRange();
                newRange.setStart(parent.childNodes[0], start);
                newRange.setEnd(parent.childNodes[0], end);
                selection.removeAllRanges();
                selection.addRange(newRange);
            }, 0)
        };

        var getWrappers = function () {
            if (actionConfig === null) {
                return $();
            }
            return $(actionConfig.wrapper + '[' + actionConfig.wrapperDataAttr + ']');
        };

        var isPopup = function () {
            return params.buttonType === 'popup';
        };

        var getSelection = function () {
            return window.getSelection();
        };

        var getRange = function (selection) {
            if (selection.rangeCount > 0) {
                return selection.getRangeAt(0);
            }
            return null;
        };

        var getContainer = function (range) {
            var $commonAncestorContainer = $(range.commonAncestorContainer);
            if ($commonAncestorContainer.find('*').length > 0) {
                var text = $commonAncestorContainer.text().trim();
                return getContainerFromConfig(text);
            }
            return $commonAncestorContainer.parent();
        };

        var getContainerFromConfig = function (text) {
            var elementsCount = elements.length;
            for (var i = 0; i < elementsCount; i++) {
                var count = elements[i].$element.length;
                for (var j = 0; j < count; j++) {
                    var $obj = $(elements[i].$element[j]);
                    if ($obj.text().trim().indexOf(text) !== -1) {
                        return $obj;
                    }
                }
            }
            return null;
        };

        var getConfigByParent = function ($parent) {
            if ($parent === null) {
                return null;
            }

            return getConfigByComparison(
                function (config) {
                    return $parent.is(config.container);
                }
            );
        };

        var getConfigByComparison = function (comparison) {
            var count = elements.length;
            for (var i = 0; i < count; i++) {
                if (comparison(elements[i])) {
                    return elements[i];
                }
            }
            return null;
        };

        var isSelectionValid = function (config, range) {
            return typeof config !== 'undefined' && config !== null && !range.collapsed;
        };

        if (!selectionChangeInited) {
            document.addEventListener('selectionchange', checkSelectedElements, false);
            $(document).on('mouseup keyup', processMouseUp);
            selectionChangeInited = true;
        }

        return this;
    };
}(jQuery));
