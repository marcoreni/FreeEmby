define(["idb"], function() {
    "use strict";

    function getDbName(serverId) {
        return "items_" + serverId
    }

    function getPromise(dbName) {
        if (!promisesMap.has(dbName)) return idb.open(dbName, dbVersion, upgradeDbFunc).then(function(dbPromise) {
            return promisesMap.set(dbName, dbPromise), Promise.resolve(dbPromise)
        });
        var dbPromise = promisesMap.get(dbName);
        return Promise.resolve(dbPromise)
    }

    function getTransaction(serverId, access) {
        var dbName = getDbName(serverId);
        return access || (access = "readonly"), getPromise(dbName).then(function(db) {
            return db.transaction(dbName, access)
        })
    }

    function getObjectStore(serverId, access) {
        var dbName = getDbName(serverId);
        return getTransaction(serverId, access).then(function(tx) {
            return tx.objectStore(dbName)
        })
    }

    function upgradeDbFunc(upgradeDB) {
        switch (upgradeDB.oldVersion) {
            case 0:
                upgradeDB.createObjectStore(upgradeDB.name)
        }
    }

    function getServerItemTypes(serverId, userId) {
        return getObjectStore(serverId).then(function(store) {
            return store.getAll(null, 1e4).then(function(all) {
                return all.filter(function(item) {
                    return !0
                }).map(function(item2) {
                    return (item2.Item.Type || "").toLowerCase()
                }).filter(filterDistinct)
            })
        })
    }

    function getAll(serverId) {
        return getObjectStore(serverId).then(function(store) {
            return store.getAll(null, 1e4)
        })
    }

    function get(serverId, key) {
        return getObjectStore(serverId).then(function(store) {
            return store.get(key)
        })
    }

    function set(serverId, key, val) {
        return getTransaction(serverId, "readwrite").then(function(tx) {
            return tx.objectStore(getDbName(serverId)).put(val, key), tx.complete
        })
    }

    function remove(serverId, key) {
        return getTransaction(serverId, "readwrite").then(function(tx) {
            return tx.objectStore(getDbName(serverId)).delete(key), tx.complete
        })
    }

    function clear(serverId) {
        return getTransaction(serverId, "readwrite").then(function(tx) {
            return tx.objectStore(getDbName(serverId)).clear(), tx.complete
        })
    }

    function filterDistinct(value, index, self) {
        return self.indexOf(value) === index
    }
    var dbVersion = 1,
        promisesMap = new Map;
    return {
        get: get,
        set: set,
        remove: remove,
        clear: clear,
        getAll: getAll,
        getServerItemTypes: getServerItemTypes
    }
});