define(["dialogHelper", "globalize", "layoutManager", "mediaInfo", "apphost", "connectionManager", "require", "loading", "scrollHelper", "imageLoader", "datetime", "scrollStyles", "emby-button", "emby-checkbox", "emby-input", "emby-select", "paper-icon-button-light", "css!./../formdialog", "css!./recordingcreator", "material-icons"], function(dialogHelper, globalize, layoutManager, mediaInfo, appHost, connectionManager, require, loading, scrollHelper, imageLoader, datetime) {
    "use strict";

    function deleteTimer(apiClient, timerId) {
        return new Promise(function(resolve, reject) {
            require(["recordingHelper"], function(recordingHelper) {
                recordingHelper.cancelSeriesTimerWithConfirmation(timerId, apiClient.serverId()).then(resolve, reject)
            })
        })
    }

    function renderTimer(context, item, apiClient) {
        item.ProgramInfo || {};
        context.querySelector("#txtPrePaddingMinutes").value = item.PrePaddingSeconds / 60, context.querySelector("#txtPostPaddingMinutes").value = item.PostPaddingSeconds / 60, context.querySelector(".selectChannels").value = item.RecordAnyChannel ? "all" : "one", context.querySelector(".selectAirTime").value = item.RecordAnyTime ? "any" : "original", context.querySelector(".selectShowType").value = item.RecordNewOnly ? "new" : "all", context.querySelector(".chkSkipEpisodesInLibrary").checked = item.SkipEpisodesInLibrary, context.querySelector(".selectKeepUpTo").value = item.KeepUpTo || 0, item.ChannelName || item.ChannelNumber ? context.querySelector(".optionChannelOnly").innerHTML = globalize.translate("sharedcomponents#ChannelNameOnly", item.ChannelName || item.ChannelNumber) : context.querySelector(".optionChannelOnly").innerHTML = globalize.translate("sharedcomponents#OneChannel"), context.querySelector(".optionAroundTime").innerHTML = globalize.translate("sharedcomponents#AroundTime", datetime.getDisplayTime(datetime.parseISO8601Date(item.StartDate))), loading.hide()
    }

    function closeDialog(isDeleted) {
        recordingUpdated = !0, recordingDeleted = isDeleted, dialogHelper.close(currentDialog)
    }

    function onSubmit(e) {
        var form = this,
            apiClient = connectionManager.getApiClient(currentServerId);
        return apiClient.getLiveTvSeriesTimer(currentItemId).then(function(item) {
            item.PrePaddingSeconds = 60 * form.querySelector("#txtPrePaddingMinutes").value, item.PostPaddingSeconds = 60 * form.querySelector("#txtPostPaddingMinutes").value, item.RecordAnyChannel = "all" === form.querySelector(".selectChannels").value, item.RecordAnyTime = "any" === form.querySelector(".selectAirTime").value, item.RecordNewOnly = "new" === form.querySelector(".selectShowType").value, item.SkipEpisodesInLibrary = form.querySelector(".chkSkipEpisodesInLibrary").checked, item.KeepUpTo = form.querySelector(".selectKeepUpTo").value, apiClient.updateLiveTvSeriesTimer(item)
        }), e.preventDefault(), !1
    }

    function init(context) {
        fillKeepUpTo(context), context.querySelector(".btnCancel").addEventListener("click", function() {
            closeDialog(!1)
        }), context.querySelector(".btnCancelRecording").addEventListener("click", function() {
            var apiClient = connectionManager.getApiClient(currentServerId);
            deleteTimer(apiClient, currentItemId).then(function() {
                closeDialog(!0)
            })
        }), context.querySelector("form").addEventListener("submit", onSubmit)
    }

    function reload(context, id) {
        var apiClient = connectionManager.getApiClient(currentServerId);
        loading.show(), "string" == typeof id ? (currentItemId = id, apiClient.getLiveTvSeriesTimer(id).then(function(result) {
            renderTimer(context, result, apiClient), loading.hide()
        })) : id && (currentItemId = id.Id, renderTimer(context, id, apiClient), loading.hide())
    }

    function fillKeepUpTo(context) {
        for (var html = "", i = 0; i <= 50; i++) {
            var text;
            text = 0 === i ? globalize.translate("sharedcomponents#AsManyAsPossible") : 1 === i ? globalize.translate("sharedcomponents#ValueOneEpisode") : globalize.translate("sharedcomponents#ValueEpisodeCount", i), html += '<option value="' + i + '">' + text + "</option>"
        }
        context.querySelector(".selectKeepUpTo").innerHTML = html
    }

    function onFieldChange(e) {
        this.querySelector(".btnSubmit").click()
    }

    function embed(itemId, serverId, options) {
        recordingUpdated = !1, recordingDeleted = !1, currentServerId = serverId, loading.show(), options = options || {}, require(["text!./seriesrecordingeditor.template.html"], function(template) {
            var dialogOptions = {
                removeOnClose: !0,
                scrollY: !1
            };
            layoutManager.tv ? dialogOptions.size = "fullscreen" : dialogOptions.size = "small";
            var dlg = options.context;
            dlg.classList.add("hide"), dlg.innerHTML = globalize.translateDocument(template, "sharedcomponents"), dlg.querySelector(".formDialogHeader").classList.add("hide"), dlg.querySelector(".formDialogFooter").classList.add("hide"), dlg.querySelector(".formDialogContent").className = "", dlg.querySelector(".dialogContentInner").className = "", dlg.classList.remove("hide"), dlg.removeEventListener("change", onFieldChange), dlg.addEventListener("change", onFieldChange), currentDialog = dlg, init(dlg), reload(dlg, itemId)
        })
    }

    function showEditor(itemId, serverId, options) {
        return new Promise(function(resolve, reject) {
            recordingUpdated = !1, recordingDeleted = !1, currentServerId = serverId, loading.show(), options = options || {}, require(["text!./seriesrecordingeditor.template.html"], function(template) {
                var dialogOptions = {
                    removeOnClose: !0,
                    scrollY: !1
                };
                layoutManager.tv ? dialogOptions.size = "fullscreen" : dialogOptions.size = "small";
                var dlg = dialogHelper.createDialog(dialogOptions);
                dlg.classList.add("formDialog"), dlg.classList.add("recordingDialog"), layoutManager.tv || (dlg.style["min-width"] = "20%");
                var html = "";
                html += globalize.translateDocument(template, "sharedcomponents"), dlg.innerHTML = html, options.enableCancel === !1 && dlg.querySelector(".formDialogFooter").classList.add("hide"), currentDialog = dlg, dlg.addEventListener("closing", function() {
                    recordingDeleted || this.querySelector(".btnSubmit").click()
                }), dlg.addEventListener("close", function() {
                    recordingUpdated ? resolve({
                        updated: !0,
                        deleted: recordingDeleted
                    }) : reject()
                }), layoutManager.tv && scrollHelper.centerFocus.on(dlg.querySelector(".formDialogContent"), !1), init(dlg), reload(dlg, itemId), dialogHelper.open(dlg)
            })
        })
    }
    var currentDialog, currentItemId, currentServerId, recordingUpdated = !1,
        recordingDeleted = !1;
    return {
        show: showEditor,
        embed: embed
    }
});