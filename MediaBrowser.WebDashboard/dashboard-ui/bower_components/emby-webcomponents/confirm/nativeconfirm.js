define([], function() {
    "use strict";

    function replaceAll(str, find, replace) {
        return str.split(find).join(replace)
    }
    return function(options) {
        "string" == typeof options && (options = {
            title: "",
            text: options
        });
        var text = replaceAll(options.text || "", "<br/>", "\n"),
            result = confirm(text);
        return result ? Promise.resolve() : Promise.reject()
    }
});