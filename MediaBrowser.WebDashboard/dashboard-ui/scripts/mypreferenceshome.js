define(["homescreenSettings", "userSettingsBuilder", "dom", "globalize", "loading", "homeSections", "listViewStyle"], function(HomescreenSettings, userSettingsBuilder, dom, globalize, loading, homeSections) {
    "use strict";
    return function(view, params) {
        var homescreenSettingsInstance, userId = params.userId || ApiClient.getCurrentUserId(),
            userSettings = new userSettingsBuilder;
        view.addEventListener("viewshow", function() {
            homescreenSettingsInstance || (homescreenSettingsInstance = new HomescreenSettings({
                serverId: ApiClient.serverId(),
                userId: userId,
                element: view.querySelector(".homeScreenSettingsContainer"),
                userSettings: userSettings,
                enableSaveButton: !AppInfo.enableAutoSave,
                enableSaveConfirmation: !AppInfo.enableAutoSave
            })), homescreenSettingsInstance.loadData()
        }), view.addEventListener("viewbeforehide", function() {
            AppInfo.enableAutoSave && homescreenSettingsInstance && homescreenSettingsInstance.submit()
        }), view.addEventListener("viewdestroy", function() {
            homescreenSettingsInstance && (homescreenSettingsInstance.destroy(), homescreenSettingsInstance = null)
        })
    }
});