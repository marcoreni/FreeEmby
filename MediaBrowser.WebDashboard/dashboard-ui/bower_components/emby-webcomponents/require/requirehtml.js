define(function() {
    "use strict";
    var importedFiles = [];
    return {
        load: function(cssId, req, load, config) {
            cssId = cssId.replace("js/requirehtml", "html");
            var url = cssId + ".html";
            if (url.indexOf("://") === -1 && (url = config.baseUrl + url), importedFiles.indexOf(url) === -1) {
                importedFiles.push(url);
                var link = document.createElement("link");
                return link.rel = "import", config.urlArgs && (url.toLowerCase().indexOf("bower_") !== -1 && url.toLowerCase().indexOf("emby-webcomponents") === -1 || (url += config.urlArgs(cssId, url))), link.onload = load, link.href = url, void document.head.appendChild(link)
            }
            load()
        },
        normalize: function(name, normalize) {
            return ".html" === name.substr(name.length - 5, 5) && (name = name.substr(0, name.length - 5)), normalize(name)
        }
    }
});