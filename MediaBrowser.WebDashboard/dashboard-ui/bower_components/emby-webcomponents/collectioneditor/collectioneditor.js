define(["shell", "dialogHelper", "loading", "layoutManager", "connectionManager", "embyRouter", "globalize", "emby-checkbox", "emby-input", "paper-icon-button-light", "emby-select", "material-icons", "css!./../formdialog", "emby-button"], function(shell, dialogHelper, loading, layoutManager, connectionManager, embyRouter, globalize) {
    "use strict";

    function parentWithClass(elem, className) {
        for (; !elem.classList || !elem.classList.contains(className);)
            if (elem = elem.parentNode, !elem) return null;
        return elem
    }

    function onSubmit(e) {
        loading.show();
        var panel = parentWithClass(this, "dialog"),
            collectionId = panel.querySelector("#selectCollectionToAddTo").value,
            apiClient = connectionManager.getApiClient(currentServerId);
        return collectionId ? addToCollection(apiClient, panel, collectionId) : createCollection(apiClient, panel), e.preventDefault(), !1
    }

    function createCollection(apiClient, dlg) {
        var url = apiClient.getUrl("Collections", {
            Name: dlg.querySelector("#txtNewCollectionName").value,
            IsLocked: !dlg.querySelector("#chkEnableInternetMetadata").checked,
            Ids: dlg.querySelector(".fldSelectedItemIds").value || ""
        });
        apiClient.ajax({
            type: "POST",
            url: url,
            dataType: "json"
        }).then(function(result) {
            loading.hide();
            var id = result.Id;
            dialogHelper.close(dlg), redirectToCollection(apiClient, id)
        })
    }

    function redirectToCollection(apiClient, id) {
        apiClient.getItem(apiClient.getCurrentUserId(), id).then(function(item) {
            embyRouter.showItem(item)
        })
    }

    function addToCollection(apiClient, dlg, id) {
        var url = apiClient.getUrl("Collections/" + id + "/Items", {
            Ids: dlg.querySelector(".fldSelectedItemIds").value || ""
        });
        apiClient.ajax({
            type: "POST",
            url: url
        }).then(function() {
            loading.hide(), dialogHelper.close(dlg), require(["toast"], function(toast) {
                toast(globalize.translate("sharedcomponents#MessageItemsAdded"))
            })
        })
    }

    function triggerChange(select) {
        select.dispatchEvent(new CustomEvent("change", {}))
    }

    function populateCollections(panel) {
        loading.show();
        var select = panel.querySelector("#selectCollectionToAddTo");
        panel.querySelector(".newCollectionInfo").classList.add("hide");
        var options = {
                Recursive: !0,
                IncludeItemTypes: "BoxSet",
                SortBy: "SortName"
            },
            apiClient = connectionManager.getApiClient(currentServerId);
        apiClient.getItems(apiClient.getCurrentUserId(), options).then(function(result) {
            var html = "";
            html += '<option value="">' + globalize.translate("sharedcomponents#OptionNew") + "</option>", html += result.Items.map(function(i) {
                return '<option value="' + i.Id + '">' + i.Name + "</option>"
            }), select.innerHTML = html, select.value = "", triggerChange(select), loading.hide()
        })
    }

    function getEditorHtml() {
        var html = "";
        return html += '<div class="formDialogContent smoothScrollY" style="padding-top:2em;">', html += '<div class="dialogContentInner dialog-content-centered">', html += '<form class="newCollectionForm" style="margin:auto;">', html += "<div>", html += globalize.translate("sharedcomponents#NewCollectionHelp"), html += "</div>", html += '<div class="fldSelectCollection">', html += "<br/>", html += "<br/>", html += '<div class="selectContainer">', html += '<select is="emby-select" label="' + globalize.translate("sharedcomponents#LabelCollection") + '" id="selectCollectionToAddTo" autofocus></select>', html += "</div>", html += "</div>", html += '<div class="newCollectionInfo">', html += '<div class="inputContainer">', html += '<input is="emby-input" type="text" id="txtNewCollectionName" required="required" label="' + globalize.translate("sharedcomponents#LabelName") + '" />', html += '<div class="fieldDescription">' + globalize.translate("sharedcomponents#NewCollectionNameExample") + "</div>", html += "</div>", html += '<label class="checkboxContainer">', html += '<input is="emby-checkbox" type="checkbox" id="chkEnableInternetMetadata" />', html += "<span>" + globalize.translate("sharedcomponents#SearchForCollectionInternetMetadata") + "</span>", html += "</label>", html += "</div>", html += '<div class="formDialogFooter">', html += '<button is="emby-button" type="submit" class="raised btnSubmit block formDialogFooterItem button-submit">' + globalize.translate("sharedcomponents#ButtonOk") + "</button>", html += "</div>", html += '<input type="hidden" class="fldSelectedItemIds" />', html += "</form>", html += "</div>", html += "</div>"
    }

    function initEditor(content, items) {
        if (content.querySelector("#selectCollectionToAddTo").addEventListener("change", function() {
                this.value ? (content.querySelector(".newCollectionInfo").classList.add("hide"), content.querySelector("#txtNewCollectionName").removeAttribute("required")) : (content.querySelector(".newCollectionInfo").classList.remove("hide"), content.querySelector("#txtNewCollectionName").setAttribute("required", "required"))
            }), content.querySelector("form").addEventListener("submit", onSubmit), content.querySelector(".fldSelectedItemIds", content).value = items.join(","), items.length) content.querySelector(".fldSelectCollection").classList.remove("hide"), populateCollections(content);
        else {
            content.querySelector(".fldSelectCollection").classList.add("hide");
            var selectCollectionToAddTo = content.querySelector("#selectCollectionToAddTo");
            selectCollectionToAddTo.innerHTML = "", selectCollectionToAddTo.value = "", triggerChange(selectCollectionToAddTo)
        }
    }

    function centerFocus(elem, horiz, on) {
        require(["scrollHelper"], function(scrollHelper) {
            var fn = on ? "on" : "off";
            scrollHelper.centerFocus[fn](elem, horiz)
        })
    }

    function collectioneditor() {
        var self = this;
        self.show = function(options) {
            var items = options.items || {};
            currentServerId = options.serverId;
            var dialogOptions = {
                removeOnClose: !0,
                scrollY: !1
            };
            layoutManager.tv ? dialogOptions.size = "fullscreen" : dialogOptions.size = "small";
            var dlg = dialogHelper.createDialog(dialogOptions);
            dlg.classList.add("formDialog");
            var html = "",
                title = items.length ? globalize.translate("sharedcomponents#HeaderAddToCollection") : globalize.translate("sharedcomponents#NewCollection");
            return html += '<div class="formDialogHeader">', html += '<button is="paper-icon-button-light" class="btnCancel autoSize" tabindex="-1"><i class="md-icon">&#xE5C4;</i></button>', html += '<h3 class="formDialogHeaderTitle">', html += title, html += "</h3>", html += '<a class="btnHelp" href="https://github.com/MediaBrowser/Wiki/wiki/Collections" target="_blank" style="margin-left:auto;margin-right:.5em;display:inline-block;padding:.25em;display:flex;align-items:center;" title="' + globalize.translate("sharedcomponents#Help") + '"><i class="md-icon">info</i><span style="margin-left:.25em;">' + globalize.translate("sharedcomponents#Help") + "</span></a>", html += "</div>", html += getEditorHtml(), dlg.innerHTML = html, initEditor(dlg, items), dlg.querySelector(".btnCancel").addEventListener("click", function() {
                dialogHelper.close(dlg)
            }), layoutManager.tv && centerFocus(dlg.querySelector(".formDialogContent"), !1, !0), new Promise(function(resolve, reject) {
                layoutManager.tv && centerFocus(dlg.querySelector(".formDialogContent"), !1, !1), dlg.addEventListener("close", resolve), dialogHelper.open(dlg)
            })
        }
    }
    var currentServerId;
    return collectioneditor
});