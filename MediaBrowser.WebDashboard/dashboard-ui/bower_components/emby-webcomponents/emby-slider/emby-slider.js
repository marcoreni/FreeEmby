define(["browser", "dom", "css!./emby-slider", "registerElement", "emby-input"], function(browser, dom) {
    "use strict";

    function updateValues(range, backgroundLower, backgroundUpper) {
        var value = range.value;
        requestAnimationFrame(function() {
            if (backgroundLower) {
                var fraction = (value - range.min) / (range.max - range.min);
                browser.noFlex && (backgroundLower.style["-webkit-flex"] = fraction, backgroundUpper.style["-webkit-flex"] = 1 - fraction, backgroundLower.style["-webkit-box-flex"] = fraction, backgroundUpper.style["-webkit-box-flex"] = 1 - fraction), backgroundLower.style.flex = fraction, backgroundUpper.style.flex = 1 - fraction
            }
        })
    }

    function updateBubble(range, value, bubble, bubbleText) {
        bubble.style.left = value + "%", range.getBubbleHtml ? value = range.getBubbleHtml(value) : (value = range.getBubbleText ? range.getBubbleText(value) : Math.round(value), value = '<h1 class="sliderBubbleText">' + value + "</h1>"), bubble.innerHTML = value
    }

    function startInterval(range, backgroundLower, backgroundUpper) {
        var interval = range.interval;
        interval && clearInterval(interval), range.interval = setInterval(function() {
            updateValues(range, backgroundLower, backgroundUpper)
        }, 100)
    }
    var EmbySliderPrototype = Object.create(HTMLInputElement.prototype),
        supportsNativeProgressStyle = browser.firefox || browser.edge || browser.msie,
        supportsValueSetOverride = !1;
    if (Object.getOwnPropertyDescriptor && Object.defineProperty) {
        var descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
        descriptor && descriptor.configurable && (supportsValueSetOverride = !0)
    }
    EmbySliderPrototype.attachedCallback = function() {
        if ("true" !== this.getAttribute("data-embyslider")) {
            this.setAttribute("data-embyslider", "true"), this.classList.add("mdl-slider"), this.classList.add("mdl-js-slider"), browser.noFlex && this.classList.add("slider-no-webkit-thumb");
            var containerElement = this.parentNode;
            containerElement.classList.add("mdl-slider__container");
            var htmlToInsert = "";
            supportsNativeProgressStyle || (htmlToInsert += '<div class="mdl-slider__background-flex"><div class="mdl-slider__background-lower"></div><div class="mdl-slider__background-upper"></div></div>'), htmlToInsert += '<div class="sliderBubble hide"></div>', containerElement.insertAdjacentHTML("beforeend", htmlToInsert);
            var backgroundLower = containerElement.querySelector(".mdl-slider__background-lower"),
                backgroundUpper = containerElement.querySelector(".mdl-slider__background-upper"),
                sliderBubble = containerElement.querySelector(".sliderBubble"),
                hasHideClass = sliderBubble.classList.contains("hide");
            dom.addEventListener(this, "input", function(e) {
                this.dragging = !0, updateBubble(this, this.value, sliderBubble), hasHideClass && (sliderBubble.classList.remove("hide"), hasHideClass = !1)
            }, {
                passive: !0
            }), dom.addEventListener(this, "change", function() {
                this.dragging = !1, updateValues(this, backgroundLower, backgroundUpper), sliderBubble.classList.add("hide"), hasHideClass = !0
            }, {
                passive: !0
            }), browser.firefox || (dom.addEventListener(this, "mousemove", function(e) {
                if (!this.dragging) {
                    var rect = this.getBoundingClientRect(),
                        clientX = e.clientX,
                        bubbleValue = (clientX - rect.left) / rect.width;
                    bubbleValue *= 100, updateBubble(this, bubbleValue, sliderBubble), hasHideClass && (sliderBubble.classList.remove("hide"), hasHideClass = !1)
                }
            }, {
                passive: !0
            }), dom.addEventListener(this, "mouseleave", function() {
                sliderBubble.classList.add("hide"), hasHideClass = !0
            }, {
                passive: !0
            })), supportsNativeProgressStyle || (supportsValueSetOverride ? this.addEventListener("valueset", function() {
                updateValues(this, backgroundLower, backgroundUpper)
            }) : startInterval(this, backgroundLower, backgroundUpper))
        }
    }, EmbySliderPrototype.detachedCallback = function() {
        var interval = this.interval;
        interval && clearInterval(interval), this.interval = null
    }, document.registerElement("emby-slider", {
        prototype: EmbySliderPrototype,
        extends: "input"
    })
});