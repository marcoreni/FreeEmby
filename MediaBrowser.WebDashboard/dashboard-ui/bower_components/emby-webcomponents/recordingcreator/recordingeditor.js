define(["dialogHelper", "globalize", "layoutManager", "mediaInfo", "apphost", "connectionManager", "require", "loading", "scrollHelper", "imageLoader", "scrollStyles", "emby-button", "emby-collapse", "emby-input", "paper-icon-button-light", "css!./../formdialog", "css!./recordingcreator", "material-icons"], function(dialogHelper, globalize, layoutManager, mediaInfo, appHost, connectionManager, require, loading, scrollHelper, imageLoader) {
    "use strict";

    function deleteTimer(apiClient, timerId) {
        return new Promise(function(resolve, reject) {
            require(["recordingHelper"], function(recordingHelper) {
                recordingHelper.cancelTimerWithConfirmation(timerId, apiClient.serverId()).then(resolve, reject)
            })
        })
    }

    function renderTimer(context, item, apiClient) {
        item.ProgramInfo || {};
        context.querySelector("#txtPrePaddingMinutes").value = item.PrePaddingSeconds / 60, context.querySelector("#txtPostPaddingMinutes").value = item.PostPaddingSeconds / 60, loading.hide()
    }

    function closeDialog(isDeleted) {
        recordingDeleted = isDeleted, dialogHelper.close(currentDialog)
    }

    function onSubmit(e) {
        var form = this,
            apiClient = connectionManager.getApiClient(currentServerId);
        return apiClient.getLiveTvTimer(currentItemId).then(function(item) {
            item.PrePaddingSeconds = 60 * form.querySelector("#txtPrePaddingMinutes").value, item.PostPaddingSeconds = 60 * form.querySelector("#txtPostPaddingMinutes").value, apiClient.updateLiveTvTimer(item).then(currentResolve)
        }), e.preventDefault(), !1
    }

    function init(context) {
        context.querySelector(".btnCancel").addEventListener("click", function() {
            closeDialog(!1)
        }), context.querySelector(".btnCancelRecording").addEventListener("click", function() {
            var apiClient = connectionManager.getApiClient(currentServerId);
            deleteTimer(apiClient, currentItemId).then(function() {
                closeDialog(!0)
            })
        }), context.querySelector("form").addEventListener("submit", onSubmit)
    }

    function reload(context, id) {
        loading.show(), currentItemId = id;
        var apiClient = connectionManager.getApiClient(currentServerId);
        apiClient.getLiveTvTimer(id).then(function(result) {
            renderTimer(context, result, apiClient), loading.hide()
        })
    }

    function showEditor(itemId, serverId, options) {
        return new Promise(function(resolve, reject) {
            recordingDeleted = !1, currentServerId = serverId, loading.show(), options = options || {}, currentResolve = resolve, require(["text!./recordingeditor.template.html"], function(template) {
                var dialogOptions = {
                    removeOnClose: !0,
                    scrollY: !1
                };
                layoutManager.tv && (dialogOptions.size = "fullscreen");
                var dlg = dialogHelper.createDialog(dialogOptions);
                dlg.classList.add("formDialog"), dlg.classList.add("recordingDialog"), layoutManager.tv || (dlg.style["min-width"] = "20%", dlg.classList.add("dialog-fullscreen-lowres"));
                var html = "";
                html += globalize.translateDocument(template, "sharedcomponents"), dlg.innerHTML = html, options.enableCancel === !1 && dlg.querySelector(".formDialogFooter").classList.add("hide"), currentDialog = dlg, dlg.addEventListener("closing", function() {
                    recordingDeleted || dlg.querySelector(".btnSubmit").click()
                }), dlg.addEventListener("close", function() {
                    recordingDeleted && resolve({
                        updated: !0,
                        deleted: !0
                    })
                }), layoutManager.tv && scrollHelper.centerFocus.on(dlg.querySelector(".formDialogContent"), !1), init(dlg), reload(dlg, itemId), dialogHelper.open(dlg)
            })
        })
    }
    var currentDialog, currentItemId, currentServerId, currentResolve, recordingDeleted = !1;
    return {
        show: showEditor
    }
});