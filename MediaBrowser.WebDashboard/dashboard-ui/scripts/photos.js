define(["jQuery", "cardBuilder", "imageLoader", "loading", "emby-itemscontainer"], function($, cardBuilder, imageLoader, loading) {
    "use strict";

    function getQuery() {
        var key = getSavedQueryKey(),
            pageData = data[key];
        return pageData || (pageData = data[key] = {
            query: {
                SortBy: "IsFolder,SortName",
                SortOrder: "Ascending",
                Fields: "PrimaryImageAspectRatio,SortName",
                ImageTypeLimit: 1,
                EnableImageTypes: "Primary",
                StartIndex: 0,
                Limit: LibraryBrowser.getDefaultPageSize()
            }
        }, pageData.query.Recursive = !1, pageData.query.MediaTypes = null, pageData.query.ParentId = getParameterByName("parentId") || LibraryMenu.getTopParentId(), LibraryBrowser.loadSavedQueryValues(key, pageData.query)), pageData.query
    }

    function getSavedQueryKey() {
        return LibraryBrowser.getSavedQueryKey("v1")
    }

    function reloadItems(page) {
        loading.show();
        var query = getQuery();
        ApiClient.getItems(Dashboard.getCurrentUserId(), query).then(function(result) {
            window.scrollTo(0, 0);
            var html = "",
                pagingHtml = LibraryBrowser.getQueryPagingHtml({
                    startIndex: query.StartIndex,
                    limit: query.Limit,
                    totalRecordCount: result.TotalRecordCount,
                    viewButton: !1,
                    showLimit: !1
                });
            page.querySelector(".listTopPaging").innerHTML = pagingHtml, "Poster" == view && (html = cardBuilder.getCardsHtml({
                items: result.Items,
                shape: "square",
                context: getParameterByName("context") || "photos",
                overlayText: !0,
                lazy: !0,
                coverImage: !0,
                showTitle: !1,
                centerText: !0
            }));
            var elem = page.querySelector(".itemsContainer");
            elem.innerHTML = html + pagingHtml, imageLoader.lazyChildren(elem), $(".btnNextPage", page).on("click", function() {
                query.StartIndex += query.Limit, reloadItems(page)
            }), $(".btnPreviousPage", page).on("click", function() {
                query.StartIndex -= query.Limit, reloadItems(page)
            }), LibraryBrowser.saveQueryValues(getSavedQueryKey(), query), loading.hide()
        })
    }

    function startSlideshow(page, itemQuery, startItemId) {
        var userId = Dashboard.getCurrentUserId(),
            localQuery = $.extend({}, itemQuery);
        localQuery.StartIndex = 0, localQuery.Limit = null, localQuery.MediaTypes = "Photo", localQuery.Recursive = !0, localQuery.Filters = "IsNotFolder", ApiClient.getItems(userId, localQuery).then(function(result) {
            showSlideshow(page, result.Items, startItemId)
        })
    }

    function showSlideshow(page, items, startItemId) {
        var index = items.map(function(i) {
            return i.Id
        }).indexOf(startItemId);
        index == -1 && (index = 0), require(["slideshow"], function(slideshow) {
            var newSlideShow = new slideshow({
                showTitle: !1,
                cover: !1,
                items: items,
                startIndex: index,
                interval: 7e3,
                interactive: !0
            });
            newSlideShow.show()
        })
    }

    function onListItemClick(e) {
        var page = $(this).parents(".page")[0],
            info = LibraryBrowser.getListItemInfo(this);
        if ("Photo" == info.mediaType) {
            var query = getQuery();
            return Photos.startSlideshow(page, query, info.id), !1
        }
    }
    var view = "Poster",
        data = {};
    pageIdOn("pageinit", "photosPage", function() {
        var page = this;
        reloadItems(page, 0), $(page).on("click", ".mediaItem", onListItemClick)
    }), window.Photos = {
        startSlideshow: startSlideshow
    }
});