define(["appSettings", "playbackManager", "connectionManager", "globalize", "events", "castSenderApiLoader"], function(appSettings, playbackManager, connectionManager, globalize, events, castSenderApiLoader) {
    "use strict";

    function sendConnectionResult(isOk) {
        var resolve = currentResolve,
            reject = currentReject;
        currentResolve = null, currentReject = null, isOk ? resolve && resolve() : reject ? reject() : playbackManager.removeActivePlayer(PlayerName)
    }

    function alertText(text, title) {
        require(["alert"], function(alert) {
            alert({
                text: text,
                title: title
            })
        })
    }

    function chromecastPlayer() {
        function initializeChromecast() {
            castPlayer = new CastPlayer, document.dispatchEvent(new CustomEvent("chromecastloaded", {
                detail: {
                    player: self
                }
            })), events.on(castPlayer, "connect", function(e) {
                currentResolve ? sendConnectionResult(!0) : playbackManager.setActivePlayer(PlayerName, self.getCurrentTargetInfo()), console.log("cc: connect"), self.lastPlayerData = null
            }), events.on(castPlayer, "playbackstart", function(e, data) {
                console.log("cc: playbackstart"), castPlayer.initializeCastPlayer();
                var state = self.getPlayerStateInternal(data);
                events.trigger(self, "playbackstart", [state])
            }), events.on(castPlayer, "playbackstop", function(e, data) {
                console.log("cc: playbackstop");
                var state = self.getPlayerStateInternal(data);
                events.trigger(self, "playbackstop", [state]), self.lastPlayerData = {}
            }), events.on(castPlayer, "playbackprogress", function(e, data) {
                console.log("cc: positionchange");
                var state = self.getPlayerStateInternal(data);
                events.trigger(self, "timeupdate", [state])
            }), events.on(castPlayer, "volumechange", function(e, data) {
                console.log("cc: volumechange");
                var state = self.getPlayerStateInternal(data);
                events.trigger(self, "volumechange", [state])
            }), events.on(castPlayer, "repeatmodechange", function(e, data) {
                console.log("cc: repeatmodechange");
                var state = self.getPlayerStateInternal(data);
                events.trigger(self, "repeatmodechange", [state])
            }), events.on(castPlayer, "playstatechange", function(e, data) {
                console.log("cc: playstatechange");
                var state = self.getPlayerStateInternal(data);
                events.trigger(self, "pause", [state])
            })
        }

        function normalizeImages(state) {
            if (state && state.NowPlayingItem) {
                var item = state.NowPlayingItem;
                item.ImageTags && item.ImageTags.Primary || item.PrimaryImageTag && (item.ImageTags = item.ImageTags || {}, item.ImageTags.Primary = item.PrimaryImageTag), item.BackdropImageTag && item.BackdropItemId === item.Id && (item.BackdropImageTags = [item.BackdropImageTag]), item.BackdropImageTag && item.BackdropItemId !== item.Id && (item.ParentBackdropImageTags = [item.BackdropImageTag], item.ParentBackdropItemId = item.BackdropItemId)
            }
        }
        var castPlayer, self = this;
        self.name = PlayerName, self.type = "mediaplayer", self.id = "chromecast", self.isLocalPlayer = !1, self.getItemsForPlayback = function(query) {
            var apiClient = ApiClient,
                userId = apiClient.getCurrentUserId();
            return query.Ids && 1 === query.Ids.split(",").length ? apiClient.getItem(userId, query.Ids.split(",")).then(function(item) {
                return {
                    Items: [item],
                    TotalRecordCount: 1
                }
            }) : (query.Limit = query.Limit || 100, query.ExcludeLocationTypes = "Virtual", apiClient.getItems(userId, query))
        }, self.play = function(options) {
            return options.items ? self.playWithCommand(options, "PlayNow") : self.getItemsForPlayback({
                Ids: options.ids.join(",")
            }).then(function(result) {
                return options.items = result.Items, self.playWithCommand(options, "PlayNow")
            })
        }, self.playWithCommand = function(options, command) {
            if (!options.items) {
                var apiClient = connectionManager.getApiClient(options.serverId);
                return apiClient.getItem(apiClient.getCurrentUserId(), options.ids[0]).then(function(item) {
                    return options.items = [item], self.playWithCommand(options, command)
                })
            }
            return castPlayer.loadMedia(options, command)
        }, self.unpause = function() {
            castPlayer.sendMessage({
                options: {},
                command: "Unpause"
            })
        }, self.playPause = function() {
            castPlayer.sendMessage({
                options: {},
                command: "PlayPause"
            })
        }, self.pause = function() {
            castPlayer.sendMessage({
                options: {},
                command: "Pause"
            })
        }, self.shuffle = function(item) {
            var apiClient = connectionManager.getApiClient(item.ServerId),
                userId = apiClient.getCurrentUserId();
            apiClient.getItem(userId, item.Id).then(function(item) {
                self.playWithCommand({
                    items: [item]
                }, "Shuffle")
            })
        }, self.instantMix = function(item) {
            var apiClient = connectionManager.getApiClient(item.ServerId),
                userId = apiClient.getCurrentUserId();
            apiClient.getItem(userId, item.Id).then(function(item) {
                self.playWithCommand({
                    items: [item]
                }, "InstantMix")
            })
        }, self.canPlayMediaType = function(mediaType) {
            return mediaType = (mediaType || "").toLowerCase(), "audio" === mediaType || "video" === mediaType
        }, self.canQueueMediaType = function(mediaType) {
            return self.canPlayMediaType(mediaType)
        }, self.queue = function(options) {
            self.playWithCommand(options, "PlayLast")
        }, self.queueNext = function(options) {
            self.playWithCommand(options, "PlayNext")
        }, self.stop = function() {
            return castPlayer.sendMessage({
                options: {},
                command: "Stop"
            })
        }, self.displayContent = function(options) {
            castPlayer.sendMessage({
                options: options,
                command: "DisplayContent"
            })
        }, self.isPlaying = function() {
            var state = self.lastPlayerData || {};
            return null != state.NowPlayingItem
        }, self.isPlayingVideo = function() {
            var state = self.lastPlayerData || {};
            return state = state.NowPlayingItem || {}, "Video" === state.MediaType
        }, self.isPlayingAudio = function() {
            var state = self.lastPlayerData || {};
            return state = state.NowPlayingItem || {}, "Audio" === state.MediaType
        }, self.currentTime = function(val) {
            if (null != val) return self.seek(val);
            var state = self.lastPlayerData || {};
            return state = state.PlayState || {}, state.PositionTicks
        }, self.duration = function() {
            var state = self.lastPlayerData || {};
            return state = state.NowPlayingItem || {}, state.RunTimeTicks
        }, self.paused = function() {
            var state = self.lastPlayerData || {};
            return state = state.PlayState || {}, state.IsPaused
        }, self.isMuted = function() {
            var state = self.lastPlayerData || {};
            return state = state.PlayState || {}, state.IsMuted
        }, self.setMute = function(isMuted) {
            isMuted ? castPlayer.sendMessage({
                options: {},
                command: "Mute"
            }) : castPlayer.sendMessage({
                options: {},
                command: "Unmute"
            })
        }, self.getRepeatMode = function() {
            var state = self.lastPlayerData || {};
            return state = state.PlayState || {}, state.RepeatMode
        }, self.setRepeatMode = function(mode) {
            castPlayer.sendMessage({
                options: {
                    RepeatMode: mode
                },
                command: "SetRepeatMode"
            })
        }, self.toggleMute = function() {
            castPlayer.sendMessage({
                options: {},
                command: "ToggleMute"
            })
        }, self.getTargets = function() {
            var targets = [];
            return castPlayer.hasReceivers && targets.push(self.getCurrentTargetInfo()), Promise.resolve(targets)
        }, self.getCurrentTargetInfo = function() {
            var appName = null;
            return castPlayer.session && castPlayer.session.receiver && castPlayer.session.receiver.friendlyName && (appName = castPlayer.session.receiver.friendlyName), {
                name: PlayerName,
                id: PlayerName,
                playerName: PlayerName,
                playableMediaTypes: ["Audio", "Video"],
                isLocalPlayer: !1,
                appName: PlayerName,
                deviceName: appName,
                supportedCommands: ["VolumeUp", "VolumeDown", "Mute", "Unmute", "ToggleMute", "SetVolume", "SetAudioStreamIndex", "SetSubtitleStreamIndex", "DisplayContent", "SetRepeatMode", "EndSession"]
            }
        }, self.seek = function(position) {
            position = parseInt(position), position /= 1e7, castPlayer.sendMessage({
                options: {
                    position: position
                },
                command: "Seek"
            })
        }, self.audioTracks = function() {
            var state = self.lastPlayerData || {};
            state = state.NowPlayingItem || {};
            var streams = state.MediaStreams || [];
            return streams.filter(function(s) {
                return "Audio" === s.Type
            })
        }, self.setAudioStreamIndex = function(index) {
            castPlayer.sendMessage({
                options: {
                    index: index
                },
                command: "SetAudioStreamIndex"
            })
        }, self.getAudioStreamIndex = function() {
            var state = self.lastPlayerData || {};
            return state = state.PlayState || {}, state.AudioStreamIndex
        }, self.subtitleTracks = function() {
            var state = self.lastPlayerData || {};
            state = state.NowPlayingItem || {};
            var streams = state.MediaStreams || [];
            return streams.filter(function(s) {
                return "Subtitle" === s.Type
            })
        }, self.getSubtitleStreamIndex = function() {
            var state = self.lastPlayerData || {};
            return state = state.PlayState || {}, state.SubtitleStreamIndex
        }, self.setSubtitleStreamIndex = function(index) {
            castPlayer.sendMessage({
                options: {
                    index: index
                },
                command: "SetSubtitleStreamIndex"
            })
        }, self.getMaxStreamingBitrate = function() {
            var state = self.lastPlayerData || {};
            return state = state.PlayState || {}, state.MaxStreamingBitrate
        }, self.setMaxStreamingBitrate = function(options) {
            castPlayer.sendMessage({
                options: options,
                command: "SetMaxStreamingBitrate"
            })
        }, self.isFullscreen = function() {
            var state = self.lastPlayerData || {};
            return state = state.PlayState || {}, state.IsFullscreen
        }, self.toggleFullscreen = function() {}, self.nextTrack = function() {
            castPlayer.sendMessage({
                options: {},
                command: "NextTrack"
            })
        }, self.previousTrack = function() {
            castPlayer.sendMessage({
                options: {},
                command: "PreviousTrack"
            })
        }, self.beginPlayerUpdates = function() {}, self.endPlayerUpdates = function() {}, self.getVolume = function() {
            var state = self.lastPlayerData || {};
            return state = state.PlayState || {}, null == state.VolumeLevel ? 100 : state.VolumeLevel
        }, self.volumeDown = function() {
            castPlayer.sendMessage({
                options: {},
                command: "VolumeDown"
            })
        }, self.endSession = function() {
            self.stop().then(function() {
                setTimeout(function() {
                    castPlayer.stopApp()
                }, 1e3)
            })
        }, self.volumeUp = function() {
            castPlayer.sendMessage({
                options: {},
                command: "VolumeUp"
            })
        }, self.setVolume = function(vol) {
            vol = Math.min(vol, 100), vol = Math.max(vol, 0), castPlayer.sendMessage({
                options: {
                    volume: vol
                },
                command: "SetVolume"
            })
        }, self.getPlaylist = function() {
            return Promise.resolve([])
        }, self.getCurrentPlaylistItemId = function() {}, self.setCurrentPlaylistItem = function(playlistItemId) {
            return Promise.resolve()
        }, self.removeFromPlaylist = function(playlistItemIds) {
            return Promise.resolve()
        }, self.getPlayerState = function() {
            return Promise.resolve(self.getPlayerStateInternal() || {})
        }, self.lastPlayerData = {}, self.getPlayerStateInternal = function(data) {
            var triggerStateChange = !1;
            return data && !self.lastPlayerData && (triggerStateChange = !0), data = data || self.lastPlayerData, self.lastPlayerData = data, normalizeImages(data), triggerStateChange && events.trigger(self, "statechange", [data]), data
        }, self.tryPair = function(target) {
            return castPlayer.deviceState !== DEVICE_STATE.ACTIVE && castPlayer.isInitialized ? new Promise(function(resolve, reject) {
                currentResolve = resolve, currentReject = reject, castPlayer.launchApp()
            }) : (currentResolve = null, currentReject = null, Promise.reject())
        }, castSenderApiLoader.load().then(initializeChromecast)
    }
    var currentResolve, currentReject, PlayerName = "Chromecast",
        DEVICE_STATE = {
            IDLE: 0,
            ACTIVE: 1,
            WARNING: 2,
            ERROR: 3
        },
        PLAYER_STATE = {
            IDLE: "IDLE",
            LOADING: "LOADING",
            LOADED: "LOADED",
            PLAYING: "PLAYING",
            PAUSED: "PAUSED",
            STOPPED: "STOPPED",
            SEEKING: "SEEKING",
            ERROR: "ERROR"
        },
        applicationID = "2D4B1DA3",
        messageNamespace = "urn:x-cast:com.connectsdk",
        CastPlayer = function() {
            this.deviceState = DEVICE_STATE.IDLE, this.currentMediaSession = null, this.session = null, this.castPlayerState = PLAYER_STATE.IDLE, this.hasReceivers = !1, this.errorHandler = this.onError.bind(this), this.mediaStatusUpdateHandler = this.onMediaStatusUpdate.bind(this), this.initializeCastPlayer()
        };
    return CastPlayer.prototype.initializeCastPlayer = function() {
        var chrome = window.chrome;
        if (chrome) {
            if (!chrome.cast || !chrome.cast.isAvailable) return void setTimeout(this.initializeCastPlayer.bind(this), 1e3);
            var sessionRequest = new chrome.cast.SessionRequest(applicationID),
                apiConfig = new chrome.cast.ApiConfig(sessionRequest, this.sessionListener.bind(this), this.receiverListener.bind(this), "origin_scoped");
            console.log("chromecast.initialize"), chrome.cast.initialize(apiConfig, this.onInitSuccess.bind(this), this.errorHandler)
        }
    }, CastPlayer.prototype.onInitSuccess = function() {
        this.isInitialized = !0, console.log("chromecast init success")
    }, CastPlayer.prototype.onError = function() {
        console.log("chromecast error")
    }, CastPlayer.prototype.sessionListener = function(e) {
        this.session = e, this.session && (console.log("sessionListener " + JSON.stringify(e)), this.session.media[0] && this.onMediaDiscovered("activeSession", this.session.media[0]), this.onSessionConnected(e))
    }, CastPlayer.prototype.messageListener = function(namespace, message) {
        if ("string" == typeof message && (message = JSON.parse(message)), "playbackerror" === message.type) {
            var errorCode = message.data;
            setTimeout(function() {
                alertText(globalize.translate("MessagePlaybackError" + errorCode), globalize.translate("HeaderPlaybackError"))
            }, 300)
        } else "connectionerror" === message.type ? setTimeout(function() {
            alertText(globalize.translate("MessageChromecastConnectionError"), globalize.translate("HeaderError"))
        }, 300) : message.type && events.trigger(this, message.type, [message.data])
    }, CastPlayer.prototype.receiverListener = function(e) {
        "available" === e ? (console.log("chromecast receiver found"), this.hasReceivers = !0) : (console.log("chromecast receiver list empty"), this.hasReceivers = !1)
    }, CastPlayer.prototype.sessionUpdateListener = function(isAlive) {
        console.log("sessionUpdateListener alive: " + isAlive), isAlive || (this.session = null, this.deviceState = DEVICE_STATE.IDLE, this.castPlayerState = PLAYER_STATE.IDLE, console.log("sessionUpdateListener: setting currentMediaSession to null"), this.currentMediaSession = null, sendConnectionResult(!1))
    }, CastPlayer.prototype.launchApp = function() {
        console.log("chromecast launching app..."), chrome.cast.requestSession(this.onRequestSessionSuccess.bind(this), this.onLaunchError.bind(this))
    }, CastPlayer.prototype.onRequestSessionSuccess = function(e) {
        console.log("chromecast session success: " + e.sessionId), this.onSessionConnected(e)
    }, CastPlayer.prototype.onSessionConnected = function(session) {
        this.session = session, this.deviceState = DEVICE_STATE.ACTIVE, this.session.addMessageListener(messageNamespace, this.messageListener.bind(this)), this.session.addMediaListener(this.sessionMediaListener.bind(this)), this.session.addUpdateListener(this.sessionUpdateListener.bind(this)), events.trigger(this, "connect"), this.sendMessage({
            options: {},
            command: "Identify"
        })
    }, CastPlayer.prototype.sessionMediaListener = function(e) {
        console.log("sessionMediaListener"), this.currentMediaSession = e, this.currentMediaSession.addUpdateListener(this.mediaStatusUpdateHandler)
    }, CastPlayer.prototype.onLaunchError = function() {
        console.log("chromecast launch error"), this.deviceState = DEVICE_STATE.ERROR, sendConnectionResult(!1)
    }, CastPlayer.prototype.stopApp = function() {
        this.session && this.session.stop(this.onStopAppSuccess.bind(this, "Session stopped"), this.errorHandler)
    }, CastPlayer.prototype.onStopAppSuccess = function(message) {
        console.log(message), this.deviceState = DEVICE_STATE.IDLE, this.castPlayerState = PLAYER_STATE.IDLE, console.log("onStopAppSuccess: setting currentMediaSession to null"), this.currentMediaSession = null
    }, CastPlayer.prototype.loadMedia = function(options, command) {
        return this.session ? (options.items = options.items.map(function(i) {
            return {
                Id: i.Id,
                Name: i.Name,
                Type: i.Type,
                MediaType: i.MediaType,
                IsFolder: i.IsFolder
            }
        }), this.sendMessage({
            options: options,
            command: command
        })) : (console.log("no session"), Promise.reject())
    }, CastPlayer.prototype.sendMessage = function(message) {
        var player = this,
            receiverName = null,
            session = player.session;
        session && session.receiver && session.receiver.friendlyName && (receiverName = session.receiver.friendlyName);
        var apiClient = ApiClient;
        message = Object.assign(message, {
            userId: apiClient.getCurrentUserId(),
            deviceId: apiClient.deviceId(),
            accessToken: apiClient.accessToken(),
            serverAddress: apiClient.serverAddress(),
            receiverName: receiverName
        });
        var bitrateSetting = appSettings.maxChromecastBitrate();
        return bitrateSetting && (message.maxBitrate = bitrateSetting), new Promise(function(resolve, reject) {
            require(["chromecasthelpers"], function(chromecasthelpers) {
                chromecasthelpers.getServerAddress(apiClient).then(function(serverAddress) {
                    message.serverAddress = serverAddress, player.sendMessageInternal(message).then(resolve, reject)
                }, reject)
            })
        })
    }, CastPlayer.prototype.sendMessageInternal = function(message) {
        return message = JSON.stringify(message), this.session.sendMessage(messageNamespace, message, this.onPlayCommandSuccess.bind(this), this.errorHandler), Promise.resolve()
    }, CastPlayer.prototype.onPlayCommandSuccess = function() {
        console.log("Message was sent to receiver ok.")
    }, CastPlayer.prototype.onMediaDiscovered = function(how, mediaSession) {
        console.log("chromecast new media session ID:" + mediaSession.mediaSessionId + " (" + how + ")"), this.currentMediaSession = mediaSession, "loadMedia" === how && (this.castPlayerState = PLAYER_STATE.PLAYING), "activeSession" === how && (this.castPlayerState = mediaSession.playerState), this.currentMediaSession.addUpdateListener(this.mediaStatusUpdateHandler)
    }, CastPlayer.prototype.onMediaStatusUpdate = function(e) {
        e === !1 && (this.castPlayerState = PLAYER_STATE.IDLE), console.log("chromecast updating media: " + e)
    }, CastPlayer.prototype.setReceiverVolume = function(mute, vol) {
        return this.currentMediaSession ? void(mute ? this.session.setReceiverMuted(!0, this.mediaCommandSuccessCallback.bind(this), this.errorHandler) : this.session.setReceiverVolumeLevel(vol || 1, this.mediaCommandSuccessCallback.bind(this), this.errorHandler)) : void console.log("this.currentMediaSession is null")
    }, CastPlayer.prototype.mute = function() {
        this.setReceiverVolume(!0)
    }, CastPlayer.prototype.mediaCommandSuccessCallback = function(info, e) {
        console.log(info)
    }, chromecastPlayer
});