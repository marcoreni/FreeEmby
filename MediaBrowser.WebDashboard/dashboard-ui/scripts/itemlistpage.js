define(["layoutManager", "loading", "libraryBrowser", "alphaPicker", "listView", "cardBuilder", "imageLoader", "emby-itemscontainer"], function(layoutManager, loading, libraryBrowser, alphaPicker, listView, cardBuilder, imageLoader) {
    "use strict";
    return function(view, params) {
        function getPageData() {
            var pageData = data;
            if (!pageData) {
                pageData = data = {
                    query: {
                        SortBy: "IsFolder,SortName",
                        SortOrder: "Ascending",
                        Fields: "DateCreated,PrimaryImageAspectRatio,MediaSourceCount",
                        ImageTypeLimit: 1,
                        EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
                        StartIndex: 0,
                        Limit: libraryBrowser.getDefaultPageSize()
                    }
                }, pageData.query.Filters = "", pageData.query.NameStartsWithOrGreater = "";
                var key = getSavedQueryKey();
                pageData.view = libraryBrowser.getSavedView(key) || "Poster", pageData.query.ParentId = params.parentId || null, libraryBrowser.loadSavedQueryValues(key, pageData.query)
            }
            return pageData
        }

        function getQuery() {
            return getPageData().query
        }

        function getSavedQueryKey() {
            return view.savedQueryKey || (view.savedQueryKey = libraryBrowser.getSavedQueryKey("itemsv1")), view.savedQueryKey
        }

        function onViewStyleChange() {
            var viewStyle = getPageData(view).view,
                itemsContainer = view.querySelector("#items");
            "List" == viewStyle ? (itemsContainer.classList.add("vertical-list"), itemsContainer.classList.remove("vertical-wrap")) : (itemsContainer.classList.remove("vertical-list"), itemsContainer.classList.add("vertical-wrap"), itemsContainer.classList.add("centered")), itemsContainer.innerHTML = ""
        }

        function reloadItems() {
            loading.show();
            var query = getQuery(),
                userId = Dashboard.getCurrentUserId(),
                parentItemPromise = query.ParentId ? ApiClient.getItem(userId, query.ParentId) : ApiClient.getRootFolder(userId),
                itemsPromise = ApiClient.getItems(userId, query);
            Promise.all([parentItemPromise, itemsPromise]).then(function(responses) {
                function onNextPageClick() {
                    query.StartIndex += query.Limit, reloadItems(view)
                }

                function onPreviousPageClick() {
                    query.StartIndex -= query.Limit, reloadItems(view)
                }
                var item = responses[0];
                currentItem = item;
                var result = responses[1];
                window.scrollTo(0, 0);
                var viewStyle = getPageData(view).view,
                    html = "",
                    pagingHtml = libraryBrowser.getQueryPagingHtml({
                        startIndex: query.StartIndex,
                        limit: query.Limit,
                        totalRecordCount: result.TotalRecordCount,
                        showLimit: !1,
                        addLayoutButton: !1,
                        currentLayout: viewStyle,
                        sortButton: !1,
                        filterButton: !1
                    });
                updateFilterControls();
                var context = params.context,
                    posterOptions = {
                        items: result.Items,
                        shape: "auto",
                        centerText: !0,
                        lazy: !0,
                        coverImage: "PhotoAlbum" == item.Type,
                        context: "folders"
                    };
                "PosterCard" == viewStyle ? (posterOptions.showTitle = !0, posterOptions.showYear = !0, posterOptions.cardLayout = !0, posterOptions.centerText = !1, posterOptions.vibrant = !0, html = cardBuilder.getCardsHtml(posterOptions)) : "List" == viewStyle ? html = listView.getListViewHtml({
                    items: result.Items,
                    sortBy: query.SortBy
                }) : "Thumb" == viewStyle ? (posterOptions.preferThumb = !0, posterOptions.showTitle = !0, posterOptions.shape = "backdrop", posterOptions.centerText = !0, posterOptions.overlayText = !1, posterOptions.overlayMoreButton = !0, html = cardBuilder.getCardsHtml(posterOptions)) : (posterOptions.showTitle = "photos" != context || "auto", posterOptions.overlayText = "photos" == context, posterOptions.overlayMoreButton = !0, html = cardBuilder.getCardsHtml(posterOptions)), "boxsets" == currentItem.CollectionType ? (view.querySelector(".btnNewCollection").classList.remove("hide"), result.Items.length || (html = '<p style="text-align:center;">' + Globalize.translate("MessageNoCollectionsAvailable") + "</p>")) : view.querySelector(".btnNewCollection").classList.add("hide");
                var elem = view.querySelector("#items");
                elem.innerHTML = html, imageLoader.lazyChildren(elem);
                var i, length, elems = view.querySelectorAll(".paging");
                for (i = 0, length = elems.length; i < length; i++) elems[i].innerHTML = pagingHtml;
                for (elems = view.querySelectorAll(".btnNextPage"), i = 0, length = elems.length; i < length; i++) elems[i].addEventListener("click", onNextPageClick);
                for (elems = view.querySelectorAll(".btnPreviousPage"), i = 0, length = elems.length; i < length; i++) elems[i].addEventListener("click", onPreviousPageClick);
                libraryBrowser.saveQueryValues(params.parentId, query);
                var name = item.Name;
                null != item.IndexNumber && (name = item.IndexNumber + " - " + name), null != item.ParentIndexNumber && (name = item.ParentIndexNumber + "." + name), LibraryMenu.setTitle(name), view.dispatchEvent(new CustomEvent("displayingitem", {
                    detail: {
                        item: item
                    },
                    bubbles: !0
                })), loading.hide()
            })
        }

        function showFilterMenu() {
            require(["components/filterdialog/filterdialog"], function(filterDialogFactory) {
                var filterDialog = new filterDialogFactory({
                    query: getQuery()
                });
                Events.on(filterDialog, "filterchange", function() {
                    reloadItems()
                }), filterDialog.show()
            })
        }

        function updateFilterControls() {
            var query = getQuery();
            self.alphaPicker.value(query.NameStartsWithOrGreater)
        }
        var currentItem, data, alphaPickerElement = view.querySelector(".alphaPicker");
        if (alphaPickerElement.addEventListener("alphavaluechanged", function(e) {
                var newValue = e.detail.value,
                    query = getQuery();
                query.NameStartsWithOrGreater = newValue, query.StartIndex = 0, reloadItems(view)
            }), self.alphaPicker = new alphaPicker({
                element: alphaPickerElement,
                valueChangeEvent: "click"
            }), layoutManager.desktop || layoutManager.mobile) {
            view.querySelector(".alphaPicker").classList.add("alphabetPicker-right");
            var itemsContainer = view.querySelector(".itemsContainer");
            itemsContainer.classList.remove("padded-left-withalphapicker"), itemsContainer.classList.add("padded-right-withalphapicker")
        }
        var btnSelectView = view.querySelector(".btnSelectView");
        btnSelectView.addEventListener("click", function(e) {
            libraryBrowser.showLayoutMenu(e.target, getPageData().view, "List,Poster,PosterCard,Thumb".split(","))
        }), btnSelectView.addEventListener("layoutchange", function(e) {
            var layout = e.detail.viewStyle;
            getPageData().view = layout, libraryBrowser.saveViewSetting(getSavedQueryKey(), layout), onViewStyleChange(), reloadItems(view)
        }), onViewStyleChange(), view.querySelector(".btnFilter").addEventListener("click", function() {
            showFilterMenu()
        }), view.querySelector(".btnSort").addEventListener("click", function() {
            libraryBrowser.showSortMenu({
                items: [{
                    name: Globalize.translate("OptionNameSort"),
                    id: "IsFolder,SortName"
                }, {
                    name: Globalize.translate("OptionCommunityRating"),
                    id: "CommunityRating,SortName"
                }, {
                    name: Globalize.translate("OptionCriticRating"),
                    id: "CriticRating,SortName"
                }, {
                    name: Globalize.translate("OptionDateAdded"),
                    id: "DateCreated,SortName"
                }, {
                    name: Globalize.translate("OptionDatePlayed"),
                    id: "DatePlayed,SortName"
                }, {
                    name: Globalize.translate("OptionParentalRating"),
                    id: "OfficialRating,SortName"
                }, {
                    name: Globalize.translate("OptionPlayCount"),
                    id: "PlayCount,SortName"
                }, {
                    name: Globalize.translate("OptionReleaseDate"),
                    id: "PremiereDate,SortName"
                }, {
                    name: Globalize.translate("OptionRuntime"),
                    id: "Runtime,SortName"
                }],
                callback: function() {
                    reloadItems(view)
                },
                query: getQuery()
            })
        }), view.querySelector(".btnNewCollection").addEventListener("click", function() {
            require(["collectionEditor"], function(collectionEditor) {
                var serverId = ApiClient.serverInfo().Id;
                (new collectionEditor).show({
                    items: [],
                    serverId: serverId
                })
            })
        }), view.addEventListener("viewbeforeshow", function(e) {
            reloadItems(view), updateFilterControls()
        }), view.addEventListener("viewdestroy", function(e) {
            self.alphaPicker && self.alphaPicker.destroy()
        })
    }
});