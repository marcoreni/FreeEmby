define(["layoutManager", "loading", "events", "libraryBrowser", "imageLoader", "alphaPicker", "listView", "cardBuilder", "apphost", "emby-itemscontainer"], function(layoutManager, loading, events, libraryBrowser, imageLoader, alphaPicker, listView, cardBuilder, appHost) {
    "use strict";
    return function(view, params, tabContent) {
        function getPageData(context) {
            var key = getSavedQueryKey(context),
                pageData = data[key];
            return pageData || (pageData = data[key] = {
                query: {
                    SortBy: "SortName",
                    SortOrder: "Ascending",
                    Recursive: !0,
                    Fields: "PrimaryImageAspectRatio,SortName,BasicSyncInfo",
                    StartIndex: 0,
                    ImageTypeLimit: 1,
                    EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
                    Limit: LibraryBrowser.getDefaultPageSize()
                },
                view: libraryBrowser.getSavedView(key) || "Poster"
            }, pageData.query.ParentId = params.topParentId, libraryBrowser.loadSavedQueryValues(key, pageData.query)), pageData
        }

        function getQuery(context) {
            return getPageData(context).query
        }

        function getSavedQueryKey(context) {
            return context.savedQueryKey || (context.savedQueryKey = LibraryBrowser.getSavedQueryKey(self.mode)), context.savedQueryKey
        }

        function onViewStyleChange() {
            var viewStyle = self.getCurrentViewStyle(),
                itemsContainer = tabContent.querySelector(".itemsContainer");
            "List" == viewStyle ? (itemsContainer.classList.add("vertical-list"), itemsContainer.classList.remove("vertical-wrap")) : (itemsContainer.classList.remove("vertical-list"), itemsContainer.classList.add("vertical-wrap")), itemsContainer.innerHTML = ""
        }

        function reloadItems(page) {
            loading.show();
            var query = getQuery(page),
                promise = "albumartists" == self.mode ? ApiClient.getAlbumArtists(Dashboard.getCurrentUserId(), query) : ApiClient.getArtists(Dashboard.getCurrentUserId(), query);
            promise.then(function(result) {
                function onNextPageClick() {
                    query.StartIndex += query.Limit, reloadItems(tabContent)
                }

                function onPreviousPageClick() {
                    query.StartIndex -= query.Limit, reloadItems(tabContent)
                }
                window.scrollTo(0, 0), updateFilterControls(page);
                var html, pagingHtml = LibraryBrowser.getQueryPagingHtml({
                        startIndex: query.StartIndex,
                        limit: query.Limit,
                        totalRecordCount: result.TotalRecordCount,
                        showLimit: !1,
                        updatePageSizeSetting: !1,
                        addLayoutButton: !1,
                        sortButton: !1,
                        filterButton: !1
                    }),
                    viewStyle = self.getCurrentViewStyle();
                html = "List" == viewStyle ? listView.getListViewHtml({
                    items: result.Items,
                    sortBy: query.SortBy
                }) : "PosterCard" == viewStyle ? cardBuilder.getCardsHtml({
                    items: result.Items,
                    shape: "square",
                    context: "music",
                    showTitle: !0,
                    coverImage: !0,
                    cardLayout: !0,
                    vibrant: !0
                }) : cardBuilder.getCardsHtml({
                    items: result.Items,
                    shape: "square",
                    context: "music",
                    showTitle: !0,
                    coverImage: !0,
                    lazy: !0,
                    centerText: !0,
                    overlayPlayButton: !0
                });
                var i, length, elems = tabContent.querySelectorAll(".paging");
                for (i = 0, length = elems.length; i < length; i++) elems[i].innerHTML = pagingHtml;
                for (elems = tabContent.querySelectorAll(".btnNextPage"), i = 0, length = elems.length; i < length; i++) elems[i].addEventListener("click", onNextPageClick);
                for (elems = tabContent.querySelectorAll(".btnPreviousPage"), i = 0, length = elems.length; i < length; i++) elems[i].addEventListener("click", onPreviousPageClick);
                var itemsContainer = tabContent.querySelector(".itemsContainer");
                itemsContainer.innerHTML = html, imageLoader.lazyChildren(itemsContainer), libraryBrowser.saveQueryValues(getSavedQueryKey(page), query), loading.hide()
            })
        }

        function updateFilterControls(tabContent) {
            var query = getQuery(tabContent);
            self.alphaPicker.value(query.NameStartsWithOrGreater)
        }

        function initPage(tabContent) {
            var alphaPickerElement = tabContent.querySelector(".alphaPicker");
            if (alphaPickerElement.addEventListener("alphavaluechanged", function(e) {
                    var newValue = e.detail.value,
                        query = getQuery(tabContent);
                    query.NameStartsWithOrGreater = newValue, query.StartIndex = 0, reloadItems(tabContent)
                }), self.alphaPicker = new alphaPicker({
                    element: alphaPickerElement,
                    valueChangeEvent: "click"
                }), layoutManager.desktop || layoutManager.mobile) {
                tabContent.querySelector(".alphaPicker").classList.add("alphabetPicker-right");
                var itemsContainer = tabContent.querySelector(".itemsContainer");
                itemsContainer.classList.remove("padded-left-withalphapicker"), itemsContainer.classList.add("padded-right-withalphapicker")
            }
            tabContent.querySelector(".btnFilter").addEventListener("click", function() {
                self.showFilterMenu()
            });
            var btnSelectView = tabContent.querySelector(".btnSelectView");
            btnSelectView.addEventListener("click", function(e) {
                libraryBrowser.showLayoutMenu(e.target, self.getCurrentViewStyle(), "List,Poster,PosterCard".split(","))
            }), btnSelectView.addEventListener("layoutchange", function(e) {
                var viewStyle = e.detail.viewStyle;
                getPageData(tabContent).view = viewStyle, libraryBrowser.saveViewSetting(getSavedQueryKey(tabContent), viewStyle), getQuery(tabContent).StartIndex = 0, onViewStyleChange(), reloadItems(tabContent)
            })
        }
        var self = this,
            data = {};
        self.showFilterMenu = function() {
            require(["components/filterdialog/filterdialog"], function(filterDialogFactory) {
                var filterDialog = new filterDialogFactory({
                    query: getQuery(tabContent),
                    mode: self.mode
                });
                Events.on(filterDialog, "filterchange", function() {
                    getQuery(tabContent).StartIndex = 0, reloadItems(tabContent)
                }), filterDialog.show()
            })
        }, self.getCurrentViewStyle = function() {
            return getPageData(tabContent).view
        }, initPage(tabContent), onViewStyleChange(), self.renderTab = function() {
            reloadItems(tabContent), updateFilterControls(tabContent)
        }, self.destroy = function() {}
    }
});