! function() {
    "use strict";

    function toArray(arr) {
        return Array.prototype.slice.call(arr)
    }

    function promisifyRequest(request) {
        return new Promise(function(resolve, reject) {
            request.onsuccess = function() {
                resolve(request.result)
            }, request.onerror = function() {
                reject(request.error)
            }
        })
    }

    function promisifyRequestCall(obj, method, args) {
        var request, p = new Promise(function(resolve, reject) {
            request = obj[method].apply(obj, args), promisifyRequest(request).then(resolve, reject)
        });
        return p.request = request, p
    }

    function promisifyCursorRequestCall(obj, method, args) {
        var p = promisifyRequestCall(obj, method, args);
        return p.then(function(value) {
            if (value) return new Cursor(value, p.request)
        })
    }

    function proxyProperties(ProxyClass, targetProp, properties) {
        properties.forEach(function(prop) {
            Object.defineProperty(ProxyClass.prototype, prop, {
                get: function() {
                    return this[targetProp][prop]
                }
            })
        })
    }

    function proxyRequestMethods(ProxyClass, targetProp, Constructor, properties) {
        properties.forEach(function(prop) {
            prop in Constructor.prototype && (ProxyClass.prototype[prop] = function() {
                return promisifyRequestCall(this[targetProp], prop, arguments)
            })
        })
    }

    function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
        properties.forEach(function(prop) {
            prop in Constructor.prototype && (ProxyClass.prototype[prop] = function() {
                return this[targetProp][prop].apply(this[targetProp], arguments)
            })
        })
    }

    function proxyCursorRequestMethods(ProxyClass, targetProp, Constructor, properties) {
        properties.forEach(function(prop) {
            prop in Constructor.prototype && (ProxyClass.prototype[prop] = function() {
                return promisifyCursorRequestCall(this[targetProp], prop, arguments)
            })
        })
    }

    function Index(index) {
        this._index = index
    }

    function Cursor(cursor, request) {
        this._cursor = cursor, this._request = request
    }

    function ObjectStore(store) {
        this._store = store
    }

    function Transaction(idbTransaction) {
        this._tx = idbTransaction, this.complete = new Promise(function(resolve, reject) {
            idbTransaction.oncomplete = function() {
                resolve()
            }, idbTransaction.onerror = function() {
                reject(idbTransaction.error)
            }, idbTransaction.onabort = function() {
                reject(idbTransaction.error)
            }
        })
    }

    function UpgradeDB(db, oldVersion, transaction) {
        this._db = db, this.oldVersion = oldVersion, this.transaction = new Transaction(transaction)
    }

    function DB(db) {
        this._db = db
    }
    proxyProperties(Index, "_index", ["name", "keyPath", "multiEntry", "unique"]), proxyRequestMethods(Index, "_index", IDBIndex, ["get", "getKey", "getAll", "getAllKeys", "count"]), proxyCursorRequestMethods(Index, "_index", IDBIndex, ["openCursor", "openKeyCursor"]), proxyProperties(Cursor, "_cursor", ["direction", "key", "primaryKey", "value"]), proxyRequestMethods(Cursor, "_cursor", IDBCursor, ["update", "delete"]), ["advance", "continue", "continuePrimaryKey"].forEach(function(methodName) {
        methodName in IDBCursor.prototype && (Cursor.prototype[methodName] = function() {
            var cursor = this,
                args = arguments;
            return Promise.resolve().then(function() {
                return cursor._cursor[methodName].apply(cursor._cursor, args), promisifyRequest(cursor._request).then(function(value) {
                    if (value) return new Cursor(value, cursor._request)
                })
            })
        })
    }), ObjectStore.prototype.createIndex = function() {
        return new Index(this._store.createIndex.apply(this._store, arguments))
    }, ObjectStore.prototype.index = function() {
        return new Index(this._store.index.apply(this._store, arguments))
    }, proxyProperties(ObjectStore, "_store", ["name", "keyPath", "indexNames", "autoIncrement"]), proxyRequestMethods(ObjectStore, "_store", IDBObjectStore, ["put", "add", "delete", "clear", "get", "getAll", "getAllKeys", "count"]), proxyCursorRequestMethods(ObjectStore, "_store", IDBObjectStore, ["openCursor", "openKeyCursor"]), proxyMethods(ObjectStore, "_store", IDBObjectStore, ["deleteIndex"]), Transaction.prototype.objectStore = function() {
        return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments))
    }, proxyProperties(Transaction, "_tx", ["objectStoreNames", "mode"]), proxyMethods(Transaction, "_tx", IDBTransaction, ["abort"]), UpgradeDB.prototype.createObjectStore = function() {
        return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments))
    }, proxyProperties(UpgradeDB, "_db", ["name", "version", "objectStoreNames"]), proxyMethods(UpgradeDB, "_db", IDBDatabase, ["deleteObjectStore", "close"]), DB.prototype.transaction = function() {
        return new Transaction(this._db.transaction.apply(this._db, arguments))
    }, proxyProperties(DB, "_db", ["name", "version", "objectStoreNames"]), proxyMethods(DB, "_db", IDBDatabase, ["close"]), ["openCursor", "openKeyCursor"].forEach(function(funcName) {
        [ObjectStore, Index].forEach(function(Constructor) {
            Constructor.prototype[funcName.replace("open", "iterate")] = function() {
                var args = toArray(arguments),
                    callback = args[args.length - 1],
                    nativeObject = this._store || this._index,
                    request = nativeObject[funcName].apply(nativeObject, args.slice(0, -1));
                request.onsuccess = function() {
                    callback(request.result)
                }
            }
        })
    }), [Index, ObjectStore].forEach(function(Constructor) {
        Constructor.prototype.getAll || (Constructor.prototype.getAll = function(query, count) {
            var instance = this,
                items = [];
            return new Promise(function(resolve) {
                instance.iterateCursor(query, function(cursor) {
                    return cursor ? (items.push(cursor.value), void 0 !== count && items.length === count ? void resolve(items) : void cursor.continue()) : void resolve(items)
                })
            })
        })
    });
    var exp = {
        open: function(name, version, upgradeCallback) {
            var p = promisifyRequestCall(indexedDB, "open", [name, version]),
                request = p.request;
            return request.onupgradeneeded = function(event) {
                upgradeCallback && upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction))
            }, p.then(function(db) {
                return new DB(db)
            })
        },
        delete: function(name) {
            return promisifyRequestCall(indexedDB, "deleteDatabase", [name])
        }
    };
    "undefined" != typeof module ? module.exports = exp : self.idb = exp
}();