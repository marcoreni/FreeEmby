define(["layoutManager", "loading", "libraryBrowser", "mainTabsManager", "cardBuilder", "apphost", "imageLoader", "scrollStyles", "emby-itemscontainer", "emby-tabs", "emby-button"], function(layoutManager, loading, libraryBrowser, mainTabsManager, cardBuilder, appHost, imageLoader) {
    "use strict";

    function enableScrollX() {
        return !layoutManager.desktop
    }

    function renderRecordings(elem, recordings, cardOptions) {
        recordings.length ? elem.classList.remove("hide") : elem.classList.add("hide");
        var recordingItems = elem.querySelector(".recordingItems");
        enableScrollX() ? (recordingItems.classList.add("hiddenScrollX"), recordingItems.classList.remove("vertical-wrap")) : (recordingItems.classList.remove("hiddenScrollX"), recordingItems.classList.add("vertical-wrap")), recordingItems.innerHTML = cardBuilder.getCardsHtml(Object.assign({
            items: recordings,
            shape: enableScrollX() ? "autooverflow" : "auto",
            showTitle: !0,
            showParentTitle: !0,
            coverImage: !0,
            allowBottomPadding: !enableScrollX(),
            preferThumb: "auto"
        }, cardOptions || {})), imageLoader.lazyChildren(recordingItems)
    }

    function getBackdropShape() {
        return enableScrollX() ? "overflowBackdrop" : "backdrop"
    }

    function renderActiveRecordings(context, promise) {
        promise.then(function(result) {
            result.Items.length && "InProgress" != result.Items[0].Status && (result.Items = []), renderRecordings(context.querySelector("#activeRecordings"), result.Items, {
                shape: getBackdropShape(),
                showParentTitle: !1,
                showParentTitleOrTitle: !0,
                showTitle: !1,
                showAirTime: !0,
                showAirEndTime: !0,
                showChannelName: !0,
                preferThumb: !0,
                coverImage: !0,
                overlayText: !1,
                centerText: !0,
                overlayMoreButton: !0
            })
        })
    }

    function getPortraitShape() {
        return enableScrollX() ? "overflowPortrait" : "portrait"
    }

    function getLimit() {
        return enableScrollX() ? 12 : 8
    }

    function loadRecommendedPrograms(page) {
        loading.show();
        var limit = getLimit();
        enableScrollX() && (limit *= 2), ApiClient.getLiveTvRecommendedPrograms({
            userId: Dashboard.getCurrentUserId(),
            IsAiring: !0,
            limit: limit,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Thumb,Backdrop",
            EnableTotalRecordCount: !1,
            Fields: "ChannelInfo"
        }).then(function(result) {
            renderItems(page, result.Items, "activeProgramItems", "play", {
                showAirDateTime: !1,
                showAirEndTime: !0
            }), loading.hide()
        })
    }

    function reload(page, enableFullRender) {
        renderActiveRecordings(page, ApiClient.getLiveTvRecordings({
            UserId: Dashboard.getCurrentUserId(),
            IsInProgress: !0,
            Fields: "CanDelete,PrimaryImageAspectRatio,BasicSyncInfo",
            EnableTotalRecordCount: !1,
            EnableImageTypes: "Primary,Thumb,Backdrop"
        })), enableFullRender && (loadRecommendedPrograms(page), ApiClient.getLiveTvRecommendedPrograms({
            userId: Dashboard.getCurrentUserId(),
            IsAiring: !1,
            HasAired: !1,
            limit: getLimit(),
            IsMovie: !1,
            IsSports: !1,
            IsKids: !1,
            IsNews: !1,
            IsSeries: !0,
            EnableTotalRecordCount: !1,
            Fields: "ChannelInfo",
            EnableImageTypes: "Primary,Thumb"
        }).then(function(result) {
            renderItems(page, result.Items, "upcomingEpisodeItems")
        }), ApiClient.getLiveTvRecommendedPrograms({
            userId: Dashboard.getCurrentUserId(),
            IsAiring: !1,
            HasAired: !1,
            limit: getLimit(),
            IsMovie: !0,
            EnableTotalRecordCount: !1,
            Fields: "ChannelInfo",
            EnableImageTypes: "Primary,Thumb"
        }).then(function(result) {
            renderItems(page, result.Items, "upcomingTvMovieItems", null, {
                shape: getPortraitShape(),
                preferThumb: null
            })
        }), ApiClient.getLiveTvRecommendedPrograms({
            userId: Dashboard.getCurrentUserId(),
            IsAiring: !1,
            HasAired: !1,
            limit: getLimit(),
            IsSports: !0,
            EnableTotalRecordCount: !1,
            Fields: "ChannelInfo",
            EnableImageTypes: "Primary,Thumb"
        }).then(function(result) {
            renderItems(page, result.Items, "upcomingSportsItems")
        }), ApiClient.getLiveTvRecommendedPrograms({
            userId: Dashboard.getCurrentUserId(),
            IsAiring: !1,
            HasAired: !1,
            limit: getLimit(),
            IsKids: !0,
            EnableTotalRecordCount: !1,
            Fields: "ChannelInfo",
            EnableImageTypes: "Primary,Thumb"
        }).then(function(result) {
            renderItems(page, result.Items, "upcomingKidsItems")
        }), ApiClient.getLiveTvRecommendedPrograms({
            userId: Dashboard.getCurrentUserId(),
            IsAiring: !1,
            HasAired: !1,
            limit: getLimit(),
            IsMovie: !1,
            IsSports: !1,
            IsKids: !1,
            IsSeries: !1,
            EnableTotalRecordCount: !1,
            Fields: "ChannelInfo",
            EnableImageTypes: "Primary,Thumb"
        }).then(function(result) {
            result.Items.length ? page.querySelector(".upcomingPrograms").classList.remove("hide") : page.querySelector(".upcomingPrograms").classList.add("hide"), renderItems(page, result.Items, "upcomingProgramItems")
        }))
    }

    function renderItems(page, items, sectionClass, overlayButton, cardOptions) {
        cardOptions = cardOptions || {};
        var html = cardBuilder.getCardsHtml(Object.assign({
                items: items,
                preferThumb: !0,
                inheritThumb: !1,
                shape: enableScrollX() ? "overflowBackdrop" : "backdrop",
                showParentTitleOrTitle: !0,
                showTitle: !1,
                centerText: !0,
                coverImage: !0,
                overlayText: !1,
                lazy: !0,
                overlayMoreButton: "play" != overlayButton,
                overlayPlayButton: "play" == overlayButton,
                allowBottomPadding: !enableScrollX(),
                showAirTime: !0,
                showAirDateTime: !0,
                showChannelName: !0
            }, cardOptions)),
            elem = page.querySelector("." + sectionClass);
        elem.innerHTML = html, imageLoader.lazyChildren(elem)
    }

    function getTabs() {
        return [{
            name: Globalize.translate("TabSuggestions")
        }, {
            name: Globalize.translate("TabGuide")
        }, {
            name: Globalize.translate("TabChannels")
        }, {
            name: Globalize.translate("TabRecordings")
        }, {
            name: Globalize.translate("HeaderSchedule")
        }, {
            name: Globalize.translate("TabSeries")
        }]
    }
    return function(view, params) {
        function enableFullRender() {
            return (new Date).getTime() - lastFullRender > 3e5
        }

        function onBeforeTabChange(e) {
            preLoadTab(view, parseInt(e.detail.selectedTabIndex))
        }

        function onTabChange(e) {
            var previousTabController = tabControllers[parseInt(e.detail.previousIndex)];
            previousTabController && previousTabController.onHide && previousTabController.onHide(), loadTab(view, parseInt(e.detail.selectedTabIndex))
        }

        function initTabs() {
            var tabsReplaced = mainTabsManager.setTabs(view, currentTabIndex, getTabs);
            if (tabsReplaced) {
                var viewTabs = document.querySelector(".tabs-viewmenubar");
                viewTabs.addEventListener("beforetabchange", onBeforeTabChange), viewTabs.addEventListener("tabchange", onTabChange), libraryBrowser.configurePaperLibraryTabs(view, viewTabs, view.querySelectorAll(".pageTabContent"), [0, 2, 3, 4, 5]), viewTabs.triggerBeforeTabChange || viewTabs.addEventListener("ready", function() {
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
                    depends.push("scripts/livetvguide");
                    break;
                case 2:
                    depends.push("scripts/livetvchannels");
                    break;
                case 3:
                    depends.push("scripts/livetvrecordings");
                    break;
                case 4:
                    depends.push("scripts/livetvschedule");
                    break;
                case 5:
                    depends.push("scripts/livetvseriestimers")
            }
            require(depends, function(controllerFactory) {
                var tabContent;
                0 == index && (tabContent = view.querySelector(".pageTabContent[data-index='" + index + "']"), self.tabContent = tabContent);
                var controller = tabControllers[index];
                controller || (tabContent = view.querySelector(".pageTabContent[data-index='" + index + "']"), controller = index ? new controllerFactory(view, params, tabContent) : self, tabControllers[index] = controller, controller.initTab && controller.initTab()), callback(controller)
            })
        }

        function preLoadTab(page, index) {
            getTabController(page, index, function(controller) {
                renderedTabs.indexOf(index) == -1 && controller.preRender && controller.preRender()
            })
        }

        function loadTab(page, index) {
            currentTabIndex = index, getTabController(page, index, function(controller) {
                1 === index ? document.body.classList.add("autoScrollY") : document.body.classList.remove("autoScrollY"), renderedTabs.indexOf(index) == -1 ? (1 === index && renderedTabs.push(index), controller.renderTab()) : controller.onShow && controller.onShow(), currentTabController = controller
            })
        }
        var self = this,
            currentTabIndex = parseInt(params.tab || "0"),
            lastFullRender = 0;
        self.initTab = function() {
            for (var tabContent = view.querySelector(".pageTabContent[data-index='0']"), containers = tabContent.querySelectorAll(".itemsContainer"), i = 0, length = containers.length; i < length; i++) enableScrollX() ? (containers[i].classList.add("hiddenScrollX"), containers[i].classList.remove("vertical-wrap")) : (containers[i].classList.remove("hiddenScrollX"), containers[i].classList.add("vertical-wrap"))
        }, self.renderTab = function() {
            var tabContent = view.querySelector(".pageTabContent[data-index='0']");
            enableFullRender() ? (reload(tabContent, !0), lastFullRender = (new Date).getTime()) : reload(tabContent)
        };
        var currentTabController, tabControllers = [],
            renderedTabs = [];
        view.addEventListener("viewbeforeshow", function(e) {
            initTabs();
            var tabs = mainTabsManager.getTabsElement();
            tabs.triggerBeforeTabChange && tabs.triggerBeforeTabChange()
        }), view.addEventListener("viewshow", function(e) {
            mainTabsManager.getTabsElement().triggerTabChange()
        }), view.addEventListener("viewbeforehide", function(e) {
            currentTabController && currentTabController.onHide && currentTabController.onHide(), document.body.classList.remove("autoScrollY")
        }), view.addEventListener("viewdestroy", function(e) {
            tabControllers.forEach(function(t) {
                t.destroy && t.destroy()
            })
        })
    }
});