define(["loading", "libraryBrowser", "libraryMenu", "playbackManager", "mainTabsManager", "homeSections", "emby-button"], function(loading, libraryBrowser, libraryMenu, playbackManager, mainTabsManager, homeSections) {
    "use strict";

    function displayPreferencesKey() {
        return AppInfo.isNativeApp ? "Emby Mobile" : "webclient"
    }

    function dismissWelcome(page, userId) {
        getDisplayPreferences("home", userId).then(function(result) {
            result.CustomPrefs[homePageTourKey] = homePageDismissValue, ApiClient.updateDisplayPreferences("home", result, userId, displayPreferencesKey())
        })
    }

    function showWelcomeIfNeeded(page, displayPreferences) {
        if (displayPreferences.CustomPrefs[homePageTourKey] == homePageDismissValue) page.querySelector(".welcomeMessage").classList.add("hide");
        else {
            loading.hide();
            var elem = page.querySelector(".welcomeMessage");
            elem.classList.remove("hide"), displayPreferences.CustomPrefs[homePageTourKey] ? (elem.querySelector(".tourHeader").innerHTML = Globalize.translate("HeaderWelcomeBack"), elem.querySelector(".tourButtonText").innerHTML = Globalize.translate("ButtonTakeTheTourToSeeWhatsNew")) : (elem.querySelector(".tourHeader").innerHTML = Globalize.translate("HeaderWelcomeToProjectWebClient"), elem.querySelector(".tourButtonText").innerHTML = Globalize.translate("ButtonTakeTheTour"))
        }
    }

    function takeTour(page, userId) {
        require(["slideshow"], function() {
            var slides = [{
                imageUrl: "css/images/tour/web/tourcontent.jpg",
                title: Globalize.translate("WebClientTourContent")
            }, {
                imageUrl: "css/images/tour/web/tourmovies.jpg",
                title: Globalize.translate("WebClientTourMovies")
            }, {
                imageUrl: "css/images/tour/web/tourmouseover.jpg",
                title: Globalize.translate("WebClientTourMouseOver")
            }, {
                imageUrl: "css/images/tour/web/tourtaphold.jpg",
                title: Globalize.translate("WebClientTourTapHold")
            }, {
                imageUrl: "css/images/tour/web/tourmysync.png",
                title: Globalize.translate("WebClientTourMySync")
            }, {
                imageUrl: "css/images/tour/web/toureditor.png",
                title: Globalize.translate("WebClientTourMetadataManager")
            }, {
                imageUrl: "css/images/tour/web/tourplaylist.png",
                title: Globalize.translate("WebClientTourPlaylists")
            }, {
                imageUrl: "css/images/tour/web/tourcollections.jpg",
                title: Globalize.translate("WebClientTourCollections")
            }, {
                imageUrl: "css/images/tour/web/tourusersettings1.png",
                title: Globalize.translate("WebClientTourUserPreferences1")
            }, {
                imageUrl: "css/images/tour/web/tourusersettings2.png",
                title: Globalize.translate("WebClientTourUserPreferences2")
            }, {
                imageUrl: "css/images/tour/web/tourusersettings3.png",
                title: Globalize.translate("WebClientTourUserPreferences3")
            }, {
                imageUrl: "css/images/tour/web/tourusersettings4.png",
                title: Globalize.translate("WebClientTourUserPreferences4")
            }, {
                imageUrl: "css/images/tour/web/tourmobile1.jpg",
                title: Globalize.translate("WebClientTourMobile1")
            }, {
                imageUrl: "css/images/tour/web/tourmobile2.png",
                title: Globalize.translate("WebClientTourMobile2")
            }, {
                imageUrl: "css/images/tour/enjoy.jpg",
                title: Globalize.translate("MessageEnjoyYourStay")
            }];
            require(["slideshow"], function(slideshow) {
                var newSlideShow = new slideshow({
                    slides: slides,
                    interactive: !0,
                    loop: !1
                });
                newSlideShow.show(), dismissWelcome(page, userId), page.querySelector(".welcomeMessage").classList.add("hide")
            })
        })
    }

    function getRequirePromise(deps) {
        return new Promise(function(resolve, reject) {
            require(deps, resolve)
        })
    }

    function loadHomeTab(page, tabContent) {
        if (window.ApiClient) {
            var userId = Dashboard.getCurrentUserId();
            loading.show();
            var promises = [Dashboard.getCurrentUser(), getRequirePromise(["userSettings"])];
            Promise.all(promises).then(function(responses) {
                var user = responses[0],
                    userSettings = responses[1];
                homeSections.loadSections(tabContent.querySelector(".sections"), ApiClient, user, userSettings).then(function() {
                    loading.hide()
                })
            }), AppInfo.isNativeApp || getDisplayPreferences("home", userId).then(function(displayPreferences) {
                showWelcomeIfNeeded(page, displayPreferences)
            })
        }
    }

    function getDisplayPreferences(key, userId) {
        return ApiClient.getDisplayPreferences(key, userId, displayPreferencesKey())
    }

    function getTabs() {
        return [{
            name: Globalize.translate("TabHome")
        }, {
            name: Globalize.translate("TabFavorites")
        }, {
            name: Globalize.translate("TabUpcoming")
        }]
    }
    var homePageDismissValue = "14",
        homePageTourKey = "homePageTour";
    return function(view, params) {
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
                viewTabs.addEventListener("beforetabchange", onBeforeTabChange), viewTabs.addEventListener("tabchange", onTabChange), libraryBrowser.configurePaperLibraryTabs(view, viewTabs, view.querySelectorAll(".pageTabContent"), [0, 1, 2, 3], !0), viewTabs.triggerBeforeTabChange || viewTabs.addEventListener("ready", function() {
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
                    depends.push("scripts/homefavorites");
                    break;
                case 2:
                    depends.push("scripts/homeupcoming");
                    break;
                default:
                    return
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
                renderedTabs.indexOf(index) == -1 && (renderedTabs.push(index), controller.renderTab())
            })
        }

        function onPlaybackStop(e, state) {
            state.NowPlayingItem && "Video" == state.NowPlayingItem.MediaType && (renderedTabs = [], mainTabsManager.getTabsElement().triggerBeforeTabChange(), mainTabsManager.getTabsElement().triggerTabChange())
        }

        function onWebSocketMessage(e, data) {
            var msg = data;
            "UserDataChanged" === msg.MessageType && msg.Data.UserId == Dashboard.getCurrentUserId() && (renderedTabs = [])
        }
        var self = this,
            currentTabIndex = parseInt(params.tab || "0");
        self.renderTab = function() {
            var tabContent = view.querySelector(".pageTabContent[data-index='0']");
            loadHomeTab(view, tabContent)
        };
        var tabControllers = [],
            renderedTabs = [];
        view.querySelector(".btnTakeTour").addEventListener("click", function() {
            takeTour(view, Dashboard.getCurrentUserId())
        }), view.querySelector(".sections").addEventListener("settingschange", function() {
            renderedTabs = [], mainTabsManager.getTabsElement().triggerBeforeTabChange(), mainTabsManager.getTabsElement().triggerTabChange()
        }), view.addEventListener("viewbeforeshow", function(e) {
            initTabs(), libraryMenu.setDefaultTitle();
            var tabs = mainTabsManager.getTabsElement();
            tabs.triggerBeforeTabChange && tabs.triggerBeforeTabChange()
        }), view.addEventListener("viewshow", function(e) {
            mainTabsManager.getTabsElement().triggerTabChange(), Events.on(playbackManager, "playbackstop", onPlaybackStop), Events.on(ApiClient, "websocketmessage", onWebSocketMessage)
        }), view.addEventListener("viewbeforehide", function(e) {
            Events.off(playbackManager, "playbackstop", onPlaybackStop), Events.off(ApiClient, "websocketmessage", onWebSocketMessage)
        }), view.addEventListener("viewdestroy", function(e) {
            tabControllers.forEach(function(t) {
                t.destroy && t.destroy()
            })
        })
    }
});