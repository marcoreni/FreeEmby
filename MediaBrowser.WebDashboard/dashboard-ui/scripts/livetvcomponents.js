define(["layoutManager", "datetime", "cardBuilder", "apphost"], function(layoutManager, datetime, cardBuilder, appHost) {
    "use strict";

    function enableScrollX() {
        return !layoutManager.desktop
    }

    function getBackdropShape() {
        return enableScrollX() ? "overflowBackdrop" : "backdrop"
    }

    function getTimersHtml(timers, options) {
        options = options || {};
        var i, length, items = timers.map(function(t) {
                return t.Type = "Timer", t
            }),
            groups = [],
            currentGroupName = "",
            currentGroup = [];
        for (i = 0, length = items.length; i < length; i++) {
            var item = items[i],
                dateText = "";
            if (options.indexByDate !== !1 && item.StartDate) try {
                var premiereDate = datetime.parseISO8601Date(item.StartDate, !0);
                dateText = datetime.toLocaleDateString(premiereDate, {
                    weekday: "long",
                    month: "short",
                    day: "numeric"
                })
            } catch (err) {}
            dateText != currentGroupName ? (currentGroup.length && groups.push({
                name: currentGroupName,
                items: currentGroup
            }), currentGroupName = dateText, currentGroup = [item]) : currentGroup.push(item)
        }
        currentGroup.length && groups.push({
            name: currentGroupName,
            items: currentGroup
        });
        var html = "";
        for (i = 0, length = groups.length; i < length; i++) {
            var group = groups[i];
            group.name && (html += '<div class="verticalSection">', html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + group.name + "</h2>"), html += enableScrollX() ? '<div is="emby-itemscontainer" class="itemsContainer hiddenScrollX padded-left padded-right">' : '<div is="emby-itemscontainer" class="itemsContainer vertical-wrap padded-left padded-right">';
            var supportsImageAnalysis = appHost.supports("imageanalysis"),
                cardLayout = appHost.preferVisualCards || supportsImageAnalysis;
            cardLayout = !1, html += cardBuilder.getCardsHtml({
                items: group.items,
                shape: getBackdropShape(),
                showParentTitleOrTitle: !0,
                showAirTime: !0,
                showAirEndTime: !0,
                showChannelName: !0,
                cardLayout: cardLayout,
                centerText: !cardLayout,
                vibrant: cardLayout && supportsImageAnalysis,
                action: "edit",
                cardFooterAside: "none",
                preferThumb: !0,
                coverImage: !0,
                allowBottomPadding: !enableScrollX(),
                overlayText: !1
            }), html += "</div>", group.name && (html += "</div>")
        }
        return Promise.resolve(html)
    }
    window.LiveTvHelpers = {
        getTimersHtml: getTimersHtml
    }
});