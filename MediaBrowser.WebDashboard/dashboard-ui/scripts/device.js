define(["jQuery", "loading"], function($, loading) {
    "use strict";

    function load(page, device, capabilities) {
        capabilities.SupportsContentUploading ? $("#fldCameraUploadPath", page).removeClass("hide") : $("#fldCameraUploadPath", page).addClass("hide"), $("#txtCustomName", page).val(device.CustomName || ""), $("#txtUploadPath", page).val(device.CameraUploadPath || ""), $(".reportedName", page).html(device.ReportedName || "")
    }

    function loadData(page) {
        loading.show();
        var id = getParameterByName("id"),
            promise1 = ApiClient.getJSON(ApiClient.getUrl("Devices/Info", {
                Id: id
            })),
            promise2 = ApiClient.getJSON(ApiClient.getUrl("Devices/Capabilities", {
                Id: id
            }));
        Promise.all([promise1, promise2]).then(function(responses) {
            load(page, responses[0], responses[1]), loading.hide()
        })
    }

    function save(page) {
        var id = getParameterByName("id");
        ApiClient.ajax({
            url: ApiClient.getUrl("Devices/Options", {
                Id: id
            }),
            type: "POST",
            data: JSON.stringify({
                CustomName: $("#txtCustomName", page).val(),
                CameraUploadPath: $("#txtUploadPath", page).val()
            }),
            contentType: "application/json"
        }).then(Dashboard.processServerConfigurationUpdateResult)
    }

    function onSubmit() {
        var form = this,
            page = $(form).parents(".page");
        return save(page), !1
    }

    function getTabs() {
        return [{
            href: "devices.html",
            name: Globalize.translate("TabDevices")
        }, {
            href: "devicesupload.html",
            name: Globalize.translate("TabCameraUpload")
        }]
    }
    $(document).on("pageinit", "#devicePage", function() {
        var page = this;
        $("#btnSelectUploadPath", page).on("click.selectDirectory", function() {
            require(["directorybrowser"], function(directoryBrowser) {
                var picker = new directoryBrowser;
                picker.show({
                    callback: function(path) {
                        path && $("#txtUploadPath", page).val(path), picker.close()
                    },
                    header: Globalize.translate("HeaderSelectUploadPath")
                })
            })
        }), $(".deviceForm").off("submit", onSubmit).on("submit", onSubmit)
    }).on("pageshow", "#devicePage", function() {
        LibraryMenu.setTabs("devices", 0, getTabs);
        var page = this;
        loadData(page)
    })
});