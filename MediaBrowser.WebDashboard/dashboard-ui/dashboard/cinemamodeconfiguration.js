define(["jQuery", "loading", "fnchecked"], function($, loading) {
    "use strict";

    function loadPage(page, config) {
        $(".chkMovies", page).checked(config.EnableIntrosForMovies), $(".chkEpisodes", page).checked(config.EnableIntrosForEpisodes), $(".chkMyMovieTrailers", page).checked(config.EnableIntrosFromMoviesInLibrary), $(".chkUpcomingTheaterTrailers", page).checked(config.EnableIntrosFromUpcomingTrailers), $(".chkUpcomingDvdTrailers", page).checked(config.EnableIntrosFromUpcomingDvdMovies), $(".chkUpcomingStreamingTrailers", page).checked(config.EnableIntrosFromUpcomingStreamingMovies), $(".chkOtherTrailers", page).checked(config.EnableIntrosFromSimilarMovies), $(".chkUnwatchedOnly", page).checked(!config.EnableIntrosForWatchedContent), $(".chkEnableParentalControl", page).checked(config.EnableIntrosParentalControl), $("#txtCustomIntrosPath", page).val(config.CustomIntroPath || ""), $("#txtCodecIntrosPath", page).val(config.MediaInfoIntroPath || ""), $("#txtNumTrailers", page).val(config.TrailerLimit), loading.hide()
    }

    function onSubmit() {
        loading.show();
        var form = this,
            page = $(form).parents(".page");
        return ApiClient.getNamedConfiguration("cinemamode").then(function(config) {
            config.CustomIntroPath = $("#txtCustomIntrosPath", page).val(), config.MediaInfoIntroPath = $("#txtCodecIntrosPath", page).val(), config.TrailerLimit = $("#txtNumTrailers", page).val(), config.EnableIntrosForMovies = $(".chkMovies", page).checked(), config.EnableIntrosForEpisodes = $(".chkEpisodes", page).checked(), config.EnableIntrosFromMoviesInLibrary = $(".chkMyMovieTrailers", page).checked(), config.EnableIntrosForWatchedContent = !$(".chkUnwatchedOnly", page).checked(), config.EnableIntrosParentalControl = $(".chkEnableParentalControl", page).checked(), config.EnableIntrosFromUpcomingTrailers = $(".chkUpcomingTheaterTrailers", page).checked(), config.EnableIntrosFromUpcomingDvdMovies = $(".chkUpcomingDvdTrailers", page).checked(), config.EnableIntrosFromUpcomingStreamingMovies = $(".chkUpcomingStreamingTrailers", page).checked(), config.EnableIntrosFromSimilarMovies = $(".chkOtherTrailers", page).checked(), ApiClient.updateNamedConfiguration("cinemamode", config).then(Dashboard.processServerConfigurationUpdateResult)
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
    $(document).on("pageinit", "#cinemaModeConfigurationPage", function() {
        var page = this;
        $("#btnSelectCustomIntrosPath", page).on("click.selectDirectory", function() {
            require(["directorybrowser"], function(directoryBrowser) {
                var picker = new directoryBrowser;
                picker.show({
                    callback: function(path) {
                        path && $("#txtCustomIntrosPath", page).val(path), picker.close()
                    },
                    header: Globalize.translate("HeaderSelectCustomIntrosPath")
                })
            })
        }), $("#btnSelectCodecIntrosPath", page).on("click.selectDirectory", function() {
            require(["directorybrowser"], function(directoryBrowser) {
                var picker = new directoryBrowser;
                picker.show({
                    callback: function(path) {
                        path && $("#txtCodecIntrosPath", page).val(path), picker.close()
                    },
                    header: Globalize.translate("HeaderSelectCodecIntrosPath")
                })
            })
        }), $(".cinemaModeConfigurationForm").off("submit", onSubmit).on("submit", onSubmit), AppInfo.enableSupporterMembership || (page.querySelector(".lnkSupporterLearnMore").href = "#", page.querySelector(".lnkSupporterLearnMore").addEventListener("click", function(e) {
            return e.preventDefault(), !1
        }))
    }).on("pageshow", "#cinemaModeConfigurationPage", function() {
        LibraryMenu.setTabs("playback", 0, getTabs), loading.show();
        var page = this;
        ApiClient.getNamedConfiguration("cinemamode").then(function(config) {
            loadPage(page, config)
        })
    })
});