define(["browser", "dom", "layoutManager", "css!./emby-button", "registerElement"], function(browser, dom, layoutManager) {
    "use strict";

    function enableAnimation() {
        return !browser.tv
    }

    function animateButtonInternal(e, btn) {
        for (var div = document.createElement("div"), i = 0, length = btn.classList.length; i < length; i++) div.classList.add(btn.classList[i] + "-ripple-effect");
        var offsetX = e.offsetX || 0,
            offsetY = e.offsetY || 0;
        offsetX > 0 && offsetY > 0 && (div.style.left = offsetX + "px", div.style.top = offsetY + "px"), btn.appendChild(div), div.addEventListener(dom.whichAnimationEvent(), function() {
            div.parentNode.removeChild(div)
        }, !1)
    }

    function animateButton(e, btn) {
        requestAnimationFrame(function() {
            animateButtonInternal(e, btn)
        })
    }

    function onKeyDown(e) {
        13 === e.keyCode && animateButton(e, this)
    }

    function onClick(e) {
        animateButton(e, this)
    }
    var EmbyButtonPrototype = Object.create(HTMLButtonElement.prototype);
    EmbyButtonPrototype.createdCallback = function() {
        this.classList.contains("paper-icon-button-light") || (this.classList.add("paper-icon-button-light"), layoutManager.tv && this.classList.add("icon-button-focusscale"), enableAnimation() && (dom.addEventListener(this, "keydown", onKeyDown, {
            passive: !0
        }), dom.addEventListener(this, "click", onClick, {
            passive: !0
        })))
    }, document.registerElement("paper-icon-button-light", {
        prototype: EmbyButtonPrototype,
        extends: "button"
    })
});