define(["dom", "layoutManager", "browser", "css!./headroom"], function(dom, layoutManager, browser) {
    "use strict";

    function Debouncer(callback) {
        this.callback = callback, this.ticking = !1
    }

    function Headroom(elems, options) {
        options = Object.assign(Headroom.options, options || {}), this.lastKnownScrollY = 0, this.elems = elems, this.debouncer = new Debouncer(this.update.bind(this)), this.offset = options.offset, this.scroller = options.scroller, this.initialised = !1, this.initialClass = options.initialClass, this.unPinnedClass = options.unPinnedClass, this.upTolerance = options.upTolerance, this.downTolerance = options.downTolerance
    }
    var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
    return Debouncer.prototype = {
        constructor: Debouncer,
        update: function() {
            this.callback && this.callback(), this.ticking = !1
        },
        handleEvent: function() {
            this.ticking || (requestAnimationFrame(this.rafCallback || (this.rafCallback = this.update.bind(this))), this.ticking = !0)
        }
    }, Headroom.prototype = {
        constructor: Headroom,
        init: function() {
            if (browser.supportsCssAnimation()) {
                for (var i = 0, length = this.elems.length; i < length; i++) this.elems[i].classList.add(this.initialClass);
                this.attachEvent()
            }
            return this
        },
        add: function(elem) {
            browser.supportsCssAnimation() && (elem.classList.add(this.initialClass), this.elems.push(elem))
        },
        remove: function(elem) {
            elem.classList.remove(this.unPinnedClass, this.initialClass);
            var i = this.elems.indexOf(elem);
            i !== -1 && this.elems.splice(i, 1)
        },
        destroy: function() {
            this.initialised = !1;
            for (var i = 0, length = this.elems.length; i < length; i++) this.elems[i].classList.remove(this.unPinnedClass, this.initialClass);
            dom.removeEventListener(this.scroller, "scroll", this.debouncer, {
                capture: !1,
                passive: !0
            })
        },
        attachEvent: function() {
            this.initialised || (this.lastKnownScrollY = this.getScrollY(), this.initialised = !0, dom.addEventListener(this.scroller, "scroll", this.debouncer, {
                capture: !1,
                passive: !0
            }), this.debouncer.handleEvent())
        },
        clear: function() {
            for (var i = 0, length = this.elems.length; i < length; i++) {
                var classList = this.elems[i].classList;
                classList.remove(this.unPinnedClass)
            }
        },
        unpin: function() {
            for (var i = 0, length = this.elems.length; i < length; i++) {
                var classList = this.elems[i].classList;
                classList.add(this.unPinnedClass)
            }
        },
        pin: function(scrollY) {
            for (var i = 0, length = this.elems.length; i < length; i++) {
                var classList = this.elems[i].classList;
                scrollY && layoutManager.tv ? classList.add(this.unPinnedClass) : classList.remove(this.unPinnedClass)
            }
        },
        getScrollY: function() {
            var scroller = this.scroller;
            if (scroller.getScrollPosition) return scroller.getScrollPosition();
            var pageYOffset = scroller.pageYOffset;
            if (void 0 !== pageYOffset) return pageYOffset;
            var scrollTop = scroller.scrollTop;
            return void 0 !== scrollTop ? scrollTop : (document.documentElement || document.body).scrollTop
        },
        toleranceExceeded: function(currentScrollY, direction) {
            return Math.abs(currentScrollY - this.lastKnownScrollY) >= this[direction + "Tolerance"]
        },
        shouldUnpin: function(currentScrollY, toleranceExceeded) {
            var scrollingDown = currentScrollY > this.lastKnownScrollY,
                pastOffset = currentScrollY >= this.offset;
            return scrollingDown && pastOffset && toleranceExceeded
        },
        shouldPin: function(currentScrollY, toleranceExceeded) {
            var scrollingUp = currentScrollY < this.lastKnownScrollY,
                pastOffset = currentScrollY <= this.offset;
            return scrollingUp && toleranceExceeded || pastOffset
        },
        update: function() {
            var currentScrollY = this.getScrollY(),
                scrollDirection = currentScrollY > this.lastKnownScrollY ? "down" : "up",
                toleranceExceeded = this.toleranceExceeded(currentScrollY, scrollDirection);
            currentScrollY < 0 || (this.shouldUnpin(currentScrollY, toleranceExceeded) ? this.unpin() : this.shouldPin(currentScrollY, toleranceExceeded) ? this.pin(currentScrollY) : this.clear(), this.lastKnownScrollY = currentScrollY)
        }
    }, Headroom.options = {
        upTolerance: 0,
        downTolerance: 0,
        offset: 0,
        scroller: window,
        initialClass: "headroom",
        unPinnedClass: "headroom--unpinned"
    }, Headroom
});