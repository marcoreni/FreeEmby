define([], function() {
    "use strict";

    function CameraRoll() {}
    return CameraRoll.prototype.getFiles = function() {
        return Promise.resolve([])
    }, new CameraRoll
});