define(["connectionManager", "confirm", "embyRouter", "globalize"], function(connectionManager, confirm, embyRouter, globalize) {
    "use strict";

    function deleteItem(options) {
        var item = options.item,
            itemId = item.Id,
            parentId = item.SeasonId || item.SeriesId || item.ParentId,
            serverId = item.ServerId,
            msg = globalize.translate("sharedcomponents#ConfirmDeleteItem"),
            title = globalize.translate("sharedcomponents#HeaderDeleteItem"),
            apiClient = connectionManager.getApiClient(item.ServerId);
        return confirm({
            title: title,
            text: msg,
            confirmText: globalize.translate("sharedcomponents#Delete"),
            primary: "cancel"
        }).then(function() {
            return apiClient.deleteItem(itemId).then(function() {
                options.navigate && (parentId ? embyRouter.showItem(parentId, serverId) : embyRouter.goHome())
            })
        })
    }
    return {
        deleteItem: deleteItem
    }
});