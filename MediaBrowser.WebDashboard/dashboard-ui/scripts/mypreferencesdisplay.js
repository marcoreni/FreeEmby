define(["userSettingsBuilder", "appStorage", "loading"], function(userSettingsBuilder, appStorage, loading) {
    "use strict";
    return function(view, params) {
        function loadForm(page, user) {
            userSettingsInstance.setUserInfo(userId, ApiClient).then(function() {
                userSettingsLoaded = !0, page.querySelector(".chkDisplayMissingEpisodes").checked = user.Configuration.DisplayMissingEpisodes || !1, page.querySelector(".chkDisplayUnairedEpisodes").checked = user.Configuration.DisplayUnairedEpisodes || !1, page.querySelector("#chkThemeSong").checked = userSettingsInstance.enableThemeSongs(), page.querySelector("#selectBackdrop").value = appStorage.getItem("enableBackdrops-" + user.Id) || "0", page.querySelector("#selectLanguage").value = userSettingsInstance.language() || "", loading.hide()
            })
        }

        function refreshGlobalUserSettings() {
            require(["userSettings"], function(userSettings) {
                userSettings.importFrom(userSettingsInstance)
            })
        }

        function saveUser(page, user) {
            return user.Configuration.DisplayMissingEpisodes = page.querySelector(".chkDisplayMissingEpisodes").checked, user.Configuration.DisplayUnairedEpisodes = page.querySelector(".chkDisplayUnairedEpisodes").checked, userSettingsLoaded && (AppInfo.supportsUserDisplayLanguageSetting && userSettingsInstance.language(page.querySelector("#selectLanguage").value), userSettingsInstance.enableThemeSongs(page.querySelector("#chkThemeSong").checked), userId === Dashboard.getCurrentUserId() && refreshGlobalUserSettings()), appStorage.setItem("enableBackdrops-" + user.Id, page.querySelector("#selectBackdrop").value), ApiClient.updateUserConfiguration(user.Id, user.Configuration)
        }

        function save(page) {
            AppInfo.enableAutoSave || loading.show(), ApiClient.getUser(userId).then(function(user) {
                saveUser(page, user).then(function() {
                    loading.hide(), AppInfo.enableAutoSave || require(["toast"], function(toast) {
                        toast(Globalize.translate("SettingsSaved"))
                    })
                }, function() {
                    loading.hide()
                })
            })
        }
        var userSettingsLoaded, userId = params.userId || Dashboard.getCurrentUserId(),
            userSettingsInstance = new userSettingsBuilder;
        view.querySelector(".displayPreferencesForm").addEventListener("submit", function(e) {
            return save(view), e.preventDefault(), !1
        }), AppInfo.enableAutoSave ? view.querySelector(".btnSave").classList.add("hide") : view.querySelector(".btnSave").classList.remove("hide"), view.addEventListener("viewshow", function() {
            var page = this;
            loading.show(), ApiClient.getUser(userId).then(function(user) {
                loadForm(page, user)
            }), AppInfo.supportsUserDisplayLanguageSetting ? page.querySelector(".languageSection").classList.remove("hide") : page.querySelector(".languageSection").classList.add("hide")
        }), view.addEventListener("viewbeforehide", function() {
            var page = this;
            AppInfo.enableAutoSave && save(page)
        })
    }
});