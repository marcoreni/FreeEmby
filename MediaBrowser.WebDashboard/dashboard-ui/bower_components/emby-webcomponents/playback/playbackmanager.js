define(["events", "datetime", "appSettings", "pluginManager", "userSettings", "globalize", "connectionManager", "loading", "serverNotifications", "apphost", "fullscreenManager", "layoutManager"], function(events, datetime, appSettings, pluginManager, userSettings, globalize, connectionManager, loading, serverNotifications, apphost, fullscreenManager, layoutManager) {
    "use strict";

    function enableLocalPlaylistManagement(player) {
        return !!player.isLocalPlayer
    }

    function bindToFullscreenChange(player) {
        events.on(fullscreenManager, "fullscreenchange", function() {
            events.trigger(player, "fullscreenchange")
        })
    }

    function PlaybackManager() {
        function triggerPlayerChange(newPlayer, newTarget, previousPlayer, previousTargetInfo) {
            (newPlayer || previousPlayer) && (newTarget && previousTargetInfo && newTarget.id === previousTargetInfo.id || events.trigger(self, "playerchange", [newPlayer, newTarget, previousPlayer]))
        }

        function displayPlayerInLocalGroup(player) {
            return player.isLocalPlayer
        }

        function getSupportedCommands(player) {
            if (player.isLocalPlayer) {
                var list = ["GoHome", "GoToSettings", "VolumeUp", "VolumeDown", "Mute", "Unmute", "ToggleMute", "SetVolume", "SetAudioStreamIndex", "SetSubtitleStreamIndex", "SetMaxStreamingBitrate", "DisplayContent", "GoToSearch", "DisplayMessage", "SetRepeatMode"];
                return apphost.supports("fullscreenchange") && !layoutManager.tv && list.push("ToggleFullscreen"), player.supports && (player.supports("PictureInPicture") && list.push("PictureInPicture"), player.supports("SetBrightness") && list.push("SetBrightness"), player.supports("SetAspectRatio") && list.push("SetAspectRatio")), list
            }
            throw new Error("player must define supported commands")
        }

        function createTarget(player) {
            return {
                name: player.name,
                id: player.id,
                playerName: player.name,
                playableMediaTypes: ["Audio", "Video", "Game"].map(player.canPlayMediaType),
                isLocalPlayer: player.isLocalPlayer,
                supportedCommands: getSupportedCommands(player)
            }
        }

        function getPlayerTargets(player) {
            return player.getTargets ? player.getTargets() : Promise.resolve([createTarget(player)])
        }

        function getCurrentSubtitleStream(player) {
            if (!player) throw new Error("player cannot be null");
            var index = getPlayerData(player).subtitleStreamIndex;
            return null == index || index === -1 ? null : getSubtitleStream(player, index)
        }

        function getSubtitleStream(player, index) {
            return self.currentMediaSource(player).MediaStreams.filter(function(s) {
                return "Subtitle" === s.Type && s.Index === index
            })[0]
        }

        function setCurrentPlayerInternal(player, targetInfo) {
            var previousPlayer = currentPlayer,
                previousTargetInfo = currentTargetInfo;
            if (player && !targetInfo && player.isLocalPlayer && (targetInfo = createTarget(player)), player && !targetInfo) throw new Error("targetInfo cannot be null");
            currentPairingId = null, currentPlayer = player, currentTargetInfo = targetInfo, targetInfo && console.log("Active player: " + JSON.stringify(targetInfo)), player && player.isLocalPlayer && (lastLocalPlayer = player), previousPlayer && self.endPlayerUpdates(previousPlayer), player && self.beginPlayerUpdates(player), triggerPlayerChange(player, targetInfo, previousPlayer, previousTargetInfo)
        }

        function getAutomaticPlayers() {
            var player = currentPlayer;
            return player && !enableLocalPlaylistManagement(player) ? [player] : self.getPlayers().filter(enableLocalPlaylistManagement)
        }

        function canPlayerSeek(player) {
            if (!player) throw new Error("player cannot be null");
            var playerData = getPlayerData(player),
                currentSrc = (playerData.streamInfo.url || "").toLowerCase();
            return currentSrc.indexOf(".m3u8") !== -1 || "Transcode" !== playerData.streamInfo.playMethod && player.duration()
        }

        function changeStream(player, ticks, params) {
            if (canPlayerSeek(player) && null == params) return void player.currentTime(parseInt(ticks / 1e4));
            params = params || {};
            var liveStreamId = getPlayerData(player).streamInfo.liveStreamId,
                playSessionId = getPlayerData(player).streamInfo.playSessionId,
                playerData = getPlayerData(player),
                currentItem = playerData.streamInfo.item;
            player.getDeviceProfile(currentItem, {
                isRetry: params.EnableDirectPlay === !1
            }).then(function(deviceProfile) {
                var audioStreamIndex = null == params.AudioStreamIndex ? getPlayerData(player).audioStreamIndex : params.AudioStreamIndex,
                    subtitleStreamIndex = null == params.SubtitleStreamIndex ? getPlayerData(player).subtitleStreamIndex : params.SubtitleStreamIndex,
                    currentMediaSource = playerData.streamInfo.mediaSource,
                    apiClient = connectionManager.getApiClient(currentItem.ServerId);
                ticks && (ticks = parseInt(ticks));
                var maxBitrate = params.MaxStreamingBitrate || self.getMaxStreamingBitrate(player);
                getPlaybackInfo(apiClient, currentItem.Id, deviceProfile, maxBitrate, ticks, currentMediaSource, audioStreamIndex, subtitleStreamIndex, liveStreamId, params.EnableDirectPlay, params.EnableDirectStream, params.AllowVideoStreamCopy, params.AllowAudioStreamCopy).then(function(result) {
                    validatePlaybackInfoResult(result) && (currentMediaSource = result.MediaSources[0], createStreamInfo(apiClient, currentItem.MediaType, currentItem, currentMediaSource, ticks).then(function(streamInfo) {
                        return streamInfo.fullscreen = currentPlayOptions.fullscreen, streamInfo.url ? (getPlayerData(player).subtitleStreamIndex = subtitleStreamIndex, getPlayerData(player).audioStreamIndex = audioStreamIndex, getPlayerData(player).maxStreamingBitrate = maxBitrate, void changeStreamToUrl(apiClient, player, playSessionId, streamInfo)) : (showPlaybackInfoErrorMessage("NoCompatibleStream"), void self.nextTrack())
                    }))
                })
            })
        }

        function changeStreamToUrl(apiClient, player, playSessionId, streamInfo, newPositionTicks) {
            clearProgressInterval(player);
            var playerData = getPlayerData(player);
            playerData.isChangingStream = !0, "Video" === playerData.MediaType ? apiClient.stopActiveEncodings(playSessionId).then(function() {
                setSrcIntoPlayer(apiClient, player, streamInfo)
            }) : setSrcIntoPlayer(apiClient, player, streamInfo)
        }

        function setSrcIntoPlayer(apiClient, player, streamInfo) {
            player.play(streamInfo).then(function() {
                var playerData = getPlayerData(player);
                playerData.isChangingStream = !1, playerData.streamInfo = streamInfo, startProgressInterval(player), sendProgressUpdate(player)
            }, function(e) {
                onPlaybackError.call(player, e, {
                    type: "mediadecodeerror"
                })
            })
        }

        function getPlayerData(player) {
            if (!player) throw new Error("player cannot be null");
            if (!player.name) throw new Error("player name cannot be null");
            var state = playerStates[player.name];
            return state || (playerStates[player.name] = {}, state = playerStates[player.name]), player
        }

        function getCurrentTicks(player) {
            if (!player) throw new Error("player cannot be null");
            var playerTime = Math.floor(1e4 * (player || currentPlayer).currentTime());
            return playerTime += getPlayerData(player).streamInfo.transcodingOffsetTicks || 0
        }

        function getNowPlayingItemForReporting(player, item, mediaSource) {
            var nowPlayingItem = Object.assign({}, item);
            return mediaSource && (nowPlayingItem.RunTimeTicks = mediaSource.RunTimeTicks), nowPlayingItem.RunTimeTicks = nowPlayingItem.RunTimeTicks || 1e4 * player.duration(), nowPlayingItem
        }

        function translateItemsForPlayback(items, options) {
            var promise, firstItem = items[0],
                serverId = firstItem.ServerId;
            return "Program" === firstItem.Type ? promise = getItemsForPlayback(serverId, {
                Ids: firstItem.ChannelId
            }) : "Playlist" === firstItem.Type ? promise = getItemsForPlayback(serverId, {
                ParentId: firstItem.Id
            }) : "MusicArtist" === firstItem.Type ? promise = getItemsForPlayback(serverId, {
                ArtistIds: firstItem.Id,
                Filters: "IsNotFolder",
                Recursive: !0,
                SortBy: "SortName",
                MediaTypes: "Audio"
            }) : "MusicGenre" === firstItem.Type ? promise = getItemsForPlayback(serverId, {
                Genres: firstItem.Name,
                Filters: "IsNotFolder",
                Recursive: !0,
                SortBy: "SortName",
                MediaTypes: "Audio"
            }) : firstItem.IsFolder ? promise = getItemsForPlayback(serverId, {
                ParentId: firstItem.Id,
                Filters: "IsNotFolder",
                Recursive: !0,
                SortBy: "SortName",
                MediaTypes: "Audio,Video"
            }) : "Episode" === firstItem.Type && 1 === items.length && getPlayer(firstItem, options).supportsProgress !== !1 && (promise = new Promise(function(resolve, reject) {
                var apiClient = connectionManager.getApiClient(firstItem.ServerId);
                apiClient.getCurrentUser().then(function(user) {
                    return user.Configuration.EnableNextEpisodeAutoPlay && firstItem.SeriesId ? void apiClient.getEpisodes(firstItem.SeriesId, {
                        IsVirtualUnaired: !1,
                        IsMissing: !1,
                        UserId: apiClient.getCurrentUserId(),
                        Fields: "MediaSources,Chapters"
                    }).then(function(episodesResult) {
                        var foundItem = !1;
                        episodesResult.Items = episodesResult.Items.filter(function(e) {
                            return !!foundItem || e.Id === firstItem.Id && (foundItem = !0, !0)
                        }), episodesResult.TotalRecordCount = episodesResult.Items.length, resolve(episodesResult)
                    }, reject) : void resolve(null)
                })
            })), promise ? promise.then(function(result) {
                return result ? result.Items : items
            }) : Promise.resolve(items)
        }

        function enableIntros(item) {
            return "Video" === item.MediaType && ("TvChannel" !== item.Type && ("InProgress" !== item.Status && isServerItem(item)))
        }

        function playWithIntros(items, options, user) {
            var firstItem = items[0];
            "Video" === firstItem.MediaType;
            var afterPlayInternal = function() {
                for (var i = 0, length = items.length; i < length; i++) addUniquePlaylistItemId(items[i]);
                playlist = items.slice(0);
                var playIndex = 0;
                setPlaylistState(items[playIndex].PlaylistItemId, playIndex), loading.hide()
            };
            if (options.startPositionTicks || options.fullscreen === !1 || !enableIntros(firstItem) || !userSettings.enableCinemaMode()) return currentPlayOptions = options, playInternal(firstItem, options, afterPlayInternal);
            var apiClient = connectionManager.getApiClient(firstItem.ServerId);
            return apiClient.getIntros(firstItem.Id).then(function(intros) {
                return items = intros.Items.concat(items), currentPlayOptions = options, playInternal(items[0], options, afterPlayInternal)
            })
        }

        function isServerItem(item) {
            return !!item.Id
        }

        function addUniquePlaylistItemId(item) {
            item.PlaylistItemId || (item.PlaylistItemId = "playlistItem" + currentId, currentId++)
        }

        function setPlaylistState(playlistItemId, index) {
            isNaN(index) || (currentPlaylistIndex = index, currentPlaylistItemId = playlistItemId)
        }

        function playInternal(item, playOptions, onPlaybackStartedFn) {
            return item.IsPlaceHolder ? (loading.hide(), showPlaybackInfoErrorMessage("PlaceHolder", !0), Promise.reject()) : (normalizePlayOptions(playOptions), playOptions.isFirstItem ? playOptions.isFirstItem = !1 : playOptions.isFirstItem = !0, runInterceptors(item, playOptions).then(function() {
                if (playOptions.fullscreen && loading.show(), "Video" === item.MediaType && isServerItem(item) && appSettings.enableAutomaticBitrateDetection()) {
                    var apiClient = connectionManager.getApiClient(item.ServerId);
                    return apiClient.detectBitrate().then(function(bitrate) {
                        return appSettings.maxStreamingBitrate(bitrate), playAfterBitrateDetect(connectionManager, bitrate, item, playOptions, onPlaybackStartedFn)
                    }, function() {
                        return playAfterBitrateDetect(connectionManager, appSettings.maxStreamingBitrate(), item, playOptions, onPlaybackStartedFn)
                    })
                }
                return playAfterBitrateDetect(connectionManager, appSettings.maxStreamingBitrate(), item, playOptions, onPlaybackStartedFn)
            }, function() {
                var player = currentPlayer;
                return player && destroyPlayer(player), setCurrentPlayerInternal(null), events.trigger(self, "playbackcancelled"), Promise.reject()
            }))
        }

        function destroyPlayer(player) {
            player.destroy(), releaseResourceLocks(player)
        }

        function runInterceptors(item, playOptions) {
            return new Promise(function(resolve, reject) {
                var interceptors = pluginManager.ofType("preplayintercept");
                if (interceptors.sort(function(a, b) {
                        return (a.order || 0) - (b.order || 0)
                    }), !interceptors.length) return void resolve();
                loading.hide();
                var options = Object.assign({}, playOptions);
                options.mediaType = item.MediaType, options.item = item, runNextPrePlay(interceptors, 0, options, resolve, reject)
            })
        }

        function runNextPrePlay(interceptors, index, options, resolve, reject) {
            if (index >= interceptors.length) return void resolve();
            var interceptor = interceptors[index];
            interceptor.intercept(options).then(function() {
                runNextPrePlay(interceptors, index + 1, options, resolve, reject)
            }, reject)
        }

        function playAfterBitrateDetect(connectionManager, maxBitrate, item, playOptions, onPlaybackStartedFn) {
            var promise, startPosition = playOptions.startPositionTicks,
                player = getPlayer(item, playOptions),
                activePlayer = currentPlayer;
            return activePlayer ? (playNextAfterEnded = !1, promise = onPlaybackChanging(activePlayer, player, item)) : promise = Promise.resolve(), isServerItem(item) && "Game" !== item.MediaType ? Promise.all([promise, player.getDeviceProfile(item)]).then(function(responses) {
                var deviceProfile = responses[1],
                    apiClient = connectionManager.getApiClient(item.ServerId);
                return getPlaybackMediaSource(apiClient, deviceProfile, maxBitrate, item, startPosition).then(function(mediaSource) {
                    return createStreamInfo(apiClient, item.MediaType, item, mediaSource, startPosition).then(function(streamInfo) {
                        return streamInfo.fullscreen = playOptions.fullscreen, getPlayerData(player).isChangingStream = !1, getPlayerData(player).maxStreamingBitrate = maxBitrate, player.play(streamInfo).then(function() {
                            loading.hide(), onPlaybackStartedFn(), onPlaybackStarted(player, playOptions, streamInfo, mediaSource)
                        }, function() {
                            onPlaybackStartedFn(), onPlaybackStarted(player, playOptions, streamInfo, mediaSource), setTimeout(function(err) {
                                onPlaybackError.call(player, err, {
                                    type: "mediadecodeerror"
                                })
                            }, 100)
                        })
                    })
                })
            }) : promise.then(function() {
                var streamInfo = createStreamInfoFromUrlItem(item);
                return streamInfo.fullscreen = playOptions.fullscreen, getPlayerData(player).isChangingStream = !1, player.play(streamInfo).then(function() {
                    loading.hide(), onPlaybackStartedFn(), onPlaybackStarted(player, playOptions, streamInfo)
                }, function() {
                    self.stop(player)
                })
            })
        }

        function createStreamInfoFromUrlItem(item) {
            return {
                url: item.Url || item.Path,
                playMethod: "DirectPlay",
                item: item,
                textTracks: [],
                mediaType: item.MediaType
            }
        }

        function backdropImageUrl(apiClient, item, options) {
            return options = options || {}, options.type = options.type || "Backdrop", options.maxWidth || options.width || options.maxHeight || options.height || (options.quality = 100), item.BackdropImageTags && item.BackdropImageTags.length ? (options.tag = item.BackdropImageTags[0], apiClient.getScaledImageUrl(item.Id, options)) : item.ParentBackdropImageTags && item.ParentBackdropImageTags.length ? (options.tag = item.ParentBackdropImageTags[0], apiClient.getScaledImageUrl(item.ParentBackdropItemId, options)) : null
        }

        function getMimeType(type, container) {
            if (container = (container || "").toLowerCase(), "audio" === type) {
                if ("opus" === container) return "audio/ogg";
                if ("webma" === container) return "audio/webm";
                if ("m4a" === container) return "audio/mp4"
            } else if ("video" === type) {
                if ("mkv" === container) return "video/x-matroska";
                if ("m4v" === container) return "video/mp4";
                if ("mov" === container) return "video/quicktime";
                if ("mpg" === container) return "video/mpeg";
                if ("flv" === container) return "video/x-flv"
            }
            return type + "/" + container
        }

        function createStreamInfo(apiClient, type, item, mediaSource, startPosition, forceTranscoding) {
            var mediaUrl, contentType, directOptions, transcodingOffsetTicks = 0,
                playerStartPositionTicks = startPosition,
                liveStreamId = mediaSource.LiveStreamId,
                playMethod = "Transcode",
                mediaSourceContainer = (mediaSource.Container || "").toLowerCase();
            if ("Video" === type) contentType = getMimeType("video", mediaSourceContainer), mediaSource.enableDirectPlay && !forceTranscoding ? (mediaUrl = mediaSource.Path, playMethod = "DirectPlay") : mediaSource.SupportsDirectStream && !forceTranscoding ? (directOptions = {
                Static: !0,
                mediaSourceId: mediaSource.Id,
                deviceId: apiClient.deviceId(),
                api_key: apiClient.accessToken()
            }, mediaSource.ETag && (directOptions.Tag = mediaSource.ETag), mediaSource.LiveStreamId && (directOptions.LiveStreamId = mediaSource.LiveStreamId), mediaUrl = apiClient.getUrl("Videos/" + item.Id + "/stream." + mediaSourceContainer, directOptions), playMethod = "DirectStream") : mediaSource.SupportsTranscoding && (mediaUrl = apiClient.getUrl(mediaSource.TranscodingUrl), "hls" === mediaSource.TranscodingSubProtocol ? contentType = "application/x-mpegURL" : (playerStartPositionTicks = null, contentType = getMimeType("video", mediaSource.TranscodingContainer), mediaUrl.toLowerCase().indexOf("copytimestamps=true") === -1 && (transcodingOffsetTicks = startPosition || 0)));
            else if ("Audio" === type)
                if (contentType = getMimeType("audio", mediaSourceContainer), mediaSource.enableDirectPlay && !forceTranscoding) mediaUrl = mediaSource.Path, playMethod = "DirectPlay";
                else {
                    var isDirectStream = mediaSource.SupportsDirectStream;
                    isDirectStream && !forceTranscoding ? (directOptions = {
                        Static: !0,
                        mediaSourceId: mediaSource.Id,
                        deviceId: apiClient.deviceId(),
                        api_key: apiClient.accessToken()
                    }, mediaSource.ETag && (directOptions.Tag = mediaSource.ETag), mediaSource.LiveStreamId && (directOptions.LiveStreamId = mediaSource.LiveStreamId), mediaUrl = apiClient.getUrl("Audio/" + item.Id + "/stream." + mediaSourceContainer, directOptions), playMethod = "DirectStream") : mediaSource.SupportsTranscoding && (mediaUrl = apiClient.getUrl(mediaSource.TranscodingUrl), "hls" === mediaSource.TranscodingSubProtocol ? contentType = "application/x-mpegURL" : (transcodingOffsetTicks = startPosition || 0, playerStartPositionTicks = null, contentType = getMimeType("audio", mediaSource.TranscodingContainer)))
                }
            else "Game" === type && (mediaUrl = mediaSource.Path, playMethod = "DirectPlay");
            !mediaUrl && mediaSource.SupportsDirectPlay && (mediaUrl = mediaSource.Path, playMethod = "DirectPlay");
            var resultInfo = {
                    url: mediaUrl,
                    mimeType: contentType,
                    transcodingOffsetTicks: transcodingOffsetTicks,
                    playMethod: playMethod,
                    playerStartPositionTicks: playerStartPositionTicks,
                    item: item,
                    mediaSource: mediaSource,
                    textTracks: getTextTracks(apiClient, mediaSource),
                    tracks: getTextTracks(apiClient, mediaSource),
                    mediaType: type,
                    liveStreamId: liveStreamId,
                    playSessionId: getParam("playSessionId", mediaUrl),
                    title: item.Name
                },
                backdropUrl = backdropImageUrl(apiClient, item, {});
            return backdropUrl && (resultInfo.backdropUrl = backdropUrl), Promise.resolve(resultInfo)
        }

        function getParam(name, url) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regexS = "[\\?&]" + name + "=([^&#]*)",
                regex = new RegExp(regexS, "i"),
                results = regex.exec(url);
            return null == results ? "" : decodeURIComponent(results[1].replace(/\+/g, " "))
        }

        function getTextTracks(apiClient, mediaSource) {
            for (var subtitleStreams = mediaSource.MediaStreams.filter(function(s) {
                    return "Subtitle" === s.Type
                }), textStreams = subtitleStreams.filter(function(s) {
                    return "External" === s.DeliveryMethod
                }), tracks = [], i = 0, length = textStreams.length; i < length; i++) {
                var textStream = textStreams[i],
                    textStreamUrl = textStream.IsExternalUrl ? textStream.DeliveryUrl : apiClient.getUrl(textStream.DeliveryUrl);
                tracks.push({
                    url: textStreamUrl,
                    language: textStream.Language || "und",
                    isDefault: textStream.Index === mediaSource.DefaultSubtitleStreamIndex,
                    index: textStream.Index,
                    format: textStream.Codec
                })
            }
            return tracks
        }

        function getPlaybackMediaSource(apiClient, deviceProfile, maxBitrate, item, startPosition, callback) {
            return "Video" === item.MediaType, getPlaybackInfo(apiClient, item.Id, deviceProfile, maxBitrate, startPosition).then(function(playbackInfoResult) {
                return validatePlaybackInfoResult(playbackInfoResult) ? getOptimalMediaSource(apiClient, item, playbackInfoResult.MediaSources).then(function(mediaSource) {
                    return mediaSource ? mediaSource.RequiresOpening ? getLiveStream(apiClient, item.Id, playbackInfoResult.PlaySessionId, deviceProfile, maxBitrate, startPosition, mediaSource, null, null).then(function(openLiveStreamResult) {
                        return supportsDirectPlay(apiClient, item, openLiveStreamResult.MediaSource).then(function(result) {
                            return openLiveStreamResult.MediaSource.enableDirectPlay = result, openLiveStreamResult.MediaSource
                        })
                    }) : mediaSource : (showPlaybackInfoErrorMessage("NoCompatibleStream"), Promise.reject())
                }) : Promise.reject()
            })
        }

        function getPlaybackInfo(apiClient, itemId, deviceProfile, maxBitrate, startPosition, mediaSource, audioStreamIndex, subtitleStreamIndex, liveStreamId, enableDirectPlay, enableDirectStream, allowVideoStreamCopy, allowAudioStreamCopy) {
            var query = {
                UserId: apiClient.getCurrentUserId(),
                StartTimeTicks: startPosition || 0
            };
            return null != audioStreamIndex && (query.AudioStreamIndex = audioStreamIndex), null != subtitleStreamIndex && (query.SubtitleStreamIndex = subtitleStreamIndex), null != enableDirectPlay && (query.EnableDirectPlay = enableDirectPlay), enableDirectPlay !== !1 && (query.ForceDirectPlayRemoteMediaSource = !0), null != enableDirectStream && (query.EnableDirectStream = enableDirectStream), null != allowVideoStreamCopy && (query.AllowVideoStreamCopy = allowVideoStreamCopy), null != allowAudioStreamCopy && (query.AllowAudioStreamCopy = allowAudioStreamCopy), mediaSource && (query.MediaSourceId = mediaSource.Id), liveStreamId && (query.LiveStreamId = liveStreamId), maxBitrate && (query.MaxStreamingBitrate = maxBitrate), apiClient.getPlaybackInfo(itemId, query, deviceProfile)
        }

        function getOptimalMediaSource(apiClient, item, versions) {
            var promises = versions.map(function(v) {
                return supportsDirectPlay(apiClient, item, v)
            });
            return promises.length ? Promise.all(promises).then(function(results) {
                for (var i = 0, length = versions.length; i < length; i++) versions[i].enableDirectPlay = results[i] || !1;
                var optimalVersion = versions.filter(function(v) {
                    return v.enableDirectPlay
                })[0];
                return optimalVersion || (optimalVersion = versions.filter(function(v) {
                    return v.SupportsDirectStream
                })[0]), optimalVersion = optimalVersion || versions.filter(function(s) {
                    return s.SupportsTranscoding
                })[0], optimalVersion || versions[0]
            }) : Promise.reject()
        }

        function getLiveStream(apiClient, itemId, playSessionId, deviceProfile, maxBitrate, startPosition, mediaSource, audioStreamIndex, subtitleStreamIndex) {
            var postData = {
                    DeviceProfile: deviceProfile,
                    OpenToken: mediaSource.OpenToken
                },
                query = {
                    UserId: apiClient.getCurrentUserId(),
                    StartTimeTicks: startPosition || 0,
                    ItemId: itemId,
                    PlaySessionId: playSessionId
                };
            return maxBitrate && (query.MaxStreamingBitrate = maxBitrate), null != audioStreamIndex && (query.AudioStreamIndex = audioStreamIndex), null != subtitleStreamIndex && (query.SubtitleStreamIndex = subtitleStreamIndex), apiClient.ajax({
                url: apiClient.getUrl("LiveStreams/Open", query),
                type: "POST",
                data: JSON.stringify(postData),
                contentType: "application/json",
                dataType: "json"
            })
        }

        function isHostReachable(mediaSource, apiClient) {
            var url = mediaSource.Path,
                isServerAddress = 0 === url.toLowerCase().replace("https:", "http").indexOf(apiClient.serverAddress().toLowerCase().replace("https:", "http").substring(0, 14));
            return isServerAddress ? Promise.resolve(!0) : mediaSource.IsRemote ? Promise.resolve(!0) : Promise.resolve(!1)
        }

        function supportsDirectPlay(apiClient, item, mediaSource) {
            if (mediaSource.SupportsDirectPlay) {
                if (mediaSource.IsRemote && ("TvChannel" === item.Type || "Trailer" === item.Type) && !apphost.supports("remotemedia")) return Promise.resolve(!1);
                if ("Http" === mediaSource.Protocol && !mediaSource.RequiredHttpHeaders.length) return mediaSource.SupportsDirectStream || mediaSource.SupportsTranscoding ? isHostReachable(mediaSource, apiClient) : Promise.resolve(!0);
                if ("File" === mediaSource.Protocol) return new Promise(function(resolve, reject) {
                    require(["filesystem"], function(filesystem) {
                        var method = "BluRay" === mediaSource.VideoType || "Dvd" === mediaSource.VideoType || "HdDvd" === mediaSource.VideoType ? "directoryExists" : "fileExists";
                        filesystem[method](mediaSource.Path).then(function() {
                            resolve(!0)
                        }, function() {
                            resolve(!1)
                        })
                    })
                })
            }
            return Promise.resolve(!1)
        }

        function validatePlaybackInfoResult(result) {
            return !result.ErrorCode || (showPlaybackInfoErrorMessage(result.ErrorCode), !1)
        }

        function showPlaybackInfoErrorMessage(errorCode, playNextTrack) {
            require(["alert"], function(alert) {
                alert({
                    text: globalize.translate("sharedcomponents#PlaybackError" + errorCode),
                    title: globalize.translate("sharedcomponents#HeaderPlaybackError")
                }).then(function() {
                    playNextTrack && self.nextTrack()
                })
            })
        }

        function normalizePlayOptions(playOptions) {
            playOptions.fullscreen = playOptions.fullscreen !== !1
        }

        function getPlayer(item, playOptions) {
            var serverItem = isServerItem(item);
            return getAutomaticPlayers().filter(function(p) {
                if (p.canPlayMediaType(item.MediaType)) {
                    if (serverItem) return !p.canPlayItem || p.canPlayItem(item, playOptions);
                    if (p.canPlayUrl) return p.canPlayUrl(item.Url)
                }
                return !1
            })[0]
        }

        function getItemsForPlayback(serverId, query) {
            var apiClient = connectionManager.getApiClient(serverId);
            if (query.Ids && 1 === query.Ids.split(",").length) {
                var itemId = query.Ids.split(",");
                return apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(function(item) {
                    return {
                        Items: [item],
                        TotalRecordCount: 1
                    }
                })
            }
            return query.Limit = query.Limit || 100, query.Fields = "MediaSources,Chapters", query.ExcludeLocationTypes = "Virtual", apiClient.getItems(apiClient.getCurrentUserId(), query)
        }

        function findPlaylistIndex(playlistItemId, list) {
            for (var i = 0, length = playlist.length; i < length; i++)
                if (list[i].PlaylistItemId === playlistItemId) return i;
            return -1
        }

        function moveInArray(array, from, to) {
            array.splice(to, 0, array.splice(from, 1)[0])
        }

        function getNextItemInfo(player) {
            var newIndex, playlistLength = playlist.length;
            switch (self.getRepeatMode()) {
                case "RepeatOne":
                    newIndex = self.getCurrentPlaylistIndex(player);
                    break;
                case "RepeatAll":
                    newIndex = self.getCurrentPlaylistIndex(player) + 1, newIndex >= playlistLength && (newIndex = 0);
                    break;
                default:
                    newIndex = self.getCurrentPlaylistIndex(player) + 1
            }
            if (newIndex < 0 || newIndex >= playlistLength) return null;
            var item = playlist[newIndex];
            return item ? {
                item: item,
                index: newIndex
            } : null
        }

        function queue(options, mode, player) {
            if (player = player || currentPlayer, !player) return self.play(options);
            if (!enableLocalPlaylistManagement(player)) return "next" === mode ? player.queueNext(item) : player.queue(item);
            if (options.items) return translateItemsForPlayback(options.items, options).then(function(items) {
                queueAll(items, mode)
            });
            if (!options.serverId) throw new Error("serverId required!");
            return getItemsForPlayback(options.serverId, {
                Ids: options.ids.join(",")
            }).then(function(result) {
                return translateItemsForPlayback(result.Items, options).then(function(items) {
                    queueAll(items, mode)
                })
            })
        }

        function queueAll(items, mode) {
            for (var i = 0, length = items.length; i < length; i++) addUniquePlaylistItemId(items[i]), playlist.push(items[i])
        }

        function onPlaybackStarted(player, playOptions, streamInfo, mediaSource) {
            if (!player) throw new Error("player cannot be null");
            setCurrentPlayerInternal(player);
            var playerData = getPlayerData(player);
            playerData.streamInfo = streamInfo, mediaSource ? (playerData.audioStreamIndex = mediaSource.DefaultAudioStreamIndex, playerData.subtitleStreamIndex = mediaSource.DefaultSubtitleStreamIndex) : (playerData.audioStreamIndex = null, playerData.subtitleStreamIndex = null), playNextAfterEnded = !0;
            var isFirstItem = playOptions.isFirstItem,
                fullscreen = playOptions.fullscreen;
            self.getPlayerState(player).then(function(state) {
                reportPlayback(state, getPlayerData(player).streamInfo.item.ServerId, "reportPlaybackStart"), startProgressInterval(player), state.IsFirstItem = isFirstItem, state.IsFullscreen = fullscreen, events.trigger(player, "playbackstart", [state]), events.trigger(self, "playbackstart", [player, state]), acquireResourceLocks(player, streamInfo.mediaType)
            })
        }

        function acquireResourceLocks(player, mediaType) {
            if (!player) throw new Error("player cannot be null");
            if (player.isLocalPlayer && !player.hasResourceLocks) {
                var playerData = getPlayerData(player);
                playerData.resourceLocks = playerData.resourceLocks || {};
                var locks = playerData.resourceLocks;
                ensureLock(locks, "network"), ensureLock(locks, "wake"), "Video" === mediaType && ensureLock(locks, "screen")
            }
        }

        function ensureLock(locks, resourceType) {
            var prop = resourceType + "Lock",
                existingLock = locks[prop];
            return existingLock ? void existingLock.acquire() : void require(["resourceLockManager"], function(resourceLockManager) {
                resourceLockManager.request(resourceType).then(function(resourceLock) {
                    locks[prop] = resourceLock, resourceLock.acquire()
                }, function() {})
            })
        }

        function releaseResourceLocks(player) {
            if (!player) throw new Error("player cannot be null");
            if (player.isLocalPlayer && !player.hasResourceLocks) {
                var playerData = getPlayerData(player),
                    locks = playerData.resourceLocks || {};
                locks.wakeLock && locks.wakeLock.release(), locks.networkLock && locks.networkLock.release(), locks.screenLock && locks.screenLock.release()
            }
        }

        function enablePlaybackRetryWithTranscoding(streamInfo, errorType) {
            return !!streamInfo && (!("mediadecodeerror" !== errorType && "medianotsupported" !== errorType || "Transcode" === streamInfo.playMethod || !streamInfo.mediaSource.SupportsTranscoding) || !("network" !== errorType || "DirectPlay" !== streamInfo.playMethod || !streamInfo.mediaSource.IsRemote || !streamInfo.mediaSource.SupportsTranscoding))
        }

        function onPlaybackError(e, error) {
            var player = this;
            error = error || {};
            var errorType = error.type;
            console.log("playbackmanager playback error type: " + (errorType || ""));
            var streamInfo = getPlayerData(player).streamInfo;
            if (enablePlaybackRetryWithTranscoding(streamInfo, errorType)) {
                var startTime = getCurrentTicks(player) || streamInfo.playerStartPositionTicks;
                return void changeStream(player, startTime, {
                    EnableDirectPlay: !1,
                    EnableDirectStream: !1,
                    AllowVideoStreamCopy: !1,
                    AllowAudioStreamCopy: !1
                }, !0)
            }
            self.nextTrack(player)
        }

        function onPlaybackStopped(e) {
            var player = this;
            getPlayerData(player).isChangingStream || self.getPlayerState(player).then(function(state) {
                var streamInfo = getPlayerData(player).streamInfo,
                    nextItem = playNextAfterEnded ? getNextItemInfo(player) : null,
                    nextMediaType = nextItem ? nextItem.item.MediaType : null,
                    playbackStopInfo = {
                        player: player,
                        state: state,
                        nextItem: nextItem ? nextItem.item : null,
                        nextMediaType: nextMediaType
                    };
                state.NextMediaType = nextMediaType, isServerItem(streamInfo.item) && (player.supportsProgress === !1 && state.PlayState && !state.PlayState.PositionTicks && (state.PlayState.PositionTicks = streamInfo.item.RunTimeTicks), reportPlayback(state, streamInfo.item.ServerId, "reportPlaybackStopped")), state.NextItem = playbackStopInfo.nextItem, nextItem || (playlist = [], currentPlaylistIndex = -1, currentPlaylistItemId = null), clearProgressInterval(player), events.trigger(player, "playbackstop", [state]), events.trigger(self, "playbackstop", [playbackStopInfo]);
                var newPlayer = nextItem ? getPlayer(nextItem.item, currentPlayOptions) : null;
                newPlayer !== player && (destroyPlayer(player), setCurrentPlayerInternal(null)), nextItem && self.nextTrack()
            })
        }

        function onPlaybackChanging(activePlayer, newPlayer, newItem) {
            return self.getPlayerState(activePlayer).then(function(state) {
                var promise, serverId = getPlayerData(activePlayer).streamInfo.item.ServerId;
                return unbindStopped(activePlayer), promise = activePlayer === newPlayer ? activePlayer.stop(!1, !0) : activePlayer.stop(!0, !0), promise.then(function() {
                    bindStopped(activePlayer), reportPlayback(state, serverId, "reportPlaybackStopped"), clearProgressInterval(activePlayer), events.trigger(self, "playbackstop", [{
                        player: activePlayer,
                        state: state,
                        nextItem: newItem,
                        nextMediaType: newItem.MediaType
                    }])
                })
            })
        }

        function bindStopped(player) {
            enableLocalPlaylistManagement(player) && (events.off(player, "stopped", onPlaybackStopped), events.on(player, "stopped", onPlaybackStopped))
        }

        function onPlaybackPause(e) {
            var player = this;
            sendProgressUpdate(player)
        }

        function onPlaybackUnpause(e) {
            var player = this;
            sendProgressUpdate(player)
        }

        function unbindStopped(player) {
            events.off(player, "stopped", onPlaybackStopped)
        }

        function initLegacyVolumeMethods(player) {
            player.getVolume = function() {
                return player.volume()
            }, player.setVolume = function(val) {
                return player.volume(val)
            }
        }

        function initMediaPlayer(player) {
            players.push(player), players.sort(function(a, b) {
                return (a.priority || 0) - (b.priority || 0)
            }), player.isLocalPlayer !== !1 && (player.isLocalPlayer = !0), player.currentState = {}, player.getVolume && player.setVolume || initLegacyVolumeMethods(player), enableLocalPlaylistManagement(player) && (events.on(player, "error", onPlaybackError), events.on(player, "pause", onPlaybackPause), events.on(player, "unpause", onPlaybackUnpause)), player.isLocalPlayer && bindToFullscreenChange(player), bindStopped(player)
        }

        function startProgressInterval(player) {
            if (!player) throw new Error("player cannot be null");
            clearProgressInterval(player), player.lastProgressReport = 0, getPlayerData(player).currentProgressInterval = setInterval(function() {
                (new Date).getTime() - player.lastProgressReport > 1e4 && sendProgressUpdate(player)
            }, 500)
        }

        function sendProgressUpdate(player) {
            if (!player) throw new Error("player cannot be null");
            player.lastProgressReport = (new Date).getTime(), self.getPlayerState(player).then(function(state) {
                var currentItem = getPlayerData(player).streamInfo.item;
                reportPlayback(state, currentItem.ServerId, "reportPlaybackProgress")
            })
        }

        function reportPlayback(state, serverId, method) {
            if (serverId) {
                var info = Object.assign({}, state.PlayState);
                info.ItemId = state.NowPlayingItem.Id;
                var apiClient = connectionManager.getApiClient(serverId);
                apiClient[method](info)
            }
        }

        function clearProgressInterval(player) {
            if (!player) throw new Error("player cannot be null");
            var playerData = getPlayerData(player);
            playerData.currentProgressInterval && (clearTimeout(playerData.currentProgressInterval), playerData.currentProgressInterval = null)
        }
        var currentPlayer, currentTargetInfo, lastLocalPlayer, currentPlaylistIndex, currentPlaylistItemId, currentPlayOptions, self = this,
            players = [],
            currentPairingId = null,
            repeatMode = "RepeatNone",
            playlist = [],
            playNextAfterEnded = !0,
            playerStates = {};
        self.currentItem = function(player) {
            if (!player) throw new Error("player cannot be null");
            var data = getPlayerData(player);
            return data.streamInfo ? data.streamInfo.item : null;
        }, self.currentMediaSource = function(player) {
            if (!player) throw new Error("player cannot be null");
            var data = getPlayerData(player);
            return data.streamInfo ? data.streamInfo.mediaSource : null
        }, self.beginPlayerUpdates = function(player) {
            player.beginPlayerUpdates && player.beginPlayerUpdates()
        }, self.endPlayerUpdates = function(player) {
            player.endPlayerUpdates && player.endPlayerUpdates()
        }, self.getPlayerInfo = function() {
            var player = currentPlayer;
            if (!player) return null;
            var target = currentTargetInfo || {};
            return {
                name: player.name,
                isLocalPlayer: player.isLocalPlayer,
                id: target.id,
                deviceName: target.deviceName,
                playableMediaTypes: target.playableMediaTypes,
                supportedCommands: target.supportedCommands
            }
        }, self.setActivePlayer = function(player, targetInfo) {
            if ("localplayer" === player || "localplayer" === player.name) {
                if (currentPlayer && currentPlayer.isLocalPlayer) return;
                return void setCurrentPlayerInternal(null, null)
            }
            if ("string" == typeof player && (player = players.filter(function(p) {
                    return p.name === player
                })[0]), !player) throw new Error("null player");
            setCurrentPlayerInternal(player, targetInfo)
        }, self.trySetActivePlayer = function(player, targetInfo) {
            if ("localplayer" === player || "localplayer" === player.name) return void(currentPlayer && currentPlayer.isLocalPlayer);
            if ("string" == typeof player && (player = players.filter(function(p) {
                    return p.name === player
                })[0]), !player) throw new Error("null player");
            if (currentPairingId !== targetInfo.id) {
                currentPairingId = targetInfo.id;
                var promise = player.tryPair ? player.tryPair(targetInfo) : Promise.resolve();
                promise.then(function() {
                    setCurrentPlayerInternal(player, targetInfo)
                }, function() {
                    currentPairingId === targetInfo.id && (currentPairingId = null)
                })
            }
        }, self.trySetActiveDeviceName = function(name) {
            function normalizeName(t) {
                return t.toLowerCase().replace(" ", "")
            }
            name = normalizeName(name), self.getTargets().then(function(result) {
                var target = result.filter(function(p) {
                    return normalizeName(p.name) === name
                })[0];
                target && self.trySetActivePlayer(target.playerName, target)
            })
        }, self.setDefaultPlayerActive = function() {
            self.setActivePlayer("localplayer")
        }, self.removeActivePlayer = function(name) {
            var playerInfo = self.getPlayerInfo();
            playerInfo && playerInfo.name === name && self.setDefaultPlayerActive()
        }, self.removeActiveTarget = function(id) {
            var playerInfo = self.getPlayerInfo();
            playerInfo && playerInfo.id === id && self.setDefaultPlayerActive()
        }, self.disconnectFromPlayer = function() {
            var playerInfo = self.getPlayerInfo();
            playerInfo && (playerInfo.supportedCommands.indexOf("EndSession") !== -1 ? require(["dialog"], function(dialog) {
                var menuItems = [];
                menuItems.push({
                    name: globalize.translate("ButtonYes"),
                    id: "yes"
                }), menuItems.push({
                    name: globalize.translate("ButtonNo"),
                    id: "no"
                }), dialog({
                    buttons: menuItems,
                    text: globalize.translate("ConfirmEndPlayerSession")
                }).then(function(id) {
                    switch (id) {
                        case "yes":
                            self.getCurrentPlayer().endSession(), self.setDefaultPlayerActive();
                            break;
                        case "no":
                            self.setDefaultPlayerActive()
                    }
                })
            }) : self.setDefaultPlayerActive())
        }, self.getTargets = function() {
            var promises = players.filter(function(p) {
                return !displayPlayerInLocalGroup(p)
            }).map(getPlayerTargets);
            return Promise.all(promises).then(function(responses) {
                var targets = [];
                targets.push({
                    name: globalize.translate("sharedcomponents#HeaderMyDevice"),
                    id: "localplayer",
                    playerName: "localplayer",
                    playableMediaTypes: ["Audio", "Video", "Game"],
                    isLocalPlayer: !0,
                    supportedCommands: getSupportedCommands({
                        isLocalPlayer: !0
                    })
                });
                for (var i = 0; i < responses.length; i++)
                    for (var subTargets = responses[i], j = 0; j < subTargets.length; j++) targets.push(subTargets[j]);
                return targets = targets.sort(function(a, b) {
                    var aVal = a.isLocalPlayer ? 0 : 1,
                        bVal = b.isLocalPlayer ? 0 : 1;
                    return aVal = aVal.toString() + a.name, bVal = bVal.toString() + b.name, aVal.localeCompare(bVal)
                })
            })
        }, self.displayContent = function(options, player) {
            player = player || currentPlayer, player && player.displayContent && player.displayContent(options)
        }, self.sendCommand = function(cmd, player) {
            switch (console.log("MediaController received command: " + cmd.Name), cmd.Name) {
                case "SetRepeatMode":
                    self.setRepeatMode(cmd.Arguments.RepeatMode, player);
                    break;
                case "VolumeUp":
                    self.volumeUp(player);
                    break;
                case "VolumeDown":
                    self.volumeDown(player);
                    break;
                case "Mute":
                    self.setMute(!0, player);
                    break;
                case "Unmute":
                    self.setMute(!1, player);
                    break;
                case "ToggleMute":
                    self.toggleMute(player);
                    break;
                case "SetVolume":
                    self.setVolume(cmd.Arguments.Volume, player);
                    break;
                case "SetAspectRatio":
                    self.setAspectRatio(cmd.Arguments.AspectRatio, player);
                    break;
                case "SetBrightness":
                    self.setBrightness(cmd.Arguments.Brightness, player);
                    break;
                case "SetAudioStreamIndex":
                    self.setAudioStreamIndex(parseInt(cmd.Arguments.Index), player);
                    break;
                case "SetSubtitleStreamIndex":
                    self.setSubtitleStreamIndex(parseInt(cmd.Arguments.Index), player);
                    break;
                case "SetMaxStreamingBitrate":
                    break;
                case "ToggleFullscreen":
                    self.toggleFullscreen(player);
                    break;
                default:
                    player.sendCommand && player.sendCommand(cmd)
            }
        }, self.audioTracks = function(player) {
            var mediaSource = self.currentMediaSource(player),
                mediaStreams = (mediaSource || {}).MediaStreams || [];
            return mediaStreams.filter(function(s) {
                return "Audio" === s.Type
            })
        }, self.subtitleTracks = function(player) {
            var mediaSource = self.currentMediaSource(player),
                mediaStreams = (mediaSource || {}).MediaStreams || [];
            return mediaStreams.filter(function(s) {
                return "Subtitle" === s.Type
            })
        }, self.getPlaylist = function(player) {
            return player = player || currentPlayer, player && !enableLocalPlaylistManagement(player) ? player.getPlaylist() : Promise.resolve(playlist.slice(0))
        }, self.getCurrentPlayer = function() {
            return currentPlayer
        }, self.isPlaying = function(player) {
            return player = player || currentPlayer, player && !enableLocalPlaylistManagement(player) ? player.isPlaying() : null != player && null != player.currentSrc()
        }, self.isPlayingLocally = function(mediaTypes, player) {
            if (player = player || currentPlayer, !player || !player.isLocalPlayer) return !1;
            var playerData = getPlayerData(player) || {};
            return mediaTypes.indexOf((playerData.streamInfo || {}).mediaType || "") !== -1
        }, self.isPlayingVideo = function(player) {
            if (player = player || currentPlayer, player && !enableLocalPlaylistManagement(player)) return player.isPlayingVideo();
            if (self.isPlaying()) {
                var playerData = getPlayerData(player);
                return "Video" === playerData.streamInfo.mediaType
            }
            return !1
        }, self.isPlayingAudio = function(player) {
            if (player = player || currentPlayer, player && !enableLocalPlaylistManagement(player)) return player.isPlayingAudio();
            if (self.isPlaying()) {
                var playerData = getPlayerData(player);
                return "Audio" === playerData.streamInfo.mediaType
            }
            return !1
        }, self.getPlayers = function() {
            return players
        }, self.canPlay = function(item) {
            var itemType = item.Type,
                locationType = item.LocationType;
            return "MusicGenre" === itemType || "Season" === itemType || "Series" === itemType || "BoxSet" === itemType || "MusicAlbum" === itemType || "MusicArtist" === itemType || "Playlist" === itemType || ("Virtual" !== locationType || "Program" === itemType) && (("Program" !== itemType || !((new Date).getTime() > datetime.parseISO8601Date(item.EndDate).getTime() || (new Date).getTime() < datetime.parseISO8601Date(item.StartDate).getTime())) && null != getPlayer(item, {}))
        }, self.canQueue = function(item) {
            return "MusicAlbum" === item.Type || "MusicArtist" === item.Type || "MusicGenre" === item.Type ? self.canQueueMediaType("Audio") : self.canQueueMediaType(item.MediaType)
        }, self.canQueueMediaType = function(mediaType) {
            return !!currentPlayer && currentPlayer.canPlayMediaType(mediaType)
        }, self.isMuted = function(player) {
            return player = player || currentPlayer, !!player && player.isMuted()
        }, self.setMute = function(mute, player) {
            player = player || currentPlayer, player && player.setMute(mute)
        }, self.toggleMute = function(mute, player) {
            player = player || currentPlayer, player && (player.toggleMute ? player.toggleMute() : player.setMute(!player.isMuted()))
        }, self.toggleAspectRatio = function(player) {
            if (player = player || currentPlayer) {
                for (var current = self.getAspectRatio(player), supported = self.getSupportedAspectRatios(player), index = -1, i = 0, length = supported.length; i < length; i++)
                    if (supported[i].id === current) {
                        index = i;
                        break
                    }
                index++, index >= supported.length && (index = 0), self.setAspectRatio(supported[index].id, player)
            }
        }, self.setAspectRatio = function(val, player) {
            player = player || currentPlayer, player && player.setAspectRatio && player.setAspectRatio(val)
        }, self.getSupportedAspectRatios = function(player) {
            return player = player || currentPlayer, player && player.getSupportedAspectRatios ? player.getSupportedAspectRatios() : []
        }, self.getAspectRatio = function(player) {
            if (player = player || currentPlayer, player && player.getAspectRatio) return player.getAspectRatio()
        };
        var brightnessOsdLoaded;
        self.setBrightness = function(val, player) {
            player = player || currentPlayer, player && (brightnessOsdLoaded || (brightnessOsdLoaded = !0, require(["brightnessOsd"])), player.setBrightness(val))
        }, self.getBrightness = function(player) {
            if (player = player || currentPlayer) return player.getBrightness()
        }, self.setVolume = function(val, player) {
            player = player || currentPlayer, player && player.setVolume(val)
        }, self.getVolume = function(player) {
            if (player = player || currentPlayer) return player.getVolume()
        }, self.volumeUp = function(player) {
            player = player || currentPlayer, player && player.volumeUp()
        }, self.volumeDown = function(player) {
            player = player || currentPlayer, player && player.volumeDown()
        }, self.getAudioStreamIndex = function(player) {
            return player = player || currentPlayer, player && !enableLocalPlaylistManagement(player) ? player.getAudioStreamIndex() : getPlayerData(player).audioStreamIndex
        }, self.setAudioStreamIndex = function(index, player) {
            return player = player || currentPlayer, player && !enableLocalPlaylistManagement(player) ? player.setAudioStreamIndex(index) : void("Transcode" !== getPlayerData(player).streamInfo.playMethod && player.canSetAudioStreamIndex() ? (player.setAudioStreamIndex(index), getPlayerData(player).audioStreamIndex = index) : (changeStream(player, getCurrentTicks(player), {
                AudioStreamIndex: index
            }), getPlayerData(player).audioStreamIndex = index))
        }, self.getMaxStreamingBitrate = function(player) {
            return player = player || currentPlayer, player && !enableLocalPlaylistManagement(player) ? player.getMaxStreamingBitrate() : getPlayerData(player).maxStreamingBitrate || appSettings.maxStreamingBitrate()
        }, self.enableAutomaticBitrateDetection = function(player) {
            return player = player || currentPlayer, player && !enableLocalPlaylistManagement(player) ? player.enableAutomaticBitrateDetection() : appSettings.enableAutomaticBitrateDetection()
        }, self.setMaxStreamingBitrate = function(options, player) {
            if (player = player || currentPlayer, player && !enableLocalPlaylistManagement(player)) return player.setMaxStreamingBitrate(options);
            var promise;
            options.enableAutomaticBitrateDetection ? (appSettings.enableAutomaticBitrateDetection(!0), promise = connectionManager.getApiClient(self.currentItem(player).ServerId).detectBitrate(!0)) : (appSettings.enableAutomaticBitrateDetection(!1), promise = Promise.resolve(options.maxBitrate)), promise.then(function(bitrate) {
                appSettings.maxStreamingBitrate(bitrate), changeStream(player, getCurrentTicks(player), {
                    MaxStreamingBitrate: bitrate
                })
            })
        }, self.isFullscreen = function(player) {
            return player = player || currentPlayer, !player.isLocalPlayer || player.isFullscreen ? player.isFullscreen() : fullscreenManager.isFullScreen()
        }, self.toggleFullscreen = function(player) {
            return player = player || currentPlayer, !player.isLocalPlayer || player.toggleFulscreen ? player.toggleFulscreen() : void(fullscreenManager.isFullScreen() ? fullscreenManager.exitFullscreen() : fullscreenManager.requestFullscreen())
        }, self.togglePictureInPicture = function(player) {
            return player = player || currentPlayer, player.togglePictureInPicture()
        }, self.getSubtitleStreamIndex = function(player) {
            if (player = player || currentPlayer, player && !enableLocalPlaylistManagement(player)) return player.getSubtitleStreamIndex();
            if (!player) throw new Error("player cannot be null");
            return getPlayerData(player).subtitleStreamIndex
        }, self.setSubtitleStreamIndex = function(index, player) {
            if (player = player || currentPlayer, player && !enableLocalPlaylistManagement(player)) return player.setSubtitleStreamIndex(index);
            var currentStream = getCurrentSubtitleStream(player),
                newStream = getSubtitleStream(player, index);
            if (currentStream || newStream) {
                var selectedTrackElementIndex = -1,
                    currentPlayMethod = (getPlayerData(player).streamInfo || {}).playMethod;
                currentStream && !newStream ? ("Encode" === currentStream.DeliveryMethod || "Embed" === currentStream.DeliveryMethod && "Transcode" === currentPlayMethod) && changeStream(player, getCurrentTicks(player), {
                    SubtitleStreamIndex: -1
                }) : !currentStream && newStream ? "External" === newStream.DeliveryMethod ? selectedTrackElementIndex = index : "Embed" === newStream.DeliveryMethod && "Transcode" !== currentPlayMethod ? selectedTrackElementIndex = index : changeStream(player, getCurrentTicks(player), {
                    SubtitleStreamIndex: index
                }) : currentStream && newStream && ("External" === newStream.DeliveryMethod || "Embed" === newStream.DeliveryMethod && "Transcode" !== currentPlayMethod ? (selectedTrackElementIndex = index, "External" !== currentStream.DeliveryMethod && "Embed" !== currentStream.DeliveryMethod && changeStream(player, getCurrentTicks(player), {
                    SubtitleStreamIndex: -1
                })) : changeStream(player, getCurrentTicks(player), {
                    SubtitleStreamIndex: index
                })), player.setSubtitleStreamIndex(selectedTrackElementIndex), getPlayerData(player).subtitleStreamIndex = index
            }
        }, self.toggleDisplayMirroring = function() {
            self.enableDisplayMirroring(!self.enableDisplayMirroring())
        }, self.enableDisplayMirroring = function(enabled) {
            if (null != enabled) {
                var val = enabled ? "1" : "0";
                return void appSettings.set("displaymirror", val)
            }
            return "0" !== (appSettings.get("displaymirror") || "")
        }, self.stop = function(player) {
            return player = player || currentPlayer, player ? (playNextAfterEnded = !1, player.stop(!0, !0)) : Promise.resolve()
        }, self.playPause = function(player) {
            if (player = player || currentPlayer) return player.playPause ? player.playPause() : player.paused() ? self.unpause(player) : self.pause(player)
        }, self.paused = function(player) {
            if (player = player || currentPlayer) return player.paused()
        }, self.pause = function(player) {
            player = player || currentPlayer, player && player.pause()
        }, self.unpause = function(player) {
            player = player || currentPlayer, player && player.unpause()
        }, self.seek = function(ticks, player) {
            return ticks = Math.max(0, ticks), player = player || currentPlayer, player && !enableLocalPlaylistManagement(player) ? player.seek(ticks) : void changeStream(player, ticks)
        }, self.nextChapter = function(player) {
            player = player || currentPlayer;
            var item = self.currentItem(player),
                ticks = getCurrentTicks(player),
                nextChapter = (item.Chapters || []).filter(function(i) {
                    return i.StartPositionTicks > ticks
                })[0];
            nextChapter ? self.seek(nextChapter.StartPositionTicks, player) : self.nextTrack(player)
        }, self.previousChapter = function(player) {
            player = player || currentPlayer;
            var item = self.currentItem(player),
                ticks = getCurrentTicks(player);
            ticks -= 1e8, 0 === self.getCurrentPlaylistIndex(player) && (ticks = Math.max(ticks, 0));
            var previousChapters = (item.Chapters || []).filter(function(i) {
                return i.StartPositionTicks <= ticks
            });
            previousChapters.length ? self.seek(previousChapters[previousChapters.length - 1].StartPositionTicks, player) : self.previousTrack(player)
        }, self.fastForward = function(player) {
            if (player = player || currentPlayer, null != player.fastForward) return void player.fastForward(userSettings.skipForwardLength());
            var ticks = getCurrentTicks(player);
            ticks += 1e4 * userSettings.skipForwardLength();
            var runTimeTicks = self.duration(player) || 0;
            ticks < runTimeTicks && self.seek(ticks)
        }, self.rewind = function(player) {
            if (player = player || currentPlayer, null != player.rewind) return void player.rewind(userSettings.skipBackLength());
            var ticks = getCurrentTicks(player);
            ticks -= 1e4 * userSettings.skipBackLength(), self.seek(Math.max(0, ticks))
        }, self.seekPercent = function(percent, player) {
            var ticks = self.duration(player) || 0;
            percent /= 100, ticks *= percent, self.seek(parseInt(ticks), player)
        }, self.playTrailers = function(item) {
            var apiClient = connectionManager.getApiClient(item.ServerId);
            if (item.LocalTrailerCount) return apiClient.getLocalTrailers(apiClient.getCurrentUserId(), item.Id).then(function(result) {
                return self.play({
                    items: result
                })
            });
            var remoteTrailers = item.RemoteTrailers || [];
            return remoteTrailers.length ? self.play({
                items: remoteTrailers.map(function(t) {
                    return {
                        Name: t.Name || item.Name + " Trailer",
                        Url: t.Url,
                        MediaType: "Video",
                        Type: "Trailer",
                        ServerId: apiClient.serverId()
                    }
                })
            }) : Promise.reject()
        }, self.play = function(options) {
            if (normalizePlayOptions(options), currentPlayer) {
                if (options.enableRemotePlayers === !1 && !currentPlayer.isLocalPlayer) return Promise.reject();
                if (!enableLocalPlaylistManagement(currentPlayer)) return currentPlayer.play(options)
            }
            if (options.fullscreen && loading.show(), options.items) return translateItemsForPlayback(options.items, options).then(function(items) {
                return playWithIntros(items, options)
            });
            if (!options.serverId) throw new Error("serverId required!");
            return getItemsForPlayback(options.serverId, {
                Ids: options.ids.join(",")
            }).then(function(result) {
                return translateItemsForPlayback(result.Items, options).then(function(items) {
                    return playWithIntros(items, options)
                })
            })
        }, self.instantMix = function(item, player) {
            if (player = player || currentPlayer, player && !enableLocalPlaylistManagement(player)) return player.instantMix(item);
            var apiClient = connectionManager.getApiClient(item.ServerId),
                options = {};
            options.UserId = apiClient.getCurrentUserId(), options.Fields = "MediaSources", apiClient.getInstantMixFromItem(item.Id, options).then(function(result) {
                self.play({
                    items: result.Items
                })
            })
        }, self.shuffle = function(shuffleItem, player) {
            if (player = player || currentPlayer, player && !enableLocalPlaylistManagement(player)) return player.shuffle(shuffleItem);
            var apiClient = connectionManager.getApiClient(shuffleItem.ServerId);
            apiClient.getItem(apiClient.getCurrentUserId(), shuffleItem.Id).then(function(item) {
                var query = {
                    Fields: "MediaSources,Chapters",
                    Limit: 100,
                    Filters: "IsNotFolder",
                    Recursive: !0,
                    SortBy: "Random"
                };
                if ("MusicArtist" === item.Type) query.MediaTypes = "Audio", query.ArtistIds = item.Id;
                else if ("MusicGenre" === item.Type) query.MediaTypes = "Audio", query.Genres = item.Name;
                else {
                    if (!item.IsFolder) return;
                    query.ParentId = item.Id
                }
                getItemsForPlayback(item.ServerId, query).then(function(result) {
                    self.play({
                        items: result.Items
                    })
                })
            })
        }, self.getPlayerState = function(player) {
            if (player = player || currentPlayer, !player) throw new Error("player cannot be null");
            if (!enableLocalPlaylistManagement(player)) return player.getPlayerState();
            var playerData = getPlayerData(player),
                streamInfo = playerData.streamInfo,
                item = streamInfo ? streamInfo.item : null,
                mediaSource = streamInfo ? streamInfo.mediaSource : null,
                state = {
                    PlayState: {}
                };
            return player && (state.PlayState.VolumeLevel = player.getVolume(), state.PlayState.IsMuted = player.isMuted(), state.PlayState.IsPaused = player.paused(), state.PlayState.RepeatMode = self.getRepeatMode(player), state.PlayState.MaxStreamingBitrate = self.getMaxStreamingBitrate(player), streamInfo && (state.PlayState.PositionTicks = getCurrentTicks(player), state.PlayState.SubtitleStreamIndex = playerData.subtitleStreamIndex, state.PlayState.AudioStreamIndex = playerData.audioStreamIndex, state.PlayState.PlayMethod = playerData.streamInfo.playMethod, mediaSource && (state.PlayState.LiveStreamId = mediaSource.LiveStreamId), state.PlayState.PlaySessionId = playerData.streamInfo.playSessionId)), mediaSource && (state.PlayState.MediaSourceId = mediaSource.Id, state.NowPlayingItem = {
                RunTimeTicks: mediaSource.RunTimeTicks
            }, state.PlayState.CanSeek = (mediaSource.RunTimeTicks || 0) > 0 || canPlayerSeek(player)), item && (state.NowPlayingItem = getNowPlayingItemForReporting(player, item, mediaSource)), state.MediaSource = mediaSource, Promise.resolve(state)
        }, self.currentTime = function(player) {
            return player = player || currentPlayer, player && !enableLocalPlaylistManagement(player) ? player.currentTime() : getCurrentTicks(player)
        }, self.duration = function(player) {
            if (player = player || currentPlayer, player && !enableLocalPlaylistManagement(player)) return player.duration();
            if (!player) throw new Error("player cannot be null");
            var streamInfo = getPlayerData(player).streamInfo;
            if (streamInfo && streamInfo.mediaSource && streamInfo.mediaSource.RunTimeTicks) return streamInfo.mediaSource.RunTimeTicks;
            var playerDuration = player.duration();
            return playerDuration && (playerDuration *= 1e4), playerDuration
        };
        var currentId = 0;
        self.getSubtitleUrl = function(textStream, serverId) {
            var apiClient = connectionManager.getApiClient(serverId),
                textStreamUrl = textStream.IsExternalUrl ? textStream.DeliveryUrl : apiClient.getUrl(textStream.DeliveryUrl);
            return textStreamUrl
        }, self.setCurrentPlaylistItem = function(playlistItemId, player) {
            if (player = player || currentPlayer, player && !enableLocalPlaylistManagement(player)) return player.setCurrentPlaylistItem(playlistItemId);
            for (var newItem, newItemIndex, i = 0, length = playlist.length; i < length; i++)
                if (playlist[i].PlaylistItemId === playlistItemId) {
                    newItem = playlist[i], newItemIndex = i;
                    break
                }
            if (newItem) {
                var playOptions = Object.assign({}, currentPlayOptions, {
                    startPositionTicks: 0
                });
                playInternal(newItem, playOptions, function() {
                    setPlaylistState(newItem.PlaylistItemId, newItemIndex)
                })
            }
        }, self.removeFromPlaylist = function(playlistItemIds, player) {
            if (!playlistItemIds) throw new Error("Invalid playlistItemIds");
            if (player = player || currentPlayer, player && !enableLocalPlaylistManagement(player)) return player.removeFromPlaylist(playlistItemIds);
            if (playlist.length <= playlistItemIds.length) return self.stop();
            var currentPlaylistItemId = self.currentItem(player).PlaylistItemId,
                isCurrentIndex = playlistItemIds.indexOf(currentPlaylistItemId) !== -1;
            return playlist = playlist.filter(function(item) {
                return playlistItemIds.indexOf(item.PlaylistItemId) === -1
            }), events.trigger(player, "playlistitemremove", [{
                playlistItemIds: playlistItemIds
            }]), isCurrentIndex ? self.setCurrentPlaylistItem(0, player) : Promise.resolve()
        }, self.movePlaylistItem = function(playlistItemId, newIndex, player) {
            if (player = player || currentPlayer, player && !enableLocalPlaylistManagement(player)) return player.movePlaylistItem(playlistItemId, newIndex);
            for (var oldIndex, i = 0, length = playlist.length; i < length; i++)
                if (playlist[i].PlaylistItemId === playlistItemId) {
                    oldIndex = i;
                    break
                }
            if (oldIndex !== -1 && oldIndex !== newIndex) {
                if (newIndex >= playlist.length) throw new Error("newIndex out of bounds");
                moveInArray(playlist, oldIndex, newIndex), events.trigger(player, "playlistitemmove", [{
                    playlistItemId: playlistItemId,
                    newIndex: newIndex
                }])
            }
        }, self.getCurrentPlaylistIndex = function(i, player) {
            return player = player || currentPlayer, player && !enableLocalPlaylistManagement(player) ? player.getCurrentPlaylistIndex() : findPlaylistIndex(currentPlaylistItemId, playlist)
        }, self.getCurrentPlaylistItemId = function(i, player) {
            return player = player || currentPlayer, player && !enableLocalPlaylistManagement(player) ? player.getCurrentPlaylistItemId() : currentPlaylistItemId
        }, self.setRepeatMode = function(value, player) {
            return player = player || currentPlayer, player && !enableLocalPlaylistManagement(player) ? player.setRepeatMode(value) : (repeatMode = value, void events.trigger(player, "repeatmodechange"))
        }, self.getRepeatMode = function(player) {
            return player = player || currentPlayer, player && !enableLocalPlaylistManagement(player) ? player.getRepeatMode() : repeatMode
        }, self.nextTrack = function(player) {
            if (player = player || currentPlayer, player && !enableLocalPlaylistManagement(player)) return player.nextTrack();
            var newItemInfo = getNextItemInfo(player);
            if (newItemInfo) {
                console.log("playing next track");
                var playOptions = Object.assign({}, currentPlayOptions, {
                    startPositionTicks: 0
                });
                playInternal(newItemInfo.item, playOptions, function() {
                    setPlaylistState(newItemInfo.item.PlaylistItemId, newItemInfo.index)
                })
            }
        }, self.previousTrack = function(player) {
            if (player = player || currentPlayer, player && !enableLocalPlaylistManagement(player)) return player.previousTrack();
            var newIndex = self.getCurrentPlaylistIndex(player) - 1;
            if (newIndex >= 0) {
                var newItem = playlist[newIndex];
                if (newItem) {
                    var playOptions = Object.assign({}, currentPlayOptions, {
                        startPositionTicks: 0
                    });
                    playInternal(newItem, playOptions, function() {
                        setPlaylistState(newItem.PlaylistItemId, newIndex)
                    })
                }
            }
        }, self.queue = function(options, player) {
            queue(options, "", player)
        }, self.queueNext = function(options, player) {
            queue(options, "next", player)
        }, events.on(pluginManager, "registered", function(e, plugin) {
            "mediaplayer" === plugin.type && initMediaPlayer(plugin)
        }), pluginManager.ofType("mediaplayer").map(initMediaPlayer), window.addEventListener("beforeunload", function(e) {
            var player = currentPlayer;
            player && getPlayerData(player).currentProgressInterval && (playNextAfterEnded = !1, onPlaybackStopped.call(player))
        }), events.on(serverNotifications, "ServerShuttingDown", function(e, apiClient, data) {
            self.setDefaultPlayerActive()
        }), events.on(serverNotifications, "ServerRestarting", function(e, apiClient, data) {
            self.setDefaultPlayerActive()
        })
    }
    return new PlaybackManager
});