define(["require", "globalize", "loading", "connectionManager", "homeSections", "dom", "events", "listViewStyle", "emby-select", "emby-checkbox", "css!./homescreensettings"], function(require, globalize, loading, connectionManager, homeSections, dom, events) {
    "use strict";

    function renderLatestItems(context, user, result) {
        var folderHtml = "";
        folderHtml += '<div class="checkboxList">';
        var excludeViewTypes = ["playlists", "livetv", "boxsets", "channels"],
            excludeItemTypes = ["Channel"];
        folderHtml += result.Items.map(function(i) {
            if (excludeViewTypes.indexOf(i.CollectionType || []) !== -1) return "";
            if (excludeItemTypes.indexOf(i.Type) !== -1) return "";
            var currentHtml = "",
                id = "chkIncludeInLatest" + i.Id,
                isChecked = user.Configuration.LatestItemsExcludes.indexOf(i.Id) === -1,
                checkedHtml = isChecked ? ' checked="checked"' : "";
            return currentHtml += "<label>", currentHtml += '<input type="checkbox" is="emby-checkbox" class="chkIncludeInLatest" data-folderid="' + i.Id + '" id="' + id + '"' + checkedHtml + "/>", currentHtml += "<span>" + i.Name + "</span>", currentHtml += "</label>"
        }).join(""), folderHtml += "</div>", context.querySelector(".latestItemsList").innerHTML = folderHtml
    }

    function renderViews(page, user, result) {
        var folderHtml = "";
        folderHtml += '<div class="checkboxList">', folderHtml += result.map(function(i) {
            var currentHtml = "",
                id = "chkGroupFolder" + i.Id,
                isChecked = user.Configuration.GroupedFolders.indexOf(i.Id) !== -1,
                checkedHtml = isChecked ? ' checked="checked"' : "";
            return currentHtml += "<label>", currentHtml += '<input type="checkbox" is="emby-checkbox" class="chkGroupFolder" data-folderid="' + i.Id + '" id="' + id + '"' + checkedHtml + "/>", currentHtml += "<span>" + i.Name + "</span>", currentHtml += "</label>"
        }).join(""), folderHtml += "</div>", page.querySelector(".folderGroupList").innerHTML = folderHtml
    }

    function getLandingScreenOptions(type) {
        var list = [];
        return list.push({
            name: globalize.translate("sharedcomponents#Suggestions"),
            value: "suggestions",
            isDefault: !0
        }), "movies" === type ? (list.push({
            name: globalize.translate("sharedcomponents#Movies"),
            value: "movies"
        }), list.push({
            name: globalize.translate("sharedcomponents#Favorites"),
            value: "favorites"
        }), list.push({
            name: globalize.translate("sharedcomponents#Collections"),
            value: "collections"
        })) : "tvshows" === type && (list.push({
            name: globalize.translate("sharedcomponents#Latest"),
            value: "latest"
        }), list.push({
            name: globalize.translate("sharedcomponents#Shows"),
            value: "shows"
        }), list.push({
            name: globalize.translate("sharedcomponents#Favorites"),
            value: "favorites"
        })), list.push({
            name: globalize.translate("sharedcomponents#Genres"),
            value: "genres"
        }), list
    }

    function getLandingScreenOptionsHtml(type, userValue) {
        return getLandingScreenOptions(type).map(function(o) {
            var selected = userValue === o.value || o.isDefault && !userValue,
                selectedHtml = selected ? " selected" : "",
                optionValue = o.isDefault ? "" : o.value;
            return '<option value="' + optionValue + '"' + selectedHtml + ">" + o.name + "</option>"
        }).join("")
    }

    function renderLandingScreens(context, user, userSettings, result) {
        for (var html = "", i = 0, length = result.Items.length; i < length; i++) {
            var folder = result.Items[i];
            if ("movies" === folder.CollectionType || "tvshows" === folder.CollectionType) {
                html += '<div class="selectContainer">', html += '<select is="emby-select" class="selectLanding" data-folderid="' + folder.Id + '" label="' + folder.Name + '">';
                var userValue = userSettings.get("landing-" + folder.Id);
                html += getLandingScreenOptionsHtml(folder.CollectionType, userValue), html += "</select>", html += "</div>"
            }
        }
        context.querySelector(".landingScreens").innerHTML = html, html ? context.querySelector(".landingScreensSection").classList.remove("hide") : context.querySelector(".landingScreensSection").classList.add("hide")
    }

    function renderViewOrder(context, user, result) {
        var html = "",
            index = 0;
        html += result.Items.map(function(view) {
            var currentHtml = "";
            return currentHtml += '<div class="listItem viewItem" data-viewid="' + view.Id + '">', currentHtml += '<i class="md-icon listItemIcon">&#xE2C8;</i>', currentHtml += '<div class="listItemBody">', currentHtml += "<div>", currentHtml += view.Name, currentHtml += "</div>", currentHtml += "</div>", currentHtml += '<button type="button" is="paper-icon-button-light" class="btnViewItemUp btnViewItemMove autoSize" title="' + globalize.translate("sharedcomponents#Up") + '"><i class="md-icon">&#xE316;</i></button>', currentHtml += '<button type="button" is="paper-icon-button-light" class="btnViewItemDown btnViewItemMove autoSize" title="' + globalize.translate("sharedcomponents#Down") + '"><i class="md-icon">&#xE313;</i></button>', currentHtml += "</div>", index++, currentHtml
        }).join(""), context.querySelector(".viewOrderList").innerHTML = html
    }

    function updateHomeSectionValues(context, userSettings) {
        for (var i = 1; i <= 7; i++) {
            var select = context.querySelector("#selectHomeSection" + i),
                defaultValue = homeSections.getDefaultSection(i - 1),
                option = select.querySelector("option[value=" + defaultValue + "]") || select.querySelector('option[value=""]'),
                userValue = userSettings.get("homesection" + (i - 1));
            option.value = "", userValue !== defaultValue && userValue ? select.value = userValue : select.value = ""
        }
    }

    function loadForm(context, user, userSettings, apiClient) {
        context.querySelector(".chkHidePlayedFromLatest").checked = user.Configuration.HidePlayedInLatest || !1, updateHomeSectionValues(context, userSettings);
        var promise1 = apiClient.getUserViews({}, user.Id),
            promise2 = ApiClient.getJSON(ApiClient.getUrl("Users/" + user.Id + "/GroupingOptions"));
        Promise.all([promise1, promise2]).then(function(responses) {
            renderViews(context, user, responses[1]), renderLatestItems(context, user, responses[0]), renderViewOrder(context, user, responses[0]), renderLandingScreens(context, user, userSettings, responses[0]), loading.hide()
        })
    }

    function onSectionOrderListClick(e) {
        var target = dom.parentWithClass(e.target, "btnViewItemMove");
        if (target) {
            var viewItem = dom.parentWithClass(target, "viewItem");
            if (viewItem) {
                dom.parentWithClass(viewItem, "paperList");
                if (target.classList.contains("btnViewItemDown")) {
                    var next = viewItem.nextSibling;
                    next && (viewItem.parentNode.removeChild(viewItem), next.parentNode.insertBefore(viewItem, next.nextSibling))
                } else {
                    var prev = viewItem.previousSibling;
                    prev && (viewItem.parentNode.removeChild(viewItem), prev.parentNode.insertBefore(viewItem, prev))
                }
            }
        }
    }

    function getCheckboxItems(selector, context, isChecked) {
        for (var inputs = context.querySelectorAll(selector), list = [], i = 0, length = inputs.length; i < length; i++) inputs[i].checked === isChecked && list.push(inputs[i]);
        return list
    }

    function refreshGlobalUserSettings(userSettingsInstance) {
        require(["userSettings"], function(userSettings) {
            userSettings.importFrom(userSettingsInstance)
        })
    }

    function saveUser(context, user, userSettingsInstance, apiClient) {
        user.Configuration.HidePlayedInLatest = context.querySelector(".chkHidePlayedFromLatest").checked, user.Configuration.LatestItemsExcludes = getCheckboxItems(".chkIncludeInLatest", context, !1).map(function(i) {
            return i.getAttribute("data-folderid")
        }), user.Configuration.GroupedFolders = getCheckboxItems(".chkGroupFolder", context, !0).map(function(i) {
            return i.getAttribute("data-folderid")
        });
        var i, length, viewItems = context.querySelectorAll(".viewItem"),
            orderedViews = [];
        for (i = 0, length = viewItems.length; i < length; i++) orderedViews.push(viewItems[i].getAttribute("data-viewid"));
        user.Configuration.OrderedViews = orderedViews, userSettingsInstance.set("homesection0", context.querySelector("#selectHomeSection1").value), userSettingsInstance.set("homesection1", context.querySelector("#selectHomeSection2").value), userSettingsInstance.set("homesection2", context.querySelector("#selectHomeSection3").value), userSettingsInstance.set("homesection3", context.querySelector("#selectHomeSection4").value), userSettingsInstance.set("homesection4", context.querySelector("#selectHomeSection5").value), userSettingsInstance.set("homesection5", context.querySelector("#selectHomeSection6").value), userSettingsInstance.set("homesection6", context.querySelector("#selectHomeSection7").value);
        var selectLandings = context.querySelectorAll(".selectLanding");
        for (i = 0, length = selectLandings.length; i < length; i++) {
            var selectLanding = selectLandings[i];
            userSettingsInstance.set("landing-" + selectLanding.getAttribute("data-folderid"), selectLanding.value)
        }
        return user.Id === apiClient.getCurrentUserId() && refreshGlobalUserSettings(userSettingsInstance), apiClient.updateUserConfiguration(user.Id, user.Configuration)
    }

    function save(instance, context, userId, userSettings, apiClient, enableSaveConfirmation) {
        loading.show(), apiClient.getUser(userId).then(function(user) {
            saveUser(context, user, userSettings, apiClient).then(function() {
                loading.hide(), enableSaveConfirmation && require(["toast"], function(toast) {
                    toast(globalize.translate("sharedcomponents#SettingsSaved"))
                }), events.trigger(instance, "saved")
            }, function() {
                loading.hide()
            })
        })
    }

    function onSubmit(e) {
        var self = this,
            apiClient = connectionManager.getApiClient(self.options.serverId),
            userId = self.options.userId,
            userSettings = self.options.userSettings;
        return userSettings.setUserInfo(userId, apiClient).then(function() {
            var enableSaveConfirmation = self.options.enableSaveConfirmation;
            save(self, self.options.element, userId, userSettings, apiClient, enableSaveConfirmation)
        }), e && e.preventDefault(), !1
    }

    function embed(options, self) {
        require(["text!./homescreensettings.template.html"], function(template) {
            for (var i = 1; i <= numConfigurableSections; i++) template = template.replace("{section" + i + "label}", globalize.translate("sharedcomponents#LabelHomeScreenSectionValue", i));
            options.element.innerHTML = globalize.translateDocument(template, "sharedcomponents"), options.element.querySelector(".viewOrderList").addEventListener("click", onSectionOrderListClick), options.element.querySelector("form").addEventListener("submit", onSubmit.bind(self)), options.enableSaveButton && options.element.querySelector(".btnSave").classList.remove("hide"), self.loadData()
        })
    }

    function HomeScreenSettings(options) {
        this.options = options, embed(options, this)
    }
    var numConfigurableSections = 7;
    return HomeScreenSettings.prototype.loadData = function() {
        var self = this,
            context = self.options.element;
        loading.show();
        var userId = self.options.userId,
            apiClient = connectionManager.getApiClient(self.options.serverId),
            userSettings = self.options.userSettings;
        apiClient.getUser(userId).then(function(user) {
            userSettings.setUserInfo(userId, apiClient).then(function() {
                self.dataLoaded = !0, loadForm(context, user, userSettings, apiClient)
            })
        })
    }, HomeScreenSettings.prototype.submit = function() {
        onSubmit.call(this)
    }, HomeScreenSettings.prototype.destroy = function() {
        this.options = null
    }, HomeScreenSettings
});