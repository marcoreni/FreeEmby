define(["layoutManager", "browser", "actionsheet", "css!./emby-select", "registerElement"], function(layoutManager, browser, actionsheet) {
    "use strict";

    function enableNativeMenu() {
        return !(!browser.edgeUwp && !browser.xboxOne) || !browser.tizen && !browser.orsay && (!!browser.tv || !layoutManager.tv)
    }

    function triggerChange(select) {
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", !1, !0), select.dispatchEvent(evt)
    }

    function setValue(select, value) {
        select.value = value
    }

    function showActionSheet(select) {
        var labelElem = getLabel(select),
            title = labelElem ? labelElem.textContent || labelElem.innerText : null;
        actionsheet.show({
            items: select.options,
            positionTo: select,
            title: title
        }).then(function(value) {
            setValue(select, value), triggerChange(select)
        })
    }

    function getLabel(select) {
        for (var elem = select.previousSibling; elem && "LABEL" !== elem.tagName;) elem = elem.previousSibling;
        return elem
    }

    function onFocus(e) {
        var label = getLabel(this);
        label && (label.classList.add("selectLabelFocused"), label.classList.remove("selectLabelUnfocused"))
    }

    function onBlur(e) {
        var label = getLabel(this);
        label && (label.classList.add("selectLabelUnfocused"), label.classList.remove("selectLabelFocused"))
    }

    function onMouseDown(e) {
        e.button || enableNativeMenu() || (e.preventDefault(), showActionSheet(this))
    }

    function onKeyDown(e) {
        switch (e.keyCode) {
            case 13:
                return void(enableNativeMenu() || (e.preventDefault(), showActionSheet(this)));
            case 37:
            case 38:
            case 39:
            case 40:
                return void(layoutManager.tv && e.preventDefault())
        }
    }
    var EmbySelectPrototype = Object.create(HTMLSelectElement.prototype),
        inputId = 0;
    EmbySelectPrototype.createdCallback = function() {
        this.id || (this.id = "embyselect" + inputId, inputId++), browser.firefox || this.classList.add("emby-select-withoptioncolor"), this.addEventListener("mousedown", onMouseDown), this.addEventListener("keydown", onKeyDown), this.addEventListener("focus", onFocus), this.addEventListener("blur", onBlur)
    }, EmbySelectPrototype.attachedCallback = function() {
        if (!this.classList.contains("emby-select")) {
            this.classList.add("emby-select");
            var label = this.ownerDocument.createElement("label");
            label.innerHTML = this.getAttribute("label") || "", label.classList.add("selectLabel"), label.classList.add("selectLabelUnfocused"), label.htmlFor = this.id, this.parentNode.insertBefore(label, this);
            var div = document.createElement("div");
            div.classList.add("emby-select-selectionbar"), this.parentNode.insertBefore(div, this.nextSibling);
            var arrowContainer = document.createElement("div");
            arrowContainer.classList.add("selectArrowContainer"), arrowContainer.innerHTML = '<div style="visibility:hidden;">0</div>', this.parentNode.appendChild(arrowContainer);
            var arrow = document.createElement("i");
            arrow.classList.add("md-icon"), arrow.classList.add("selectArrow"), arrow.innerHTML = "&#xE313;", arrowContainer.appendChild(arrow)
        }
    }, EmbySelectPrototype.setLabel = function(text) {
        var label = this.parentNode.querySelector("label");
        label.innerHTML = text
    }, document.registerElement("emby-select", {
        prototype: EmbySelectPrototype,
        extends: "select"
    })
});