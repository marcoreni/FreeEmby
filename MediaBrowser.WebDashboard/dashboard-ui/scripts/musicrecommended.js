define(["layoutManager", "loading", "libraryBrowser", "cardBuilder", "dom", "apphost", "imageLoader", "libraryMenu", "mainTabsManager", "scrollStyles", "emby-itemscontainer", "emby-tabs", "emby-button"], function(layoutManager, loading, libraryBrowser, cardBuilder, dom, appHost, imageLoader, libraryMenu, mainTabsManager) {
    "use strict";

    function itemsPerRow() {
        var screenWidth = dom.getWindowSize().innerWidth;
        return screenWidth >= 1920 ? 9 : screenWidth >= 1200 ? 12 : screenWidth >= 1e3 ? 10 : 8
    }

    function enableScrollX() {
        return !layoutManager.desktop
    }

    function getSquareShape() {
        return enableScrollX() ? "overflowSquare" : "square"
    }

    function loadLatest(page, parentId) {
        loading.show();
        var userId = Dashboard.getCurrentUserId(),
            options = {
                IncludeItemTypes: "Audio",
                Limit: itemsPerRow(),
                Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
                ParentId: parentId,
                ImageTypeLimit: 1,
                EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
                EnableTotalRecordCount: !1
            };
        ApiClient.getJSON(ApiClient.getUrl("Users/" + userId + "/Items/Latest", options)).then(function(items) {
            var elem = page.querySelector("#recentlyAddedSongs"),
                supportsImageAnalysis = appHost.supports("imageanalysis");
            supportsImageAnalysis = !1, elem.innerHTML = cardBuilder.getCardsHtml({
                items: items,
                showUnplayedIndicator: !1,
                showLatestItemsPopup: !1,
                shape: getSquareShape(),
                showTitle: !0,
                showParentTitle: !0,
                lazy: !0,
                centerText: !supportsImageAnalysis,
                overlayPlayButton: !supportsImageAnalysis,
                allowBottomPadding: !enableScrollX(),
                cardLayout: supportsImageAnalysis,
                vibrant: supportsImageAnalysis
            }), imageLoader.lazyChildren(elem), loading.hide()
        })
    }

    function loadRecentlyPlayed(page, parentId) {
        var options = {
            SortBy: "DatePlayed",
            SortOrder: "Descending",
            IncludeItemTypes: "Audio",
            Limit: itemsPerRow(),
            Recursive: !0,
            Fields: "PrimaryImageAspectRatio,AudioInfo",
            Filters: "IsPlayed",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
            EnableTotalRecordCount: !1
        };
        ApiClient.getItems(Dashboard.getCurrentUserId(), options).then(function(result) {
            var elem = page.querySelector("#recentlyPlayed");
            result.Items.length ? elem.classList.remove("hide") : elem.classList.add("hide");
            var itemsContainer = elem.querySelector(".itemsContainer"),
                supportsImageAnalysis = appHost.supports("imageanalysis");
            supportsImageAnalysis = !1, itemsContainer.innerHTML = cardBuilder.getCardsHtml({
                items: result.Items,
                showUnplayedIndicator: !1,
                shape: getSquareShape(),
                showTitle: !0,
                showParentTitle: !0,
                action: "instantmix",
                lazy: !0,
                centerText: !supportsImageAnalysis,
                overlayMoreButton: !supportsImageAnalysis,
                allowBottomPadding: !enableScrollX(),
                cardLayout: supportsImageAnalysis,
                vibrant: supportsImageAnalysis
            }), imageLoader.lazyChildren(itemsContainer)
        })
    }

    function loadFrequentlyPlayed(page, parentId) {
        var options = {
            SortBy: "PlayCount",
            SortOrder: "Descending",
            IncludeItemTypes: "Audio",
            Limit: itemsPerRow(),
            Recursive: !0,
            Fields: "PrimaryImageAspectRatio,AudioInfo",
            Filters: "IsPlayed",
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
            EnableTotalRecordCount: !1
        };
        ApiClient.getItems(Dashboard.getCurrentUserId(), options).then(function(result) {
            var elem = page.querySelector("#topPlayed");
            result.Items.length ? elem.classList.remove("hide") : elem.classList.add("hide");
            var itemsContainer = elem.querySelector(".itemsContainer"),
                supportsImageAnalysis = appHost.supports("imageanalysis");
            supportsImageAnalysis = !1, itemsContainer.innerHTML = cardBuilder.getCardsHtml({
                items: result.Items,
                showUnplayedIndicator: !1,
                shape: getSquareShape(),
                showTitle: !0,
                showParentTitle: !0,
                action: "instantmix",
                lazy: !0,
                centerText: !supportsImageAnalysis,
                overlayMoreButton: !supportsImageAnalysis,
                allowBottomPadding: !enableScrollX(),
                cardLayout: supportsImageAnalysis,
                vibrant: supportsImageAnalysis
            }), imageLoader.lazyChildren(itemsContainer)
        })
    }

    function loadPlaylists(page, parentId) {
        var options = {
            SortBy: "SortName",
            SortOrder: "Ascending",
            IncludeItemTypes: "Playlist",
            Recursive: !0,
            Fields: "PrimaryImageAspectRatio,SortName,CumulativeRunTimeTicks,CanDelete",
            StartIndex: 0,
            Limit: itemsPerRow(),
            EnableTotalRecordCount: !1
        };
        ApiClient.getItems(Dashboard.getCurrentUserId(), options).then(function(result) {
            var elem = page.querySelector("#playlists");
            result.Items.length ? elem.classList.remove("hide") : elem.classList.add("hide");
            var itemsContainer = elem.querySelector(".itemsContainer"),
                supportsImageAnalysis = appHost.supports("imageanalysis");
            supportsImageAnalysis = !1, itemsContainer.innerHTML = cardBuilder.getCardsHtml({
                items: result.Items,
                shape: getSquareShape(),
                showTitle: !0,
                lazy: !0,
                coverImage: !0,
                centerText: !supportsImageAnalysis,
                overlayPlayButton: !supportsImageAnalysis,
                allowBottomPadding: !enableScrollX(),
                cardLayout: supportsImageAnalysis,
                vibrant: supportsImageAnalysis
            }), imageLoader.lazyChildren(itemsContainer)
        })
    }

    function loadSuggestionsTab(page, tabContent, parentId) {
        console.log("loadSuggestionsTab"), loadLatest(tabContent, parentId), loadPlaylists(tabContent, parentId), loadRecentlyPlayed(tabContent, parentId), loadFrequentlyPlayed(tabContent, parentId), require(["components/favoriteitems"], function(favoriteItems) {
            favoriteItems.render(tabContent, Dashboard.getCurrentUserId(), parentId, ["favoriteArtists", "favoriteAlbums", "favoriteSongs"])
        })
    }

    function getTabs() {
        return [{
            name: Globalize.translate("TabSuggestions")
        }, {
            name: Globalize.translate("TabAlbums")
        }, {
            name: Globalize.translate("TabAlbumArtists")
        }, {
            name: Globalize.translate("TabArtists")
        }, {
            name: Globalize.translate("TabSongs")
        }, {
            name: Globalize.translate("TabGenres")
        }, {
            name: Globalize.translate("TabFolders")
        }]
    }
    return function(view, params) {
        function reload() {
            loading.show();
            var tabContent = view.querySelector(".pageTabContent[data-index='0']");
            loadSuggestionsTab(view, tabContent, params.topParentId)
        }

        function enableScrollX() {
            return browserInfo.mobile
        }

        function onBeforeTabChange(e) {
            preLoadTab(view, parseInt(e.detail.selectedTabIndex))
        }

        function onTabChange(e) {
            loadTab(view, parseInt(e.detail.selectedTabIndex))
        }

        function initTabs() {
            var tabsReplaced = mainTabsManager.setTabs(view, currentTabIndex, getTabs);
            if (tabsReplaced) {
                var viewTabs = document.querySelector(".tabs-viewmenubar");
                viewTabs.addEventListener("beforetabchange", onBeforeTabChange), viewTabs.addEventListener("tabchange", onTabChange), libraryBrowser.configurePaperLibraryTabs(view, viewTabs, view.querySelectorAll(".pageTabContent"), [0, 4, 5, 6]), viewTabs.triggerBeforeTabChange || viewTabs.addEventListener("ready", function() {
                    viewTabs.triggerBeforeTabChange()
                })
            }
        }

        function getTabController(page, index, callback) {
            var depends = [];
            switch (index) {
                case 0:
                    break;
                case 1:
                    depends.push("scripts/musicalbums");
                    break;
                case 2:
                    depends.push("scripts/musicartists");
                    break;
                case 3:
                    depends.push("scripts/musicartists");
                    break;
                case 4:
                    depends.push("scripts/songs");
                    break;
                case 5:
                    depends.push("scripts/musicgenres");
                    break;
                case 6:
                    depends.push("scripts/musicfolders")
            }
            require(depends, function(controllerFactory) {
                var tabContent;
                0 == index && (tabContent = view.querySelector(".pageTabContent[data-index='" + index + "']"), self.tabContent = tabContent);
                var controller = tabControllers[index];
                controller || (tabContent = view.querySelector(".pageTabContent[data-index='" + index + "']"), controller = index ? new controllerFactory(view, params, tabContent) : self, 2 == index ? controller.mode = "albumartists" : 3 == index && (controller.mode = "artists"), tabControllers[index] = controller, controller.initTab && controller.initTab()), callback(controller)
            })
        }

        function preLoadTab(page, index) {
            getTabController(page, index, function(controller) {
                renderedTabs.indexOf(index) == -1 && controller.preRender && controller.preRender()
            })
        }

        function loadTab(page, index) {
            currentTabIndex = index, getTabController(page, index, function(controller) {
                renderedTabs.indexOf(index) == -1 && (renderedTabs.push(index), controller.renderTab())
            })
        }
        var self = this,
            currentTabIndex = parseInt(params.tab || "0");
        self.initTab = function() {
            for (var tabContent = view.querySelector(".pageTabContent[data-index='0']"), containers = tabContent.querySelectorAll(".itemsContainer"), i = 0, length = containers.length; i < length; i++) enableScrollX() ? (containers[i].classList.add("hiddenScrollX"), containers[i].classList.remove("vertical-wrap")) : (containers[i].classList.remove("hiddenScrollX"), containers[i].classList.add("vertical-wrap"))
        }, self.renderTab = function() {
            reload()
        };
        var tabControllers = [],
            renderedTabs = [];
        view.addEventListener("viewbeforeshow", function(e) {
            if (initTabs(), !view.getAttribute("data-title")) {
                var parentId = params.topParentId;
                parentId ? ApiClient.getItem(Dashboard.getCurrentUserId(), parentId).then(function(item) {
                    view.setAttribute("data-title", item.Name), libraryMenu.setTitle(item.Name)
                }) : (view.setAttribute("data-title", Globalize.translate("TabMusic")), libraryMenu.setTitle(Globalize.translate("TabMusic")))
            }
            var tabs = mainTabsManager.getTabsElement();
            tabs.triggerBeforeTabChange && tabs.triggerBeforeTabChange()
        }), view.addEventListener("viewshow", function(e) {
            mainTabsManager.getTabsElement().triggerTabChange()
        }), view.addEventListener("viewdestroy", function(e) {
            tabControllers.forEach(function(t) {
                t.destroy && t.destroy()
            })
        })
    }
});