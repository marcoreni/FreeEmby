define(["jQuery", "listView", "imageLoader", "loading"], function($, listView, imageLoader, loading) {
    "use strict";

    function getPageData(context) {
        var key = getSavedQueryKey(context),
            pageData = data[key];
        return pageData || (pageData = data[key] = {
            query: {
                SortBy: "SortName",
                SortOrder: "Ascending",
                MediaTypes: "Game",
                Recursive: !0,
                Fields: "Genres,Studios,PrimaryImageAspectRatio,SortName",
                ImageTypeLimit: 1,
                EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
                StartIndex: 0,
                Limit: LibraryBrowser.getDefaultPageSize()
            },
            view: LibraryBrowser.getSavedView(key) || "Poster"
        }, pageData.query.ParentId = LibraryMenu.getTopParentId(), LibraryBrowser.loadSavedQueryValues(key, pageData.query)), pageData
    }

    function getQuery(context) {
        return getPageData(context).query
    }

    function getSavedQueryKey(context) {
        return context.savedQueryKey || (context.savedQueryKey = LibraryBrowser.getSavedQueryKey("games")), context.savedQueryKey
    }

    function reloadItems(page) {
        loading.show();
        var query = getQuery(page);
        ApiClient.getItems(Dashboard.getCurrentUserId(), query).then(function(result) {
            window.scrollTo(0, 0);
            var html = "";
            $(".listTopPaging", page).html(LibraryBrowser.getQueryPagingHtml({
                startIndex: query.StartIndex,
                limit: query.Limit,
                totalRecordCount: result.TotalRecordCount,
                showLimit: !1,
                filterButton: !0
            }));
            var view = getPageData(page).view;
            "List" == view ? html = listView.getListViewHtml({
                items: result.Items,
                context: "games",
                sortBy: query.SortBy
            }) : "Poster" == view ? html = LibraryBrowser.getPosterViewHtml({
                items: result.Items,
                shape: "auto",
                context: "games",
                showTitle: !0,
                showParentTitle: !0,
                centerText: !0
            }) : "PosterCard" == view && (html = LibraryBrowser.getPosterViewHtml({
                items: result.Items,
                shape: "auto",
                context: "games",
                showTitle: !0,
                showParentTitle: !0,
                cardLayout: !0
            }));
            var elem = page.querySelector("#items");
            elem.innerHTML = html, imageLoader.lazyChildren(elem), $(".btnNextPage", page).on("click", function() {
                query.StartIndex += query.Limit, reloadItems(page)
            }), $(".btnPreviousPage", page).on("click", function() {
                query.StartIndex -= query.Limit, reloadItems(page)
            }), $(".btnFilter", page).on("click", function() {
                showFilterMenu(page)
            }), LibraryBrowser.saveQueryValues(getSavedQueryKey(page), query), loading.hide()
        })
    }

    function showFilterMenu(page) {
        require(["components/filterdialog/filterdialog"], function(filterDialogFactory) {
            var filterDialog = new filterDialogFactory({
                query: getQuery(page),
                mode: "games"
            });
            Events.on(filterDialog, "filterchange", function() {
                reloadItems(page)
            }), filterDialog.show()
        })
    }
    var data = {};
    $(document).on("pageinit", "#gamesPage", function() {
        var page = this;
        $(".alphabetPicker", this).on("alphaselect", function(e, character) {
            var query = getQuery(page);
            query.NameStartsWithOrGreater = character, query.StartIndex = 0, reloadItems(page)
        }).on("alphaclear", function(e) {
            var query = getQuery(page);
            query.NameStartsWithOrGreater = "", reloadItems(page)
        })
    }).on("pagebeforeshow", "#gamesPage", function() {
        var page = this,
            query = getQuery(page);
        query.ParentId = LibraryMenu.getTopParentId();
        var limit = LibraryBrowser.getDefaultPageSize();
        limit != query.Limit && (query.Limit = limit, query.StartIndex = 0);
        var viewkey = getSavedQueryKey(page);
        LibraryBrowser.loadSavedQueryValues(viewkey, query), LibraryBrowser.getSavedViewSetting(viewkey).then(function(val) {
            val ? $("#selectView", page).val(val).trigger("change") : reloadItems(page)
        })
    })
});