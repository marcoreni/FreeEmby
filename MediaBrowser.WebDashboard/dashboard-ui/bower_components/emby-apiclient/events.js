define([], function() {
    "use strict";

    function getCallbacks(obj, name) {
        if (!obj) throw new Error("obj cannot be null!");
        obj._callbacks = obj._callbacks || {};
        var list = obj._callbacks[name];
        return list || (obj._callbacks[name] = [], list = obj._callbacks[name]), list
    }
    return {
        on: function(obj, eventName, fn) {
            var list = getCallbacks(obj, eventName);
            list.push(fn)
        },
        off: function(obj, eventName, fn) {
            var list = getCallbacks(obj, eventName),
                i = list.indexOf(fn);
            i !== -1 && list.splice(i, 1)
        },
        trigger: function(obj, eventName) {
            var eventObject = {
                    type: eventName
                },
                eventArgs = [];
            eventArgs.push(eventObject);
            for (var additionalArgs = arguments[2] || [], i = 0, length = additionalArgs.length; i < length; i++) eventArgs.push(additionalArgs[i]);
            var callbacks = getCallbacks(obj, eventName).slice(0);
            callbacks.forEach(function(c) {
                c.apply(obj, eventArgs)
            })
        }
    }
});