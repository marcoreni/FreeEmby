define(["scroller", "dom", "layoutManager", "inputManager", "focusManager", "registerElement"], function(scroller, dom, layoutManager, inputManager, focusManager) {
    "use strict";

    function initCenterFocus(elem, scrollerInstance) {
        dom.addEventListener(elem, "focus", function(e) {
            var focused = focusManager.focusableParent(e.target);
            focused && scrollerInstance.toCenter(focused)
        }, {
            capture: !0,
            passive: !0
        })
    }

    function onInputCommand(e) {
        var cmd = e.detail.command;
        "home" === cmd ? (focusManager.focusFirst(this, "." + this.getAttribute("data-navcommands")), e.preventDefault(), e.stopPropagation()) : "end" === cmd ? (focusManager.focusLast(this, "." + this.getAttribute("data-navcommands")), e.preventDefault(), e.stopPropagation()) : "pageup" === cmd ? (focusManager.moveFocus(e.target, this, "." + this.getAttribute("data-navcommands"), -12), e.preventDefault(), e.stopPropagation()) : "pagedown" === cmd && (focusManager.moveFocus(e.target, this, "." + this.getAttribute("data-navcommands"), 12), e.preventDefault(), e.stopPropagation())
    }

    function initHeadroom(elem) {
        require(["headroom"], function(Headroom) {
            var headroom = new Headroom([], {
                scroller: elem
            });
            headroom.init(), headroom.add(document.querySelector(".skinHeader")), elem.headroom = headroom
        })
    }
    var ScrollerProtoType = Object.create(HTMLDivElement.prototype);
    ScrollerProtoType.createdCallback = function() {
        this.classList.add("emby-scroller")
    }, ScrollerProtoType.scrollToBeginning = function() {
        this.scroller && this.scroller.slideTo(0, !0)
    }, ScrollerProtoType.toStart = function(elem, immediate) {
        this.scroller && this.scroller.toStart(elem, immediate)
    }, ScrollerProtoType.scrollToPosition = function(pos, immediate) {
        this.scroller && this.scroller.slideTo(pos, immediate)
    }, ScrollerProtoType.getScrollPosition = function() {
        if (this.scroller) return this.scroller.getScrollPosition()
    }, ScrollerProtoType.attachedCallback = function() {
        this.getAttribute("data-navcommands") && inputManager.on(this, onInputCommand);
        var horizontal = "false" !== this.getAttribute("data-horizontal"),
            slider = this.querySelector(".scrollSlider");
        horizontal && (slider.style["white-space"] = "nowrap");
        var bindHeader = "true" === this.getAttribute("data-bindheader"),
            options = {
                horizontal: horizontal,
                mouseDragging: 1,
                mouseWheel: "false" !== this.getAttribute("data-mousewheel"),
                touchDragging: 1,
                slidee: slider,
                scrollBy: 200,
                speed: horizontal ? 300 : 270,
                elasticBounds: 1,
                dragHandle: 1,
                scrollWidth: 5e6,
                autoImmediate: !0,
                skipSlideToWhenVisible: "true" === this.getAttribute("data-skipfocuswhenvisible"),
                dispatchScrollEvent: bindHeader || "true" === this.getAttribute("data-scrollevent")
            },
            self = this;
        self.scroller = new scroller(self, options), self.scroller.init(), layoutManager.tv && self.getAttribute("data-centerfocus") && initCenterFocus(self, self.scroller), bindHeader && initHeadroom(self)
    }, ScrollerProtoType.detachedCallback = function() {
        this.getAttribute("data-navcommands") && inputManager.off(this, onInputCommand);
        var headroom = this.headroom;
        headroom && (headroom.destroy(), this.headroom = null);
        var scrollerInstance = this.scroller;
        scrollerInstance && (scrollerInstance.destroy(), this.scroller = null)
    }, document.registerElement("emby-scroller", {
        prototype: ScrollerProtoType,
        extends: "div"
    })
});