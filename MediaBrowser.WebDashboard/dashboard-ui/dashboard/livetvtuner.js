define(["globalize", "loading", "emby-input", "emby-button", "emby-checkbox", "emby-select"], function(globalize, loading) {
    "use strict";

    function fillTypes(view, currentId) {
        return ApiClient.getJSON(ApiClient.getUrl("LiveTv/TunerHosts/Types")).then(function(types) {
            var selectType = view.querySelector(".selectType");
            selectType.innerHTML = types.map(function(t) {
                return '<option value="' + t.Id + '">' + t.Name + "</option>"
            }).join("") + '<option value="other">' + globalize.translate("TabOther") + "</option>", selectType.disabled = null != currentId, selectType.value = "", selectType.dispatchEvent(new CustomEvent("change", {}))
        })
    }

    function reload(view, providerId) {
        view.querySelector(".txtDevicePath").value = "", view.querySelector(".chkFavorite").checked = !1, providerId && ApiClient.getNamedConfiguration("livetv").then(function(config) {
            var info = config.TunerHosts.filter(function(i) {
                return i.Id == providerId
            })[0];
            fillTunerHostInfo(view, info)
        })
    }

    function fillTunerHostInfo(view, info) {
        var selectType = view.querySelector(".selectType");
        selectType.value = info.Type || "", selectType.dispatchEvent(new CustomEvent("change", {})), view.querySelector(".txtDevicePath").value = info.Url || "", view.querySelector(".chkFavorite").checked = info.ImportFavoritesOnly, view.querySelector(".chkTranscode").checked = info.AllowHWTranscoding
    }

    function submitForm(page) {
        loading.show();
        var info = {
                Type: page.querySelector(".selectType").value,
                Url: page.querySelector(".txtDevicePath").value,
                ImportFavoritesOnly: page.querySelector(".chkFavorite").checked,
                AllowHWTranscoding: page.querySelector(".chkTranscode").checked,
                EnableTvgId: !0
            },
            id = getParameterByName("id");
        id && (info.Id = id);
        var originalId = info.Id;
        ApiClient.ajax({
            type: "POST",
            url: ApiClient.getUrl("LiveTv/TunerHosts"),
            data: JSON.stringify(info),
            contentType: "application/json"
        }).then(function(result) {
            Dashboard.processServerConfigurationUpdateResult(), originalId ? Dashboard.navigate("livetvstatus.html") : Dashboard.navigate("livetvstatus.html")
        }, function() {
            Dashboard.alert({
                message: Globalize.translate("ErrorSavingTvProvider")
            })
        })
    }

    function getRequirePromise(deps) {
        return new Promise(function(resolve, reject) {
            require(deps, resolve)
        })
    }

    function getDetectedDevice() {
        return getRequirePromise(["tunerPicker"]).then(function(tunerPicker) {
            return (new tunerPicker).show({
                serverId: ApiClient.serverId()
            })
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
    return function(view, params) {
        function onTypeChange() {
            var value = this.value,
                mayIncludeUnsupportedDrmChannels = "hdhomerun" === value,
                supportsTranscoding = "hdhomerun" === value,
                supportsFavorites = "hdhomerun" === value,
                supportsTunerIpAddress = "hdhomerun" === value,
                supportsTunerFileOrUrl = "m3u" === value,
                suppportsSubmit = "other" !== value;
            supportsTunerIpAddress ? (view.querySelector(".txtDevicePath").label(globalize.translate("LabelTunerIpAddress")), view.querySelector(".btnSelectPath").classList.add("hide"), view.querySelector(".fldPath").classList.remove("hide")) : supportsTunerFileOrUrl ? (view.querySelector(".txtDevicePath").label(globalize.translate("LabelFileOrUrl")), view.querySelector(".btnSelectPath").classList.remove("hide"), view.querySelector(".fldPath").classList.remove("hide")) : (view.querySelector(".fldPath").classList.add("hide"), view.querySelector(".btnSelectPath").classList.add("hide")), supportsFavorites ? view.querySelector(".fldFavorites").classList.remove("hide") : view.querySelector(".fldFavorites").classList.add("hide"), supportsTranscoding ? view.querySelector(".fldTranscode").classList.remove("hide") : view.querySelector(".fldTranscode").classList.add("hide"), mayIncludeUnsupportedDrmChannels ? view.querySelector(".drmMessage").classList.remove("hide") : view.querySelector(".drmMessage").classList.add("hide"), suppportsSubmit ? (view.querySelector(".button-submit").classList.remove("hide"), view.querySelector(".otherOptionsMessage").classList.add("hide")) : (view.querySelector(".button-submit").classList.add("hide"), view.querySelector(".otherOptionsMessage").classList.remove("hide"))
        }
        params.id || view.querySelector(".btnDetect").classList.remove("hide"), view.addEventListener("viewshow", function() {
            LibraryMenu.setTabs("livetvadmin", 0, getTabs);
            var currentId = params.id;
            fillTypes(view, currentId).then(function() {
                reload(view, currentId)
            })
        }), view.querySelector("form").addEventListener("submit", function(e) {
            return submitForm(view), e.preventDefault(), e.stopPropagation(), !1
        }), view.querySelector(".selectType").addEventListener("change", onTypeChange), view.querySelector(".btnDetect").addEventListener("click", function() {
            getDetectedDevice().then(function(info) {
                fillTunerHostInfo(view, info)
            })
        }), view.querySelector(".btnSelectPath").addEventListener("click", function() {
            require(["directorybrowser"], function(directoryBrowser) {
                var picker = new directoryBrowser;
                picker.show({
                    includeFiles: !0,
                    callback: function(path) {
                        path && (view.querySelector(".txtDevicePath").value = path), picker.close()
                    }
                })
            })
        })
    }
});