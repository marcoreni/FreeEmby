define([], function() {
    "use strict";

    function LazyLoader(options) {
        this.options = options
    }

    function unveilElements(elements, root, callback) {
        if (elements.length) {
            var lazyLoader = new LazyLoader({
                callback: callback
            });
            lazyLoader.addElements(elements)
        }
    }
    return LazyLoader.prototype.createObserver = function() {
        var observerOptions = {},
            options = this.options,
            loadedCount = 0,
            callback = options.callback,
            observerId = "obs" + (new Date).getTime(),
            self = this,
            observer = new IntersectionObserver(function(entries) {
                for (var j = 0, length2 = entries.length; j < length2; j++) {
                    var entry = entries[j],
                        target = entry.target;
                    observer.unobserve(target), target[observerId] || (target[observerId] = 1, callback(target), loadedCount++, loadedCount >= self.elementCount && self.destroyObserver())
                }
            }, observerOptions);
        this.observer = observer
    }, LazyLoader.prototype.addElements = function(elements) {
        var observer = this.observer;
        observer || (this.createObserver(), observer = this.observer), this.elementCount = (this.elementCount || 0) + elements.length;
        for (var i = 0, length = elements.length; i < length; i++) observer.observe(elements[i])
    }, LazyLoader.prototype.destroyObserver = function(elements) {
        var observer = this.observer;
        observer && (observer.disconnect(), this.observer = null)
    }, LazyLoader.prototype.destroy = function(elements) {
        this.destroyObserver(), this.options = null
    }, LazyLoader.lazyChildren = function(elem, callback) {
        unveilElements(elem.getElementsByClassName("lazy"), elem, callback)
    }, LazyLoader
});