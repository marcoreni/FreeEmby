define(["jQuery", "loading"], function($, loading) {
    "use strict";

    function reloadList(page) {
        loading.show();
        var promise1 = ApiClient.getAvailablePlugins({
                TargetSystems: "Server"
            }),
            promise2 = ApiClient.getInstalledPlugins();
        Promise.all([promise1, promise2]).then(function(responses) {
            renderInstalled(page, responses[0], responses[1]), renderCatalog(page, responses[0], responses[1])
        })
    }

    function getCategories() {
        var context = getParameterByName("context"),
            categories = [];
        return "sync" == context ? categories.push("Sync") : "livetv" == context ? categories.push("Live TV") : "notifications" == context && categories.push("Notifications"), categories
    }

    function renderInstalled(page, availablePlugins, installedPlugins) {
        requirejs(["scripts/pluginspage"], function() {
            var category = getCategories()[0];
            installedPlugins = installedPlugins.filter(function(i) {
                var catalogEntry = availablePlugins.filter(function(a) {
                    return (a.guid || "").toLowerCase() == (i.Id || "").toLowerCase()
                })[0];
                return !!catalogEntry && catalogEntry.category == category
            }), PluginsPage.renderPlugins(page, installedPlugins)
        })
    }

    function renderCatalog(page, availablePlugins, installedPlugins) {
        requirejs(["scripts/plugincatalogpage"], function() {
            var categories = getCategories();
            PluginCatalog.renderCatalog({
                catalogElement: $(".catalog", page),
                availablePlugins: availablePlugins,
                installedPlugins: installedPlugins,
                categories: categories,
                showCategory: !1,
                context: getParameterByName("context"),
                targetSystem: "Server"
            })
        })
    }
    $(document).on("pagebeforeshow pageshow", "#appServicesPage", function() {
        var page = this,
            context = getParameterByName("context");
        "sync" == context ? (LibraryMenu.setTitle(Globalize.translate("TitleSync")), page.setAttribute("data-helpurl", "https://github.com/MediaBrowser/Wiki/wiki/Sync")) : "livetv" == context ? (LibraryMenu.setTitle(Globalize.translate("TitleLiveTV")), page.setAttribute("data-helpurl", "https://github.com/MediaBrowser/Wiki/wiki/Live%20TV")) : "notifications" == context && (LibraryMenu.setTitle(Globalize.translate("TitleNotifications")), page.setAttribute("data-helpurl", "https://github.com/MediaBrowser/Wiki/wiki/Notifications"))
    }).on("pageshow", "#appServicesPage", function() {
        var page = this;
        reloadList(page)
    })
});