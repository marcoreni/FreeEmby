define(["playbackManager", "events", "serverNotifications", "connectionManager"], function(playbackManager, events, serverNotifications, connectionManager) {
    "use strict";

    function getActivePlayerId() {
        var info = playbackManager.getPlayerInfo();
        return info ? info.id : null
    }

    function sendPlayCommand(apiClient, options, playType) {
        var sessionId = getActivePlayerId(),
            ids = options.ids || options.items.map(function(i) {
                return i.Id
            }),
            remoteOptions = {
                ItemIds: ids.join(","),
                PlayCommand: playType
            };
        return options.startPositionTicks && (remoteOptions.startPositionTicks = options.startPositionTicks), apiClient.sendPlayCommand(sessionId, remoteOptions)
    }

    function sendPlayStateCommand(apiClient, command, options) {
        var sessionId = getActivePlayerId();
        apiClient.sendPlayStateCommand(sessionId, command, options)
    }
    return function() {
        function getCurrentApiClient() {
            return currentServerId ? connectionManager.getApiClient(currentServerId) : connectionManager.currentApiClient()
        }

        function sendCommandByName(name, options) {
            var command = {
                Name: name
            };
            options && (command.Arguments = options), self.sendCommand(command)
        }

        function onPollIntervalFired() {
            var apiClient = getCurrentApiClient();
            apiClient.isWebSocketOpen() || apiClient && apiClient.getSessions().then(function(sessions) {
                processUpdatedSessions(sessions, apiClient)
            })
        }

        function unsubscribeFromPlayerUpdates() {
            self.isUpdating = !0;
            var apiClient = getCurrentApiClient();
            apiClient.isWebSocketOpen() && apiClient.sendWebSocketMessage("SessionsStop"), pollInterval && (clearInterval(pollInterval), pollInterval = null)
        }

        function getPlayerState(session) {
            return session
        }

        function normalizeImages(state) {
            if (state && state.NowPlayingItem) {
                var item = state.NowPlayingItem;
                item.ImageTags && item.ImageTags.Primary || item.PrimaryImageTag && (item.ImageTags = item.ImageTags || {}, item.ImageTags.Primary = item.PrimaryImageTag), item.BackdropImageTag && item.BackdropItemId === item.Id && (item.BackdropImageTags = [item.BackdropImageTag]), item.BackdropImageTag && item.BackdropItemId !== item.Id && (item.ParentBackdropImageTags = [item.BackdropImageTag], item.ParentBackdropItemId = item.BackdropItemId)
            }
        }

        function firePlaybackEvent(name, session) {
            var state = getPlayerState(session);
            normalizeImages(state), self.lastPlayerData = state, events.trigger(self, name, [state])
        }

        function processUpdatedSessions(sessions, apiClient) {
            var serverId = apiClient.serverId();
            sessions.map(function(s) {
                s.NowPlayingItem && (s.NowPlayingItem.ServerId = serverId)
            });
            var currentTargetId = getActivePlayerId(),
                session = sessions.filter(function(s) {
                    return s.Id === currentTargetId
                })[0];
            session && (firePlaybackEvent("statechange", session), firePlaybackEvent("timeupdate", session), firePlaybackEvent("pause", session))
        }
        var self = this;
        self.name = "Remote Control", self.type = "mediaplayer", self.isLocalPlayer = !1, self.id = "remoteplayer";
        var currentServerId;
        self.sendCommand = function(command) {
            var sessionId = getActivePlayerId(),
                apiClient = getCurrentApiClient();
            apiClient.sendCommand(sessionId, command)
        }, self.play = function(options) {
            var playOptions = {};
            return playOptions.ids = options.ids || options.items.map(function(i) {
                return i.Id
            }), options.startPositionTicks && (playOptions.startPositionTicks = options.startPositionTicks), sendPlayCommand(getCurrentApiClient(), playOptions, "PlayNow")
        }, self.shuffle = function(item) {
            sendPlayCommand(getCurrentApiClient(), {
                ids: [item.Id]
            }, "PlayShuffle")
        }, self.instantMix = function(item) {
            sendPlayCommand(getCurrentApiClient(), {
                ids: [item.Id]
            }, "PlayInstantMix")
        }, self.queue = function(options) {
            sendPlayCommand(getCurrentApiClient(), options, "PlayNext")
        }, self.queueNext = function(options) {
            sendPlayCommand(getCurrentApiClient(), options, "PlayLast")
        }, self.canPlayMediaType = function(mediaType) {
            return mediaType = (mediaType || "").toLowerCase(), "audio" === mediaType || "video" === mediaType
        }, self.canQueueMediaType = function(mediaType) {
            return self.canPlayMediaType(mediaType)
        }, self.stop = function() {
            sendPlayStateCommand(getCurrentApiClient(), "stop")
        }, self.nextTrack = function() {
            sendPlayStateCommand(getCurrentApiClient(), "nextTrack")
        }, self.previousTrack = function() {
            sendPlayStateCommand(getCurrentApiClient(), "previousTrack")
        }, self.seek = function(positionTicks) {
            sendPlayStateCommand(getCurrentApiClient(), "seek", {
                SeekPositionTicks: positionTicks
            })
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
        }, self.getVolume = function() {
            var state = self.lastPlayerData || {};
            return state = state.PlayState || {}, state.VolumeLevel
        }, self.pause = function() {
            sendPlayStateCommand(getCurrentApiClient(), "Pause")
        }, self.unpause = function() {
            sendPlayStateCommand(getCurrentApiClient(), "Unpause")
        }, self.setMute = function(isMuted) {
            sendCommandByName(isMuted ? "Mute" : "Unmute")
        }, self.toggleMute = function() {
            sendCommandByName("ToggleMute")
        }, self.setVolume = function(vol) {
            sendCommandByName("SetVolume", {
                Volume: vol
            })
        }, self.volumeUp = function() {
            sendCommandByName("VolumeUp")
        }, self.volumeDown = function() {
            sendCommandByName("VolumeDown")
        }, self.toggleFullscreen = function() {
            sendCommandByName("ToggleFullscreen")
        }, self.audioTracks = function() {
            var state = self.lastPlayerData || {};
            state = state.NowPlayingItem || {};
            var streams = state.MediaStreams || [];
            return streams.filter(function(s) {
                return "Audio" === s.Type
            })
        }, self.getAudioStreamIndex = function() {
            var state = self.lastPlayerData || {};
            return state = state.PlayState || {}, state.AudioStreamIndex
        }, self.setAudioStreamIndex = function(index) {
            sendCommandByName("SetAudioStreamIndex", {
                Index: index
            })
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
            sendCommandByName("SetSubtitleStreamIndex", {
                Index: index
            })
        }, self.getMaxStreamingBitrate = function() {}, self.setMaxStreamingBitrate = function(options) {}, self.isFullscreen = function() {}, self.toggleFullscreen = function() {}, self.getRepeatMode = function() {}, self.setRepeatMode = function(mode) {
            sendCommandByName("SetRepeatMode", {
                RepeatMode: mode
            })
        }, self.displayContent = function(options) {
            sendCommandByName("DisplayContent", options)
        }, self.isPlaying = function() {
            var state = self.lastPlayerData || {};
            return null != state.NowPlayingItem
        }, self.isPlayingVideo = function() {
            var state = self.lastPlayerData || {};
            return state = state.NowPlayingItem || {}, "Video" === state.MediaType
        }, self.isPlayingAudio = function() {
            var state = self.lastPlayerData || {};
            return state = state.NowPlayingItem || {}, "Audio" === state.MediaType
        }, self.getPlaylist = function() {
            return Promise.resolve([])
        }, self.getCurrentPlaylistItemId = function() {}, self.setCurrentPlaylistItem = function(playlistItemId) {
            return Promise.resolve()
        }, self.removeFromPlaylist = function(playlistItemIds) {
            return Promise.resolve()
        }, self.getPlayerState = function() {
            var apiClient = getCurrentApiClient();
            return apiClient ? apiClient.getSessions().then(function(sessions) {
                var currentTargetId = getActivePlayerId(),
                    session = sessions.filter(function(s) {
                        return s.Id === currentTargetId
                    })[0];
                return session && (session = getPlayerState(session)), session
            }) : Promise.resolve({})
        };
        var pollInterval;
        self.subscribeToPlayerUpdates = function() {
            self.isUpdating = !0;
            var apiClient = getCurrentApiClient();
            apiClient.isWebSocketOpen() && apiClient.sendWebSocketMessage("SessionsStart", "100,800"), pollInterval && (clearInterval(pollInterval), pollInterval = null), pollInterval = setInterval(onPollIntervalFired, 5e3)
        };
        var playerListenerCount = 0;
        self.beginPlayerUpdates = function() {
            playerListenerCount <= 0 && (playerListenerCount = 0, self.subscribeToPlayerUpdates()), playerListenerCount++
        }, self.endPlayerUpdates = function() {
            playerListenerCount--, playerListenerCount <= 0 && (unsubscribeFromPlayerUpdates(), playerListenerCount = 0)
        }, self.getTargets = function() {
            var apiClient = getCurrentApiClient(),
                sessionQuery = {
                    ControllableByUserId: apiClient.getCurrentUserId()
                };
            return apiClient ? apiClient.getSessions(sessionQuery).then(function(sessions) {
                return sessions.filter(function(s) {
                    return s.DeviceId !== apiClient.deviceId()
                }).map(function(s) {
                    return {
                        name: s.DeviceName,
                        deviceName: s.DeviceName,
                        id: s.Id,
                        playerName: self.name,
                        appName: s.Client,
                        playableMediaTypes: s.PlayableMediaTypes,
                        isLocalPlayer: !1,
                        supportedCommands: s.SupportedCommands
                    }
                })
            }) : Promise.resolve([])
        }, self.tryPair = function(target) {
            return Promise.resolve()
        }, events.on(serverNotifications, "Sessions", function(e, apiClient, data) {
            processUpdatedSessions(data, apiClient)
        }), events.on(serverNotifications, "SessionEnded", function(e, apiClient, data) {
            console.log("Server reports another session ended"), getActivePlayerId() === data.Id && playbackManager.setDefaultPlayerActive()
        }), events.on(serverNotifications, "PlaybackStart", function(e, apiClient, data) {
            data.DeviceId !== apiClient.deviceId() && getActivePlayerId() === data.Id && firePlaybackEvent("playbackstart", data)
        }), events.on(serverNotifications, "PlaybackStopped", function(e, apiClient, data) {
            data.DeviceId !== apiClient.deviceId() && getActivePlayerId() === data.Id && firePlaybackEvent("playbackstop", data)
        })
    }
});