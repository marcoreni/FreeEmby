define([], function() {
    "use strict";
    return function(connectionManager) {
        function performSync(server, options) {
            console.log("ServerSync.performSync to server: " + server.Id), options = options || {};
            var uploadPhotos = options.uploadPhotos !== !1;
            options.cameraUploadServers && options.cameraUploadServers.indexOf(server.Id) === -1 && (uploadPhotos = !1);
            var pr = Promise.resolve();
            return pr.then(function() {
                return uploadPhotos ? uploadContent(server, options) : Promise.resolve()
            }).then(function() {
                return syncMedia(server, options)
            })
        }

        function uploadContent(server, options) {
            return new Promise(function(resolve, reject) {
                require(["contentuploader"], function(contentuploader) {
                    uploader = new ContentUploader(connectionManager), uploader.uploadImages(server).then(resolve, reject)
                })
            })
        }

        function syncMedia(server, options) {
            return new Promise(function(resolve, reject) {
                require(["mediasync"], function(MediaSync) {
                    var apiClient = connectionManager.getApiClient(server.Id);
                    (new MediaSync).sync(apiClient, server, options).then(resolve, reject)
                })
            })
        }
        var self = this;
        self.sync = function(server, options) {
            if (!server.AccessToken && !server.ExchangeToken) return console.log("Skipping sync to server " + server.Id + " because there is no saved authentication information."), Promise.resolve();
            var connectionOptions = {
                updateDateLastAccessed: !1,
                enableWebSocket: !1,
                reportCapabilities: !1,
                enableAutomaticBitrateDetection: !1
            };
            return connectionManager.connectToServer(server, connectionOptions).then(function(result) {
                return result.State === MediaBrowser.ConnectionState.SignedIn ? performSync(server, options) : (console.log("Unable to connect to server id: " + server.Id), Promise.reject())
            }, function(err) {
                throw console.log("Unable to connect to server id: " + server.Id), err
            })
        }
    }
});