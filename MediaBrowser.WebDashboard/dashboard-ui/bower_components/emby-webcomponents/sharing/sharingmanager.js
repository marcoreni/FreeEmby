define(["connectionManager", "sharingMenu", "loading"], function(connectionManager, sharingMenu, loading) {
    "use strict";

    function onSharingCancel(options, apiClient) {
        var shareId = options.share.Id;
        console.log("share cancelled. shareId: " + shareId), apiClient.ajax({
            type: "DELETE",
            url: apiClient.getUrl("Social/Shares/" + shareId)
        })
    }

    function showMenu(options) {
        loading.show();
        var itemId = options.itemId,
            apiClient = connectionManager.getApiClient(options.serverId),
            userId = apiClient.getCurrentUserId();
        return apiClient.getItem(userId, itemId).then(function() {
            return apiClient.ajax({
                type: "POST",
                url: apiClient.getUrl("Social/Shares", {
                    ItemId: itemId,
                    UserId: userId
                }),
                dataType: "json"
            }).then(function(share) {
                var options = {
                    share: share
                };
                return loading.hide(), sharingMenu.showMenu(options).then(function() {
                    console.log("share success. shareId: " + options.share.Id)
                }, function() {
                    onSharingCancel(options, apiClient)
                })
            }, function() {
                loading.hide()
            })
        })
    }
    return {
        showMenu: showMenu
    }
});