define(["browser", "appSettings", "events"], function(browser, appSettings, events) {
    "use strict";

    function setLayout(self, layout, selectedLayout) {
        layout === selectedLayout ? (self[layout] = !0, document.documentElement.classList.add("layout-" + layout)) : (self[layout] = !1, document.documentElement.classList.remove("layout-" + layout))
    }

    function LayoutManager() {}
    return LayoutManager.prototype.setLayout = function(layout, save) {
        layout && "auto" !== layout ? (setLayout(this, "mobile", layout), setLayout(this, "tv", layout), setLayout(this, "desktop", layout), save !== !1 && appSettings.set("layout", layout)) : (this.autoLayout(), save !== !1 && appSettings.set("layout", "")), events.trigger(this, "modechange")
    }, LayoutManager.prototype.getSavedLayout = function(layout) {
        return appSettings.get("layout")
    }, LayoutManager.prototype.autoLayout = function() {
        browser.mobile ? this.setLayout("mobile", !1) : browser.tv || browser.xboxOne ? this.setLayout("tv", !1) : this.setLayout(this.defaultLayout || "tv", !1)
    }, LayoutManager.prototype.init = function() {
        var saved = this.getSavedLayout();
        saved ? this.setLayout(saved, !1) : this.autoLayout()
    }, new LayoutManager
});