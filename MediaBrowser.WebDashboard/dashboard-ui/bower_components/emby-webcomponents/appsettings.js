define(["appStorage", "events"], function(appStorage, events) {
    "use strict";

    function getKey(name, userId) {
        return userId && (name = userId + "-" + name), name
    }

    function AppSettings() {}
    return AppSettings.prototype.enableAutoLogin = function(val) {
        return null != val && this.set("enableAutoLogin", val.toString()), "false" !== this.get("enableAutoLogin")
    }, AppSettings.prototype.enableAutomaticBitrateDetection = function(val) {
        return null != val && this.set("enableAutomaticBitrateDetection", val.toString()), "false" !== this.get("enableAutomaticBitrateDetection")
    }, AppSettings.prototype.maxStreamingBitrate = function(val) {
        return null != val && this.set("preferredVideoBitrate", val), parseInt(this.get("preferredVideoBitrate") || "0") || 15e5
    }, AppSettings.prototype.maxStaticMusicBitrate = function(val) {
        void 0 !== val && this.set("maxStaticMusicBitrate", val);
        var defaultValue = 32e4;
        return parseInt(this.get("maxStaticMusicBitrate") || defaultValue.toString()) || defaultValue
    }, AppSettings.prototype.maxChromecastBitrate = function(val) {
        return null != val && this.set("chromecastBitrate1", val), val = this.get("chromecastBitrate1"), val ? parseInt(val) : null
    }, AppSettings.prototype.syncOnlyOnWifi = function(val) {
        return null != val && this.set("syncOnlyOnWifi", val.toString()), "false" !== this.get("syncOnlyOnWifi")
    }, AppSettings.prototype.syncPath = function(val) {
        return null != val && this.set("syncPath", val), this.get("syncPath")
    }, AppSettings.prototype.cameraUploadServers = function(val) {
        return null != val && this.set("cameraUploadServers", val.join(",")), val = this.get("cameraUploadServers"), val ? val.split(",") : []
    }, AppSettings.prototype.set = function(name, value, userId) {
        var currentValue = this.get(name, userId);
        appStorage.setItem(getKey(name, userId), value), currentValue !== value && events.trigger(this, "change", [name])
    }, AppSettings.prototype.get = function(name, userId) {
        return appStorage.getItem(getKey(name, userId))
    }, new AppSettings
});