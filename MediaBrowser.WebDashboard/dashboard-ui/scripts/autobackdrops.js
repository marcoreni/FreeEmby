define(["backdrop", "appStorage"], function(backdrop, appStorage) {
    "use strict";

    function enabled() {
        var apiClient = window.ApiClient;
        if (!apiClient) return !1;
        var userId = apiClient.getCurrentUserId(),
            val = appStorage.getItem("enableBackdrops-" + userId);
        return "1" == val
    }

    function getBackdropItemIds(apiClient, userId, types, parentId) {
        var key = "backdrops2_" + userId + (types || "") + (parentId || ""),
            data = cache[key];
        if (data) return console.log("Found backdrop id list in cache. Key: " + key), data = JSON.parse(data), Promise.resolve(data);
        var options = {
            SortBy: "IsFavoriteOrLiked,Random",
            Limit: 20,
            Recursive: !0,
            IncludeItemTypes: types,
            ImageTypes: "Backdrop",
            ParentId: parentId
        };
        return apiClient.getItems(apiClient.getCurrentUserId(), options).then(function(result) {
            var images = result.Items.map(function(i) {
                return {
                    Id: i.Id,
                    tag: i.BackdropImageTags[0],
                    ServerId: i.ServerId
                }
            });
            return cache[key] = JSON.stringify(images), images
        })
    }

    function showBackdrop(type, parentId) {
        var apiClient = window.ApiClient;
        apiClient && getBackdropItemIds(apiClient, apiClient.getCurrentUserId(), type, parentId).then(function(images) {
            images.length ? backdrop.setBackdrops(images.map(function(i) {
                return i.BackdropImageTags = [i.tag], i
            })) : backdrop.clear()
        })
    }
    var cache = {};
    pageClassOn("pagebeforeshow", "page", function() {
        var page = this;
        if (!page.classList.contains("selfBackdropPage"))
            if (page.classList.contains("backdropPage"))
                if (enabled()) {
                    var type = page.getAttribute("data-backdroptype"),
                        parentId = page.classList.contains("globalBackdropPage") ? "" : LibraryMenu.getTopParentId();
                    showBackdrop(type, parentId)
                } else page.classList.remove("backdropPage"), backdrop.clear();
        else backdrop.clear()
    })
});