define(["appSettings", "userSettingsBuilder", "loading"], function(appSettings, userSettingsBuilder, loading) {
    "use strict";

    function populateLanguages(select, languages) {
        var html = "";
        html += "<option value=''></option>";
        for (var i = 0, length = languages.length; i < length; i++) {
            var culture = languages[i];
            html += "<option value='" + culture.ThreeLetterISOLanguageName + "'>" + culture.DisplayName + "</option>"
        }
        select.innerHTML = html
    }
    return function(view, params) {
        function loadForm(page, user, loggedInUser, allCulturesPromise) {
            userSettingsInstance.setUserInfo(userId, ApiClient).then(function() {
                userSettingsLoaded = !0, allCulturesPromise.then(function(allCultures) {
                    populateLanguages(page.querySelector("#selectAudioLanguage"), allCultures), populateLanguages(page.querySelector("#selectSubtitleLanguage"), allCultures), page.querySelector("#selectAudioLanguage", page).value = user.Configuration.AudioLanguagePreference || "", page.querySelector("#selectSubtitleLanguage", page).value = user.Configuration.SubtitleLanguagePreference || "", page.querySelector(".chkEpisodeAutoPlay").checked = user.Configuration.EnableNextEpisodeAutoPlay || !1
                }), AppInfo.supportsExternalPlayers && userId === loggedInUserId ? view.querySelector(".fldExternalPlayer").classList.remove("hide") : view.querySelector(".fldExternalPlayer").classList.add("hide"), userId === loggedInUserId ? (view.querySelector(".fldMaxBitrate").classList.remove("hide"), view.querySelector(".fldChromecastBitrate").classList.remove("hide")) : (view.querySelector(".fldMaxBitrate").classList.add("hide"), view.querySelector(".fldChromecastBitrate").classList.add("hide")), page.querySelector("#selectSubtitlePlaybackMode").value = user.Configuration.SubtitleMode || "", page.querySelector(".chkPlayDefaultAudioTrack").checked = user.Configuration.PlayDefaultAudioTrack || !1, page.querySelector(".chkEnableCinemaMode").checked = userSettingsInstance.enableCinemaMode(), page.querySelector(".chkExternalVideoPlayer").checked = appSettings.enableExternalPlayers(), require(["qualityoptions"], function(qualityoptions) {
                    var bitrateOptions = qualityoptions.getVideoQualityOptions({
                        currentMaxBitrate: appSettings.maxStreamingBitrate(),
                        isAutomaticBitrateEnabled: appSettings.enableAutomaticBitrateDetection(),
                        enableAuto: !0
                    }).map(function(i) {
                        return '<option value="' + (i.bitrate || "") + '">' + i.name + "</option>"
                    }).join("");
                    page.querySelector("#selectMaxBitrate").innerHTML = bitrateOptions, page.querySelector("#selectMaxChromecastBitrate").innerHTML = bitrateOptions, appSettings.enableAutomaticBitrateDetection() ? page.querySelector("#selectMaxBitrate").value = "" : page.querySelector("#selectMaxBitrate").value = appSettings.maxStreamingBitrate(), page.querySelector("#selectMaxChromecastBitrate").value = appSettings.maxChromecastBitrate() || "", loading.hide()
                })
            })
        }

        function loadPage(page) {
            loading.show();
            var promise1 = ApiClient.getUser(userId),
                promise2 = Dashboard.getCurrentUser(),
                allCulturesPromise = ApiClient.getCultures();
            Promise.all([promise1, promise2]).then(function(responses) {
                loadForm(page, responses[1], responses[0], allCulturesPromise)
            }), ApiClient.getNamedConfiguration("cinemamode").then(function(cinemaConfig) {
                cinemaConfig.EnableIntrosForMovies || cinemaConfig.EnableIntrosForEpisodes ? page.querySelector(".cinemaModeOptions").classList.remove("hide") : page.querySelector(".cinemaModeOptions").classList.add("hide")
            })
        }

        function refreshGlobalUserSettings() {
            require(["userSettings"], function(userSettings) {
                userSettings.importFrom(userSettingsInstance)
            })
        }

        function saveUser(page, user) {
            return user.Configuration.AudioLanguagePreference = page.querySelector("#selectAudioLanguage").value, user.Configuration.SubtitleLanguagePreference = page.querySelector("#selectSubtitleLanguage").value, user.Configuration.SubtitleMode = page.querySelector("#selectSubtitlePlaybackMode").value, user.Configuration.PlayDefaultAudioTrack = page.querySelector(".chkPlayDefaultAudioTrack").checked, user.Configuration.EnableNextEpisodeAutoPlay = page.querySelector(".chkEpisodeAutoPlay").checked, userSettingsLoaded && (userSettingsInstance.enableCinemaMode(page.querySelector(".chkEnableCinemaMode").checked), userId === Dashboard.getCurrentUserId() && refreshGlobalUserSettings()), ApiClient.updateUserConfiguration(user.Id, user.Configuration)
        }

        function save(page) {
            appSettings.enableExternalPlayers(page.querySelector(".chkExternalVideoPlayer").checked), page.querySelector("#selectMaxBitrate").value ? (appSettings.maxStreamingBitrate(page.querySelector("#selectMaxBitrate").value), appSettings.enableAutomaticBitrateDetection(!1)) : appSettings.enableAutomaticBitrateDetection(!0), appSettings.maxChromecastBitrate(page.querySelector("#selectMaxChromecastBitrate").value), AppInfo.enableAutoSave || loading.show(), ApiClient.getUser(userId).then(function(result) {
                saveUser(page, result).then(function() {
                    loading.hide(), AppInfo.enableAutoSave || require(["toast"], function(toast) {
                        toast(Globalize.translate("SettingsSaved"))
                    })
                }, function() {
                    loading.hide()
                })
            })
        }
        var userSettingsLoaded, loggedInUserId = Dashboard.getCurrentUserId(),
            userId = params.userId || loggedInUserId,
            userSettingsInstance = new userSettingsBuilder;
        view.querySelector("#selectSubtitlePlaybackMode").addEventListener("change", function() {
            for (var subtitlesHelp = view.querySelectorAll(".subtitlesHelp"), i = 0, length = subtitlesHelp.length; i < length; i++) subtitlesHelp[i].classList.add("hide");
            view.querySelector(".subtitles" + this.value + "Help").classList.remove("hide")
        }), view.querySelector(".languagePreferencesForm").addEventListener("submit", function(e) {
            return save(view), e.preventDefault(), !1
        }), AppInfo.enableAutoSave ? view.querySelector(".btnSave").classList.add("hide") : view.querySelector(".btnSave").classList.remove("hide"), view.addEventListener("viewshow", function() {
            loadPage(view)
        }), view.addEventListener("viewbeforehide", function() {
            var page = this;
            AppInfo.enableAutoSave && save(page)
        })
    }
});