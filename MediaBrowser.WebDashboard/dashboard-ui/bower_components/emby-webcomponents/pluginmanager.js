define(["events"], function(events) {
    "use strict";

    function pluginManager() {
        function loadStrings(plugin, globalize) {
            var strings = plugin.getTranslations ? plugin.getTranslations() : [];
            return globalize.loadStrings({
                name: plugin.id || plugin.packageName,
                strings: strings
            })
        }

        function definePluginRoute(route, plugin) {
            route.contentPath = self.mapPath(plugin, route.path), route.path = self.mapRoute(plugin, route), Emby.App.defineRoute(route, plugin.id)
        }
        var self = this,
            plugins = [];
        self.register = function(obj) {
            plugins.push(obj), events.trigger(self, "registered", [obj])
        }, self.ofType = function(type) {
            return plugins.filter(function(o) {
                return o.type === type
            })
        }, self.plugins = function() {
            return plugins
        }, self.mapRoute = function(plugin, route) {
            return "string" == typeof plugin && (plugin = plugins.filter(function(p) {
                return (p.id || p.packageName) === plugin
            })[0]), route = route.path || route, 0 === route.toLowerCase().indexOf("http") ? route : "/plugins/" + plugin.id + "/" + route
        };
        var cacheParam = (new Date).getTime();
        self.mapPath = function(plugin, path, addCacheParam) {
            "string" == typeof plugin && (plugin = plugins.filter(function(p) {
                return (p.id || p.packageName) === plugin
            })[0]);
            var url = plugin.baseUrl + "/" + path;
            return addCacheParam && (url += url.indexOf("?") === -1 ? "?" : "&", url += "v=" + cacheParam), url
        }, self.loadPlugin = function(url) {
            return console.log("Loading plugin: " + url), new Promise(function(resolve, reject) {
                require([url, "globalize", "embyRouter"], function(pluginFactory, globalize, embyRouter) {
                    var plugin = new pluginFactory,
                        existing = plugins.filter(function(p) {
                            return p.id === plugin.id
                        })[0];
                    if (existing) return void resolve(url);
                    plugin.installUrl = url;
                    var urlLower = url.toLowerCase();
                    urlLower.indexOf("http:") === -1 && urlLower.indexOf("https:") === -1 && urlLower.indexOf("file:") === -1 && 0 !== url.indexOf(embyRouter.baseUrl()) && (url = embyRouter.baseUrl() + "/" + url);
                    var separatorIndex = Math.max(url.lastIndexOf("/"), url.lastIndexOf("\\"));
                    plugin.baseUrl = url.substring(0, separatorIndex);
                    var paths = {};
                    paths[plugin.id] = plugin.baseUrl, requirejs.config({
                        waitSeconds: 0,
                        paths: paths
                    }), self.register(plugin), plugin.getRoutes && plugin.getRoutes().forEach(function(route) {
                        definePluginRoute(route, plugin)
                    }), "skin" === plugin.type ? resolve(plugin) : loadStrings(plugin, globalize).then(function() {
                        resolve(plugin)
                    }, reject)
                })
            })
        }
    }
    var instance = new pluginManager;
    return window.Emby = window.Emby || {}, window.Emby.PluginManager = instance, instance
});