define(["connectionManager", "serverNotifications", "events", "datetime", "dom", "imageLoader", "loading", "globalize", "apphost", "layoutManager", "scrollHelper", "dialogHelper", "shell", "listViewStyle", "paper-icon-button-light", "emby-button", "formDialogStyle"], function(connectionManager, serverNotifications, events, datetime, dom, imageLoader, loading, globalize, appHost, layoutManager, scrollHelper, dialogHelper, shell) {
    "use strict";

    function renderJob(context, job, dialogOptions) {
        require(["syncDialog"], function(syncDialog) {
            syncDialog.renderForm({
                elem: context.querySelector(".syncJobFormContent"),
                dialogOptions: dialogOptions,
                dialogOptionsFn: getTargetDialogOptionsFn(dialogOptions),
                showName: !0,
                readOnlySyncTarget: !0
            }).then(function() {
                fillJobValues(context, job, dialogOptions)
            })
        })
    }

    function getTargetDialogOptionsFn(dialogOptions) {
        return function(targetId) {
            return Promise.resolve(dialogOptions)
        }
    }

    function getJobItemHtml(jobItem, apiClient, index) {
        var html = "",
            hasActions = ["Queued", "Cancelled", "Failed", "ReadyToTransfer", "Transferring", "Converting", "Synced"].indexOf(jobItem.Status) !== -1,
            listItemClass = "listItem listItem-shaded";
        layoutManager.tv && hasActions && (listItemClass += " btnJobItemMenu"), layoutManager.tv && (listItemClass += " listItem-button");
        var tagName = layoutManager.tv ? "button" : "div";
        html += "<" + tagName + ' type="button" class="' + listItemClass + '" data-itemid="' + jobItem.Id + '" data-status="' + jobItem.Status + '" data-remove="' + jobItem.IsMarkedForRemoval + '">';
        var imgUrl;
        jobItem.PrimaryImageItemId && (imgUrl = apiClient.getImageUrl(jobItem.PrimaryImageItemId, {
            type: "Primary",
            width: 80,
            tag: jobItem.PrimaryImageTag,
            minScale: 1.5
        })), html += imgUrl ? '<div class="listItemImage" style="background-image:url(\'' + imgUrl + "');background-repeat:no-repeat;background-position:center center;background-size: cover;\"></div>" : '<i class="md-icon listItemIcon">sync</i>', html += '<div class="listItemBody three-line">', html += '<h3 class="listItemBodyText">', html += jobItem.ItemName, html += "</h3>", html += "Failed" === jobItem.Status ? '<div class="secondary listItemBodyText" style="color:red;">' : '<div class="secondary listItemBodyText">', html += globalize.translate("sharedcomponents#SyncJobItemStatus" + jobItem.Status), "Synced" === jobItem.Status && jobItem.IsMarkedForRemoval && (html += "<br/>", html += globalize.translate("sharedcomponents#RemovingFromDevice")), html += "</div>", html += '<div class="secondary listItemBodyText" style="padding-top:5px;">', html += '<div style="background:#e0e0e0;height:2px;"><div style="background:#52B54B;width:' + (jobItem.Progress || 0) + '%;height:100%;"></div></div>', html += "</div>", html += "</div>";
        var moreIcon = "dots-horiz" === appHost.moreIcon ? "&#xE5D3;" : "&#xE5D4;";
        return layoutManager.tv || (html += hasActions ? '<button type="button" is="paper-icon-button-light" class="btnJobItemMenu autoSize"><i class="md-icon">' + moreIcon + "</i></button>" : '<button type="button" is="paper-icon-button-light" class="btnJobItemMenu autoSize" disabled><i class="md-icon">' + moreIcon + "</i></button>"), html += "</" + tagName + ">"
    }

    function renderJobItems(context, items, apiClient) {
        var html = "";
        html += "<h1>" + globalize.translate("sharedcomponents#Items") + "</h1>", html += '<div class="paperList">';
        var index = 0;
        html += items.map(function(i) {
            return getJobItemHtml(i, apiClient, index++)
        }).join(""), html += "</div>";
        var elem = context.querySelector(".jobItems");
        elem.innerHTML = html, imageLoader.lazyChildren(elem)
    }

    function parentWithClass(elem, className) {
        for (; !elem.classList || !elem.classList.contains(className);)
            if (elem = elem.parentNode, !elem) return null;
        return elem
    }

    function showJobItemMenu(elem, jobId, apiClient) {
        var context = parentWithClass(elem, "formDialog"),
            listItem = parentWithClass(elem, "listItem"),
            jobItemId = listItem.getAttribute("data-itemid"),
            status = listItem.getAttribute("data-status"),
            remove = "true" === listItem.getAttribute("data-remove").toLowerCase(),
            menuItems = [];
        "Failed" === status || "Cancelled" === status ? menuItems.push({
            name: globalize.translate("sharedcomponents#Retry"),
            id: "retry"
        }) : "Queued" === status || "Transferring" === status || "Converting" === status || "ReadyToTransfer" === status ? menuItems.push({
            name: globalize.translate("sharedcomponents#CancelDownload"),
            id: "cancel"
        }) : "Synced" === status && remove ? menuItems.push({
            name: globalize.translate("sharedcomponents#KeepOnDevice"),
            id: "unmarkforremoval"
        }) : "Synced" === status && menuItems.push({
            name: globalize.translate("sharedcomponents#RemoveFromDevice"),
            id: "markforremoval"
        }), require(["actionsheet"], function(actionsheet) {
            actionsheet.show({
                items: menuItems,
                positionTo: elem,
                callback: function(id) {
                    switch (id) {
                        case "cancel":
                            cancelJobItem(context, jobId, jobItemId, apiClient);
                            break;
                        case "retry":
                            retryJobItem(context, jobId, jobItemId, apiClient);
                            break;
                        case "markforremoval":
                            markForRemoval(context, jobId, jobItemId, apiClient);
                            break;
                        case "unmarkforremoval":
                            unMarkForRemoval(context, jobId, jobItemId, apiClient)
                    }
                }
            })
        })
    }

    function cancelJobItem(context, jobId, jobItemId, apiClient) {
        loading.show(), apiClient.ajax({
            type: "DELETE",
            url: apiClient.getUrl("Sync/JobItems/" + jobItemId)
        }).then(function() {
            loadJob(context, jobId, apiClient)
        })
    }

    function markForRemoval(context, jobId, jobItemId, apiClient) {
        apiClient.ajax({
            type: "POST",
            url: apiClient.getUrl("Sync/JobItems/" + jobItemId + "/MarkForRemoval")
        }).then(function() {
            loadJob(context, jobId, apiClient)
        })
    }

    function unMarkForRemoval(context, jobId, jobItemId, apiClient) {
        apiClient.ajax({
            type: "POST",
            url: apiClient.getUrl("Sync/JobItems/" + jobItemId + "/UnmarkForRemoval")
        }).then(function() {
            loadJob(context, jobId, apiClient)
        })
    }

    function retryJobItem(context, jobId, jobItemId, apiClient) {
        apiClient.ajax({
            type: "POST",
            url: apiClient.getUrl("Sync/JobItems/" + jobItemId + "/Enable")
        }).then(function() {
            loadJob(context, jobId, apiClient)
        })
    }

    function fillJobValues(context, job, editOptions) {
        var txtSyncJobName = context.querySelector(".syncJobName");
        txtSyncJobName && (txtSyncJobName.innerHTML = job.Name);
        var selectProfile = context.querySelector("#selectProfile");
        selectProfile && (selectProfile.value = job.Profile || "");
        var selectQuality = context.querySelector("#selectQuality");
        selectQuality && (selectQuality.value = job.Quality || "");
        var chkUnwatchedOnly = context.querySelector("#chkUnwatchedOnly");
        chkUnwatchedOnly && (chkUnwatchedOnly.checked = job.UnwatchedOnly);
        var chkSyncNewContent = context.querySelector("#chkSyncNewContent");
        chkSyncNewContent && (chkSyncNewContent.checked = job.SyncNewContent);
        var txtItemLimit = context.querySelector("#txtItemLimit");
        txtItemLimit && (txtItemLimit.value = job.ItemLimit);
        var txtBitrate = context.querySelector("#txtBitrate");
        job.Bitrate ? txtBitrate.value = job.Bitrate / 1e6 : txtBitrate.value = "";
        var target = editOptions.Targets.filter(function(t) {
                return t.Id === job.TargetId
            })[0],
            targetName = target ? target.Name : "",
            selectSyncTarget = context.querySelector("#selectSyncTarget");
        selectSyncTarget && (selectSyncTarget.value = targetName)
    }

    function loadJob(context, id, apiClient) {
        loading.show(), apiClient.getJSON(apiClient.getUrl("Sync/Jobs/" + id)).then(function(job) {
            apiClient.getJSON(apiClient.getUrl("Sync/Options", {
                UserId: job.UserId,
                ItemIds: job.RequestedItemIds && job.RequestedItemIds.length ? job.RequestedItemIds.join("") : null,
                ParentId: job.ParentId,
                Category: job.Category,
                TargetId: job.TargetId
            })).then(function(options) {
                _jobOptions = options, renderJob(context, job, options), loading.hide()
            })
        }), apiClient.getJSON(apiClient.getUrl("Sync/JobItems", {
            JobId: id,
            AddMetadata: !0
        })).then(function(result) {
            renderJobItems(context, result.Items, apiClient), loading.hide()
        })
    }

    function loadJobInfo(context, job, jobItems, apiClient) {
        renderJobItems(context, jobItems, apiClient), loading.hide()
    }

    function saveJob(context, id, apiClient) {
        loading.show(), apiClient.getJSON(apiClient.getUrl("Sync/Jobs/" + id)).then(function(job) {
            require(["syncDialog"], function(syncDialog) {
                syncDialog.setJobValues(job, context), apiClient.ajax({
                    url: apiClient.getUrl("Sync/Jobs/" + id),
                    type: "POST",
                    data: JSON.stringify(job),
                    contentType: "application/json"
                }).then(function() {
                    loading.hide(), dialogHelper.close(context)
                })
            })
        })
    }

    function onHelpLinkClick(e) {
        return shell.openUrl(this.href), e.preventDefault(), !1
    }

    function startListening(apiClient, jobId) {
        var startParams = "0,1500";
        startParams += "," + jobId, apiClient.isWebSocketOpen() && apiClient.sendWebSocketMessage("SyncJobStart", startParams)
    }

    function stopListening(apiClient) {
        apiClient.isWebSocketOpen() && apiClient.sendWebSocketMessage("SyncJobStop", "")
    }

    function bindEvents(context, jobId, apiClient) {
        context.querySelector(".jobItems").addEventListener("click", function(e) {
            var btnJobItemMenu = dom.parentWithClass(e.target, "btnJobItemMenu");
            btnJobItemMenu && showJobItemMenu(btnJobItemMenu, jobId, apiClient)
        })
    }

    function showEditor(options) {
        function onSyncJobMessage(e, apiClient, msg) {
            loadJobInfo(dlg, msg.Job, msg.JobItems, apiClient)
        }
        var apiClient = connectionManager.getApiClient(options.serverId),
            id = options.jobId,
            dlgElementOptions = {
                removeOnClose: !0,
                scrollY: !1,
                autoFocus: !1
            };
        layoutManager.tv ? dlgElementOptions.size = "fullscreen" : dlgElementOptions.size = "medium";
        var dlg = dialogHelper.createDialog(dlgElementOptions);
        dlg.classList.add("formDialog");
        var html = "";
        html += '<div class="formDialogHeader">', html += '<button is="paper-icon-button-light" class="btnCancel autoSize" tabindex="-1"><i class="md-icon">&#xE5C4;</i></button>', html += '<h3 class="formDialogHeaderTitle">', html += globalize.translate("sharedcomponents#Sync"), html += "</h3>", html += '<a href="https://github.com/MediaBrowser/Wiki/wiki/Sync" target="_blank" class="clearLink lnkHelp" style="margin-top:0;display:inline-block;vertical-align:middle;margin-left:auto;"><button is="emby-button" type="button" class="button-accent-flat button-flat"><i class="md-icon">info</i><span>' + globalize.translate("sharedcomponents#Help") + "</span></button></a>", html += "</div>", html += '<div class="formDialogContent smoothScrollY" style="padding-top:2em;">', html += '<div class="dialogContentInner dialog-content-centered">', html += '<form class="syncJobForm" style="margin: auto;">', html += '<div class="syncJobFormContent"></div>', html += '<div class="jobItems"></div>', html += '<div class="formDialogFooter">', html += '<button is="emby-button" type="submit" class="raised button-submit block formDialogFooterItem"><span>' + globalize.translate("sharedcomponents#Save") + "</span></button>", html += "</div>", html += "</form>", html += "</div>", html += "</div>", dlg.innerHTML = html, dlg.querySelector(".lnkHelp").addEventListener("click", onHelpLinkClick);
        var submitted = !1;
        dlg.querySelector("form").addEventListener("submit", function(e) {
            return saveJob(dlg, id, apiClient), e.preventDefault(), !1
        }), dlg.querySelector(".btnCancel").addEventListener("click", function() {
            dialogHelper.close(dlg)
        }), layoutManager.tv && scrollHelper.centerFocus.on(dlg.querySelector(".formDialogContent"), !1), loadJob(dlg, id, apiClient), bindEvents(dlg, id, apiClient);
        var promise = dialogHelper.open(dlg);
        return startListening(apiClient, id), events.on(serverNotifications, "SyncJob", onSyncJobMessage), promise.then(function() {
            return stopListening(apiClient), events.off(serverNotifications, "SyncJob", onSyncJobMessage), layoutManager.tv && scrollHelper.centerFocus.off(dlg.querySelector(".formDialogContent"), !1), submitted ? Promise.resolve() : Promise.reject()
        })
    }
    var _jobOptions;
    return {
        show: showEditor
    }
});