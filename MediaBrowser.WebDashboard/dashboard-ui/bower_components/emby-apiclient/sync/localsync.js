define(["appSettings", "connectionManager"], function(appSettings, connectionManager) {
    "use strict";
    var syncPromise;
    return {
        sync: function(options) {
            return syncPromise ? syncPromise : new Promise(function(resolve, reject) {
                require(["multiserversync"], function(MultiServerSync) {
                    options = options || {}, options.cameraUploadServers = appSettings.cameraUploadServers(), syncPromise = new MultiServerSync(connectionManager).sync(options).then(function() {
                        syncPromise = null, resolve()
                    }, function() {
                        syncPromise = null, reject()
                    })
                })
            })
        },
        getSyncStatus: function() {
            return null != syncPromise ? "Syncing" : "Idle"
        }
    }
});