define(function() {
    "use strict";
    return {
        load: function(url, req, load, config) {
            url.indexOf("://") === -1 && (url = config.baseUrl + url), config.urlArgs && (url += config.urlArgs(url, url));
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, !0), xhr.onload = function(e) {
                load(this.response)
            }, xhr.send()
        },
        normalize: function(name, normalize) {
            return normalize(name)
        }
    }
});