define(["dom"], function(dom) {
    "use strict";

    function visibleInViewport(elem, partial, thresholdX, thresholdY) {
        if (thresholdX = thresholdX || 0, thresholdY = thresholdY || 0, !elem.getBoundingClientRect) return !0;
        var windowSize = dom.getWindowSize(),
            vpWidth = windowSize.innerWidth,
            vpHeight = windowSize.innerHeight,
            rec = elem.getBoundingClientRect(),
            tViz = rec.top >= 0 && rec.top < vpHeight + thresholdY,
            bViz = rec.bottom > 0 && rec.bottom <= vpHeight + thresholdY,
            lViz = rec.left >= 0 && rec.left < vpWidth + thresholdX,
            rViz = rec.right > 0 && rec.right <= vpWidth + thresholdX,
            vVisible = partial ? tViz || bViz : tViz && bViz,
            hVisible = partial ? lViz || rViz : lViz && rViz;
        return vVisible && hVisible
    }
    return visibleInViewport
});