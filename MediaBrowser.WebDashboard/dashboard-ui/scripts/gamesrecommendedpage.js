define(["jQuery", "imageLoader"], function($, imageLoader) {
    "use strict";
    $(document).on("pagebeforeshow", "#gamesRecommendedPage", function() {
        var parentId = LibraryMenu.getTopParentId(),
            userId = Dashboard.getCurrentUserId(),
            page = this,
            options = {
                IncludeItemTypes: "Game",
                Limit: 18,
                Fields: "PrimaryImageAspectRatio",
                ParentId: parentId,
                ImageTypeLimit: 1,
                EnableImageTypes: "Primary,Backdrop,Banner,Thumb"
            };
        ApiClient.getJSON(ApiClient.getUrl("Users/" + userId + "/Items/Latest", options)).then(function(items) {
            var recentlyAddedItems = page.querySelector("#recentlyAddedItems");
            recentlyAddedItems.innerHTML = LibraryBrowser.getPosterViewHtml({
                items: items,
                transparent: !0,
                borderless: !0,
                shape: "auto",
                lazy: !0
            }), imageLoader.lazyChildren(recentlyAddedItems)
        }), options = {
            SortBy: "DatePlayed",
            SortOrder: "Descending",
            MediaTypes: "Game",
            Limit: 18,
            Recursive: !0,
            Filters: "IsPlayed",
            Fields: "ItemCounts,AudioInfo,PrimaryImageAspectRatio",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Banner,Thumb"
        }, ApiClient.getItems(userId, options).then(function(result) {
            result.Items.length ? $("#recentlyPlayedSection", page).show() : $("#recentlyPlayedSection", page).hide();
            var recentlyPlayedItems = page.querySelector("#recentlyPlayedItems");
            recentlyPlayedItems.innerHTML = LibraryBrowser.getPosterViewHtml({
                items: result.Items,
                transparent: !0,
                borderless: !0,
                shape: "auto",
                lazy: !0
            }), imageLoader.lazyChildren(recentlyPlayedItems)
        })
    })
});