define(["loading", "apphost", "globalize", "syncJobList", "events", "scripts/taskbutton", "localsync", "emby-button", "paper-icon-button-light"], function(loading, appHost, globalize, syncJobList, events, taskButton) {
    "use strict";

    function getTabs() {
        return [{
            href: "syncactivity.html",
            name: Globalize.translate("TabSyncJobs")
        }, {
            href: "appservices.html?context=sync",
            name: Globalize.translate("TabServices")
        }, {
            href: "syncsettings.html",
            name: Globalize.translate("TabSettings")
        }]
    }
    return function(view, params) {
        var mySyncJobList = new syncJobList({
            isLocalSync: "offline" === params.mode,
            serverId: ApiClient.serverId(),
            userId: "offline" === params.mode ? null : ApiClient.getCurrentUserId(),
            element: view.querySelector(".syncActivity"),
            mode: params.mode
        });
        view.addEventListener("viewshow", function() {
            LibraryMenu.setTabs("syncadmin", 0, getTabs), taskButton({
                mode: "on",
                progressElem: view.querySelector(".syncProgress"),
                taskKey: "SyncPrepare",
                button: view.querySelector(".btnSync")
            })
        }), view.addEventListener("viewbeforehide", function() {
            taskButton({
                mode: "off",
                taskKey: "SyncPrepare",
                button: view.querySelector(".btnSync")
            })
        }), view.addEventListener("viewdestroy", function() {
            mySyncJobList.destroy()
        })
    }
});