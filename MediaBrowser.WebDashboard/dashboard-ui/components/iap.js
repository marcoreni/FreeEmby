define(["globalize", "shell", "browser"], function(globalize, shell, browser) {
    "use strict";

    function getProductInfo(feature) {
        return null
    }

    function showExternalPremiereInfo() {
        shell.openUrl("https://emby.media/premiere")
    }

    function beginPurchase(feature, email) {
        return showExternalPremiereInfo(), Promise.reject()
    }

    function restorePurchase(id) {
        return Promise.reject()
    }

    function getSubscriptionOptions() {
        var options = [];
        return options.push({
            id: "embypremiere",
            title: globalize.translate("sharedcomponents#HeaderBecomeProjectSupporter"),
            requiresEmail: !1
        }), Promise.resolve(options)
    }

    function isUnlockedByDefault(feature, options) {
        return "playback" === feature || "livetv" === feature ? Promise.resolve() : Promise.reject()
    }

    function getAdminFeatureName(feature) {
        return feature
    }

    function getRestoreButtonText() {
        return globalize.translate("sharedcomponents#HeaderAlreadyPaid")
    }

    function getPeriodicMessageIntervalMs(feature) {
        return "playback" === feature ? browser.tv || browser.mobile ? 864e5 : 3456e5 : 0
    }
    return {
        getProductInfo: getProductInfo,
        beginPurchase: beginPurchase,
        restorePurchase: restorePurchase,
        getSubscriptionOptions: getSubscriptionOptions,
        isUnlockedByDefault: isUnlockedByDefault,
        getAdminFeatureName: getAdminFeatureName,
        getRestoreButtonText: getRestoreButtonText,
        getPeriodicMessageIntervalMs: getPeriodicMessageIntervalMs
    }
});