define(["dialogHelper", "jQuery", "loading", "emby-input", "emby-button", "emby-checkbox", "paper-icon-button-light", "formDialogStyle"], function(dialogHelper, $, loading) {
    "use strict";

    function renderLibrarySharingList(context, result) {
        var folderHtml = "";
        folderHtml += result.Items.map(function(i) {
            var currentHtml = "",
                isChecked = !0,
                checkedHtml = isChecked ? ' checked="checked"' : "";
            return currentHtml += '<label><input is="emby-checkbox" class="chkShareFolder" type="checkbox" data-folderid="' + i.Id + '"' + checkedHtml + "/><span>" + i.Name + "</span></label>"
        }).join(""), context.querySelector(".librarySharingList").innerHTML = folderHtml
    }

    function inviteUser(dlg) {
        loading.show();
        var shareExcludes = $(".chkShareFolder", dlg).get().filter(function(i) {
            return i.checked
        }).map(function(i) {
            return i.getAttribute("data-folderid")
        });
        require(["connectHelper"], function(connectHelper) {
            connectHelper.inviteGuest({
                apiClient: ApiClient,
                guestOptions: {
                    ConnectUsername: dlg.querySelector("#txtConnectUsername").value,
                    EnabledLibraries: shareExcludes.join(","),
                    SendingUserId: Dashboard.getCurrentUserId(),
                    EnableLiveTv: !1
                }
            }).then(function() {
                loading.hide(), dlg.submitted = !0, dialogHelper.close(dlg)
            })
        })
    }
    return {
        show: function() {
            return new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest;
                xhr.open("GET", "components/guestinviter/guestinviter.template.html", !0), xhr.onload = function(e) {
                    var template = this.response,
                        dlg = dialogHelper.createDialog({
                            removeOnClose: !0,
                            size: "small"
                        });
                    dlg.classList.add("ui-body-a"), dlg.classList.add("background-theme-a"), dlg.classList.add("formDialog");
                    var html = "";
                    html += Globalize.translateDocument(template), dlg.innerHTML = html, dialogHelper.open(dlg), dlg.addEventListener("close", function() {
                        dlg.submitted ? resolve() : reject()
                    }), dlg.querySelector(".btnCancel").addEventListener("click", function(e) {
                        dialogHelper.close(dlg)
                    }), dlg.querySelector("form").addEventListener("submit", function(e) {
                        return inviteUser(dlg), e.preventDefault(), !1
                    }), ApiClient.getJSON(ApiClient.getUrl("Library/MediaFolders", {
                        IsHidden: !1
                    })).then(function(result) {
                        renderLibrarySharingList(dlg, result)
                    })
                }, xhr.send()
            })
        }
    }
});