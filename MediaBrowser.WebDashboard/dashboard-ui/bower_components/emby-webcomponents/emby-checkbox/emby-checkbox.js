define(["browser", "dom", "css!./emby-checkbox", "registerElement"], function(browser, dom) {
    "use strict";

    function onKeyDown(e) {
        if (13 === e.keyCode) return e.preventDefault(), this.checked = !this.checked, this.dispatchEvent(new CustomEvent("change", {
            bubbles: !0
        })), !1
    }

    function forceRefresh(loading) {
        var elem = this.parentNode;
        elem.style.webkitAnimationName = "repaintChrome", elem.style.webkitAnimationDelay = loading === !0 ? "500ms" : "", elem.style.webkitAnimationDuration = "10ms", elem.style.webkitAnimationIterationCount = "1", setTimeout(function() {
            elem.style.webkitAnimationName = ""
        }, loading === !0 ? 520 : 20)
    }
    var EmbyCheckboxPrototype = Object.create(HTMLInputElement.prototype),
        enableRefreshHack = !!(browser.tizen || browser.orsay || browser.operaTv || browser.web0s);
    EmbyCheckboxPrototype.attachedCallback = function() {
        if ("true" !== this.getAttribute("data-embycheckbox")) {
            this.setAttribute("data-embycheckbox", "true"), this.classList.add("mdl-checkbox__input");
            var labelElement = this.parentNode;
            labelElement.classList.add("mdl-checkbox"), labelElement.classList.add("mdl-js-checkbox");
            var labelTextElement = labelElement.querySelector("span"),
                outlineClass = "checkboxOutline",
                customClass = this.getAttribute("data-outlineclass");
            customClass && (outlineClass += " " + customClass), labelElement.insertAdjacentHTML("beforeend", '<span class="mdl-checkbox__focus-helper"></span><span class="' + outlineClass + '"><span class="mdl-checkbox__tick-outline"></span></span>'), labelTextElement.classList.add("checkboxLabel"), this.addEventListener("keydown", onKeyDown), enableRefreshHack && (forceRefresh.call(this, !0), dom.addEventListener(this, "click", forceRefresh, {
                passive: !0
            }), dom.addEventListener(this, "blur", forceRefresh, {
                passive: !0
            }), dom.addEventListener(this, "focus", forceRefresh, {
                passive: !0
            }), dom.addEventListener(this, "change", forceRefresh, {
                passive: !0
            }))
        }
    }, document.registerElement("emby-checkbox", {
        prototype: EmbyCheckboxPrototype,
        extends: "input"
    })
});