define(["dom", "events"], function(dom, events) {
    "use strict";

    function getTouches(e) {
        return e.changedTouches || e.targetTouches || e.touches
    }

    function TouchHelper(elem, options) {
        options = options || {};
        var touchTarget, touchStartX, touchStartY, self = this,
            swipeXThreshold = options.swipeXThreshold || 50,
            swipeYThreshold = options.swipeYThreshold || 50,
            swipeXMaxY = 30,
            excludeTagNames = options.ignoreTagNames || [],
            touchStart = function(e) {
                var touch = getTouches(e)[0];
                if (touchTarget = null, touchStartX = 0, touchStartY = 0, touch) {
                    var currentTouchTarget = touch.target;
                    if (dom.parentWithTag(currentTouchTarget, excludeTagNames)) return;
                    touchTarget = currentTouchTarget, touchStartX = touch.clientX, touchStartY = touch.clientY
                }
            },
            touchEnd = function(e) {
                var isTouchMove = "touchmove" === e.type;
                if (touchTarget) {
                    var deltaX, deltaY, clientX, clientY, touch = getTouches(e)[0];
                    touch ? (clientX = touch.clientX || 0, clientY = touch.clientY || 0, deltaX = clientX - (touchStartX || 0), deltaY = clientY - (touchStartY || 0)) : (deltaX = 0, deltaY = 0), deltaX > swipeXThreshold && Math.abs(deltaY) < swipeXMaxY ? events.trigger(self, "swiperight", [touchTarget]) : deltaX < 0 - swipeXThreshold && Math.abs(deltaY) < swipeXMaxY ? events.trigger(self, "swipeleft", [touchTarget]) : deltaY < 0 - swipeYThreshold && Math.abs(deltaX) < swipeXMaxY ? events.trigger(self, "swipeup", [touchTarget, {
                        deltaY: deltaY,
                        deltaX: deltaX,
                        clientX: clientX,
                        clientY: clientY
                    }]) : deltaY > swipeYThreshold && Math.abs(deltaX) < swipeXMaxY && events.trigger(self, "swipedown", [touchTarget, {
                        deltaY: deltaY,
                        deltaX: deltaX,
                        clientX: clientX,
                        clientY: clientY
                    }]), isTouchMove && options.preventDefaultOnMove && e.preventDefault()
                }
                isTouchMove || (touchTarget = null, touchStartX = 0, touchStartY = 0)
            };
        this.touchStart = touchStart, this.touchEnd = touchEnd, dom.addEventListener(elem, "touchstart", touchStart, {
            passive: !0
        }), options.triggerOnMove && dom.addEventListener(elem, "touchmove", touchEnd, {
            passive: !options.preventDefaultOnMove
        }), dom.addEventListener(elem, "touchend", touchEnd, {
            passive: !0
        }), dom.addEventListener(elem, "touchcancel", touchEnd, {
            passive: !0
        })
    }
    return TouchHelper.prototype.destroy = function() {
        var elem = this.elem;
        if (elem) {
            var touchStart = this.touchStart,
                touchEnd = this.touchEnd;
            dom.removeEventListener(elem, "touchstart", touchStart, {
                passive: !0
            }), dom.removeEventListener(elem, "touchmove", touchEnd, {
                passive: !0
            }), dom.removeEventListener(elem, "touchend", touchEnd, {
                passive: !0
            }), dom.removeEventListener(elem, "touchcancel", touchEnd, {
                passive: !0
            })
        }
        this.touchStart = null, this.touchEnd = null, this.elem = null
    }, TouchHelper
});