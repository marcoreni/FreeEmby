define(["emby-tabs", "emby-button"], function() {
    "use strict";

    function setTabs(view, selectedIndex, builder) {
        var viewMenuBarTabs;
        if (!view) return void(tabOwnerView && (document.body.classList.remove("withTallToolbar"), viewMenuBarTabs = queryScope.querySelector(".viewMenuBarTabs"), viewMenuBarTabs.innerHTML = "", viewMenuBarTabs.classList.add("hide"), tabOwnerView = null));
        if (viewMenuBarTabs = queryScope.querySelector(".viewMenuBarTabs"), tabOwnerView || viewMenuBarTabs.classList.remove("hide"), tabOwnerView !== view) {
            var index = 0,
                indexAttribute = null == selectedIndex ? "" : ' data-index="' + selectedIndex + '"';
            return viewMenuBarTabs.innerHTML = '<div is="emby-tabs"' + indexAttribute + ' class="tabs-viewmenubar"><div class="emby-tabs-slider" style="white-space:nowrap;">' + builder().map(function(t) {
                var tabHtml, tabClass = "emby-tab-button";
                return tabHtml = t.href ? '<button onclick="Dashboard.navigate(this.getAttribute(\'data-href\'));" type="button" data-href="' + t.href + '" is="emby-button" class="' + tabClass + '" data-index="' + index + '"><div class="emby-button-foreground">' + t.name + "</div></button>" : '<button type="button" is="emby-button" class="' + tabClass + '" data-index="' + index + '"><div class="emby-button-foreground">' + t.name + "</div></button>", index++, tabHtml
            }).join("") + "</div></div>", document.body.classList.add("withTallToolbar"), tabOwnerView = view, !0
        }
        return viewMenuBarTabs.querySelector('[is="emby-tabs"]').selectedIndex(selectedIndex), tabOwnerView = view, !1
    }

    function getTabsElement() {
        return document.querySelector(".tabs-viewmenubar")
    }
    var tabOwnerView, queryScope = document.querySelector(".skinHeader");
    return {
        setTabs: setTabs,
        getTabsElement: getTabsElement
    }
});