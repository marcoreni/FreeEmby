define(["jQuery", "imageLoader", "loading"], function($, imageLoader, loading) {
    "use strict";

    function getSavedQueryKey() {
        return LibraryBrowser.getSavedQueryKey()
    }

    function reloadItems(page) {
        loading.show(), ApiClient.getItems(Dashboard.getCurrentUserId(), query).then(function(result) {
            window.scrollTo(0, 0), updateFilterControls(page);
            var html = LibraryBrowser.getPosterViewHtml({
                    items: result.Items,
                    shape: "backdrop",
                    context: "games",
                    showTitle: !0,
                    centerText: !0,
                    lazy: !0
                }),
                elem = page.querySelector("#items");
            elem.innerHTML = html, imageLoader.lazyChildren(elem), LibraryBrowser.saveQueryValues(getSavedQueryKey(), query), loading.hide()
        })
    }

    function updateFilterControls(page) {}
    var query = {
        SortBy: "SortName",
        SortOrder: "Ascending",
        IncludeItemTypes: "GameSystem",
        Recursive: !0,
        Fields: "DateCreated",
        StartIndex: 0,
        ImageTypeLimit: 1,
        EnableImageTypes: "Primary,Backdrop,Banner,Thumb"
    };
    $(document).on("pagebeforeshow", "#gamesystemsPage", function() {
        query.ParentId = LibraryMenu.getTopParentId();
        var limit = LibraryBrowser.getDefaultPageSize();
        limit != query.Limit && (query.Limit = limit, query.StartIndex = 0), LibraryBrowser.loadSavedQueryValues(getSavedQueryKey(), query), reloadItems(this), updateFilterControls(this)
    })
});