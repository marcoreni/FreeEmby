define(["loading", "libraryBrowser", "focusManager", "embyRouter", "cardBuilder", "imageLoader", "emby-input", "paper-icon-button-light", "material-icons", "emby-itemscontainer"], function(loading, libraryBrowser, focusManager, embyRouter, cardBuilder, imageLoader) {
    "use strict";

    function loadSuggestions(page) {
        var options = {
            SortBy: "IsFavoriteOrLiked,Random",
            IncludeItemTypes: "Movie,Series,MusicArtist",
            Limit: 20,
            Recursive: !0,
            ImageTypeLimit: 0,
            EnableImages: !1
        };
        ApiClient.getItems(Dashboard.getCurrentUserId(), options).then(function(result) {
            var html = result.Items.map(function(i) {
                var href = embyRouter.getRouteUrl(i),
                    itemHtml = '<div><a style="display:inline-block;padding:.55em 1em;" href="' + href + '">';
                return itemHtml += i.Name, itemHtml += "</a></div>"
            }).join("");
            page.querySelector(".searchSuggestions").innerHTML = html
        })
    }
    return function(view, params) {
        function clearSearchHintTimeout() {
            searchHintTimeout && (clearTimeout(searchHintTimeout), searchHintTimeout = null)
        }

        function showTextSuggestions() {
            textSuggestions.classList.remove("hide")
        }

        function getAdditionalTextLines(hint) {
            return "Audio" == hint.Type ? [
                [hint.AlbumArtist, hint.Album].join(" - ")
            ] : "MusicAlbum" == hint.Type ? [hint.AlbumArtist] : "MusicArtist" == hint.Type ? [Globalize.translate("LabelArtist")] : "Movie" == hint.Type ? [Globalize.translate("LabelMovie")] : "MusicVideo" == hint.Type ? [Globalize.translate("LabelMusicVideo")] : "Episode" == hint.Type ? [Globalize.translate("LabelEpisode")] : "Series" == hint.Type ? [Globalize.translate("Series")] : "BoxSet" == hint.Type ? [Globalize.translate("LabelCollection")] : hint.ChannelName ? [hint.ChannelName] : [hint.Type]
        }

        function renderSearchResultsInOverlay(hints) {
            hints = hints.map(function(i) {
                return i.Id = i.ItemId, i.ImageTags = {}, i.UserData = {}, i.PrimaryImageTag && (i.ImageTags.Primary = i.PrimaryImageTag), i
            });
            var html = cardBuilder.getCardsHtml({
                items: hints,
                shape: "auto",
                overlayText: !1,
                showTitle: !0,
                centerImage: !0,
                centerText: !0,
                textLines: getAdditionalTextLines,
                overlayMoreButton: !0,
                serverId: ApiClient.serverInfo().Id
            });
            hints.length || (html = '<p style="text-align:center;margin-top:2em;">' + Globalize.translate("NoResultsFound") + "</p>");
            var itemsContainer = searchResults;
            itemsContainer.innerHTML = html, searchResults.classList.remove("hide"), textSuggestions.classList.add("hide"), imageLoader.lazyChildren(itemsContainer)
        }

        function requestSearchHintsForOverlay(searchTerm) {
            var currentTimeout = searchHintTimeout;
            loading.show(), ApiClient.getSearchHints({
                userId: Dashboard.getCurrentUserId(),
                searchTerm: (searchTerm || "").trim(),
                limit: 30
            }).then(function(result) {
                currentTimeout == searchHintTimeout && renderSearchResultsInOverlay(result.SearchHints), loading.hide()
            }, function() {
                loading.hide()
            })
        }

        function onSearchChange(val) {
            return val ? (clearSearchHintTimeout(), void(searchHintTimeout = setTimeout(function() {
                requestSearchHintsForOverlay(val)
            }, 300))) : (clearSearchHintTimeout(), searchResults.classList.add("hide"), searchResults.innerHTML = "", void showTextSuggestions())
        }
        var searchHintTimeout, textSuggestions = view.querySelector(".textSuggestions"),
            searchResults = view.querySelector(".searchResults");
        showTextSuggestions(), loadSuggestions(view), view.querySelector(".txtSearch").addEventListener("input", function() {
            onSearchChange(this.value)
        }), view.querySelector(".btnBack").addEventListener("click", function() {
            embyRouter.back()
        }), view.addEventListener("viewbeforeshow", function(e) {
            document.body.classList.add("hiddenViewMenuBar")
        }), view.addEventListener("viewbeforehide", function(e) {
            document.body.classList.remove("hiddenViewMenuBar")
        })
    }
});