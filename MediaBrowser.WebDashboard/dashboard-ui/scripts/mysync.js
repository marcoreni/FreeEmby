define(["apphost", "globalize", "syncJobList", "events", "localsync", "emby-button", "paper-icon-button-light"], function(appHost, globalize, syncJobList, events, localSync) {
    "use strict";
    return function(view, params) {
        function isLocalSyncManagement() {
            return appHost.supports("sync") && "offline" == params.mode
        }

        function refreshSyncStatus(page) {
            if (isLocalSyncManagement()) {
                var status = localSync.getSyncStatus();
                "Active" == status ? page.querySelector(".btnSyncNow").classList.add("hide") : page.querySelector(".btnSyncNow").classList.remove("hide")
            }
        }

        function syncNow(page) {
            localSync.sync(), require(["toast"], function(toast) {
                toast(Globalize.translate("MessageSyncStarted"))
            }), refreshSyncStatus(page)
        }
        var interval;
        view.querySelector(".btnSyncNow").addEventListener("click", function() {
            syncNow(view)
        }), isLocalSyncManagement() ? view.querySelector(".localSyncStatus").classList.remove("hide") : view.querySelector(".localSyncStatus").classList.add("hide");
        var mySyncJobList = new syncJobList({
            isLocalSync: "offline" === params.mode,
            serverId: ApiClient.serverId(),
            userId: "offline" === params.mode ? null : ApiClient.getCurrentUserId(),
            element: view.querySelector(".syncActivity"),
            mode: params.mode
        });
        view.addEventListener("viewbeforeshow", function() {
            refreshSyncStatus(view), appHost.supports("sync") && (interval = setInterval(function() {
                refreshSyncStatus(view)
            }, 5e3))
        }), view.addEventListener("viewbeforehide", function() {
            interval && (clearInterval(interval), interval = null)
        }), view.addEventListener("viewdestroy", function() {
            mySyncJobList.destroy()
        })
    }
});