define(["jQuery", "cardBuilder", "imageLoader", "loading", "emby-itemscontainer"], function($, cardBuilder, imageLoader, loading) {
    "use strict";

    function getPageData(context) {
        var key = getSavedQueryKey(context),
            pageData = data[key];
        return pageData || (pageData = data[key] = {
            query: {
                SortBy: "",
                SortOrder: "Ascending",
                Fields: "PrimaryImageAspectRatio",
                StartIndex: 0,
                Limit: LibraryBrowser.getDefaultPageSize()
            }
        }, LibraryBrowser.loadSavedQueryValues(key, pageData.query)), pageData
    }

    function getQuery(context) {
        return getPageData(context).query
    }

    function getSavedQueryKey(context) {
        return context.savedQueryKey || (context.savedQueryKey = LibraryBrowser.getSavedQueryKey("channelitems")), context.savedQueryKey
    }

    function getParam(context, name) {
        return context.pageParams || (context.pageParams = {}), context.pageParams[name] || (context.pageParams[name] = getParameterByName(name)), context.pageParams[name]
    }

    function reloadFeatures(page) {
        var channelId = getParam(page, "id");
        ApiClient.getJSON(ApiClient.getUrl("Channels/" + channelId + "/Features")).then(function(features) {
            features.CanFilter ? $(".filterControls", page).show() : $(".filterControls", page).hide(), features.SupportsSortOrderToggle ? $(".sortOrderToggle", page).show() : $(".sortOrderToggle", page).hide();
            var maxPageSize = features.MaxPageSize,
                query = getQuery(page);
            maxPageSize && (query.Limit = Math.min(maxPageSize, query.Limit || maxPageSize)), getPageData(page).sortFields = features.DefaultSortFields, reloadItems(page)
        })
    }

    function reloadItems(page) {
        loading.show();
        var channelId = getParam(page, "id"),
            folderId = getParam(page, "folderId"),
            query = getQuery(page);
        query.UserId = Dashboard.getCurrentUserId(), folderId ? ApiClient.getItem(query.UserId, folderId).then(function(item) {
            LibraryMenu.setTitle(item.Name)
        }) : ApiClient.getItem(query.UserId, channelId).then(function(item) {
            LibraryMenu.setTitle(item.Name)
        }), query.folderId = folderId, ApiClient.getJSON(ApiClient.getUrl("Channels/" + channelId + "/Items", query)).then(function(result) {
            window.scrollTo(0, 0);
            var html = "",
                pagingHtml = LibraryBrowser.getQueryPagingHtml({
                    startIndex: query.StartIndex,
                    limit: query.Limit,
                    totalRecordCount: result.TotalRecordCount,
                    showLimit: !1,
                    updatePageSizeSetting: !1,
                    sortButton: !0,
                    filterButton: !0
                });
            updateFilterControls(page), html = cardBuilder.getCardsHtml({
                items: result.Items,
                shape: "auto",
                defaultShape: "square",
                context: "channels",
                showTitle: !0,
                coverImage: !0,
                showYear: !0,
                lazy: !0,
                centerText: !0
            });
            var i, length, elems = page.querySelectorAll(".paging");
            for (i = 0, length = elems.length; i < length; i++) elems[i].innerHTML = pagingHtml;
            var elem = page.querySelector("#items");
            elem.innerHTML = html, imageLoader.lazyChildren(elem), $(".btnNextPage", page).on("click", function() {
                query.StartIndex += query.Limit, reloadItems(page)
            }), $(".btnPreviousPage", page).on("click", function() {
                query.StartIndex -= query.Limit, reloadItems(page)
            }), $(".btnFilter", page).on("click", function() {
                showFilterMenu(page)
            }), $(".btnSort", page).on("click", function() {
                showSortMenu(page)
            }), loading.hide()
        }, function() {
            loading.hide()
        })
    }

    function showFilterMenu(page) {
        require(["components/filterdialog/filterdialog"], function(filterDialogFactory) {
            var filterDialog = new filterDialogFactory({
                query: getQuery(page)
            });
            Events.on(filterDialog, "filterchange", function() {
                reloadItems(page)
            }), filterDialog.show()
        })
    }

    function showSortMenu(page) {
        var sortFields = getPageData(page).sortFields,
            items = [];
        items.push({
            name: Globalize.translate("OptionDefaultSort"),
            id: ""
        }), sortFields.indexOf("Name") != -1 && items.push({
            name: Globalize.translate("OptionNameSort"),
            id: "SortName"
        }), sortFields.indexOf("CommunityRating") != -1 && items.push({
            name: Globalize.translate("OptionCommunityRating"),
            id: "CommunityRating"
        }), sortFields.indexOf("DateCreated") != -1 && items.push({
            name: Globalize.translate("OptionDateAdded"),
            id: "DateCreated"
        }), sortFields.indexOf("PlayCount") != -1 && items.push({
            name: Globalize.translate("OptionPlayCount"),
            id: "PlayCount"
        }), sortFields.indexOf("PremiereDate") != -1 && items.push({
            name: Globalize.translate("OptionReleaseDate"),
            id: "PremiereDate"
        }), sortFields.indexOf("Runtime") != -1 && items.push({
            name: Globalize.translate("OptionRuntime"),
            id: "Runtime"
        }), LibraryBrowser.showSortMenu({
            items: items,
            callback: function() {
                reloadItems(page)
            },
            query: getQuery(page)
        })
    }

    function updateFilterControls(page) {}
    var data = {};
    pageIdOn("pagebeforeshow", "channelItemsPage", function() {
        var page = this;
        reloadFeatures(page), updateFilterControls(page)
    })
});