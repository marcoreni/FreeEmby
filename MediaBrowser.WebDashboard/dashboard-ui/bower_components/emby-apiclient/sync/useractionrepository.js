define(["idb"], function() {
    "use strict";

    function setup() {
        dbPromise = idb.open(dbName, dbVersion, function(upgradeDB) {
            switch (upgradeDB.oldVersion) {
                case 0:
                    upgradeDB.createObjectStore(dbName)
            }
        })
    }

    function getByServerId(serverId) {
        return dbPromise.then(function(db) {
            return db.transaction(dbName).objectStore(dbName).getAll(null, 1e3).then(function(all) {
                return all.filter(function(item) {
                    return item.ServerId === serverId
                })
            })
        })
    }

    function getAll() {
        return dbPromise.then(function(db) {
            return db.transaction(dbName).objectStore(dbName).getAll(null, 1e4)
        })
    }

    function get(key) {
        return dbPromise.then(function(db) {
            return db.transaction(dbName).objectStore(dbName).get(key)
        })
    }

    function set(key, val) {
        return dbPromise.then(function(db) {
            var tx = db.transaction(dbName, "readwrite");
            return tx.objectStore(dbName).put(val, key), tx.complete
        })
    }

    function remove(key) {
        return dbPromise.then(function(db) {
            var tx = db.transaction(dbName, "readwrite");
            return tx.objectStore(dbName).delete(key), tx.complete
        })
    }

    function clear() {
        return dbPromise.then(function(db) {
            var tx = db.transaction(dbName, "readwrite");
            return tx.objectStore(dbName).clear(key), tx.complete
        })
    }
    var dbPromise, dbName = "useractions",
        dbVersion = 1;
    return setup(), {
        get: get,
        set: set,
        remove: remove,
        clear: clear,
        getAll: getAll,
        getByServerId: getByServerId
    }
});