define(["cardBuilder", "appSettings", "dom", "apphost", "layoutManager", "imageLoader", "globalize", "itemShortcuts", "itemHelper", "embyRouter", "emby-button", "paper-icon-button-light", "emby-itemscontainer", "emby-scroller", "emby-linkbutton"], function(cardBuilder, appSettings, dom, appHost, layoutManager, imageLoader, globalize, itemShortcuts, itemHelper, embyRouter) {
    "use strict";

    function getDefaultSection(index) {
        switch (index) {
            case 0:
                return "smalllibrarytiles";
            case 1:
                return "activerecordings";
            case 2:
                return "resume";
            case 3:
                return "resumeaudio";
            case 4:
                return "nextup";
            case 5:
                return "onnow";
            case 6:
                return "latestmedia";
            case 7:
                return "none";
            default:
                return ""
        }
    }

    function loadSections(elem, apiClient, user, userSettings) {
        var i, length, sectionCount = 7,
            html = "";
        for (i = 0, length = sectionCount; i < length; i++) html += '<div class="verticalSection section' + i + '"></div>';
        elem.innerHTML = html, elem.classList.add("homeSectionsContainer");
        var promises = [];
        for (i = 0, length = sectionCount; i < length; i++) promises.push(loadSection(elem, apiClient, user, userSettings, i));
        return Promise.all(promises)
    }

    function loadSection(page, apiClient, user, userSettings, index) {
        var userId = user.Id,
            section = userSettings.get("homesection" + index) || getDefaultSection(index);
        "folders" === section && (section = getDefaultSection()[0]);
        var elem = page.querySelector(".section" + index);
        return "latestmedia" === section ? loadRecentlyAdded(elem, apiClient, user) : "librarytiles" === section || "smalllibrarytiles" === section || "smalllibrarytiles-automobile" === section || "librarytiles-automobile" === section ? loadLibraryTiles(elem, apiClient, user, userSettings, "smallBackdrop") : "librarybuttons" === section ? loadlibraryButtons(elem, apiClient, userId, userSettings) : "resume" === section ? loadResumeVideo(elem, apiClient, userId) : "resumeaudio" === section ? loadResumeAudio(elem, apiClient, userId) : "activerecordings" === section ? loadActiveRecordings(elem, apiClient, userId) : "nextup" === section ? loadNextUp(elem, apiClient, userId) : "onnow" === section ? loadOnNow(elem, apiClient, user) : "latesttvrecordings" === section ? loadLatestLiveTvRecordings(elem, apiClient, userId) : "latestchannelmedia" === section ? loadLatestChannelMedia(elem, apiClient, userId) : (elem.innerHTML = "", Promise.resolve())
    }

    function getUserViews(apiClient, userId) {
        return apiClient.getUserViews({}, userId || apiClient.getCurrentUserId()).then(function(result) {
            return result.Items
        })
    }

    function enableScrollX() {
        return !layoutManager.desktop
    }

    function getSquareShape() {
        return enableScrollX() ? "overflowSquare" : "square"
    }

    function getThumbShape() {
        return enableScrollX() ? "overflowBackdrop" : "backdrop"
    }

    function getPortraitShape() {
        return enableScrollX() ? "overflowPortrait" : "portrait"
    }

    function getLibraryButtonsHtml(items) {
        var html = "";
        html += '<div class="sectionTitleContainer">', html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate("sharedcomponents#HeaderMyMedia") + "</h2>", layoutManager.tv || (html += '<button type="button" is="paper-icon-button-light" class="sectionTitleIconButton btnHomeScreenSettings"><i class="md-icon">&#xE8B8;</i></button>'), html += "</div>", html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x" data-multiselect="false">';
        for (var i = 0, length = items.length; i < length; i++) {
            var icon, item = items[i];
            switch (item.CollectionType) {
                case "movies":
                    icon = "local_movies";
                    break;
                case "music":
                    icon = "library_music";
                    break;
                case "photos":
                    icon = "photo";
                    break;
                case "livetv":
                    icon = "live_tv";
                    break;
                case "tvshows":
                    icon = "live_tv";
                    break;
                case "games":
                    icon = "folder";
                    break;
                case "trailers":
                    icon = "local_movies";
                    break;
                case "homevideos":
                    icon = "video_library";
                    break;
                case "musicvideos":
                    icon = "video_library";
                    break;
                case "books":
                    icon = "folder";
                    break;
                case "channels":
                    icon = "folder";
                    break;
                case "playlists":
                    icon = "folder";
                    break;
                default:
                    icon = "folder"
            }
            html += '<a is="emby-linkbutton" href="' + embyRouter.getRouteUrl(item) + '" class="raised homeLibraryButton"><i class="md-icon">' + icon + "</i><span>" + item.Name + "</span></a>"
        }
        return html += "</div>"
    }

    function loadlibraryButtons(elem, apiClient, userId, userSettings) {
        return getUserViews(apiClient, userId).then(function(items) {
            var html = getLibraryButtonsHtml(items);
            return getAppInfo(apiClient).then(function(infoHtml) {
                elem.innerHTML = html + infoHtml, bindHomeScreenSettingsIcon(elem, apiClient, userId, userSettings), infoHtml && bindAppInfoEvents(elem)
            })
        })
    }

    function bindAppInfoEvents(elem) {
        getRequirePromise(["registrationServices"]).then(function(registrationServices) {
            elem.querySelector(".appInfoSection").addEventListener("click", function(e) {
                dom.parentWithClass(e.target, "card") && registrationServices.showPremiereInfo()
            })
        })
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min
    }

    function getAppInfo(apiClient) {
        var frequency = 1728e5,
            cacheKey = "lastappinfopresent5",
            lastDatePresented = parseInt(appSettings.get(cacheKey) || "0");
        return lastDatePresented ? (new Date).getTime() - lastDatePresented < frequency ? Promise.resolve("") : getRequirePromise(["registrationServices"]).then(function(registrationServices) {
            return registrationServices.validateFeature("dvr", {
                showDialog: !1
            }).then(function() {
                return appSettings.set(cacheKey, (new Date).getTime()), ""
            }, function() {
                appSettings.set(cacheKey, (new Date).getTime());
                var infos = [getPremiereInfo];
                return appHost.supports("otherapppromotions") && infos.push(getTheaterInfo), infos[getRandomInt(0, infos.length - 1)]()
            })
        }) : (appSettings.set(cacheKey, (new Date).getTime()), Promise.resolve(""))
    }

    function getCard(img, shape) {
        shape = shape || "backdropCard";
        var html = '<div class="card scalableCard ' + shape + " " + shape + '-scalable"><div class="cardBox"><div class="cardScalable"><div class="cardPadder cardPadder-backdrop"></div>';
        return html += '<div class="cardContent">', html += '<div class="cardImage lazy" data-src="' + img + '"></div>', html += "</div>", html += "</div></div></div>"
    }

    function getTheaterInfo() {
        var html = "";
        html += '<div class="verticalSection appInfoSection">', html += '<div class="sectionTitleContainer">', html += '<h2 class="sectionTitle sectionTitle-cards padded-left">Discover Emby Theater</h2>', html += '<button is="paper-icon-button-light" class="sectionTitleButton" onclick="this.parentNode.parentNode.remove();" class="autoSize"><i class="md-icon">close</i></button>', html += "</div>";
        var nameText = "Emby Theater";
        return html += '<div class="padded-left padded-right">', html += '<p class="sectionTitle-cards">A beautiful app for your TV and large screen tablet. ' + nameText + " runs on Windows, Xbox One, Raspberry Pi, Samsung Smart TVs, Sony PS4, Web Browsers, and more.</p>", html += '<div class="itemsContainer vertical-wrap">', html += getCard("https://raw.githubusercontent.com/MediaBrowser/Emby.Resources/master/apps/theater1.png"), html += getCard("https://raw.githubusercontent.com/MediaBrowser/Emby.Resources/master/apps/theater2.png"), html += getCard("https://raw.githubusercontent.com/MediaBrowser/Emby.Resources/master/apps/theater3.png"), html += "</div>", html += "</div>", html += "</div>"
    }

    function getPremiereInfo() {
        var html = "";
        return html += '<div class="verticalSection appInfoSection">', html += '<div class="sectionTitleContainer">', html += '<h2 class="sectionTitle sectionTitle-cards padded-left">Discover Emby Premiere</h2>', html += '<button is="paper-icon-button-light" class="sectionTitleButton" onclick="this.parentNode.parentNode.remove();" class="autoSize"><i class="md-icon">close</i></button>', html += "</div>", html += '<div class="padded-left padded-right">', html += '<p class="sectionTitle-cards">Enjoy Emby DVR, get free access to Emby apps, and more.</p>', html += '<div class="itemsContainer vertical-wrap">', html += getCard("https://raw.githubusercontent.com/MediaBrowser/Emby.Resources/master/apps/theater1.png"), html += getCard("https://raw.githubusercontent.com/MediaBrowser/Emby.Resources/master/apps/theater2.png"), html += getCard("https://raw.githubusercontent.com/MediaBrowser/Emby.Resources/master/apps/theater3.png"), html += "</div>", html += "</div>", html += "</div>"
    }

    function renderLatestSection(elem, apiClient, user, parent) {
        var limit = 12;
        enableScrollX() || (limit = "tvshows" === parent.CollectionType ? 5 : "music" === parent.CollectionType ? 9 : 8);
        var options = {
            Limit: limit,
            Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb",
            ParentId: parent.Id
        };
        return apiClient.getJSON(apiClient.getUrl("Users/" + user.Id + "/Items/Latest", options)).then(function(items) {
            var html = "";
            if (items.length) {
                html += '<div class="sectionTitleContainer">', html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate("sharedcomponents#LatestFromLibrary", parent.Name) + "</h2>", layoutManager.tv || (html += '<a is="emby-linkbutton" href="' + embyRouter.getRouteUrl(parent, {
                    section: "latest"
                }) + '" class="raised raised-mini sectionTitleButton btnMore">' + globalize.translate("sharedcomponents#More") + "</a>"), html += "</div>", html += enableScrollX() ? '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true"><div is="emby-itemscontainer" class="scrollSlider focuscontainer-x padded-left padded-right">' : '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x">';
                var viewType = parent.CollectionType,
                    shape = "movies" === viewType ? getPortraitShape() : "music" === viewType ? getSquareShape() : getThumbShape(),
                    supportsImageAnalysis = appHost.supports("imageanalysis");
                supportsImageAnalysis = !1;
                var cardLayout = supportsImageAnalysis && ("music" === viewType || "movies" === viewType || "tvshows" === viewType || "musicvideos" === viewType || !viewType);
                html += cardBuilder.getCardsHtml({
                    items: items,
                    shape: shape,
                    preferThumb: "movies" !== viewType && "music" !== viewType,
                    showUnplayedIndicator: !1,
                    showChildCountIndicator: !0,
                    context: "home",
                    overlayText: !1,
                    centerText: !cardLayout,
                    overlayPlayButton: "photos" !== viewType,
                    allowBottomPadding: !enableScrollX() && !cardLayout,
                    cardLayout: cardLayout,
                    showTitle: "music" === viewType || "tvshows" === viewType || "movies" === viewType || !viewType || cardLayout,
                    showYear: "movies" === viewType || "tvshows" === viewType || !viewType,
                    showParentTitle: "music" === viewType || "tvshows" === viewType || !viewType || cardLayout && "tvshows" === viewType,
                    vibrant: supportsImageAnalysis && cardLayout,
                    lines: 2
                }), enableScrollX() && (html += "</div>"), html += "</div>"
            }
            elem.innerHTML = html, imageLoader.lazyChildren(elem)
        })
    }

    function loadRecentlyAdded(elem, apiClient, user) {
        return elem.classList.remove("verticalSection"), getUserViews(apiClient, user.Id).then(function(items) {
            for (var excludeViewTypes = ["playlists", "livetv", "boxsets", "channels"], excludeItemTypes = ["Channel"], i = 0, length = items.length; i < length; i++) {
                var item = items[i];
                if (user.Configuration.LatestItemsExcludes.indexOf(item.Id) === -1 && excludeViewTypes.indexOf(item.CollectionType || []) === -1 && excludeItemTypes.indexOf(item.Type) === -1) {
                    var frag = document.createElement("div");
                    frag.classList.add("verticalSection"), elem.appendChild(frag), renderLatestSection(frag, apiClient, user, item)
                }
            }
        })
    }

    function loadLatestChannelMedia(elem, apiClient, userId) {
        var screenWidth = dom.getWindowSize().innerWidth,
            options = {
                Limit: enableScrollX() ? 12 : screenWidth >= 2400 ? 10 : screenWidth >= 1600 ? 10 : screenWidth >= 1440 ? 8 : screenWidth >= 800 ? 7 : 6,
                Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
                Filters: "IsUnplayed",
                UserId: userId
            };
        return apiClient.getJSON(apiClient.getUrl("Channels/Items/Latest", options)).then(function(result) {
            var html = "";
            result.Items.length && (html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate("sharedcomponents#HeaderLatestChannelMedia") + "</h2>", html += enableScrollX() ? '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true"><div is="emby-itemscontainer" class="scrollSlider focuscontainer-x padded-left padded-right">' : '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x">', html += cardBuilder.getCardsHtml({
                items: result.Items,
                shape: "auto",
                showTitle: !0,
                centerText: !0,
                lazy: !0,
                showDetailsMenu: !0,
                overlayPlayButton: !0
            }), enableScrollX() && (html += "</div>")), elem.innerHTML = html, imageLoader.lazyChildren(elem)
        })
    }

    function getRequirePromise(deps) {
        return new Promise(function(resolve, reject) {
            require(deps, resolve)
        })
    }

    function showHomeScreenSettings(elem, options) {
        return getRequirePromise(["homescreenSettingsDialog"]).then(function(homescreenSettingsDialog) {
            return homescreenSettingsDialog.show(options).then(function() {
                dom.parentWithClass(elem, "homeSectionsContainer").dispatchEvent(new CustomEvent("settingschange", {
                    cancelable: !1
                }))
            })
        })
    }

    function bindHomeScreenSettingsIcon(elem, apiClient, userId, userSettings) {
        var btnHomeScreenSettings = elem.querySelector(".btnHomeScreenSettings");
        btnHomeScreenSettings && btnHomeScreenSettings.addEventListener("click", function() {
            showHomeScreenSettings(elem, {
                serverId: apiClient.serverId(),
                userId: userId,
                userSettings: userSettings
            })
        })
    }

    function loadLibraryTiles(elem, apiClient, user, userSettings, shape) {
        return getUserViews(apiClient, user.Id).then(function(items) {
            var html = "";
            if (html += "<div>", items.length) {
                html += '<div class="sectionTitleContainer">', html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate("sharedcomponents#HeaderMyMedia") + "</h2>", layoutManager.tv || (html += '<button type="button" is="paper-icon-button-light" class="sectionTitleIconButton btnHomeScreenSettings"><i class="md-icon">&#xE8B8;</i></button>'), html += "</div>";
                var scrollX = enableScrollX();
                html += enableScrollX() ? '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true"><div is="emby-itemscontainer" class="scrollSlider focuscontainer-x padded-left padded-right">' : '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x">', html += cardBuilder.getCardsHtml({
                    items: items,
                    shape: scrollX ? "overflowSmallBackdrop" : shape,
                    showTitle: !0,
                    centerText: !0,
                    overlayText: !1,
                    lazy: !0,
                    transition: !1,
                    allowBottomPadding: !scrollX
                }), enableScrollX() && (html += "</div>"), html += "</div>"
            }
            return html += "</div>", getAppInfo(apiClient).then(function(infoHtml) {
                elem.innerHTML = html + infoHtml, bindHomeScreenSettingsIcon(elem, apiClient, user.Id, userSettings), infoHtml && bindAppInfoEvents(elem), imageLoader.lazyChildren(elem)
            })
        })
    }

    function loadResumeVideo(elem, apiClient, userId) {
        var limit, screenWidth = dom.getWindowSize().innerWidth;
        enableScrollX() ? limit = 12 : (limit = screenWidth >= 1920 ? 8 : screenWidth >= 1600 ? 8 : screenWidth >= 1200 ? 9 : 6, limit = Math.min(limit, 5));
        var options = {
            SortBy: "DatePlayed",
            SortOrder: "Descending",
            Filters: "IsResumable",
            Limit: limit,
            Recursive: !0,
            Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
            CollapseBoxSetItems: !1,
            ExcludeLocationTypes: "Virtual",
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb",
            EnableTotalRecordCount: !1,
            MediaTypes: "Video"
        };
        return apiClient.getItems(userId, options).then(function(result) {
            var html = "";
            if (result.Items.length) {
                html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate("sharedcomponents#HeaderContinueWatching") + "</h2>", html += enableScrollX() ? '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true"><div is="emby-itemscontainer" class="scrollSlider focuscontainer-x padded-left padded-right">' : '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x">';
                var supportsImageAnalysis = appHost.supports("imageanalysis");
                supportsImageAnalysis = !1;
                var cardLayout = supportsImageAnalysis;
                html += cardBuilder.getCardsHtml({
                    items: result.Items,
                    preferThumb: !0,
                    shape: getThumbShape(),
                    overlayText: !1,
                    showTitle: !0,
                    showParentTitle: !0,
                    lazy: !0,
                    showDetailsMenu: !0,
                    overlayPlayButton: !0,
                    context: "home",
                    centerText: !cardLayout,
                    allowBottomPadding: !1,
                    cardLayout: cardLayout,
                    showYear: !0,
                    lines: 2,
                    vibrant: cardLayout && supportsImageAnalysis
                }), enableScrollX() && (html += "</div>"), html += "</div>"
            }
            elem.innerHTML = html, imageLoader.lazyChildren(elem)
        })
    }

    function loadResumeAudio(elem, apiClient, userId) {
        var limit, screenWidth = dom.getWindowSize().innerWidth;
        enableScrollX() ? limit = 12 : (limit = screenWidth >= 1920 ? 8 : screenWidth >= 1600 ? 8 : screenWidth >= 1200 ? 9 : 6, limit = Math.min(limit, 5));
        var options = {
            SortBy: "DatePlayed",
            SortOrder: "Descending",
            Filters: "IsResumable",
            Limit: limit,
            Recursive: !0,
            Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
            CollapseBoxSetItems: !1,
            ExcludeLocationTypes: "Virtual",
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Thumb",
            EnableTotalRecordCount: !1,
            MediaTypes: "Audio"
        };
        return apiClient.getItems(userId, options).then(function(result) {
            var html = "";
            if (result.Items.length) {
                html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate("sharedcomponents#HeaderContinueListening") + "</h2>", html += enableScrollX() ? '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true"><div is="emby-itemscontainer" class="scrollSlider focuscontainer-x padded-left padded-right">' : '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x">';
                var cardLayout = !1;
                html += cardBuilder.getCardsHtml({
                    items: result.Items,
                    preferThumb: !0,
                    shape: getThumbShape(),
                    overlayText: !1,
                    showTitle: !0,
                    showParentTitle: !0,
                    lazy: !0,
                    showDetailsMenu: !0,
                    overlayPlayButton: !0,
                    context: "home",
                    centerText: !cardLayout,
                    allowBottomPadding: !1,
                    cardLayout: cardLayout,
                    showYear: !0,
                    lines: 2
                }), enableScrollX() && (html += "</div>"), html += "</div>"
            }
            elem.innerHTML = html, imageLoader.lazyChildren(elem)
        })
    }

    function loadActiveRecordings(elem, apiClient, userId) {
        apiClient.getLiveTvRecordings({
            UserId: userId,
            IsInProgress: !0,
            Fields: "CanDelete,PrimaryImageAspectRatio,BasicSyncInfo",
            EnableTotalRecordCount: !1,
            EnableImageTypes: "Primary,Thumb,Backdrop"
        }).then(function(result) {
            var html = "";
            if (result.Items.length) {
                html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate("sharedcomponents#HeaderActiveRecordings") + "</h2>", html += enableScrollX() ? '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true"><div is="emby-itemscontainer" class="scrollSlider focuscontainer-x padded-left padded-right">' : '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x">';
                var supportsImageAnalysis = appHost.supports("imageanalysis");
                supportsImageAnalysis = !1;
                var cardLayout = !1;
                html += cardBuilder.getCardsHtml({
                    items: result.Items,
                    lazy: !0,
                    allowBottomPadding: !enableScrollX(),
                    shape: getThumbShape(),
                    showTitle: !1,
                    showParentTitleOrTitle: !0,
                    showAirTime: !0,
                    showAirEndTime: !0,
                    showChannelName: !0,
                    cardLayout: cardLayout,
                    preferThumb: !0,
                    coverImage: !0,
                    overlayText: !1,
                    centerText: !cardLayout,
                    overlayMoreButton: !0
                }), enableScrollX() && (html += "</div>"), html += "</div>"
            }
            elem.innerHTML = html, imageLoader.lazyChildren(elem)
        })
    }

    function loadOnNow(elem, apiClient, user) {
        if (!user.Policy.EnableLiveTvAccess) return Promise.resolve("");
        user.Id;
        return apiClient.getLiveTvRecommendedPrograms({
            userId: apiClient.getCurrentUserId(),
            IsAiring: !0,
            limit: enableScrollX() ? 18 : 5,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Thumb,Backdrop",
            EnableTotalRecordCount: !1,
            Fields: "ChannelInfo"
        }).then(function(result) {
            var html = "";
            result.Items.length && (html += '<div class="sectionTitleContainer">', html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate("sharedcomponents#HeaderOnNow") + "</h2>", layoutManager.tv || (html += '<a is="emby-linkbutton" href="' + embyRouter.getRouteUrl("livetv", {
                serverId: apiClient.serverId(),
                section: "onnow"
            }) + '" class="raised raised-mini sectionTitleButton btnMore">' + globalize.translate("sharedcomponents#More") + "</a>", html += '<a is="emby-linkbutton" href="' + embyRouter.getRouteUrl("livetv", {
                serverId: apiClient.serverId(),
                section: "guide"
            }) + '" class="raised raised-mini sectionTitleButton btnMore">' + globalize.translate("sharedcomponents#Guide") + "</a>"), html += "</div>", html += enableScrollX() ? '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true"><div is="emby-itemscontainer" class="scrollSlider focuscontainer-x padded-left padded-right">' : '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x">', html += cardBuilder.getCardsHtml({
                items: result.Items,
                preferThumb: !0,
                inheritThumb: !1,
                shape: enableScrollX() ? "overflowBackdrop" : "backdrop",
                showParentTitleOrTitle: !0,
                showTitle: !1,
                centerText: !0,
                coverImage: !0,
                overlayText: !1,
                overlayPlayButton: !0,
                allowBottomPadding: !enableScrollX(),
                showAirTime: !0,
                showChannelName: !0,
                showAirDateTime: !1,
                showAirEndTime: !0
            }), enableScrollX() && (html += "</div>"), html += "</div>"), elem.innerHTML = html, imageLoader.lazyChildren(elem)
        })
    }

    function loadNextUp(elem, apiClient, userId) {
        var query = {
            Limit: enableScrollX() ? 24 : 15,
            Fields: "PrimaryImageAspectRatio,SeriesInfo,DateCreated,BasicSyncInfo",
            UserId: userId,
            ImageTypeLimit: 1,
            EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
            EnableTotalRecordCount: !1
        };
        apiClient.getNextUpEpisodes(query).then(function(result) {
            var html = "";
            if (result.Items.length) {
                html += '<div class="sectionTitleContainer">', html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate("sharedcomponents#HeaderNextUp") + "</h2>", layoutManager.tv || (html += '<a is="emby-linkbutton" href="' + embyRouter.getRouteUrl("nextup", {
                    serverId: apiClient.serverId()
                }) + '" class="raised raised-mini sectionTitleButton btnMore">' + globalize.translate("sharedcomponents#More") + "</a>"), html += "</div>", html += enableScrollX() ? '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true"><div is="emby-itemscontainer" class="scrollSlider focuscontainer-x padded-left padded-right">' : '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x">';
                var supportsImageAnalysis = appHost.supports("imageanalysis");
                supportsImageAnalysis = !1, html += cardBuilder.getCardsHtml({
                    items: result.Items,
                    preferThumb: !0,
                    shape: getThumbShape(),
                    overlayText: !1,
                    showTitle: !0,
                    showParentTitle: !0,
                    lazy: !0,
                    overlayPlayButton: !0,
                    context: "home",
                    centerText: !supportsImageAnalysis,
                    allowBottomPadding: !enableScrollX(),
                    cardLayout: supportsImageAnalysis,
                    vibrant: supportsImageAnalysis
                }), enableScrollX() && (html += "</div>"), html += "</div>"
            }
            elem.innerHTML = html, imageLoader.lazyChildren(elem)
        })
    }

    function loadLatestChannelItems(elem, apiClient, userId, options) {
        return options = Object.assign(options || {}, {
            UserId: userId,
            SupportsLatestItems: !0
        }), apiClient.getJSON(apiClient.getUrl("Channels", options)).then(function(result) {
            var channels = result.Items,
                channelsHtml = channels.map(function(c) {
                    return '<div id="channel' + c.Id + '"></div>'
                }).join("");
            elem.innerHTML = channelsHtml;
            for (var i = 0, length = channels.length; i < length; i++) {
                var channel = channels[i];
                loadLatestChannelItemsFromChannel(elem, apiClient, channel, i)
            }
        })
    }

    function loadLatestChannelItemsFromChannel(page, apiClient, channel, index) {
        var screenWidth = dom.getWindowSize().innerWidth,
            options = {
                Limit: enableScrollX() ? 12 : screenWidth >= 1600 ? 10 : screenWidth >= 1440 ? 5 : 6,
                Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
                Filters: "IsUnplayed",
                UserId: apiClient.getCurrentUserId(),
                ChannelIds: channel.Id
            };
        apiClient.getJSON(apiClient.getUrl("Channels/Items/Latest", options)).then(function(result) {
            var html = "";
            if (result.Items.length) {
                html += '<div class="verticalSection">', html += '<div class="sectionTitleContainer">';
                var text = globalize.translate("sharedcomponents#HeaderLatestFrom").replace("{0}", channel.Name);
                html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + text + "</h2>", layoutManager.tv || (html += '<a is="emby-linkbutton" href="' + embyRouter.getRouteUrl(channel) + '" class="raised raised-mini sectionTitleButton btnMore">' + globalize.translate("sharedcomponents#More") + "</a>"), html += "</div>", html += enableScrollX() ? '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true"><div is="emby-itemscontainer" class="scrollSlider focuscontainer-x padded-left padded-right">' : '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x">', html += cardBuilder.getCardsHtml({
                    items: result.Items,
                    shape: enableScrollX() ? "autooverflow" : "auto",
                    defaultShape: "square",
                    showTitle: !0,
                    centerText: !0,
                    lazy: !0,
                    showDetailsMenu: !0,
                    overlayPlayButton: !0,
                    allowBottomPadding: !enableScrollX()
                }), enableScrollX() && (html += "</div>"), html += "</div>", html += "</div>"
            }
            var elem = page.querySelector("#channel" + channel.Id);
            elem.innerHTML = html, imageLoader.lazyChildren(elem)
        })
    }

    function loadLatestLiveTvRecordings(elem, apiClient, userId) {
        return apiClient.getLiveTvRecordings({
            userId: userId,
            Limit: enableScrollX() ? 12 : 5,
            Fields: "PrimaryImageAspectRatio,BasicSyncInfo",
            IsInProgress: !1,
            EnableTotalRecordCount: !1,
            IsLibraryItem: !1
        }).then(function(result) {
            var html = "";
            result.Items.length && (html += '<div class="sectionTitleContainer">', html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + globalize.translate("sharedcomponents#HeaderLatestRecordings") + "</h2>", !layoutManager.tv, html += "</div>"), html += enableScrollX() ? '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true"><div is="emby-itemscontainer" class="scrollSlider focuscontainer-x padded-left padded-right">' : '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right vertical-wrap focuscontainer-x">', html += cardBuilder.getCardsHtml({
                items: result.Items,
                shape: enableScrollX() ? "autooverflow" : "auto",
                showTitle: !0,
                showParentTitle: !0,
                coverImage: !0,
                lazy: !0,
                showDetailsMenu: !0,
                centerText: !0,
                overlayText: !1,
                overlayPlayButton: !0,
                allowBottomPadding: !enableScrollX(),
                preferThumb: !0,
                cardLayout: !1
            }), enableScrollX() && (html += "</div>"), html += "</div>", elem.innerHTML = html, imageLoader.lazyChildren(elem)
        })
    }
    return {
        loadRecentlyAdded: loadRecentlyAdded,
        loadLatestChannelMedia: loadLatestChannelMedia,
        loadLibraryTiles: loadLibraryTiles,
        loadResumeVideo: loadResumeVideo,
        loadResumeAudio: loadResumeAudio,
        loadActiveRecordings: loadActiveRecordings,
        loadNextUp: loadNextUp,
        loadLatestChannelItems: loadLatestChannelItems,
        loadLatestLiveTvRecordings: loadLatestLiveTvRecordings,
        loadlibraryButtons: loadlibraryButtons,
        loadSection: loadSection,
        getDefaultSection: getDefaultSection,
        loadSections: loadSections
    }
});