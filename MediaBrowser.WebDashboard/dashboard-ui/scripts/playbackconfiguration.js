define(["jQuery", "loading"], function($, loading) {
    "use strict";

    function loadPage(page, config) {
        $("#txtMinResumePct", page).val(config.MinResumePct), $("#txtMaxResumePct", page).val(config.MaxResumePct), $("#txtMinResumeDuration", page).val(config.MinResumeDurationSeconds), loading.hide()
    }

    function onSubmit() {
        loading.show();
        var form = this;
        return ApiClient.getServerConfiguration().then(function(config) {
            config.MinResumePct = $("#txtMinResumePct", form).val(), config.MaxResumePct = $("#txtMaxResumePct", form).val(), config.MinResumeDurationSeconds = $("#txtMinResumeDuration", form).val(), ApiClient.updateServerConfiguration(config).then(Dashboard.processServerConfigurationUpdateResult)
        }), !1
    }

    function getTabs() {
        return [{
            href: "cinemamodeconfiguration.html",
            name: Globalize.translate("TabCinemaMode")
        }, {
            href: "playbackconfiguration.html",
            name: Globalize.translate("TabResumeSettings")
        }, {
            href: "streamingsettings.html",
            name: Globalize.translate("TabStreaming")
        }]
    }
    $(document).on("pageinit", "#playbackConfigurationPage", function() {
        $(".playbackConfigurationForm").off("submit", onSubmit).on("submit", onSubmit)
    }).on("pageshow", "#playbackConfigurationPage", function() {
        LibraryMenu.setTabs("playback", 1, getTabs), loading.show();
        var page = this;
        ApiClient.getServerConfiguration().then(function(config) {
            loadPage(page, config)
        })
    })
});