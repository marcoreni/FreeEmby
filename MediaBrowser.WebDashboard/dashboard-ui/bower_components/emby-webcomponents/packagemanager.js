define(["appSettings", "pluginManager"], function(appSettings, pluginManager) {
    "use strict";

    function PackageManager() {
        function addPackage(pkg) {
            packages = packages.filter(function(p) {
                return p.name !== pkg.name
            }), packages.push(pkg)
        }

        function removeUrl(url) {
            var manifestUrls = JSON.parse(appSettings.get(settingsKey) || "[]");
            manifestUrls = manifestUrls.filter(function(i) {
                return i !== url
            }), appSettings.set(settingsKey, JSON.stringify(manifestUrls))
        }

        function loadPackage(url, throwError) {
            return new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest,
                    originalUrl = url;
                url += url.indexOf("?") === -1 ? "?" : "&", url += "t=" + (new Date).getTime(), xhr.open("GET", url, !0);
                var onError = function() {
                    throwError === !0 ? reject() : (removeUrl(originalUrl), resolve())
                };
                xhr.onload = function(e) {
                    if (this.status < 400) {
                        var pkg = JSON.parse(this.response);
                        pkg.url = originalUrl, addPackage(pkg);
                        var plugins = pkg.plugins || [];
                        pkg.plugin && plugins.push(pkg.plugin);
                        var promises = plugins.map(function(pluginUrl) {
                            return pluginManager.loadPlugin(self.mapPath(pkg, pluginUrl))
                        });
                        Promise.all(promises).then(resolve, resolve)
                    } else onError()
                }, xhr.onerror = onError, xhr.send()
            })
        }
        var self = this,
            settingsKey = "installedpackages1",
            packages = [];
        self.packages = function() {
            return packages.slice(0)
        }, self.install = function(url) {
            return loadPackage(url, !0).then(function(pkg) {
                var manifestUrls = JSON.parse(appSettings.get(settingsKey) || "[]");
                return manifestUrls.indexOf(url) === -1 && (manifestUrls.push(url), appSettings.set(settingsKey, JSON.stringify(manifestUrls))), pkg
            })
        }, self.uninstall = function(name) {
            var pkg = packages.filter(function(p) {
                return p.name === name
            })[0];
            return pkg && (packages = packages.filter(function(p) {
                return p.name !== name
            }), removeUrl(pkg.url)), Promise.resolve()
        }, self.init = function() {
            var manifestUrls = JSON.parse(appSettings.get(settingsKey) || "[]");
            return Promise.all(manifestUrls.map(loadPackage)).then(function() {
                return Promise.resolve()
            }, function() {
                return Promise.resolve()
            })
        }
    }
    return PackageManager.prototype.mapPath = function(pkg, pluginUrl) {
        var urlLower = pluginUrl.toLowerCase();
        if (0 === urlLower.indexOf("http:") || 0 === urlLower.indexOf("https:") || 0 === urlLower.indexOf("file:")) return pluginUrl;
        var packageUrl = pkg.url;
        return packageUrl = packageUrl.substring(0, packageUrl.lastIndexOf("/")), packageUrl += "/", packageUrl += pluginUrl
    }, new PackageManager
});