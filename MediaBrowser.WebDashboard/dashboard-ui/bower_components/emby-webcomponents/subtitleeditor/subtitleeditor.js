define(["dialogHelper", "require", "layoutManager", "globalize", "userSettings", "connectionManager", "loading", "focusManager", "dom", "apphost", "emby-select", "listViewStyle", "paper-icon-button-light", "css!./../formdialog", "material-icons", "css!./subtitleeditor", "emby-button"], function(dialogHelper, require, layoutManager, globalize, userSettings, connectionManager, loading, focusManager, dom, appHost) {
    "use strict";

    function downloadRemoteSubtitles(context, id) {
        var url = "Items/" + currentItem.Id + "/RemoteSearch/Subtitles/" + id,
            apiClient = connectionManager.getApiClient(currentItem.ServerId);
        apiClient.ajax({
            type: "POST",
            url: apiClient.getUrl(url)
        }).then(function() {
            hasChanges = !0, require(["toast"], function(toast) {
                toast(globalize.translate("sharedcomponents#MessageDownloadQueued"))
            }), focusManager.autoFocus(context)
        })
    }

    function deleteLocalSubtitle(context, index) {
        var msg = globalize.translate("sharedcomponents#MessageAreYouSureDeleteSubtitles");
        require(["confirm"], function(confirm) {
            confirm({
                title: globalize.translate("sharedcomponents#ConfirmDeletion"),
                text: msg,
                confirmText: globalize.translate("sharedcomponents#Delete"),
                primary: "cancel"
            }).then(function() {
                loading.show();
                var itemId = currentItem.Id,
                    url = "Videos/" + itemId + "/Subtitles/" + index,
                    apiClient = connectionManager.getApiClient(currentItem.ServerId);
                apiClient.ajax({
                    type: "DELETE",
                    url: apiClient.getUrl(url)
                }).then(function() {
                    hasChanges = !0, reload(context, apiClient, itemId)
                })
            })
        })
    }

    function fillSubtitleList(context, item) {
        var streams = item.MediaStreams || [],
            subs = streams.filter(function(s) {
                return "Subtitle" === s.Type
            }),
            html = "";
        subs.length && (html += "<h1>" + globalize.translate("sharedcomponents#MySubtitles") + "</h1>", html += layoutManager.tv ? '<div class="paperList paperList-clear">' : '<div class="paperList">', html += subs.map(function(s) {
            var itemHtml = "",
                tagName = layoutManager.tv ? "button" : "div",
                className = layoutManager.tv && s.Path ? "listItem btnDelete" : "listItem";
            return layoutManager.tv && (className += " listItem-focusscale listItem-button"), className += " listItem-noborder", itemHtml += "<" + tagName + ' class="' + className + '" data-index="' + s.Index + '">', itemHtml += '<i class="listItemIcon md-icon">closed_caption</i>', itemHtml += '<div class="listItemBody two-line">', itemHtml += "<div>", itemHtml += s.DisplayTitle || "", itemHtml += "</div>", s.Path && (itemHtml += '<div class="secondary listItemBodyText">' + s.Path + "</div>"), itemHtml += "</a>", itemHtml += "</div>", layoutManager.tv || s.Path && (itemHtml += '<button is="paper-icon-button-light" data-index="' + s.Index + '" title="' + globalize.translate("sharedcomponents#Delete") + '" class="btnDelete listItemButton"><i class="md-icon">delete</i></button>'), itemHtml += "</" + tagName + ">"
        }).join(""), html += "</div>");
        var elem = context.querySelector(".subtitleList");
        subs.length ? elem.classList.remove("hide") : elem.classList.add("hide"), elem.innerHTML = html
    }

    function fillLanguages(context, apiClient, languages) {
        var selectLanguage = context.querySelector("#selectLanguage");
        selectLanguage.innerHTML = languages.map(function(l) {
            return '<option value="' + l.ThreeLetterISOLanguageName + '">' + l.DisplayName + "</option>"
        });
        var lastLanguage = userSettings.get("subtitleeditor-language");
        lastLanguage ? selectLanguage.value = lastLanguage : apiClient.getCurrentUser().then(function(user) {
            var lang = user.Configuration.SubtitleLanguagePreference;
            lang && (selectLanguage.value = lang)
        })
    }

    function renderSearchResults(context, results) {
        var lastProvider = "",
            html = "";
        if (!results.length) return context.querySelector(".noSearchResults").classList.remove("hide"), context.querySelector(".subtitleResults").innerHTML = "", void loading.hide();
        context.querySelector(".noSearchResults").classList.add("hide");
        for (var moreIcon = "dots-horiz" === appHost.moreIcon ? "&#xE5D3;" : "&#xE5D4;", i = 0, length = results.length; i < length; i++) {
            var result = results[i],
                provider = result.ProviderName;
            provider !== lastProvider && (i > 0 && (html += "</div>"), html += "<h1>" + provider + "</h1>", html += layoutManager.tv ? '<div class="paperList paperList-clear">' : '<div class="paperList">', lastProvider = provider);
            var tagName = layoutManager.tv ? "button" : "div",
                className = layoutManager.tv ? "listItem btnOptions" : "listItem";
            layoutManager.tv && (className += " listItem-focusscale listItem-button"), html += "<" + tagName + ' class="' + className + '" data-subid="' + result.Id + '">', html += '<i class="listItemIcon md-icon">closed_caption</i>', html += '<div class="listItemBody two-line">', html += "<div>" + result.Name + "</div>", html += '<div class="secondary listItemBodyText">' + result.Format + "</div>", result.Comment && (html += '<div class="secondary listItemBodyText">' + result.Comment + "</div>"), html += "</div>", html += '<div class="secondary listItemAside">' + (result.DownloadCount || 0) + "</div>", layoutManager.tv || (html += '<button type="button" is="paper-icon-button-light" data-subid="' + result.Id + '" class="btnOptions listItemButton"><i class="md-icon">' + moreIcon + "</i></button>"), html += "</" + tagName + ">"
        }
        results.length && (html += "</div>");
        var elem = context.querySelector(".subtitleResults");
        elem.innerHTML = html, loading.hide()
    }

    function searchForSubtitles(context, language) {
        userSettings.set("subtitleeditor-language", language), loading.show();
        var apiClient = connectionManager.getApiClient(currentItem.ServerId),
            url = apiClient.getUrl("Items/" + currentItem.Id + "/RemoteSearch/Subtitles/" + language);
        apiClient.getJSON(url).then(function(results) {
            renderSearchResults(context, results)
        })
    }

    function reload(context, apiClient, itemId) {
        function onGetItem(item) {
            currentItem = item, fillSubtitleList(context, item);
            var file = item.Path || "",
                index = Math.max(file.lastIndexOf("/"), file.lastIndexOf("\\"));
            index > -1 && (file = file.substring(index + 1)), file ? (context.querySelector(".pathValue").innerHTML = file, context.querySelector(".originalFile").classList.remove("hide")) : (context.querySelector(".pathValue").innerHTML = "", context.querySelector(".originalFile").classList.add("hide")), loading.hide()
        }
        context.querySelector(".noSearchResults").classList.add("hide"), "string" == typeof itemId ? apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(onGetItem) : onGetItem(itemId)
    }

    function onSearchSubmit(e) {
        var form = this,
            lang = form.querySelector("#selectLanguage", form).value;
        return searchForSubtitles(dom.parentWithClass(form, "formDialogContent"), lang), e.preventDefault(), !1
    }

    function onSubtitleListClick(e) {
        var btnDelete = dom.parentWithClass(e.target, "btnDelete");
        if (btnDelete) {
            var index = btnDelete.getAttribute("data-index"),
                context = dom.parentWithClass(btnDelete, "subtitleEditorDialog");
            deleteLocalSubtitle(context, index)
        }
    }

    function onSubtitleResultsClick(e) {
        var btnOptions = dom.parentWithClass(e.target, "btnOptions");
        if (btnOptions) {
            var subtitleId = btnOptions.getAttribute("data-subid"),
                context = dom.parentWithClass(btnOptions, "subtitleEditorDialog");
            showDownloadOptions(btnOptions, context, subtitleId)
        }
    }

    function showDownloadOptions(button, context, subtitleId) {
        var items = [];
        items.push({
            name: Globalize.translate("sharedcomponents#Download"),
            id: "download"
        }), require(["actionsheet"], function(actionsheet) {
            actionsheet.show({
                items: items,
                positionTo: button
            }).then(function(id) {
                switch (id) {
                    case "download":
                        downloadRemoteSubtitles(context, subtitleId)
                }
            })
        })
    }

    function centerFocus(elem, horiz, on) {
        require(["scrollHelper"], function(scrollHelper) {
            var fn = on ? "on" : "off";
            scrollHelper.centerFocus[fn](elem, horiz)
        })
    }

    function showEditorInternal(itemId, serverId, template) {
        hasChanges = !1;
        var apiClient = connectionManager.getApiClient(serverId);
        return apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(function(item) {
            var dialogOptions = {
                removeOnClose: !0,
                scrollY: !1
            };
            layoutManager.tv ? dialogOptions.size = "fullscreen" : dialogOptions.size = "small";
            var dlg = dialogHelper.createDialog(dialogOptions);
            dlg.classList.add("formDialog"), dlg.classList.add("subtitleEditorDialog"), dlg.innerHTML = globalize.translateDocument(template, "sharedcomponents"), dlg.querySelector(".originalSubtitleFileLabel").innerHTML = globalize.translate("sharedcomponents#File"), dlg.querySelector(".subtitleSearchForm").addEventListener("submit", onSearchSubmit);
            var btnSubmit = dlg.querySelector(".btnSubmit");
            layoutManager.tv ? (centerFocus(dlg.querySelector(".formDialogContent"), !1, !0), dlg.querySelector(".btnSearchSubtitles").classList.add("hide")) : btnSubmit.classList.add("hide");
            var editorContent = dlg.querySelector(".formDialogContent");
            return dlg.querySelector(".subtitleList").addEventListener("click", onSubtitleListClick), dlg.querySelector(".subtitleResults").addEventListener("click", onSubtitleResultsClick), apiClient.getCultures().then(function(languages) {
                fillLanguages(editorContent, apiClient, languages)
            }), dlg.querySelector(".btnCancel").addEventListener("click", function() {
                dialogHelper.close(dlg)
            }), new Promise(function(resolve, reject) {
                dlg.addEventListener("close", function() {
                    layoutManager.tv && centerFocus(dlg.querySelector(".formDialogContent"), !1, !1), hasChanges ? resolve() : reject()
                }), dialogHelper.open(dlg), reload(editorContent, apiClient, item)
            })
        })
    }

    function showEditor(itemId, serverId) {
        return loading.show(), new Promise(function(resolve, reject) {
            require(["text!./subtitleeditor.template.html"], function(template) {
                showEditorInternal(itemId, serverId, template).then(resolve, reject)
            })
        })
    }
    var currentItem, hasChanges;
    return {
        show: showEditor
    }
});