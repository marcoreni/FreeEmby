define(["jQuery", "loading", "fnchecked"], function($, loading) {
    "use strict";

    function loadPage(page, config) {
        $(".liveTvSettingsForm", page).show(), $(".noLiveTvServices", page).hide(), $("#selectGuideDays", page).val(config.GuideDays || ""), $("#chkMovies", page).checked(config.EnableMovieProviders), $("#chkConvertRecordings", page).checked(config.EnableRecordingEncoding), $("#chkPreserveAudio", page).checked(config.EnableOriginalAudioWithEncodedRecordings || !1), $("#chkPreserveVideo", page).checked("copy" == config.RecordedVideoCodec), $("#txtPrePaddingMinutes", page).val(config.PrePaddingSeconds / 60), $("#txtPostPaddingMinutes", page).val(config.PostPaddingSeconds / 60), page.querySelector("#txtRecordingPath").value = config.RecordingPath || "", page.querySelector("#txtMovieRecordingPath").value = config.MovieRecordingPath || "", page.querySelector("#txtSeriesRecordingPath").value = config.SeriesRecordingPath || "", page.querySelector("#selectConversionFormat").value = config.RecordingEncodingFormat || "", page.querySelector("#txtPostProcessor").value = config.RecordingPostProcessor || "", page.querySelector("#txtPostProcessorArguments").value = config.RecordingPostProcessorArguments || "", loading.hide()
    }

    function onSubmit() {
        loading.show();
        var form = this;
        return ApiClient.getNamedConfiguration("livetv").then(function(config) {
            config.GuideDays = $("#selectGuideDays", form).val() || null, config.EnableMovieProviders = $("#chkMovies", form).checked(), config.EnableRecordingEncoding = $("#chkConvertRecordings", form).checked(), config.EnableOriginalAudioWithEncodedRecordings = $("#chkPreserveAudio", form).checked(), config.RecordedVideoCodec = $("#chkPreserveVideo", form).checked() ? "copy" : null;
            var recordingPath = form.querySelector("#txtRecordingPath").value || null,
                movieRecordingPath = form.querySelector("#txtMovieRecordingPath").value || null,
                seriesRecordingPath = form.querySelector("#txtSeriesRecordingPath").value || null,
                recordingPathChanged = recordingPath != config.RecordingPath || movieRecordingPath != config.MovieRecordingPath || seriesRecordingPath != config.SeriesRecordingPath;
            config.RecordingPath = recordingPath, config.MovieRecordingPath = movieRecordingPath, config.SeriesRecordingPath = seriesRecordingPath, config.RecordingEncodingFormat = form.querySelector("#selectConversionFormat").value, config.PrePaddingSeconds = 60 * $("#txtPrePaddingMinutes", form).val(), config.PostPaddingSeconds = 60 * $("#txtPostPaddingMinutes", form).val(), config.RecordingPostProcessor = $("#txtPostProcessor", form).val(), config.RecordingPostProcessorArguments = $("#txtPostProcessorArguments", form).val(), ApiClient.updateNamedConfiguration("livetv", config).then(function() {
                Dashboard.processServerConfigurationUpdateResult(), showSaveMessage(recordingPathChanged)
            })
        }), !1
    }

    function showSaveMessage(recordingPathChanged) {
        var msg = "";
        recordingPathChanged && (msg += Globalize.translate("RecordingPathChangeMessage")), msg && require(["alert"], function(alert) {
            alert(msg)
        })
    }

    function getTabs() {
        return [{
            href: "livetvstatus.html",
            name: Globalize.translate("TabDevices")
        }, {
            href: "livetvsettings.html",
            name: Globalize.translate("TabSettings")
        }, {
            href: "appservices.html?context=livetv",
            name: Globalize.translate("TabServices")
        }]
    }
    $(document).on("pageinit", "#liveTvSettingsPage", function() {
        var page = this;
        $(".liveTvSettingsForm").off("submit", onSubmit).on("submit", onSubmit), $("#btnSelectRecordingPath", page).on("click.selectDirectory", function() {
            require(["directorybrowser"], function(directoryBrowser) {
                var picker = new directoryBrowser;
                picker.show({
                    callback: function(path) {
                        path && $("#txtRecordingPath", page).val(path), picker.close()
                    }
                })
            })
        }), $("#btnSelectMovieRecordingPath", page).on("click.selectDirectory", function() {
            require(["directorybrowser"], function(directoryBrowser) {
                var picker = new directoryBrowser;
                picker.show({
                    callback: function(path) {
                        path && $("#txtMovieRecordingPath", page).val(path), picker.close()
                    }
                })
            })
        }), $("#btnSelectSeriesRecordingPath", page).on("click.selectDirectory", function() {
            require(["directorybrowser"], function(directoryBrowser) {
                var picker = new directoryBrowser;
                picker.show({
                    callback: function(path) {
                        path && $("#txtSeriesRecordingPath", page).val(path), picker.close()
                    }
                })
            })
        }), $("#btnSelectPostProcessorPath", page).on("click.selectDirectory", function() {
            require(["directorybrowser"], function(directoryBrowser) {
                var picker = new directoryBrowser;
                picker.show({
                    includeFiles: !0,
                    callback: function(path) {
                        path && $("#txtPostProcessor", page).val(path), picker.close()
                    }
                })
            })
        })
    }).on("pageshow", "#liveTvSettingsPage", function() {
        LibraryMenu.setTabs("livetvadmin", 1, getTabs), loading.show();
        var page = this;
        ApiClient.getNamedConfiguration("livetv").then(function(config) {
            loadPage(page, config)
        }), AppInfo.enableSupporterMembership ? page.querySelector(".btnSupporterForConverting a").href = "https://emby.media/premiere" : page.querySelector(".btnSupporterForConverting a").href = "#"
    })
});