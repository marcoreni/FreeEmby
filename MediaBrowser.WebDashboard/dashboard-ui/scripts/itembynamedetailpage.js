define(["listView", "cardBuilder", "imageLoader", "emby-itemscontainer"], function(listView, cardBuilder, imageLoader) {
    "use strict";

    function renderItems(page, item) {
        var sections = [];
        item.ArtistCount && sections.push({
            name: Globalize.translate("TabArtists"),
            type: "MusicArtist"
        }), item.ProgramCount && "Person" == item.Type && sections.push({
            name: Globalize.translate("HeaderUpcomingOnTV"),
            type: "Program"
        }), item.MovieCount && sections.push({
            name: Globalize.translate("TabMovies"),
            type: "Movie"
        }), item.SeriesCount && sections.push({
            name: Globalize.translate("TabShows"),
            type: "Series"
        }), item.EpisodeCount && sections.push({
            name: Globalize.translate("TabEpisodes"),
            type: "Episode"
        }), item.TrailerCount && sections.push({
            name: Globalize.translate("TabTrailers"),
            type: "Trailer"
        }), item.GameCount && sections.push({
            name: Globalize.translate("TabGames"),
            type: "Game"
        }), item.AlbumCount && sections.push({
            name: Globalize.translate("TabAlbums"),
            type: "MusicAlbum"
        }), item.SongCount && sections.push({
            name: Globalize.translate("TabSongs"),
            type: "Audio"
        }), item.MusicVideoCount && sections.push({
            name: Globalize.translate("TabMusicVideos"),
            type: "MusicVideo"
        });
        var elem = page.querySelector("#childrenContent");
        elem.innerHTML = sections.map(function(section) {
            var html = "";
            return html += '<div class="verticalSection" data-type="' + section.type + '">', html += '<div class="sectionTitleContainer">', html += '<h2 class="sectionTitle sectionTitle-cards padded-left">', html += section.name, html += "</h2>", html += '<a href="#" class="clearLink hide" style="margin-left:1em;vertical-align:middle;"><button is="emby-button" type="button" class="raised more raised-mini noIcon">' + Globalize.translate("ButtonMore") + "</button></a>", html += "</div>", html += '<div is="emby-itemscontainer" class="itemsContainer padded-left padded-right">', html += "</div>", html += "</div>"
        }).join("");
        for (var sectionElems = elem.querySelectorAll(".verticalSection"), i = 0, length = sectionElems.length; i < length; i++) renderSection(page, item, sectionElems[i], sectionElems[i].getAttribute("data-type"))
    }

    function renderSection(page, item, element, type) {
        switch (type) {
            case "Program":
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "Program",
                    PersonTypes: "",
                    ArtistIds: "",
                    Limit: 10
                }, {
                    shape: "backdrop",
                    showTitle: !0,
                    centerText: !0,
                    overlayMoreButton: !0,
                    preferThumb: !0,
                    overlayText: !1,
                    showAirTime: !0,
                    showAirDateTime: !0,
                    showChannelName: !0
                });
                break;
            case "Movie":
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "Movie",
                    PersonTypes: "",
                    ArtistIds: "",
                    Limit: 10
                }, {
                    shape: "portrait",
                    showTitle: !0,
                    centerText: !0,
                    overlayMoreButton: !0,
                    overlayText: !1
                });
                break;
            case "MusicVideo":
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "MusicVideo",
                    PersonTypes: "",
                    ArtistIds: "",
                    Limit: 10
                }, {
                    shape: "portrait",
                    showTitle: !0,
                    centerText: !0,
                    overlayPlayButton: !0
                });
                break;
            case "Game":
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "Game",
                    PersonTypes: "",
                    ArtistIds: "",
                    Limit: 10
                }, {
                    shape: "portrait",
                    showTitle: !0,
                    centerText: !0,
                    overlayMoreButton: !0
                });
                break;
            case "Trailer":
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "Trailer",
                    PersonTypes: "",
                    ArtistIds: "",
                    Limit: 10
                }, {
                    shape: "portrait",
                    showTitle: !0,
                    centerText: !0,
                    overlayPlayButton: !0
                });
                break;
            case "Series":
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "Series",
                    PersonTypes: "",
                    ArtistIds: "",
                    Limit: 10
                }, {
                    shape: "portrait",
                    showTitle: !0,
                    centerText: !0,
                    overlayMoreButton: !0
                });
                break;
            case "MusicAlbum":
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "MusicAlbum",
                    PersonTypes: "",
                    ArtistIds: "",
                    Limit: 8
                }, {
                    shape: "square",
                    playFromHere: !0,
                    showTitle: !0,
                    showParentTitle: !0,
                    coverImage: !0,
                    centerText: !0,
                    overlayPlayButton: !0
                });
                break;
            case "MusicArtist":
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "MusicArtist",
                    PersonTypes: "",
                    ArtistIds: "",
                    Limit: 8
                }, {
                    shape: "square",
                    playFromHere: !0,
                    showTitle: !0,
                    showParentTitle: !0,
                    coverImage: !0,
                    centerText: !0,
                    overlayPlayButton: !0
                });
                break;
            case "Episode":
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "Episode",
                    PersonTypes: "",
                    ArtistIds: "",
                    Limit: 6
                }, {
                    shape: "backdrop",
                    showTitle: !0,
                    showParentTitle: !0,
                    centerText: !0,
                    overlayPlayButton: !0
                });
                break;
            case "Audio":
                loadItems(element, item, type, {
                    MediaTypes: "",
                    IncludeItemTypes: "Audio",
                    PersonTypes: "",
                    ArtistIds: "",
                    Limit: 40
                }, {
                    playFromHere: !0,
                    action: "playallfromhere",
                    smallIcon: !0,
                    artist: !0
                })
        }
    }

    function loadItems(element, item, type, query, listOptions) {
        query = getQuery(query, item), getItemsFunction(query, item)(query.StartIndex, query.Limit, query.Fields).then(function(result) {
            var html = "";
            if (query.Limit && result.TotalRecordCount > query.Limit) {
                var link = element.querySelector("a");
                link.classList.remove("hide"), link.setAttribute("href", getMoreItemsHref(item, type))
            } else element.querySelector("a").classList.add("hide");
            listOptions.items = result.Items;
            var itemsContainer = element.querySelector(".itemsContainer");
            "Audio" == type ? (html = listView.getListViewHtml(listOptions), itemsContainer.classList.remove("vertical-wrap"), itemsContainer.classList.add("vertical-list")) : (html = cardBuilder.getCardsHtml(listOptions), itemsContainer.classList.add("vertical-wrap"), itemsContainer.classList.remove("vertical-list")), itemsContainer.innerHTML = html, imageLoader.lazyChildren(itemsContainer)
        })
    }

    function getMoreItemsHref(item, type) {
        return "Genre" == item.Type || "MusicGenre" == item.Type || "GameGenre" == item.Type ? "secondaryitems.html?type=" + type + "&genreId=" + item.Id : "Studio" == item.Type ? "secondaryitems.html?type=" + type + "&studioId=" + item.Id : "MusicArtist" == item.Type ? "secondaryitems.html?type=" + type + "&artistId=" + item.Id : "Person" == item.Type ? "secondaryitems.html?type=" + type + "&personId=" + item.Id : "secondaryitems.html?type=" + type + "&parentId=" + item.Id
    }

    function addCurrentItemToQuery(query, item) {
        "Person" == item.Type ? query.PersonIds = item.Id : "Genre" == item.Type ? query.Genres = item.Name : "MusicGenre" == item.Type ? query.Genres = item.Name : "GameGenre" == item.Type ? query.Genres = item.Name : "Studio" == item.Type ? query.StudioIds = item.Id : "MusicArtist" == item.Type && (query.ArtistIds = item.Id)
    }

    function getQuery(options, item) {
        var query = {
            SortBy: "SortName",
            SortOrder: "Ascending",
            IncludeItemTypes: "",
            Recursive: !0,
            Fields: "AudioInfo,SeriesInfo,ParentId,PrimaryImageAspectRatio,BasicSyncInfo",
            Limit: LibraryBrowser.getDefaultPageSize(),
            StartIndex: 0,
            CollapseBoxSetItems: !1
        };
        return query = Object.assign(query, options || {}), "Audio" == query.IncludeItemTypes && (query.SortBy = "AlbumArtist,Album,SortName"), addCurrentItemToQuery(query, item), query
    }

    function getItemsFunction(options, item) {
        var query = getQuery(options, item);
        return function(index, limit, fields) {
            return query.StartIndex = index, query.Limit = limit, fields && (query.Fields += "," + fields), ApiClient.getItems(Dashboard.getCurrentUserId(), query)
        }
    }
    window.ItemsByName = {
        renderItems: renderItems
    }
});