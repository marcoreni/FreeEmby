define(["events", "dom"], function(events, dom) {
    "use strict";

    function fullscreenManager() {}

    function onFullScreenChange() {
        events.trigger(manager, "fullscreenchange")
    }
    fullscreenManager.prototype.requestFullscreen = function(element) {
        return element = element || document.documentElement, element.requestFullscreen ? void element.requestFullscreen() : element.mozRequestFullScreen ? void element.mozRequestFullScreen() : element.webkitRequestFullscreen ? void element.webkitRequestFullscreen() : element.msRequestFullscreen ? void element.msRequestFullscreen() : ("VIDEO" !== element.tagName && (element = document.querySelector("video") || element), void(element.webkitEnterFullscreen && element.webkitEnterFullscreen()))
    }, fullscreenManager.prototype.exitFullscreen = function() {
        document.exitFullscreen ? document.exitFullscreen() : document.mozCancelFullScreen ? document.mozCancelFullScreen() : document.webkitExitFullscreen ? document.webkitExitFullscreen() : document.webkitCancelFullscreen ? document.webkitCancelFullscreen() : document.msExitFullscreen && document.msExitFullscreen()
    }, fullscreenManager.prototype.isFullScreen = function() {
        return !!(document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen || document.msFullscreenElement)
    };
    var manager = new fullscreenManager;
    return dom.addEventListener(document, "fullscreenchange", onFullScreenChange, {
        passive: !0
    }), dom.addEventListener(document, "webkitfullscreenchange", onFullScreenChange, {
        passive: !0
    }), dom.addEventListener(document, "mozfullscreenchange", onFullScreenChange, {
        passive: !0
    }), manager
});