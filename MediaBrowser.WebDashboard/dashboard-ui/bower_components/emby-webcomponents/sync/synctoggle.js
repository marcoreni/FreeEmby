define(["itemHelper", "globalize", "apphost", "connectionManager", "events", "emby-checkbox"], function(itemHelper, globalize, appHost, connectionManager, events) {
    "use strict";

    function updateSyncStatus(container, item) {
        container.querySelector(".chkOffline").checked = null != item.SyncPercent
    }

    function syncToggle(options) {
        function resetSyncStatus() {
            updateSyncStatus(options.container, options.item)
        }

        function onSyncLocalClick() {
            this.checked ? require(["syncDialog"], function(syncDialog) {
                syncDialog.showMenu({
                    items: [options.item],
                    isLocalSync: !0,
                    serverId: options.item.ServerId
                }).then(function() {
                    events.trigger(self, "sync")
                }, resetSyncStatus)
            }) : require(["confirm"], function(confirm) {
                confirm(globalize.translate("sharedcomponents#ConfirmRemoveDownload")).then(function() {
                    connectionManager.getApiClient(options.item.ServerId).cancelSyncItems([options.item.Id])
                }, resetSyncStatus)
            })
        }
        var self = this;
        options = options || {}, self.options = options;
        var container = options.container,
            user = options.user,
            item = options.item,
            html = "";
        html += '<label class="checkboxContainer" style="margin: 0;">', html += '<input type="checkbox" is="emby-checkbox" class="chkOffline" />', html += "<span>" + globalize.translate("sharedcomponents#MakeAvailableOffline") + "</span>", html += "</label>", itemHelper.canSync(user, item) ? (appHost.supports("sync") ? container.classList.remove("hide") : container.classList.add("hide"), container.innerHTML = html, container.querySelector(".chkOffline").addEventListener("change", onSyncLocalClick), updateSyncStatus(container, item)) : container.classList.add("hide")
    }
    return syncToggle.prototype.refresh = function(item) {
        this.options.item = item, updateSyncStatus(this.options.container, item)
    }, syncToggle.prototype.destroy = function() {
        var options = this.options;
        options && (options.container.innerHTML = "", this.options = null)
    }, syncToggle
});