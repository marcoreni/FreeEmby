define([], function() {
    "use strict";

    function parentWithAttribute(elem, name, value) {
        for (; value ? elem.getAttribute(name) !== value : !elem.getAttribute(name);)
            if (elem = elem.parentNode, !elem || !elem.getAttribute) return null;
        return elem
    }

    function parentWithTag(elem, tagNames) {
        for (Array.isArray(tagNames) || (tagNames = [tagNames]); tagNames.indexOf(elem.tagName || "") === -1;)
            if (elem = elem.parentNode, !elem) return null;
        return elem
    }

    function containsAnyClass(classList, classNames) {
        for (var i = 0, length = classNames.length; i < length; i++)
            if (classList.contains(classNames[i])) return !0;
        return !1
    }

    function parentWithClass(elem, classNames) {
        for (Array.isArray(classNames) || (classNames = [classNames]); !elem.classList || !containsAnyClass(elem.classList, classNames);)
            if (elem = elem.parentNode, !elem) return null;
        return elem
    }

    function addEventListenerWithOptions(target, type, handler, options) {
        var optionsOrCapture = options;
        supportsCaptureOption || (optionsOrCapture = options.capture), target.addEventListener(type, handler, optionsOrCapture)
    }

    function removeEventListenerWithOptions(target, type, handler, options) {
        var optionsOrCapture = options;
        supportsCaptureOption || (optionsOrCapture = options.capture), target.removeEventListener(type, handler, optionsOrCapture)
    }

    function clearWindowSize() {
        windowSize = null
    }

    function getWindowSize() {
        return windowSize || (windowSize = {
            innerHeight: window.innerHeight,
            innerWidth: window.innerWidth
        }, windowSizeEventsBound || (windowSizeEventsBound = !0, addEventListenerWithOptions(window, "orientationchange", clearWindowSize, {
            passive: !0
        }), addEventListenerWithOptions(window, "resize", clearWindowSize, {
            passive: !0
        }))), windowSize
    }

    function whichAnimationEvent() {
        if (_animationEvent) return _animationEvent;
        var t, el = document.createElement("div"),
            animations = {
                animation: "animationend",
                OAnimation: "oAnimationEnd",
                MozAnimation: "animationend",
                WebkitAnimation: "webkitAnimationEnd"
            };
        for (t in animations)
            if (void 0 !== el.style[t]) return _animationEvent = animations[t], animations[t];
        return _animationEvent = "animationend"
    }

    function whichTransitionEvent() {
        if (_transitionEvent) return _transitionEvent;
        var t, el = document.createElement("div"),
            transitions = {
                transition: "transitionend",
                OTransition: "oTransitionEnd",
                MozTransition: "transitionend",
                WebkitTransition: "webkitTransitionEnd"
            };
        for (t in transitions)
            if (void 0 !== el.style[t]) return _transitionEvent = transitions[t], transitions[t];
        return _transitionEvent = "transitionend"
    }
    var supportsCaptureOption = !1;
    try {
        var opts = Object.defineProperty({}, "capture", {
            get: function() {
                supportsCaptureOption = !0
            }
        });
        window.addEventListener("test", null, opts)
    } catch (e) {}
    var windowSize, windowSizeEventsBound, _animationEvent, _transitionEvent;
    return {
        parentWithAttribute: parentWithAttribute,
        parentWithClass: parentWithClass,
        parentWithTag: parentWithTag,
        addEventListener: addEventListenerWithOptions,
        removeEventListener: removeEventListenerWithOptions,
        getWindowSize: getWindowSize,
        whichTransitionEvent: whichTransitionEvent,
        whichAnimationEvent: whichAnimationEvent
    }
});