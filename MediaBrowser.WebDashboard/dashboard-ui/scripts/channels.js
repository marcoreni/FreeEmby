define(["loading", "libraryBrowser", "cardBuilder", "imageLoader", "homeSections", "emby-itemscontainer", "emby-button"], function(loading, libraryBrowser, cardBuilder, imageLoader, homeSections) {
    "use strict";

    function reloadItems(page) {
        loading.show(), query.UserId = Dashboard.getCurrentUserId(), ApiClient.getJSON(ApiClient.getUrl("Channels", query)).then(function(result) {
            window.scrollTo(0, 0);
            var html = "",
                view = "Thumb";
            "Thumb" == view ? html = cardBuilder.getCardsHtml({
                items: result.Items,
                shape: "backdrop",
                context: "channels",
                showTitle: !0,
                lazy: !0,
                centerText: !0,
                preferThumb: !0
            }) : "ThumbCard" == view && (html = cardBuilder.getCardsHtml({
                items: result.Items,
                shape: "backdrop",
                preferThumb: !0,
                context: "channels",
                lazy: !0,
                cardLayout: !0,
                showTitle: !0
            }));
            var elem = page.querySelector("#items");
            elem.innerHTML = html, imageLoader.lazyChildren(elem), libraryBrowser.saveQueryValues("channels", query), loading.hide()
        })
    }
    var query = {
        StartIndex: 0
    };
    return function(view, params) {
        view.addEventListener("viewshow", function(e) {
            libraryBrowser.loadSavedQueryValues("channels", query), homeSections.loadLatestChannelItems(view.querySelector(".latestItems"), ApiClient, Dashboard.getCurrentUserId()), reloadItems(view)
        })
    }
});