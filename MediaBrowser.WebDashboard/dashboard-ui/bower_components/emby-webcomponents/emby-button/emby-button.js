define(["browser", "dom", "layoutManager", "shell", "embyRouter", "apphost", "css!./emby-button", "registerElement"], function(browser, dom, layoutManager, shell, embyRouter, appHost) {
    "use strict";

    function animateButtonInternal(e, btn) {
        for (var div = document.createElement("div"), i = 0, length = btn.classList.length; i < length; i++) div.classList.add(btn.classList[i] + "-ripple-effect");
        var offsetX = e.offsetX || 0,
            offsetY = e.offsetY || 0;
        offsetX > 0 && offsetY > 0 && (div.style.left = offsetX + "px", div.style.top = offsetY + "px");
        var firstChild = btn.firstChild;
        firstChild ? btn.insertBefore(div, btn.firstChild) : btn.appendChild(div), div.addEventListener(dom.whichAnimationEvent(), function() {
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

    function onMouseDown(e) {
        0 === e.button && animateButton(e, this)
    }

    function onClick(e) {
        animateButton(e, this)
    }

    function enableAnimation() {
        return !browser.tv
    }

    function onClickOpenTarget(e) {
        shell.openUrl(this.getAttribute("data-target"))
    }

    function onAnchorClick(e) {
        var href = this.getAttribute("href");
        "#" !== href && (this.getAttribute("target") ? (e.preventDefault(), shell.openUrl(href)) : embyRouter.handleAnchorClick(e))
    }
    var EmbyButtonPrototype = Object.create(HTMLButtonElement.prototype),
        EmbyLinkButtonPrototype = Object.create(HTMLAnchorElement.prototype);
    EmbyButtonPrototype.createdCallback = function() {
        this.classList.contains("emby-button") || (this.classList.add("emby-button"), browser.safari && this.classList.add("emby-button-noflex"), layoutManager.tv && (this.classList.add("emby-button-focusscale"), this.classList.add("emby-button-tv")), enableAnimation() && (dom.addEventListener(this, "keydown", onKeyDown, {
            passive: !0
        }), browser.safari ? dom.addEventListener(this, "click", onClick, {
            passive: !0
        }) : dom.addEventListener(this, "mousedown", onMouseDown, {
            passive: !0
        })))
    }, EmbyButtonPrototype.attachedCallback = function() {
        "A" === this.tagName ? (dom.removeEventListener(this, "click", onAnchorClick, {}), dom.addEventListener(this, "click", onAnchorClick, {})) : this.getAttribute("data-target") && (dom.removeEventListener(this, "click", onClickOpenTarget, {
            passive: !0
        }), dom.addEventListener(this, "click", onClickOpenTarget, {
            passive: !0
        }), "false" !== this.getAttribute("data-autohide") && (appHost.supports("externallinks") ? this.classList.remove("hide") : this.classList.add("hide")))
    }, EmbyLinkButtonPrototype.createdCallback = EmbyButtonPrototype.createdCallback, EmbyLinkButtonPrototype.attachedCallback = EmbyButtonPrototype.attachedCallback, document.registerElement("emby-button", {
        prototype: EmbyButtonPrototype,
        extends: "button"
    }), document.registerElement("emby-linkbutton", {
        prototype: EmbyLinkButtonPrototype,
        extends: "a"
    })
});