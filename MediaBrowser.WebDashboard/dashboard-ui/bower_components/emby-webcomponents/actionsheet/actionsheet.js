define(["dialogHelper", "layoutManager", "globalize", "browser", "dom", "emby-button", "css!./actionsheet", "material-icons", "scrollStyles"], function(dialogHelper, layoutManager, globalize, browser, dom) {
    "use strict";

    function getOffsets(elems) {
        var doc = document,
            results = [];
        if (!doc) return results;
        for (var box, elem, i = 0, length = elems.length; i < length; i++) elem = elems[i], box = elem.getBoundingClientRect ? elem.getBoundingClientRect() : {
            top: 0,
            left: 0
        }, results[i] = {
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height
        };
        return results
    }

    function getPosition(options, dlg) {
        var windowSize = dom.getWindowSize(),
            windowHeight = windowSize.innerHeight,
            windowWidth = windowSize.innerWidth;
        if (windowHeight < 540) return null;
        var pos = getOffsets([options.positionTo])[0];
        "top" !== options.positionY && (pos.top += (pos.height || 0) / 2), pos.left += (pos.width || 0) / 2;
        var height = dlg.offsetHeight || 300,
            width = dlg.offsetWidth || 160;
        pos.top -= height / 2, pos.left -= width / 2;
        var overflowX = pos.left + width - windowWidth,
            overflowY = pos.top + height - windowHeight;
        return overflowX > 0 && (pos.left -= overflowX + 20), overflowY > 0 && (pos.top -= overflowY + 20), pos.top += options.offsetTop || 0, pos.left += options.offsetLeft || 0, pos.top = Math.max(pos.top, 10), pos.left = Math.max(pos.left, 10), pos
    }

    function centerFocus(elem, horiz, on) {
        require(["scrollHelper"], function(scrollHelper) {
            var fn = on ? "on" : "off";
            scrollHelper.centerFocus[fn](elem, horiz)
        })
    }

    function show(options) {
        var isFullscreen, dialogOptions = {
                removeOnClose: !0,
                enableHistory: options.enableHistory,
                scrollY: !1
            },
            backButton = !1;
        layoutManager.tv ? (dialogOptions.size = "fullscreen", isFullscreen = !0, backButton = !0, dialogOptions.autoFocus = !0) : (dialogOptions.modal = !1, dialogOptions.entryAnimation = options.entryAnimation, dialogOptions.exitAnimation = options.exitAnimation, dialogOptions.entryAnimationDuration = options.entryAnimationDuration || 140, dialogOptions.exitAnimationDuration = options.exitAnimationDuration || 160, dialogOptions.autoFocus = !1);
        var dlg = dialogHelper.createDialog(dialogOptions);
        isFullscreen ? dlg.classList.add("actionsheet-fullscreen") : dlg.classList.add("actionsheet-not-fullscreen");
        var extraSpacing = !layoutManager.tv;
        extraSpacing && dlg.classList.add("actionsheet-extraSpacing"), dlg.classList.add("actionSheet"), options.dialogClass && dlg.classList.add(options.dialogClass);
        var html = "",
            scrollType = layoutManager.desktop ? "smoothScrollY" : "hiddenScrollY",
            style = "";
        if (options.items.length > 20) {
            var minWidth = dom.getWindowSize().innerWidth >= 300 ? 240 : 200;
            style += "min-width:" + minWidth + "px;"
        }
        var i, length, option, renderIcon = !1;
        for (i = 0, length = options.items.length; i < length; i++) option = options.items[i], option.icon = option.selected ? "check" : null, option.icon && (renderIcon = !0);
        layoutManager.tv && (html += '<button is="paper-icon-button-light" class="btnCloseActionSheet" tabindex="-1"><i class="md-icon">&#xE5C4;</i></button>');
        var center = options.title && !renderIcon;
        html += center ? '<div class="actionSheetContent actionSheetContent-centered">' : '<div class="actionSheetContent">', options.title && (layoutManager.tv ? (html += '<h1 class="actionSheetTitle">', html += options.title, html += "</h1>") : (html += '<h2 class="actionSheetTitle">', html += options.title, html += "</h2>")), options.text && (html += '<p class="actionSheetText">', html += options.text, html += "</p>");
        var scrollerClassName = "actionSheetScroller";
        layoutManager.tv && (scrollerClassName += " actionSheetScroller-tv"), html += '<div class="' + scrollerClassName + " " + scrollType + '" style="' + style + '">';
        var menuItemClass = "actionSheetMenuItem";
        options.menuItemClass && (menuItemClass += " " + options.menuItemClass), extraSpacing && (menuItemClass += " actionSheetMenuItem-extraspacing");
        var actionSheetItemTextClass = "actionSheetItemText";
        for (i = 0, length = options.items.length; i < length; i++) {
            option = options.items[i];
            var autoFocus = option.selected ? " autoFocus" : "",
                optionId = null == option.id || "" === option.id ? option.value : option.id;
            html += "<button" + autoFocus + ' is="emby-button" type="button" class="' + menuItemClass + '" data-id="' + optionId + '">', option.icon ? html += '<i class="actionSheetItemIcon md-icon">' + option.icon + "</i>" : renderIcon && !center && (html += '<i class="actionSheetItemIcon md-icon" style="visibility:hidden;">check</i>'), html += '<div class="' + actionSheetItemTextClass + '">' + (option.name || option.textContent || option.innerText) + "</div>", option.secondaryText && (html += '<div class="actionSheetItemSecondaryText">' + option.secondaryText + "</div>"), html += "</button>"
        }
        options.showCancel && (html += '<div class="buttons">', html += '<button is="emby-button" type="button" class="btnCloseActionSheet">' + globalize.translate("sharedcomponents#ButtonCancel") + "</button>", html += "</div>"), html += "</div>", dlg.innerHTML = html, layoutManager.tv && centerFocus(dlg.querySelector(".actionSheetScroller"), !1, !0);
        var btnCloseActionSheet = dlg.querySelector(".btnCloseActionSheet");
        btnCloseActionSheet && dlg.querySelector(".btnCloseActionSheet").addEventListener("click", function() {
            dialogHelper.close(dlg)
        });
        var selectedId, timeout;
        return options.timeout && (timeout = setTimeout(function() {
            dialogHelper.close(dlg)
        }, options.timeout)), new Promise(function(resolve, reject) {
            var isResolved;
            dlg.addEventListener("click", function(e) {
                var actionSheetMenuItem = dom.parentWithClass(e.target, "actionSheetMenuItem");
                actionSheetMenuItem && (selectedId = actionSheetMenuItem.getAttribute("data-id"), options.resolveOnClick && (resolve(selectedId), isResolved = !0), dialogHelper.close(dlg))
            }), dlg.addEventListener("close", function() {
                layoutManager.tv && centerFocus(dlg.querySelector(".actionSheetScroller"), !1, !1), timeout && (clearTimeout(timeout), timeout = null), isResolved || (null != selectedId ? (options.callback && options.callback(selectedId), resolve(selectedId)) : reject())
            }), dialogHelper.open(dlg);
            var setPositions = function() {
                var pos = options.positionTo && "fullscreen" !== dialogOptions.size ? getPosition(options, dlg) : null;
                pos && (dlg.style.position = "fixed", dlg.style.margin = 0, dlg.style.left = pos.left + "px", dlg.style.top = pos.top + "px")
            };
            browser.safari ? setTimeout(setPositions, 0) : setPositions()
        })
    }
    return {
        show: show
    }
});