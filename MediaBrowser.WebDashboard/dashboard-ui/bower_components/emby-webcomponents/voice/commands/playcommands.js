define(["connectionManager", "playbackManager", "globalize"], function(connectionManager, playbackManager, globalize) {
    "use strict";

    function playItems(items, shuffle) {
        if (shuffle && (items = shuffleArray(items)), items.length) {
            var serverId = items[0].ServerId;
            items = items.map(function(i) {
                return i.Id
            }), playbackManager.play({
                ids: items,
                serverId: serverId
            })
        } else require(["toast"], function(toast) {
            toast(globalize.translate("sharedcomponents#NoItemsFound"))
        })
    }

    function shuffleArray(array) {
        for (var temporaryValue, randomIndex, currentIndex = array.length; 0 !== currentIndex;) randomIndex = Math.floor(Math.random() * currentIndex), currentIndex -= 1, temporaryValue = array[currentIndex], array[currentIndex] = array[randomIndex], array[randomIndex] = temporaryValue;
        return array
    }
    return function(result) {
        return function() {
            var query = {
                Limit: result.item.limit || 100,
                UserId: result.userId,
                ExcludeLocationTypes: "Virtual"
            };
            result.item.itemType && (query.IncludeItemTypes = result.item.itemType);
            var apiClient = connectionManager.currentApiClient();
            "nextup" === result.item.sourceid && apiClient.getNextUpEpisodes(query).then(function(queryResult) {
                playItems(queryResult.Items, result.item.shuffle)
            }), result.item.shuffle && (result.item.sortBy = result.sortBy ? "Random," + result.item.sortBy : "Random"), query.SortBy = result.item.sortBy, query.SortOrder = result.item.sortOrder, query.Recursive = !0, result.item.filters.indexOf("unplayed") !== -1 && (query.IsPlayed = !1), result.item.filters.indexOf("played") !== -1 && (query.IsPlayed = !0), result.item.filters.indexOf("favorite") !== -1 && (query.Filters = "IsFavorite"), apiClient.getItems(apiClient.getCurrentUserId(), query).then(function(queryResult) {
                playItems(queryResult.Items, result.item.shuffle)
            })
        }
    }
});