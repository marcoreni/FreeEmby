define([], function() {
    "use strict";

    function updateCache() {
        cache.put("data", new Response(JSON.stringify(localData)))
    }
    var cache, localData, myStore = {};
    return myStore.setItem = function(name, value) {
        if (localData) {
            var changed = localData[name] !== value;
            changed && (localData[name] = value, updateCache())
        }
    }, myStore.getItem = function(name) {
        if (localData) return localData[name]
    }, myStore.removeItem = function(name) {
        localData && (localData[name] = null, delete localData[name], updateCache())
    }, myStore.init = function() {
        return caches.open("embydata").then(function(result) {
            cache = result, localData = {}
        })
    }, myStore
});