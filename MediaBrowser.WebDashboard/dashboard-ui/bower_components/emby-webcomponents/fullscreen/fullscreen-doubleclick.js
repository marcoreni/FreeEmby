define(["dom", "fullscreenManager"], function(dom, fullscreenManager) {
    "use strict";

    function isTargetValid(target) {
        return !dom.parentWithTag(target, ["BUTTON", "INPUT", "TEXTAREA"])
    }
    dom.addEventListener(window, "dblclick", function(e) {
        isTargetValid(e.target) && (fullscreenManager.isFullScreen() ? fullscreenManager.exitFullscreen() : fullscreenManager.requestFullscreen())
    }, {
        passive: !0
    })
});