define(["inputManager", "focusManager", "browser", "layoutManager", "events", "dom"], function(inputmanager, focusManager, browser, layoutManager, events, dom) {
    "use strict";

    function mouseIdleTime() {
        return (new Date).getTime() - lastMouseInputTime
    }

    function notifyApp() {
        inputmanager.notifyMouseMove()
    }

    function onMouseMove(e) {
        var eventX = e.screenX,
            eventY = e.screenY;
        if ("undefined" != typeof eventX || "undefined" != typeof eventY) {
            var obj = lastMouseMoveData;
            return obj ? void(Math.abs(eventX - obj.x) < 10 && Math.abs(eventY - obj.y) < 10 || (obj.x = eventX, obj.y = eventY, lastMouseInputTime = (new Date).getTime(), notifyApp(), isMouseIdle && (isMouseIdle = !1, document.body.classList.remove("mouseIdle"), events.trigger(self, "mouseactive")))) : void(lastMouseMoveData = {
                x: eventX,
                y: eventY
            })
        }
    }

    function onMouseEnter(e) {
        if (!isMouseIdle) {
            var parent = focusManager.focusableParent(e.target);
            parent && focusManager.focus(e.target)
        }
    }

    function enableFocusWithMouse() {
        return !!layoutManager.tv && (!!browser.xboxOne || !!browser.tv)
    }

    function onMouseInterval() {
        mouseIdleTime() >= 5e3 && (isMouseIdle = !0, document.body.classList.add("mouseIdle"), events.trigger(self, "mouseidle"))
    }

    function startMouseInterval() {
        mouseInterval || (mouseInterval = setInterval(onMouseInterval, 5e3))
    }

    function stopMouseInterval() {
        var interval = mouseInterval;
        interval && (clearInterval(interval), mouseInterval = null), document.body.classList.remove("mouseIdle")
    }

    function initMouse() {
        stopMouseInterval(), dom.removeEventListener(document, "mousemove", onMouseMove, {
            passive: !0
        }), layoutManager.mobile || (startMouseInterval(), dom.addEventListener(document, "mousemove", onMouseMove, {
            passive: !0
        })), dom.removeEventListener(document, "mouseenter", onMouseEnter, {
            capture: !0,
            passive: !0
        }), enableFocusWithMouse() && dom.addEventListener(document, "mouseenter", onMouseEnter, {
            capture: !0,
            passive: !0
        })
    }
    var isMouseIdle, lastMouseMoveData, mouseInterval, self = {},
        lastMouseInputTime = (new Date).getTime();
    return initMouse(), events.on(layoutManager, "modechange", initMouse), self
});