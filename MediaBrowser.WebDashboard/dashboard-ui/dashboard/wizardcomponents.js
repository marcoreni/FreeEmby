define([], function() {
    "use strict";

    function goNext() {
        Dashboard.navigate("wizardagreement.html")
    }

    function loadDownloadInfo(view) {
        var instructions = "";
        ApiClient.getSystemInfo().then(function(systemInfo) {
            var operatingSystem = systemInfo.OperatingSystem.toLowerCase();
            "windows" == operatingSystem ? (view.querySelector(".fldSelectEncoderPathType").classList.add("hide"), view.querySelector(".markExec").classList.add("hide")) : (view.querySelector(".fldSelectEncoderPathType").classList.remove("hide"), view.querySelector(".markExec").classList.remove("hide")), "windows" == operatingSystem && "Arm" != systemInfo.SystemArchitecture ? (view.querySelector(".suggestedLocation").innerHTML = Globalize.translate("FFmpegSuggestedDownload", '<a target="_blank" href="https://ffmpeg.zeranoe.com/builds">https://ffmpeg.zeranoe.com</a>'), "X86" == systemInfo.SystemArchitecture ? instructions = "Download FFmpeg 32-Bit Static" : "X64" == systemInfo.SystemArchitecture && (instructions = "Download FFmpeg 64-Bit Static")) : "linux" == operatingSystem ? (view.querySelector(".suggestedLocation").innerHTML = Globalize.translate("FFmpegSuggestedDownload", '<a target="_blank" href="http://johnvansickle.com/ffmpeg">http://johnvansickle.com/ffmpeg</a>'), "X86" == systemInfo.SystemArchitecture ? instructions = "Download x86 build" : "X64" == systemInfo.SystemArchitecture && (instructions = "Download x86_64 build")) : "osx" == operatingSystem && "X64" == systemInfo.SystemArchitecture ? (view.querySelector(".suggestedLocation").innerHTML = Globalize.translate("FFmpegSuggestedDownload", '<a target="_blank" href="http://evermeet.cx/ffmpeg">http://evermeet.cx/ffmpeg</a>'), instructions = "Download both ffmpeg and ffprobe, and extract them to the same folder.") : view.querySelector(".suggestedLocation").innerHTML = Globalize.translate("FFmpegSuggestedDownload", '<a target="_blank" href="http://ffmpeg.org">https://ffmpeg.org/download.html</a>'), view.querySelector(".downloadInstructions").innerHTML = instructions;
            var selectEncoderPath = view.querySelector("#selectEncoderPath");
            selectEncoderPath.value = "Custom", onSelectEncoderPathChange.call(selectEncoderPath)
        })
    }

    function onSaveEncodingPathFailure(response) {
        var msg = "";
        msg = Globalize.translate("FFmpegSavePathNotFound"), require(["alert"], function(alert) {
            alert(msg)
        })
    }

    function parentWithClass(elem, className) {
        for (; !elem.classList || !elem.classList.contains(className);)
            if (elem = elem.parentNode, !elem) return null;
        return elem
    }

    function onSelectEncoderPathChange(e) {
        var page = parentWithClass(this, "page");
        "Custom" == this.value ? page.querySelector(".fldEncoderPath").classList.remove("hide") : page.querySelector(".fldEncoderPath").classList.add("hide")
    }
    return function(view, params) {
        view.querySelector("#btnSelectEncoderPath").addEventListener("click", function() {
            require(["directorybrowser"], function(directoryBrowser) {
                var picker = new directoryBrowser;
                picker.show({
                    includeFiles: !0,
                    callback: function(path) {
                        path && (view.querySelector(".txtEncoderPath").value = path), picker.close()
                    }
                })
            })
        }), view.querySelector("form").addEventListener("submit", function(e) {
            var form = this;
            return ApiClient.ajax({
                url: ApiClient.getUrl("System/MediaEncoder/Path"),
                type: "POST",
                data: {
                    Path: form.querySelector(".txtEncoderPath").value,
                    PathType: "Custom"
                }
            }).then(goNext, onSaveEncodingPathFailure), e.preventDefault(), !1
        }), view.querySelector("#selectEncoderPath").addEventListener("change", onSelectEncoderPathChange), view.addEventListener("viewbeforeshow", function(e) {
            loadDownloadInfo(view)
        })
    }
});