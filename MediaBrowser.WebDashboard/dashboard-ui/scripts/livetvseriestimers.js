define(["datetime", "cardBuilder", "imageLoader", "apphost", "loading", "paper-icon-button-light", "emby-button"], function(datetime, cardBuilder, imageLoader, appHost, loading) {
    "use strict";

    function renderTimers(context, timers) {
        var html = "",
            supportsImageAnalysis = appHost.supports("imageanalysis"),
            cardLayout = !1;
        html += cardBuilder.getCardsHtml({
            items: timers,
            shape: "backdrop",
            showTitle: !0,
            cardLayout: cardLayout,
            vibrant: cardLayout && supportsImageAnalysis,
            preferThumb: !0,
            coverImage: !0,
            overlayText: !1,
            showSeriesTimerTime: !0,
            showSeriesTimerChannel: !0,
            centerText: !cardLayout,
            overlayMoreButton: !cardLayout
        });
        var elem = context.querySelector("#items");
        elem.innerHTML = html, imageLoader.lazyChildren(elem), loading.hide()
    }

    function reload(context, promise) {
        loading.show(), promise.then(function(result) {
            renderTimers(context, result.Items)
        })
    }
    var query = {
        SortBy: "SortName",
        SortOrder: "Ascending"
    };
    return function(view, params, tabContent) {
        var timersPromise, self = this;
        self.preRender = function() {
            timersPromise = ApiClient.getLiveTvSeriesTimers(query)
        }, self.renderTab = function() {
            reload(tabContent, timersPromise)
        }
    }
});