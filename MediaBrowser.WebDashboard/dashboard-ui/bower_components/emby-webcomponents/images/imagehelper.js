define(["lazyLoader", "imageFetcher", "layoutManager", "browser", "appSettings", "require", "css!./style"], function(lazyLoader, imageFetcher, layoutManager, browser, appSettings, require) {
    "use strict";

    function fillImage(elem, source, enableEffects) {
        if (!elem) throw new Error("elem cannot be null");
        source || (source = elem.getAttribute("data-src")), source && fillImageElement(elem, source, enableEffects)
    }

    function fillImageElement(elem, source, enableEffects) {
        imageFetcher.loadImage(elem, source).then(function() {
            var fillingVibrant = fillVibrant(elem, source);
            !enableFade || layoutManager.tv || enableEffects === !1 || fillingVibrant || fadeIn(elem), elem.removeAttribute("data-src")
        })
    }

    function fillVibrant(img, url, canvas, canvasContext) {
        var vibrantElement = img.getAttribute("data-vibrant");
        return !!vibrantElement && (window.Vibrant ? (fillVibrantOnLoaded(img, url, vibrantElement, canvas, canvasContext), !0) : (require(["vibrant"], function() {
            fillVibrantOnLoaded(img, url, vibrantElement, canvas, canvasContext)
        }), !0))
    }

    function fillVibrantOnLoaded(img, url, vibrantElement) {
        vibrantElement = document.getElementById(vibrantElement), vibrantElement && requestIdleCallback(function() {
            getVibrantInfoFromElement(img, url).then(function(vibrantInfo) {
                var swatch = vibrantInfo.split("|");
                if (swatch.length) {
                    var index = 0;
                    vibrantElement.style.backgroundColor = swatch[index], vibrantElement.style.color = swatch[index + 1]
                }
            })
        })
    }

    function getVibrantInfoFromElement(elem, url) {
        return new Promise(function(resolve, reject) {
            require(["vibrant"], function() {
                if ("IMG" === elem.tagName) return void resolve(getVibrantInfo(elem, url));
                var img = new Image;
                img.onload = function() {
                    resolve(getVibrantInfo(img, url))
                }, img.src = url
            })
        })
    }

    function getSettingsKey(url) {
        var parts = url.split("://");
        url = parts[parts.length - 1], url = url.substring(url.indexOf("/") + 1), url = url.split("?")[0];
        var cacheKey = "vibrant31";
        return cacheKey + url
    }

    function getCachedVibrantInfo(url) {
        return appSettings.get(getSettingsKey(url))
    }

    function getVibrantInfo(img, url) {
        var value = getCachedVibrantInfo(url);
        if (value) return value;
        var vibrant = new Vibrant(img),
            swatches = vibrant.swatches();
        value = "";
        var swatch = swatches.DarkVibrant;
        return value += getSwatchString(swatch), appSettings.set(getSettingsKey(url), value), value
    }

    function getSwatchString(swatch) {
        return swatch ? swatch.getHex() + "|" + swatch.getBodyTextColor() + "|" + swatch.getTitleTextColor() : "||"
    }

    function fadeIn(elem) {
        var cssClass = layoutManager.tv ? "lazy-image-fadein-fast" : "lazy-image-fadein";
        elem.classList.add(cssClass)
    }

    function lazyChildren(elem) {
        lazyLoader.lazyChildren(elem, fillImage)
    }

    function getPrimaryImageAspectRatio(items) {
        for (var values = [], i = 0, length = items.length; i < length; i++) {
            var ratio = items[i].PrimaryImageAspectRatio || 0;
            ratio && (values[values.length] = ratio)
        }
        if (!values.length) return null;
        values.sort(function(a, b) {
            return a - b
        });
        var result, half = Math.floor(values.length / 2);
        result = values.length % 2 ? values[half] : (values[half - 1] + values[half]) / 2;
        var aspect2x3 = 2 / 3;
        if (Math.abs(aspect2x3 - result) <= .15) return aspect2x3;
        var aspect16x9 = 16 / 9;
        if (Math.abs(aspect16x9 - result) <= .2) return aspect16x9;
        if (Math.abs(1 - result) <= .15) return 1;
        var aspect4x3 = 4 / 3;
        return Math.abs(aspect4x3 - result) <= .15 ? aspect4x3 : result
    }

    function fillImages(elems) {
        for (var i = 0, length = elems.length; i < length; i++) {
            var elem = elems[0];
            fillImage(elem)
        }
    }
    var requestIdleCallback = window.requestIdleCallback || function(fn) {
            fn()
        },
        self = {},
        enableFade = !browser.slow;
    return self.fillImages = fillImages, self.lazyImage = fillImage, self.lazyChildren = lazyChildren, self.getPrimaryImageAspectRatio = getPrimaryImageAspectRatio, self.getCachedVibrantInfo = getCachedVibrantInfo, self.getVibrantInfoFromElement = getVibrantInfoFromElement, self
});