define(["events"], function(events) {
    "use strict";
    return function(serverAddress, clientName, applicationVersion, deviceName, deviceId, devicePixelRatio) {
        function redetectBitrate() {
            stopBitrateDetection(), self.accessToken() && self.enableAutomaticBitrateDetection !== !1 && setTimeout(redetectBitrateInternal, 6e3)
        }

        function redetectBitrateInternal() {
            self.detectBitrate()
        }

        function stopBitrateDetection() {
            detectTimeout && clearTimeout(detectTimeout)
        }

        function onFetchFail(url, response) {
            events.trigger(self, "requestfail", [{
                url: url,
                status: response.status,
                errorCode: response.headers ? response.headers.get("X-Application-Error-Code") : null
            }])
        }

        function getFetchPromise(request) {
            var headers = request.headers || {};
            "json" === request.dataType && (headers.accept = "application/json");
            var fetchRequest = {
                    headers: headers,
                    method: request.type,
                    credentials: "same-origin"
                },
                contentType = request.contentType;
            return request.data && ("string" == typeof request.data ? fetchRequest.body = request.data : (fetchRequest.body = paramsToString(request.data), contentType = contentType || "application/x-www-form-urlencoded; charset=UTF-8")), contentType && (headers["Content-Type"] = contentType), request.timeout ? fetchWithTimeout(request.url, fetchRequest, request.timeout) : fetch(request.url, fetchRequest)
        }

        function fetchWithTimeout(url, options, timeoutMs) {
            return new Promise(function(resolve, reject) {
                var timeout = setTimeout(reject, timeoutMs);
                options = options || {}, options.credentials = "same-origin", fetch(url, options).then(function(response) {
                    clearTimeout(timeout), resolve(response)
                }, function(error) {
                    clearTimeout(timeout), reject(error)
                })
            })
        }

        function paramsToString(params) {
            var values = [];
            for (var key in params) {
                var value = params[key];
                null !== value && void 0 !== value && "" !== value && values.push(encodeURIComponent(key) + "=" + encodeURIComponent(value))
            }
            return values.join("&")
        }

        function switchConnectionMode(connectionMode) {
            var currentServerInfo = self.serverInfo(),
                newConnectionMode = connectionMode;
            return newConnectionMode--, newConnectionMode < 0 && (newConnectionMode = MediaBrowser.ConnectionMode.Manual), MediaBrowser.ServerInfo.getServerAddress(currentServerInfo, newConnectionMode) ? newConnectionMode : (newConnectionMode--, newConnectionMode < 0 && (newConnectionMode = MediaBrowser.ConnectionMode.Manual), MediaBrowser.ServerInfo.getServerAddress(currentServerInfo, newConnectionMode) ? newConnectionMode : connectionMode)
        }

        function tryReconnectInternal(resolve, reject, connectionMode, currentRetryCount) {
            connectionMode = switchConnectionMode(connectionMode);
            var url = MediaBrowser.ServerInfo.getServerAddress(self.serverInfo(), connectionMode);
            console.log("Attempting reconnection to " + url);
            var timeout = connectionMode === MediaBrowser.ConnectionMode.Local ? 7e3 : 15e3;
            fetchWithTimeout(url + "/system/info/public", {
                method: "GET",
                accept: "application/json"
            }, timeout).then(function() {
                console.log("Reconnect succeeded to " + url), self.serverInfo().LastConnectionMode = connectionMode, self.serverAddress(url), resolve()
            }, function() {
                if (console.log("Reconnect attempt failed to " + url), currentRetryCount < 5) {
                    var newConnectionMode = switchConnectionMode(connectionMode);
                    setTimeout(function() {
                        tryReconnectInternal(resolve, reject, newConnectionMode, currentRetryCount + 1)
                    }, 300)
                } else reject()
            })
        }

        function tryReconnect() {
            return new Promise(function(resolve, reject) {
                setTimeout(function() {
                    tryReconnectInternal(resolve, reject, self.serverInfo().LastConnectionMode, 0)
                }, 300)
            })
        }

        function replaceAll(originalString, strReplace, strWith) {
            var reg = new RegExp(strReplace, "ig");
            return originalString.replace(reg, strWith)
        }

        function onWebSocketMessage(msg) {
            if ("UserDeleted" === msg.MessageType) currentUser = null;
            else if ("UserUpdated" === msg.MessageType || "UserConfigurationUpdated" === msg.MessageType) {
                var user = msg.Data;
                user.Id === self.getCurrentUserId() && (currentUser = null)
            }
            events.trigger(self, "websocketmessage", [msg])
        }

        function normalizeReturnBitrate(bitrate) {
            if (!bitrate) return lastDetectedBitrate ? lastDetectedBitrate : Promise.reject();
            var result = Math.round(.8 * bitrate);
            return lastDetectedBitrate = result, lastDetectedBitrateTime = (new Date).getTime(), result
        }

        function detectBitrateInternal(tests, index, currentBitrate) {
            if (index >= tests.length) return normalizeReturnBitrate(currentBitrate);
            var test = tests[index];
            return self.getDownloadSpeed(test.bytes).then(function(bitrate) {
                return bitrate < test.threshold ? normalizeReturnBitrate(bitrate) : detectBitrateInternal(tests, index + 1, bitrate)
            }, function() {
                return normalizeReturnBitrate(currentBitrate)
            })
        }

        function getRemoteImagePrefix(options) {
            var urlPrefix;
            return options.artist ? (urlPrefix = "Artists/" + self.encodeName(options.artist), delete options.artist) : options.person ? (urlPrefix = "Persons/" + self.encodeName(options.person), delete options.person) : options.genre ? (urlPrefix = "Genres/" + self.encodeName(options.genre), delete options.genre) : options.musicGenre ? (urlPrefix = "MusicGenres/" + self.encodeName(options.musicGenre), delete options.musicGenre) : options.gameGenre ? (urlPrefix = "GameGenres/" + self.encodeName(options.gameGenre), delete options.gameGenre) : options.studio ? (urlPrefix = "Studios/" + self.encodeName(options.studio), delete options.studio) : (urlPrefix = "Items/" + options.itemId, delete options.itemId), urlPrefix
        }

        function normalizeImageOptions(options) {
            var ratio = devicePixelRatio || 1;
            ratio && (options.minScale && (ratio = Math.max(options.minScale, ratio)), options.width && (options.width = Math.round(options.width * ratio)), options.height && (options.height = Math.round(options.height * ratio)), options.maxWidth && (options.maxWidth = Math.round(options.maxWidth * ratio)), options.maxHeight && (options.maxHeight = Math.round(options.maxHeight * ratio))), options.quality = options.quality || self.getDefaultImageQuality(options.type), self.normalizeImageOptions && self.normalizeImageOptions(options)
        }

        function exchangePin(pinInfo) {
            return self.ajax({
                type: "POST",
                url: self.getUrl("Auth/Pin/Exchange"),
                data: {
                    deviceId: pinInfo.DeviceId,
                    pin: pinInfo.Pin
                },
                dataType: "json"
            })
        }
        if (!serverAddress) throw new Error("Must supply a serverAddress");
        console.log("ApiClient serverAddress: " + serverAddress), console.log("ApiClient clientName: " + clientName), console.log("ApiClient applicationVersion: " + applicationVersion), console.log("ApiClient deviceName: " + deviceName), console.log("ApiClient deviceId: " + deviceId);
        var webSocket, lastDetectedBitrate, lastDetectedBitrateTime, detectTimeout, self = this,
            serverInfo = {};
        self.serverAddress = function(val) {
            if (null != val) {
                if (0 !== val.toLowerCase().indexOf("http")) throw new Error("Invalid url: " + val);
                var changed = val !== serverAddress;
                serverAddress = val, lastDetectedBitrate = 0, lastDetectedBitrateTime = 0, changed && events.trigger(this, "serveraddresschanged"), redetectBitrate()
            }
            return serverAddress
        }, self.serverInfo = function(info) {
            return serverInfo = info || serverInfo
        }, self.serverId = function() {
            return self.serverInfo().Id
        }, self.serverName = function() {
            return self.serverInfo().Name
        };
        var currentUser;
        self.getCurrentUser = function() {
            if (currentUser) return Promise.resolve(currentUser);
            var userId = self.getCurrentUserId();
            return userId ? self.getUser(userId).then(function(user) {
                return currentUser = user, user
            }) : Promise.reject()
        }, self.isLoggedIn = function() {
            var info = self.serverInfo();
            return !!(info && info.UserId && info.AccessToken)
        }, self.getCurrentUserId = function() {
            return serverInfo.UserId
        }, self.accessToken = function() {
            return serverInfo.AccessToken
        }, self.deviceName = function() {
            return deviceName
        }, self.deviceId = function() {
            return deviceId
        }, self.appName = function() {
            return clientName
        }, self.appVersion = function() {
            return applicationVersion
        }, self.clearAuthenticationInfo = function() {
            self.setAuthenticationInfo(null, null)
        }, self.setAuthenticationInfo = function(accessKey, userId) {
            currentUser = null, serverInfo.AccessToken = accessKey, serverInfo.UserId = userId, redetectBitrate()
        }, self.encodeName = function(name) {
            name = name.split("/").join("-"), name = name.split("&").join("-"), name = name.split("?").join("-");
            var val = paramsToString({
                name: name
            });
            return val.substring(val.indexOf("=") + 1).replace("'", "%27")
        }, self.setRequestHeaders = function(headers) {
            var currentServerInfo = self.serverInfo();
            if (clientName) {
                var auth = 'MediaBrowser Client="' + clientName + '", Device="' + deviceName + '", DeviceId="' + deviceId + '", Version="' + applicationVersion + '"',
                    userId = currentServerInfo.UserId;
                userId && (auth += ', UserId="' + userId + '"'), headers["X-Emby-Authorization"] = auth
            }
            var accessToken = currentServerInfo.AccessToken;
            accessToken && (headers["X-MediaBrowser-Token"] = accessToken)
        }, self.ajax = function(request, includeAuthorization) {
            if (!request) throw new Error("Request cannot be null");
            return self.fetch(request, includeAuthorization)
        }, self.fetch = function(request, includeAuthorization) {
            if (!request) throw new Error("Request cannot be null");
            return request.headers = request.headers || {}, includeAuthorization !== !1 && self.setRequestHeaders(request.headers), self.enableAutomaticNetworking === !1 || "GET" !== request.type ? (console.log("Requesting url without automatic networking: " + request.url), getFetchPromise(request).then(function(response) {
                return response.status < 400 ? "json" === request.dataType || "application/json" === request.headers.accept ? response.json() : "text" === request.dataType || 0 === (response.headers.get("Content-Type") || "").toLowerCase().indexOf("text/") ? response.text() : response : (onFetchFail(request.url, response), Promise.reject(response))
            }, function(error) {
                throw onFetchFail(request.url, {}), error
            })) : self.fetchWithFailover(request, !0)
        }, self.getJSON = function(url, includeAuthorization) {
            return self.fetch({
                url: url,
                type: "GET",
                dataType: "json",
                headers: {
                    accept: "application/json"
                }
            }, includeAuthorization)
        }, self.fetchWithFailover = function(request, enableReconnection) {
            return console.log("Requesting " + request.url), request.timeout = 3e4, getFetchPromise(request).then(function(response) {
                return response.status < 400 ? "json" === request.dataType || "application/json" === request.headers.accept ? response.json() : "text" === request.dataType || 0 === (response.headers.get("Content-Type") || "").toLowerCase().indexOf("text/") ? response.text() : response : (onFetchFail(request.url, response), Promise.reject(response))
            }, function(error) {
                if (error ? console.log("Request failed to " + request.url + " " + error.toString()) : console.log("Request timed out to " + request.url), !error && enableReconnection) {
                    console.log("Attempting reconnection");
                    var previousServerAddress = self.serverAddress();
                    return tryReconnect().then(function() {
                        return console.log("Reconnect succeesed"), request.url = request.url.replace(previousServerAddress, self.serverAddress()), self.fetchWithFailover(request, !1)
                    }, function(innerError) {
                        throw console.log("Reconnect failed"), onFetchFail(request.url, {}), innerError
                    })
                }
                throw console.log("Reporting request failure"), onFetchFail(request.url, {}), error
            })
        }, self.get = function(url) {
            return self.ajax({
                type: "GET",
                url: url
            })
        }, self.getUrl = function(name, params) {
            if (!name) throw new Error("Url name cannot be empty");
            var url = serverAddress;
            if (!url) throw new Error("serverAddress is yet not set");
            var lowered = url.toLowerCase();
            return lowered.indexOf("/emby") === -1 && lowered.indexOf("/mediabrowser") === -1 && (url += "/emby"), "/" !== name.charAt(0) && (url += "/"), url += name, params && (params = paramsToString(params), params && (url += "?" + params)), url
        }, self.updateServerInfo = function(server, connectionMode) {
            if (null == server) throw new Error("server cannot be null");
            if (null == connectionMode) throw new Error("connectionMode cannot be null");
            console.log("Begin updateServerInfo. connectionMode: " + connectionMode), self.serverInfo(server);
            var serverUrl = MediaBrowser.ServerInfo.getServerAddress(server, connectionMode);
            if (!serverUrl) throw new Error("serverUrl cannot be null. serverInfo: " + JSON.stringify(server));
            console.log("Setting server address to " + serverUrl), self.serverAddress(serverUrl)
        }, self.isWebSocketSupported = function() {
            try {
                return null != WebSocket
            } catch (err) {
                return !1
            }
        }, self.ensureWebSocket = function() {
            if (!self.isWebSocketOpenOrConnecting() && self.isWebSocketSupported()) try {
                self.openWebSocket()
            } catch (err) {
                console.log("Error opening web socket: " + err)
            }
        }, self.openWebSocket = function() {
            var accessToken = self.accessToken();
            if (!accessToken) throw new Error("Cannot open web socket without access token.");
            var url = self.getUrl("socket");
            url = replaceAll(url, "emby/socket", "embywebsocket"), url = replaceAll(url, "https:", "wss:"), url = replaceAll(url, "http:", "ws:"), url += "?api_key=" + accessToken, url += "&deviceId=" + deviceId, webSocket = new WebSocket(url), webSocket.onmessage = function(msg) {
                msg = JSON.parse(msg.data), onWebSocketMessage(msg)
            }, webSocket.onopen = function() {
                console.log("web socket connection opened"), setTimeout(function() {
                    events.trigger(self, "websocketopen")
                }, 0)
            }, webSocket.onerror = function() {
                events.trigger(self, "websocketerror")
            }, webSocket.onclose = function() {
                setTimeout(function() {
                    events.trigger(self, "websocketclose")
                }, 0)
            }
        }, self.closeWebSocket = function() {
            webSocket && webSocket.readyState === WebSocket.OPEN && webSocket.close()
        }, self.sendWebSocketMessage = function(name, data) {
            console.log("Sending web socket message: " + name);
            var msg = {
                MessageType: name
            };
            data && (msg.Data = data), msg = JSON.stringify(msg), webSocket.send(msg)
        }, self.isWebSocketOpen = function() {
            return webSocket && webSocket.readyState === WebSocket.OPEN
        }, self.isWebSocketOpenOrConnecting = function() {
            return webSocket && (webSocket.readyState === WebSocket.OPEN || webSocket.readyState === WebSocket.CONNECTING)
        }, self.getProductNews = function(options) {
            options = options || {};
            var url = self.getUrl("News/Product", options);
            return self.getJSON(url)
        }, self.getDownloadSpeed = function(byteSize) {
            var url = self.getUrl("Playback/BitrateTest", {
                    Size: byteSize
                }),
                now = (new Date).getTime();
            return self.ajax({
                type: "GET",
                url: url,
                timeout: 5e3
            }).then(function() {
                var responseTimeSeconds = ((new Date).getTime() - now) / 1e3,
                    bytesPerSecond = byteSize / responseTimeSeconds,
                    bitrate = Math.round(8 * bytesPerSecond);
                return bitrate
            })
        }, self.detectBitrate = function(force) {
            return !force && lastDetectedBitrate && (new Date).getTime() - (lastDetectedBitrateTime || 0) <= 36e5 ? Promise.resolve(lastDetectedBitrate) : detectBitrateInternal([{
                bytes: 5e5,
                threshold: 5e5
            }, {
                bytes: 1e6,
                threshold: 2e7
            }, {
                bytes: 3e6,
                threshold: 5e7
            }], 0)
        }, self.getItem = function(userId, itemId) {
            if (!itemId) throw new Error("null itemId");
            var url = userId ? self.getUrl("Users/" + userId + "/Items/" + itemId) : self.getUrl("Items/" + itemId);
            return self.getJSON(url)
        }, self.getRootFolder = function(userId) {
            if (!userId) throw new Error("null userId");
            var url = self.getUrl("Users/" + userId + "/Items/Root");
            return self.getJSON(url)
        }, self.getNotificationSummary = function(userId) {
            if (!userId) throw new Error("null userId");
            var url = self.getUrl("Notifications/" + userId + "/Summary");
            return self.getJSON(url)
        }, self.getNotifications = function(userId, options) {
            if (!userId) throw new Error("null userId");
            var url = self.getUrl("Notifications/" + userId, options || {});
            return self.getJSON(url)
        }, self.markNotificationsRead = function(userId, idList, isRead) {
            if (!userId) throw new Error("null userId");
            if (!idList) throw new Error("null idList");
            var suffix = isRead ? "Read" : "Unread",
                params = {
                    UserId: userId,
                    Ids: idList.join(",")
                },
                url = self.getUrl("Notifications/" + userId + "/" + suffix, params);
            return self.ajax({
                type: "POST",
                url: url
            })
        }, self.logout = function() {
            stopBitrateDetection(), self.closeWebSocket();
            var done = function() {
                self.setAuthenticationInfo(null, null)
            };
            if (self.accessToken()) {
                var url = self.getUrl("Sessions/Logout");
                return self.ajax({
                    type: "POST",
                    url: url
                }).then(done, done)
            }
            return new Promise(function(resolve, reject) {
                done(), resolve()
            })
        }, self.getRemoteImageProviders = function(options) {
            if (!options) throw new Error("null options");
            var urlPrefix = getRemoteImagePrefix(options),
                url = self.getUrl(urlPrefix + "/RemoteImages/Providers", options);
            return self.getJSON(url)
        }, self.getAvailableRemoteImages = function(options) {
            if (!options) throw new Error("null options");
            var urlPrefix = getRemoteImagePrefix(options),
                url = self.getUrl(urlPrefix + "/RemoteImages", options);
            return self.getJSON(url)
        }, self.downloadRemoteImage = function(options) {
            if (!options) throw new Error("null options");
            var urlPrefix = getRemoteImagePrefix(options),
                url = self.getUrl(urlPrefix + "/RemoteImages/Download", options);
            return self.ajax({
                type: "POST",
                url: url
            })
        }, self.getLiveTvInfo = function(options) {
            var url = self.getUrl("LiveTv/Info", options || {});
            return self.getJSON(url)
        }, self.getLiveTvGuideInfo = function(options) {
            var url = self.getUrl("LiveTv/GuideInfo", options || {});
            return self.getJSON(url)
        }, self.getLiveTvChannel = function(id, userId) {
            if (!id) throw new Error("null id");
            var options = {};
            userId && (options.userId = userId);
            var url = self.getUrl("LiveTv/Channels/" + id, options);
            return self.getJSON(url)
        }, self.getLiveTvChannels = function(options) {
            var url = self.getUrl("LiveTv/Channels", options || {});
            return self.getJSON(url)
        }, self.getLiveTvPrograms = function(options) {
            return options = options || {}, options.channelIds && options.channelIds.length > 1800 ? self.ajax({
                type: "POST",
                url: self.getUrl("LiveTv/Programs"),
                data: JSON.stringify(options),
                contentType: "application/json",
                dataType: "json"
            }) : self.ajax({
                type: "GET",
                url: self.getUrl("LiveTv/Programs", options),
                dataType: "json"
            })
        }, self.getLiveTvRecommendedPrograms = function(options) {
            return options = options || {}, self.ajax({
                type: "GET",
                url: self.getUrl("LiveTv/Programs/Recommended", options),
                dataType: "json"
            })
        }, self.getLiveTvRecordings = function(options) {
            var url = self.getUrl("LiveTv/Recordings", options || {});
            return self.getJSON(url)
        }, self.getLiveTvRecordingSeries = function(options) {
            var url = self.getUrl("LiveTv/Recordings/Series", options || {});
            return self.getJSON(url)
        }, self.getLiveTvRecordingGroups = function(options) {
            var url = self.getUrl("LiveTv/Recordings/Groups", options || {});
            return self.getJSON(url)
        }, self.getLiveTvRecordingGroup = function(id) {
            if (!id) throw new Error("null id");
            var url = self.getUrl("LiveTv/Recordings/Groups/" + id);
            return self.getJSON(url)
        }, self.getLiveTvRecording = function(id, userId) {
            if (!id) throw new Error("null id");
            var options = {};
            userId && (options.userId = userId);
            var url = self.getUrl("LiveTv/Recordings/" + id, options);
            return self.getJSON(url)
        }, self.getLiveTvProgram = function(id, userId) {
            if (!id) throw new Error("null id");
            var options = {};
            userId && (options.userId = userId);
            var url = self.getUrl("LiveTv/Programs/" + id, options);
            return self.getJSON(url)
        }, self.deleteLiveTvRecording = function(id) {
            if (!id) throw new Error("null id");
            var url = self.getUrl("LiveTv/Recordings/" + id);
            return self.ajax({
                type: "DELETE",
                url: url
            })
        }, self.cancelLiveTvTimer = function(id) {
            if (!id) throw new Error("null id");
            var url = self.getUrl("LiveTv/Timers/" + id);
            return self.ajax({
                type: "DELETE",
                url: url
            })
        }, self.getLiveTvTimers = function(options) {
            var url = self.getUrl("LiveTv/Timers", options || {});
            return self.getJSON(url)
        }, self.getLiveTvTimer = function(id) {
            if (!id) throw new Error("null id");
            var url = self.getUrl("LiveTv/Timers/" + id);
            return self.getJSON(url)
        }, self.getNewLiveTvTimerDefaults = function(options) {
            options = options || {};
            var url = self.getUrl("LiveTv/Timers/Defaults", options);
            return self.getJSON(url)
        }, self.createLiveTvTimer = function(item) {
            if (!item) throw new Error("null item");
            var url = self.getUrl("LiveTv/Timers");
            return self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(item),
                contentType: "application/json"
            })
        }, self.updateLiveTvTimer = function(item) {
            if (!item) throw new Error("null item");
            var url = self.getUrl("LiveTv/Timers/" + item.Id);
            return self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(item),
                contentType: "application/json"
            })
        }, self.resetLiveTvTuner = function(id) {
            if (!id) throw new Error("null id");
            var url = self.getUrl("LiveTv/Tuners/" + id + "/Reset");
            return self.ajax({
                type: "POST",
                url: url
            })
        }, self.getLiveTvSeriesTimers = function(options) {
            var url = self.getUrl("LiveTv/SeriesTimers", options || {});
            return self.getJSON(url)
        }, self.getFileOrganizationResults = function(options) {
            var url = self.getUrl("Library/FileOrganization", options || {});
            return self.getJSON(url)
        }, self.deleteOriginalFileFromOrganizationResult = function(id) {
            var url = self.getUrl("Library/FileOrganizations/" + id + "/File");
            return self.ajax({
                type: "DELETE",
                url: url
            })
        }, self.clearOrganizationLog = function() {
            var url = self.getUrl("Library/FileOrganizations");
            return self.ajax({
                type: "DELETE",
                url: url
            })
        }, self.performOrganization = function(id) {
            var url = self.getUrl("Library/FileOrganizations/" + id + "/Organize");
            return self.ajax({
                type: "POST",
                url: url
            })
        }, self.performEpisodeOrganization = function(id, options) {
            var url = self.getUrl("Library/FileOrganizations/" + id + "/Episode/Organize");
            return self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(options),
                contentType: "application/json"
            })
        }, self.getLiveTvSeriesTimer = function(id) {
            if (!id) throw new Error("null id");
            var url = self.getUrl("LiveTv/SeriesTimers/" + id);
            return self.getJSON(url)
        }, self.cancelLiveTvSeriesTimer = function(id) {
            if (!id) throw new Error("null id");
            var url = self.getUrl("LiveTv/SeriesTimers/" + id);
            return self.ajax({
                type: "DELETE",
                url: url
            })
        }, self.createLiveTvSeriesTimer = function(item) {
            if (!item) throw new Error("null item");
            var url = self.getUrl("LiveTv/SeriesTimers");
            return self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(item),
                contentType: "application/json"
            })
        }, self.updateLiveTvSeriesTimer = function(item) {
            if (!item) throw new Error("null item");
            var url = self.getUrl("LiveTv/SeriesTimers/" + item.Id);
            return self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(item),
                contentType: "application/json"
            })
        }, self.getRegistrationInfo = function(feature) {
            var url = self.getUrl("Registrations/" + feature);
            return self.getJSON(url)
        }, self.getSystemInfo = function() {
            var url = self.getUrl("System/Info");
            return self.getJSON(url)
        }, self.getPublicSystemInfo = function() {
            var url = self.getUrl("System/Info/Public");
            return self.getJSON(url, !1)
        }, self.getInstantMixFromItem = function(itemId, options) {
            var url = self.getUrl("Items/" + itemId + "/InstantMix", options);
            return self.getJSON(url)
        }, self.getEpisodes = function(itemId, options) {
            var url = self.getUrl("Shows/" + itemId + "/Episodes", options);
            return self.getJSON(url)
        }, self.getDisplayPreferences = function(id, userId, app) {
            var url = self.getUrl("DisplayPreferences/" + id, {
                userId: userId,
                client: app
            });
            return self.getJSON(url)
        }, self.updateDisplayPreferences = function(id, obj, userId, app) {
            var url = self.getUrl("DisplayPreferences/" + id, {
                userId: userId,
                client: app
            });
            return self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(obj),
                contentType: "application/json"
            })
        }, self.getSeasons = function(itemId, options) {
            var url = self.getUrl("Shows/" + itemId + "/Seasons", options);
            return self.getJSON(url)
        }, self.getSimilarItems = function(itemId, options) {
            var url = self.getUrl("Items/" + itemId + "/Similar", options);
            return self.getJSON(url)
        }, self.getCultures = function() {
            var url = self.getUrl("Localization/cultures");
            return self.getJSON(url)
        }, self.getCountries = function() {
            var url = self.getUrl("Localization/countries");
            return self.getJSON(url)
        }, self.getPluginSecurityInfo = function() {
            var url = self.getUrl("Plugins/SecurityInfo");
            return self.getJSON(url)
        }, self.getPlaybackInfo = function(itemId, options, deviceProfile) {
            var postData = {
                DeviceProfile: deviceProfile
            };
            return self.ajax({
                url: self.getUrl("Items/" + itemId + "/PlaybackInfo", options),
                type: "POST",
                data: JSON.stringify(postData),
                contentType: "application/json",
                dataType: "json"
            })
        }, self.getIntros = function(itemId) {
            return self.getJSON(self.getUrl("Users/" + self.getCurrentUserId() + "/Items/" + itemId + "/Intros"))
        }, self.getDirectoryContents = function(path, options) {
            if (!path) throw new Error("null path");
            if ("string" != typeof path) throw new Error("invalid path");
            options = options || {}, options.path = path;
            var url = self.getUrl("Environment/DirectoryContents", options);
            return self.getJSON(url)
        }, self.getNetworkShares = function(path) {
            if (!path) throw new Error("null path");
            var options = {};
            options.path = path;
            var url = self.getUrl("Environment/NetworkShares", options);
            return self.getJSON(url)
        }, self.getParentPath = function(path) {
            if (!path) throw new Error("null path");
            var options = {};
            options.path = path;
            var url = self.getUrl("Environment/ParentPath", options);
            return self.ajax({
                type: "GET",
                url: url,
                dataType: "text"
            })
        }, self.getDrives = function() {
            var url = self.getUrl("Environment/Drives");
            return self.getJSON(url)
        }, self.getNetworkDevices = function() {
            var url = self.getUrl("Environment/NetworkDevices");
            return self.getJSON(url)
        }, self.cancelPackageInstallation = function(installationId) {
            if (!installationId) throw new Error("null installationId");
            var url = self.getUrl("Packages/Installing/" + installationId);
            return self.ajax({
                type: "DELETE",
                url: url
            })
        }, self.refreshItem = function(itemId, options) {
            if (!itemId) throw new Error("null itemId");
            var url = self.getUrl("Items/" + itemId + "/Refresh", options || {});
            return self.ajax({
                type: "POST",
                url: url
            })
        }, self.installPlugin = function(name, guid, updateClass, version) {
            if (!name) throw new Error("null name");
            if (!updateClass) throw new Error("null updateClass");
            var options = {
                updateClass: updateClass,
                AssemblyGuid: guid
            };
            version && (options.version = version);
            var url = self.getUrl("Packages/Installed/" + name, options);
            return self.ajax({
                type: "POST",
                url: url
            })
        }, self.restartServer = function() {
            var url = self.getUrl("System/Restart");
            return self.ajax({
                type: "POST",
                url: url
            })
        }, self.shutdownServer = function() {
            var url = self.getUrl("System/Shutdown");
            return self.ajax({
                type: "POST",
                url: url
            })
        }, self.getPackageInfo = function(name, guid) {
            if (!name) throw new Error("null name");
            var options = {
                    AssemblyGuid: guid
                },
                url = self.getUrl("Packages/" + name, options);
            return self.getJSON(url)
        }, self.getAvailableApplicationUpdate = function() {
            var url = self.getUrl("Packages/Updates", {
                PackageType: "System"
            });
            return self.getJSON(url)
        }, self.getAvailablePluginUpdates = function() {
            var url = self.getUrl("Packages/Updates", {
                PackageType: "UserInstalled"
            });
            return self.getJSON(url)
        }, self.getVirtualFolders = function() {
            var url = "Library/VirtualFolders";
            return url = self.getUrl(url), self.getJSON(url)
        }, self.getPhysicalPaths = function() {
            var url = self.getUrl("Library/PhysicalPaths");
            return self.getJSON(url)
        }, self.getServerConfiguration = function() {
            var url = self.getUrl("System/Configuration");
            return self.getJSON(url)
        }, self.getDevicesOptions = function() {
            var url = self.getUrl("System/Configuration/devices");
            return self.getJSON(url)
        }, self.getContentUploadHistory = function() {
            var url = self.getUrl("Devices/CameraUploads", {
                DeviceId: self.deviceId()
            });
            return self.getJSON(url)
        }, self.getNamedConfiguration = function(name) {
            var url = self.getUrl("System/Configuration/" + name);
            return self.getJSON(url)
        }, self.getScheduledTasks = function(options) {
            options = options || {};
            var url = self.getUrl("ScheduledTasks", options);
            return self.getJSON(url)
        }, self.startScheduledTask = function(id) {
            if (!id) throw new Error("null id");
            var url = self.getUrl("ScheduledTasks/Running/" + id);
            return self.ajax({
                type: "POST",
                url: url
            })
        }, self.getScheduledTask = function(id) {
            if (!id) throw new Error("null id");
            var url = self.getUrl("ScheduledTasks/" + id);
            return self.getJSON(url)
        }, self.getNextUpEpisodes = function(options) {
            var url = self.getUrl("Shows/NextUp", options);
            return self.getJSON(url)
        }, self.stopScheduledTask = function(id) {
            if (!id) throw new Error("null id");
            var url = self.getUrl("ScheduledTasks/Running/" + id);
            return self.ajax({
                type: "DELETE",
                url: url
            })
        }, self.getPluginConfiguration = function(id) {
            if (!id) throw new Error("null Id");
            var url = self.getUrl("Plugins/" + id + "/Configuration");
            return self.getJSON(url)
        }, self.getAvailablePlugins = function(options) {
            options = options || {}, options.PackageType = "UserInstalled";
            var url = self.getUrl("Packages", options);
            return self.getJSON(url)
        }, self.uninstallPlugin = function(id) {
            if (!id) throw new Error("null Id");
            var url = self.getUrl("Plugins/" + id);
            return self.ajax({
                type: "DELETE",
                url: url
            })
        }, self.removeVirtualFolder = function(name, refreshLibrary) {
            if (!name) throw new Error("null name");
            var url = "Library/VirtualFolders";
            return url = self.getUrl(url, {
                refreshLibrary: !!refreshLibrary,
                name: name
            }), self.ajax({
                type: "DELETE",
                url: url
            })
        }, self.addVirtualFolder = function(name, type, refreshLibrary, libraryOptions) {
            if (!name) throw new Error("null name");
            var options = {};
            type && (options.collectionType = type), options.refreshLibrary = !!refreshLibrary, options.name = name;
            var url = "Library/VirtualFolders";
            return url = self.getUrl(url, options), self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify({
                    LibraryOptions: libraryOptions
                }),
                contentType: "application/json"
            })
        }, self.updateVirtualFolderOptions = function(id, libraryOptions) {
            if (!id) throw new Error("null name");
            var url = "Library/VirtualFolders/LibraryOptions";
            return url = self.getUrl(url), self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify({
                    Id: id,
                    LibraryOptions: libraryOptions
                }),
                contentType: "application/json"
            })
        }, self.renameVirtualFolder = function(name, newName, refreshLibrary) {
            if (!name) throw new Error("null name");
            var url = "Library/VirtualFolders/Name";
            return url = self.getUrl(url, {
                refreshLibrary: !!refreshLibrary,
                newName: newName,
                name: name
            }), self.ajax({
                type: "POST",
                url: url
            })
        }, self.addMediaPath = function(virtualFolderName, mediaPath, networkSharePath, refreshLibrary) {
            if (!virtualFolderName) throw new Error("null virtualFolderName");
            if (!mediaPath) throw new Error("null mediaPath");
            var url = "Library/VirtualFolders/Paths",
                pathInfo = {
                    Path: mediaPath
                };
            return networkSharePath && (pathInfo.NetworkPath = networkSharePath), url = self.getUrl(url, {
                refreshLibrary: !!refreshLibrary
            }), self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify({
                    Name: virtualFolderName,
                    PathInfo: pathInfo
                }),
                contentType: "application/json"
            })
        }, self.updateMediaPath = function(virtualFolderName, pathInfo) {
            if (!virtualFolderName) throw new Error("null virtualFolderName");
            if (!pathInfo) throw new Error("null pathInfo");
            var url = "Library/VirtualFolders/Paths/Update";
            return url = self.getUrl(url), self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify({
                    Name: virtualFolderName,
                    PathInfo: pathInfo
                }),
                contentType: "application/json"
            })
        }, self.removeMediaPath = function(virtualFolderName, mediaPath, refreshLibrary) {
            if (!virtualFolderName) throw new Error("null virtualFolderName");
            if (!mediaPath) throw new Error("null mediaPath");
            var url = "Library/VirtualFolders/Paths";
            return url = self.getUrl(url, {
                refreshLibrary: !!refreshLibrary,
                path: mediaPath,
                name: virtualFolderName
            }), self.ajax({
                type: "DELETE",
                url: url
            })
        }, self.deleteUser = function(id) {
            if (!id) throw new Error("null id");
            var url = self.getUrl("Users/" + id);
            return self.ajax({
                type: "DELETE",
                url: url
            })
        }, self.deleteUserImage = function(userId, imageType, imageIndex) {
            if (!userId) throw new Error("null userId");
            if (!imageType) throw new Error("null imageType");
            var url = self.getUrl("Users/" + userId + "/Images/" + imageType);
            return null != imageIndex && (url += "/" + imageIndex), self.ajax({
                type: "DELETE",
                url: url
            })
        }, self.deleteItemImage = function(itemId, imageType, imageIndex) {
            if (!imageType) throw new Error("null imageType");
            var url = self.getUrl("Items/" + itemId + "/Images");
            return url += "/" + imageType, null != imageIndex && (url += "/" + imageIndex), self.ajax({
                type: "DELETE",
                url: url
            })
        }, self.deleteItem = function(itemId) {
            if (!itemId) throw new Error("null itemId");
            var url = self.getUrl("Items/" + itemId);
            return self.ajax({
                type: "DELETE",
                url: url
            })
        }, self.stopActiveEncodings = function(playSessionId) {
            var options = {
                deviceId: deviceId
            };
            playSessionId && (options.PlaySessionId = playSessionId);
            var url = self.getUrl("Videos/ActiveEncodings", options);
            return self.ajax({
                type: "DELETE",
                url: url
            })
        }, self.reportCapabilities = function(options) {
            var url = self.getUrl("Sessions/Capabilities/Full");
            return self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(options),
                contentType: "application/json"
            })
        }, self.updateItemImageIndex = function(itemId, imageType, imageIndex, newIndex) {
            if (!imageType) throw new Error("null imageType");
            var options = {
                    newIndex: newIndex
                },
                url = self.getUrl("Items/" + itemId + "/Images/" + imageType + "/" + imageIndex + "/Index", options);
            return self.ajax({
                type: "POST",
                url: url
            })
        }, self.getItemImageInfos = function(itemId) {
            var url = self.getUrl("Items/" + itemId + "/Images");
            return self.getJSON(url)
        }, self.getCriticReviews = function(itemId, options) {
            if (!itemId) throw new Error("null itemId");
            var url = self.getUrl("Items/" + itemId + "/CriticReviews", options);
            return self.getJSON(url)
        }, self.getItemDownloadUrl = function(itemId) {
            if (!itemId) throw new Error("itemId cannot be empty");
            var url = "Items/" + itemId + "/Download";
            return self.getUrl(url, {
                api_key: self.accessToken()
            })
        }, self.getSessions = function(options) {
            var url = self.getUrl("Sessions", options);
            return self.getJSON(url)
        }, self.uploadUserImage = function(userId, imageType, file) {
            if (!userId) throw new Error("null userId");
            if (!imageType) throw new Error("null imageType");
            if (!file) throw new Error("File must be an image.");
            if ("image/png" !== file.type && "image/jpeg" !== file.type && "image/jpeg" !== file.type) throw new Error("File must be an image.");
            return new Promise(function(resolve, reject) {
                var reader = new FileReader;
                reader.onerror = function() {
                    reject()
                }, reader.onabort = function() {
                    reject()
                }, reader.onload = function(e) {
                    var data = e.target.result.split(",")[1],
                        url = self.getUrl("Users/" + userId + "/Images/" + imageType);
                    self.ajax({
                        type: "POST",
                        url: url,
                        data: data,
                        contentType: "image/" + file.name.substring(file.name.lastIndexOf(".") + 1)
                    }).then(function(result) {
                        resolve(result)
                    }, function() {
                        reject()
                    })
                }, reader.readAsDataURL(file)
            })
        }, self.uploadItemImage = function(itemId, imageType, file) {
            if (!itemId) throw new Error("null itemId");
            if (!imageType) throw new Error("null imageType");
            if (!file) throw new Error("File must be an image.");
            if ("image/png" !== file.type && "image/jpeg" !== file.type && "image/jpeg" !== file.type) throw new Error("File must be an image.");
            var url = self.getUrl("Items/" + itemId + "/Images");
            return url += "/" + imageType, new Promise(function(resolve, reject) {
                var reader = new FileReader;
                reader.onerror = function() {
                    reject()
                }, reader.onabort = function() {
                    reject()
                }, reader.onload = function(e) {
                    var data = e.target.result.split(",")[1];
                    self.ajax({
                        type: "POST",
                        url: url,
                        data: data,
                        contentType: "image/" + file.name.substring(file.name.lastIndexOf(".") + 1)
                    }).then(function(result) {
                        resolve(result)
                    }, function() {
                        reject()
                    })
                }, reader.readAsDataURL(file)
            })
        }, self.getInstalledPlugins = function() {
            var options = {},
                url = self.getUrl("Plugins", options);
            return self.getJSON(url)
        }, self.getUser = function(id) {
            if (!id) throw new Error("Must supply a userId");
            var url = self.getUrl("Users/" + id);
            return self.getJSON(url)
        }, self.getStudio = function(name, userId) {
            if (!name) throw new Error("null name");
            var options = {};
            userId && (options.userId = userId);
            var url = self.getUrl("Studios/" + self.encodeName(name), options);
            return self.getJSON(url)
        }, self.getGenre = function(name, userId) {
            if (!name) throw new Error("null name");
            var options = {};
            userId && (options.userId = userId);
            var url = self.getUrl("Genres/" + self.encodeName(name), options);
            return self.getJSON(url)
        }, self.getMusicGenre = function(name, userId) {
            if (!name) throw new Error("null name");
            var options = {};
            userId && (options.userId = userId);
            var url = self.getUrl("MusicGenres/" + self.encodeName(name), options);
            return self.getJSON(url)
        }, self.getGameGenre = function(name, userId) {
            if (!name) throw new Error("null name");
            var options = {};
            userId && (options.userId = userId);
            var url = self.getUrl("GameGenres/" + self.encodeName(name), options);
            return self.getJSON(url)
        }, self.getArtist = function(name, userId) {
            if (!name) throw new Error("null name");
            var options = {};
            userId && (options.userId = userId);
            var url = self.getUrl("Artists/" + self.encodeName(name), options);
            return self.getJSON(url)
        }, self.getPerson = function(name, userId) {
            if (!name) throw new Error("null name");
            var options = {};
            userId && (options.userId = userId);
            var url = self.getUrl("Persons/" + self.encodeName(name), options);
            return self.getJSON(url)
        }, self.getPublicUsers = function() {
            var url = self.getUrl("users/public");
            return self.ajax({
                type: "GET",
                url: url,
                dataType: "json"
            }, !1)
        }, self.getUsers = function(options) {
            var url = self.getUrl("users", options || {});
            return self.getJSON(url)
        }, self.getParentalRatings = function() {
            var url = self.getUrl("Localization/ParentalRatings");
            return self.getJSON(url)
        }, self.getDefaultImageQuality = function(imageType) {
            return "backdrop" === imageType.toLowerCase() ? 80 : 90
        }, self.getUserImageUrl = function(userId, options) {
            if (!userId) throw new Error("null userId");
            options = options || {};
            var url = "Users/" + userId + "/Images/" + options.type;
            return null != options.index && (url += "/" + options.index), normalizeImageOptions(options), delete options.type, delete options.index, self.getUrl(url, options)
        }, self.getImageUrl = function(itemId, options) {
            if (!itemId) throw new Error("itemId cannot be empty");
            options = options || {};
            var url = "Items/" + itemId + "/Images/" + options.type;
            return null != options.index && (url += "/" + options.index), options.quality = options.quality || self.getDefaultImageQuality(options.type), self.normalizeImageOptions && self.normalizeImageOptions(options), delete options.type, delete options.index, self.getUrl(url, options)
        }, self.getScaledImageUrl = function(itemId, options) {
            if (!itemId) throw new Error("itemId cannot be empty");
            options = options || {};
            var url = "Items/" + itemId + "/Images/" + options.type;
            return null != options.index && (url += "/" + options.index), normalizeImageOptions(options), delete options.type, delete options.index, delete options.minScale, self.getUrl(url, options)
        }, self.getThumbImageUrl = function(item, options) {
            if (!item) throw new Error("null item");
            return options = options || {}, options.imageType = "thumb", item.ImageTags && item.ImageTags.Thumb ? (options.tag = item.ImageTags.Thumb, self.getImageUrl(item.Id, options)) : item.ParentThumbItemId ? (options.tag = item.ImageTags.ParentThumbImageTag, self.getImageUrl(item.ParentThumbItemId, options)) : null
        }, self.authenticateUserByName = function(name, password) {
            return new Promise(function(resolve, reject) {
                if (!name) return void reject();
                var url = self.getUrl("Users/authenticatebyname");
                require(["cryptojs-sha1", "cryptojs-md5"], function() {
                    var postData = {
                        Password: CryptoJS.SHA1(password || "").toString(),
                        PasswordMd5: CryptoJS.MD5(password || "").toString(),
                        Username: name
                    };
                    self.ajax({
                        type: "POST",
                        url: url,
                        data: JSON.stringify(postData),
                        dataType: "json",
                        contentType: "application/json"
                    }).then(function(result) {
                        self.onAuthenticated && self.onAuthenticated(self, result), redetectBitrate(), resolve(result)
                    }, reject)
                })
            })
        }, self.updateUserPassword = function(userId, currentPassword, newPassword) {
            return new Promise(function(resolve, reject) {
                if (!userId) return void reject();
                var url = self.getUrl("Users/" + userId + "/Password");
                require(["cryptojs-sha1"], function() {
                    self.ajax({
                        type: "POST",
                        url: url,
                        data: {
                            currentPassword: CryptoJS.SHA1(currentPassword).toString(),
                            newPassword: CryptoJS.SHA1(newPassword).toString()
                        }
                    }).then(resolve, reject)
                })
            })
        }, self.updateEasyPassword = function(userId, newPassword) {
            return new Promise(function(resolve, reject) {
                if (!userId) return void reject();
                var url = self.getUrl("Users/" + userId + "/EasyPassword");
                require(["cryptojs-sha1"], function() {
                    self.ajax({
                        type: "POST",
                        url: url,
                        data: {
                            newPassword: CryptoJS.SHA1(newPassword).toString()
                        }
                    }).then(resolve, reject)
                })
            })
        }, self.resetUserPassword = function(userId) {
            if (!userId) throw new Error("null userId");
            var url = self.getUrl("Users/" + userId + "/Password"),
                postData = {};
            return postData.resetPassword = !0, self.ajax({
                type: "POST",
                url: url,
                data: postData
            })
        }, self.resetEasyPassword = function(userId) {
            if (!userId) throw new Error("null userId");
            var url = self.getUrl("Users/" + userId + "/EasyPassword"),
                postData = {};
            return postData.resetPassword = !0, self.ajax({
                type: "POST",
                url: url,
                data: postData
            })
        }, self.updateServerConfiguration = function(configuration) {
            if (!configuration) throw new Error("null configuration");
            var url = self.getUrl("System/Configuration");
            return self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(configuration),
                contentType: "application/json"
            })
        }, self.updateNamedConfiguration = function(name, configuration) {
            if (!configuration) throw new Error("null configuration");
            var url = self.getUrl("System/Configuration/" + name);
            return self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(configuration),
                contentType: "application/json"
            })
        }, self.updateItem = function(item) {
            if (!item) throw new Error("null item");
            var url = self.getUrl("Items/" + item.Id);
            return self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(item),
                contentType: "application/json"
            })
        }, self.updatePluginSecurityInfo = function(info) {
            var url = self.getUrl("Plugins/SecurityInfo");
            return self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(info),
                contentType: "application/json"
            })
        }, self.createUser = function(name) {
            var url = self.getUrl("Users/New");
            return self.ajax({
                type: "POST",
                url: url,
                data: {
                    Name: name
                },
                dataType: "json"
            })
        }, self.updateUser = function(user) {
            if (!user) throw new Error("null user");
            var url = self.getUrl("Users/" + user.Id);
            return self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(user),
                contentType: "application/json"
            })
        }, self.updateUserPolicy = function(userId, policy) {
            if (!userId) throw new Error("null userId");
            if (!policy) throw new Error("null policy");
            var url = self.getUrl("Users/" + userId + "/Policy");
            return self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(policy),
                contentType: "application/json"
            })
        }, self.updateUserConfiguration = function(userId, configuration) {
            if (!userId) throw new Error("null userId");
            if (!configuration) throw new Error("null configuration");
            var url = self.getUrl("Users/" + userId + "/Configuration");
            return self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(configuration),
                contentType: "application/json"
            })
        }, self.updateScheduledTaskTriggers = function(id, triggers) {
            if (!id) throw new Error("null id");
            if (!triggers) throw new Error("null triggers");
            var url = self.getUrl("ScheduledTasks/" + id + "/Triggers");
            return self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(triggers),
                contentType: "application/json"
            })
        }, self.updatePluginConfiguration = function(id, configuration) {
            if (!id) throw new Error("null Id");
            if (!configuration) throw new Error("null configuration");
            var url = self.getUrl("Plugins/" + id + "/Configuration");
            return self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(configuration),
                contentType: "application/json"
            })
        }, self.getAncestorItems = function(itemId, userId) {
            if (!itemId) throw new Error("null itemId");
            var options = {};
            userId && (options.userId = userId);
            var url = self.getUrl("Items/" + itemId + "/Ancestors", options);
            return self.getJSON(url)
        }, self.getItems = function(userId, options) {
            var url;
            return url = "string" === (typeof userId).toString().toLowerCase() ? self.getUrl("Users/" + userId + "/Items", options) : self.getUrl("Items", options), self.getJSON(url)
        }, self.getMovieRecommendations = function(options) {
            return self.getJSON(self.getUrl("Movies/Recommendations", options))
        }, self.getUpcomingEpisodes = function(options) {
            return self.getJSON(self.getUrl("Shows/Upcoming", options))
        }, self.getChannels = function(query) {
            return self.getJSON(self.getUrl("Channels", query || {}))
        }, self.getLatestChannelItems = function(query) {
            return self.getJSON(self.getUrl("Channels/Items/Latest", query))
        }, self.getUserViews = function(options, userId) {
            options = options || {};
            var url = self.getUrl("Users/" + (userId || self.getCurrentUserId()) + "/Views", options);
            return self.getJSON(url)
        }, self.getArtists = function(userId, options) {
            if (!userId) throw new Error("null userId");
            options = options || {}, options.userId = userId;
            var url = self.getUrl("Artists", options);
            return self.getJSON(url)
        }, self.getAlbumArtists = function(userId, options) {
            if (!userId) throw new Error("null userId");
            options = options || {}, options.userId = userId;
            var url = self.getUrl("Artists/AlbumArtists", options);
            return self.getJSON(url)
        }, self.getGenres = function(userId, options) {
            if (!userId) throw new Error("null userId");
            options = options || {}, options.userId = userId;
            var url = self.getUrl("Genres", options);
            return self.getJSON(url)
        }, self.getMusicGenres = function(userId, options) {
            if (!userId) throw new Error("null userId");
            options = options || {}, options.userId = userId;
            var url = self.getUrl("MusicGenres", options);
            return self.getJSON(url)
        }, self.getGameGenres = function(userId, options) {
            if (!userId) throw new Error("null userId");
            options = options || {}, options.userId = userId;
            var url = self.getUrl("GameGenres", options);
            return self.getJSON(url)
        }, self.getPeople = function(userId, options) {
            if (!userId) throw new Error("null userId");
            options = options || {}, options.userId = userId;
            var url = self.getUrl("Persons", options);
            return self.getJSON(url)
        }, self.getStudios = function(userId, options) {
            if (!userId) throw new Error("null userId");
            options = options || {}, options.userId = userId;
            var url = self.getUrl("Studios", options);
            return self.getJSON(url)
        }, self.getLocalTrailers = function(userId, itemId) {
            if (!userId) throw new Error("null userId");
            if (!itemId) throw new Error("null itemId");
            var url = self.getUrl("Users/" + userId + "/Items/" + itemId + "/LocalTrailers");
            return self.getJSON(url)
        }, self.getGameSystems = function() {
            var options = {},
                userId = self.getCurrentUserId();
            userId && (options.userId = userId);
            var url = self.getUrl("Games/SystemSummaries", options);
            return self.getJSON(url)
        }, self.getAdditionalVideoParts = function(userId, itemId) {
            if (!itemId) throw new Error("null itemId");
            var options = {};
            userId && (options.userId = userId);
            var url = self.getUrl("Videos/" + itemId + "/AdditionalParts", options);
            return self.getJSON(url)
        }, self.getThemeMedia = function(userId, itemId, inherit) {
            if (!itemId) throw new Error("null itemId");
            var options = {};
            userId && (options.userId = userId), options.InheritFromParent = inherit || !1;
            var url = self.getUrl("Items/" + itemId + "/ThemeMedia", options);
            return self.getJSON(url)
        }, self.getSearchHints = function(options) {
            var url = self.getUrl("Search/Hints", options);
            return self.getJSON(url).then(function(result) {
                var serverId = self.serverId();
                return result.SearchHints.forEach(function(i) {
                    i.ServerId = serverId
                }), result
            })
        }, self.getSpecialFeatures = function(userId, itemId) {
            if (!userId) throw new Error("null userId");
            if (!itemId) throw new Error("null itemId");
            var url = self.getUrl("Users/" + userId + "/Items/" + itemId + "/SpecialFeatures");
            return self.getJSON(url)
        }, self.getDateParamValue = function(date) {
            function formatDigit(i) {
                return i < 10 ? "0" + i : i
            }
            var d = date;
            return "" + d.getFullYear() + formatDigit(d.getMonth() + 1) + formatDigit(d.getDate()) + formatDigit(d.getHours()) + formatDigit(d.getMinutes()) + formatDigit(d.getSeconds())
        }, self.markPlayed = function(userId, itemId, date) {
            if (!userId) throw new Error("null userId");
            if (!itemId) throw new Error("null itemId");
            var options = {};
            date && (options.DatePlayed = self.getDateParamValue(date));
            var url = self.getUrl("Users/" + userId + "/PlayedItems/" + itemId, options);
            return self.ajax({
                type: "POST",
                url: url,
                dataType: "json"
            })
        }, self.markUnplayed = function(userId, itemId) {
            if (!userId) throw new Error("null userId");
            if (!itemId) throw new Error("null itemId");
            var url = self.getUrl("Users/" + userId + "/PlayedItems/" + itemId);
            return self.ajax({
                type: "DELETE",
                url: url,
                dataType: "json"
            })
        }, self.updateFavoriteStatus = function(userId, itemId, isFavorite) {
            if (!userId) throw new Error("null userId");
            if (!itemId) throw new Error("null itemId");
            var url = self.getUrl("Users/" + userId + "/FavoriteItems/" + itemId),
                method = isFavorite ? "POST" : "DELETE";
            return self.ajax({
                type: method,
                url: url,
                dataType: "json"
            })
        }, self.updateUserItemRating = function(userId, itemId, likes) {
            if (!userId) throw new Error("null userId");
            if (!itemId) throw new Error("null itemId");
            var url = self.getUrl("Users/" + userId + "/Items/" + itemId + "/Rating", {
                likes: likes
            });
            return self.ajax({
                type: "POST",
                url: url,
                dataType: "json"
            })
        }, self.getItemCounts = function(userId) {
            var options = {};
            userId && (options.userId = userId);
            var url = self.getUrl("Items/Counts", options);
            return self.getJSON(url)
        }, self.clearUserItemRating = function(userId, itemId) {
            if (!userId) throw new Error("null userId");
            if (!itemId) throw new Error("null itemId");
            var url = self.getUrl("Users/" + userId + "/Items/" + itemId + "/Rating");
            return self.ajax({
                type: "DELETE",
                url: url,
                dataType: "json"
            })
        }, self.reportPlaybackStart = function(options) {
            if (!options) throw new Error("null options");
            stopBitrateDetection();
            var url = self.getUrl("Sessions/Playing");
            return self.ajax({
                type: "POST",
                data: JSON.stringify(options),
                contentType: "application/json",
                url: url
            })
        }, self.reportPlaybackProgress = function(options) {
            if (!options) throw new Error("null options");
            if (self.isWebSocketOpen()) try {
                return self.sendWebSocketMessage("ReportPlaybackProgress", JSON.stringify(options)), Promise.resolve()
            } catch (err) {
                console.log("Error sending playback progress report: " + err)
            }
            var url = self.getUrl("Sessions/Playing/Progress");
            return self.ajax({
                type: "POST",
                data: JSON.stringify(options),
                contentType: "application/json",
                url: url
            })
        }, self.reportOfflineActions = function(actions) {
            if (!actions) throw new Error("null actions");
            var url = self.getUrl("Sync/OfflineActions");
            return self.ajax({
                type: "POST",
                data: JSON.stringify(actions),
                contentType: "application/json",
                url: url
            })
        }, self.syncData = function(data) {
            if (!data) throw new Error("null data");
            var url = self.getUrl("Sync/Data");
            return self.ajax({
                type: "POST",
                data: JSON.stringify(data),
                contentType: "application/json",
                url: url,
                dataType: "json"
            })
        }, self.getReadySyncItems = function(deviceId) {
            if (!deviceId) throw new Error("null deviceId");
            var url = self.getUrl("Sync/Items/Ready", {
                TargetId: deviceId
            });
            return self.getJSON(url)
        }, self.reportSyncJobItemTransferred = function(syncJobItemId) {
            if (!syncJobItemId) throw new Error("null syncJobItemId");
            var url = self.getUrl("Sync/JobItems/" + syncJobItemId + "/Transferred");
            return self.ajax({
                type: "POST",
                url: url
            })
        }, self.cancelSyncItems = function(itemIds, targetId) {
            if (!itemIds) throw new Error("null itemIds");
            var url = self.getUrl("Sync/" + (targetId || self.deviceId()) + "/Items", {
                ItemIds: itemIds.join(",")
            });
            return self.ajax({
                type: "DELETE",
                url: url
            })
        }, self.reportPlaybackStopped = function(options) {
            if (!options) throw new Error("null options");
            redetectBitrate();
            var url = self.getUrl("Sessions/Playing/Stopped");
            return self.ajax({
                type: "POST",
                data: JSON.stringify(options),
                contentType: "application/json",
                url: url
            })
        }, self.sendPlayCommand = function(sessionId, options) {
            if (!sessionId) throw new Error("null sessionId");
            if (!options) throw new Error("null options");
            var url = self.getUrl("Sessions/" + sessionId + "/Playing", options);
            return self.ajax({
                type: "POST",
                url: url
            })
        }, self.sendCommand = function(sessionId, command) {
            if (!sessionId) throw new Error("null sessionId");
            if (!command) throw new Error("null command");
            var url = self.getUrl("Sessions/" + sessionId + "/Command"),
                ajaxOptions = {
                    type: "POST",
                    url: url
                };
            return ajaxOptions.data = JSON.stringify(command), ajaxOptions.contentType = "application/json", self.ajax(ajaxOptions)
        }, self.sendMessageCommand = function(sessionId, options) {
            if (!sessionId) throw new Error("null sessionId");
            if (!options) throw new Error("null options");
            var url = self.getUrl("Sessions/" + sessionId + "/Message", options);
            return self.ajax({
                type: "POST",
                url: url
            })
        }, self.sendPlayStateCommand = function(sessionId, command, options) {
            if (!sessionId) throw new Error("null sessionId");
            if (!command) throw new Error("null command");
            var url = self.getUrl("Sessions/" + sessionId + "/Playing/" + command, options || {});
            return self.ajax({
                type: "POST",
                url: url
            })
        }, self.createPackageReview = function(review) {
            var url = self.getUrl("Packages/Reviews/" + review.id, review);
            return self.ajax({
                type: "POST",
                url: url
            })
        };
        self.getPackageReviews = function(packageId, minRating, maxRating, limit) {
            if (!packageId) throw new Error("null packageId");
            var options = {};
            minRating && (options.MinRating = minRating), maxRating && (options.MaxRating = maxRating), limit && (options.Limit = limit);
            var url = self.getUrl("Packages/" + packageId + "/Reviews", options);
            return self.getJSON(url)
        };
        self.getSmartMatchInfos = function(options) {
            options = options || {};
            var url = self.getUrl("Library/FileOrganizations/SmartMatches", options);
            return self.ajax({
                type: "GET",
                url: url,
                dataType: "json"
            })
        }, self.deleteSmartMatchEntries = function(entries) {
            var url = self.getUrl("Library/FileOrganizations/SmartMatches/Delete"),
                postData = {
                    Entries: entries
                };
            return self.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(postData),
                contentType: "application/json"
            })
        }, self.createPin = function() {
            return self.ajax({
                type: "POST",
                url: self.getUrl("Auth/Pin"),
                data: {
                    deviceId: self.deviceId(),
                    appName: self.appName()
                },
                dataType: "json"
            })
        }, self.getLatestItems = function(options) {
            return options = options || {}, self.getJSON(self.getUrl("Users/" + self.getCurrentUserId() + "/Items/Latest", options))
        }, self.exchangePin = function(pinInfo) {
            return exchangePin(pinInfo).then(function(result) {
                return self.onAuthenticated && self.onAuthenticated(self, result), result
            })
        }
    }
});