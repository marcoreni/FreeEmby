define(["playbackManager", "itemHelper"], function(playbackManager, itemHelper) {
    "use strict";

    function getRequirePromise(deps) {
        return new Promise(function(resolve, reject) {
            require(deps, resolve)
        })
    }

    function validatePlayback(options) {
        return getRequirePromise(["registrationServices"]).then(function(registrationServices) {
            return registrationServices.validateFeature("playback", options).then(function(result) {
                result && result.enableTimeLimit && startAutoStopTimer()
            })
        })
    }

    function startAutoStopTimer() {
        stopAutoStopTimer(), autoStopTimeout = setTimeout(onAutoStopTimeout, 63e3)
    }

    function onAutoStopTimeout() {
        stopAutoStopTimer(), playbackManager.stop()
    }

    function stopAutoStopTimer() {
        var timeout = autoStopTimeout;
        timeout && (clearTimeout(timeout), autoStopTimeout = null)
    }

    function PlaybackValidation() {
        this.name = "Playback validation", this.type = "preplayintercept", this.id = "playbackvalidation", this.order = -1
    }
    var autoStopTimeout;
    return PlaybackValidation.prototype.intercept = function(options) {
        return options.fullscreen ? options.item && itemHelper.isLocalItem(options.item) ? Promise.resolve() : validatePlayback(options) : Promise.resolve()
    }, PlaybackValidation
});