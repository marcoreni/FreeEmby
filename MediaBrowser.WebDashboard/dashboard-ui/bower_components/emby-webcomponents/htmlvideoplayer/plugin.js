define(["browser", "pluginManager", "events", "apphost", "loading", "playbackManager", "embyRouter", "appSettings", "connectionManager", "itemHelper"], function(browser, pluginManager, events, appHost, loading, playbackManager, embyRouter, appSettings, connectionManager, itemHelper) {
    "use strict";
    return function() {
        function getSavedVolume() {
            return appSettings.get("volume") || 1
        }

        function saveVolume(value) {
            value && appSettings.set("volume", value)
        }

        function getDefaultProfile() {
            return new Promise(function(resolve, reject) {
                require(["browserdeviceprofile"], function(profileBuilder) {
                    resolve(profileBuilder({}))
                })
            })
        }

        function updateVideoUrl(streamInfo) {
            var isHls = streamInfo.url.toLowerCase().indexOf(".m3u8") !== -1,
                mediaSource = streamInfo.mediaSource,
                item = streamInfo.item;
            if (mediaSource && item && !mediaSource.RunTimeTicks && isHls && "Transcode" === streamInfo.playMethod && (browser.iOS || browser.osx)) {
                var hlsPlaylistUrl = streamInfo.url.replace("master.m3u8", "live.m3u8");
                return loading.show(), console.log("prefetching hls playlist: " + hlsPlaylistUrl), connectionManager.getApiClient(item.ServerId).ajax({
                    type: "GET",
                    url: hlsPlaylistUrl
                }).then(function() {
                    return console.log("completed prefetching hls playlist: " + hlsPlaylistUrl), loading.hide(), streamInfo.url = hlsPlaylistUrl, Promise.resolve()
                }, function() {
                    return console.log("error prefetching hls playlist: " + hlsPlaylistUrl), loading.hide(), Promise.resolve()
                })
            }
            return Promise.resolve()
        }

        function getSupportedFeatures() {
            var list = [],
                video = document.createElement("video");
            return browser.ipad && navigator.userAgent.toLowerCase().indexOf("os 9") === -1 && video.webkitSupportsPresentationMode && video.webkitSupportsPresentationMode && "function" == typeof video.webkitSetPresentationMode && list.push("PictureInPicture"), list.push("SetBrightness"), list
        }

        function getCrossOriginValue(mediaSource) {
            return mediaSource.IsRemote ? null : "anonymous"
        }

        function requireHlsPlayer(callback) {
            require(["hlsjs"], function(hls) {
                window.Hls = hls, callback()
            })
        }

        function bindEventsToHlsPlayer(hls, elem, resolve, reject) {
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                playWithPromise(elem).then(resolve, function() {
                    reject && (reject(), reject = null)
                })
            }), hls.on(Hls.Events.ERROR, function(event, data) {
                if (console.log("HLS Error: Type: " + data.type + " Details: " + (data.details || "") + " Fatal: " + (data.fatal || !1)), data.fatal) switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        data.response && data.response.code && data.response.code >= 400 && data.response.code < 500 ? (console.log("hls.js response error code: " + data.response.code), reject ? (reject(), reject = null) : onErrorInternal("network")) : (console.log("fatal network error encountered, try to recover"), hls.startLoad());
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.log("fatal media error encountered, try to recover");
                        var currentReject = reject;
                        reject = null, handleMediaError(currentReject);
                        break;
                    default:
                        hls.destroy(), reject ? (reject(), reject = null) : onErrorInternal("mediadecodeerror")
                }
            })
        }

        function setCurrentSrc(elem, options) {
            elem.removeEventListener("error", onError);
            var val = options.url;
            console.log("playing url: " + val);
            var seconds = (options.playerStartPositionTicks || 0) / 1e7;
            seconds && (val += "#t=" + seconds), destroyHlsPlayer();
            for (var tracks = getMediaStreamTextTracks(options.mediaSource), currentTrackIndex = -1, i = 0, length = tracks.length; i < length; i++)
                if (tracks[i].Index === options.mediaSource.DefaultSubtitleStreamIndex) {
                    currentTrackIndex = tracks[i].Index;
                    break
                }
            subtitleTrackIndexToSetOnPlaying = currentTrackIndex, currentPlayOptions = options;
            var crossOrigin = getCrossOriginValue(options.mediaSource);
            if (crossOrigin && (elem.crossOrigin = crossOrigin), enableHlsPlayer(val, options.item, options.mediaSource)) return setTracks(elem, tracks, options.mediaSource, options.item.ServerId), new Promise(function(resolve, reject) {
                requireHlsPlayer(function() {
                    var hls = new Hls({
                        manifestLoadingTimeOut: 2e4
                    });
                    hls.loadSource(val), hls.attachMedia(elem), bindEventsToHlsPlayer(hls, elem, resolve, reject), hlsPlayer = hls, currentSrc = val, setCurrentTrackElement(currentTrackIndex)
                })
            });
            elem.autoplay = !0;
            var mimeType = options.mimeType;
            return mimeType && browser.operaTv ? (browser.chrome && "video/x-matroska" === mimeType && (mimeType = "video/webm"), elem.currentSrc && (elem.src = "", elem.removeAttribute("src")), elem.innerHTML = '<source src="' + val + '" type="' + mimeType + '">' + getTracksHtml(tracks, options.mediaSource, options.item.ServerId), elem.addEventListener("loadedmetadata", onLoadedMetadata), currentSrc = val, setCurrentTrackElement(currentTrackIndex), playWithPromise(elem)) : applySrc(elem, val, options).then(function() {
                return setTracks(elem, tracks, options.mediaSource, options.item.ServerId), currentSrc = val, setCurrentTrackElement(currentTrackIndex), playWithPromise(elem)
            })
        }

        function handleMediaError(reject) {
            if (hlsPlayer) {
                var now = Date.now();
                window.performance && window.performance.now && (now = performance.now()), !recoverDecodingErrorDate || now - recoverDecodingErrorDate > 3e3 ? (recoverDecodingErrorDate = now, console.log("try to recover media Error ..."), hlsPlayer.recoverMediaError()) : !recoverSwapAudioCodecDate || now - recoverSwapAudioCodecDate > 3e3 ? (recoverSwapAudioCodecDate = now, console.log("try to swap Audio Codec and recover media Error ..."), hlsPlayer.swapAudioCodec(), hlsPlayer.recoverMediaError()) : (console.error("cannot recover, last media error recovery failed ..."), reject ? reject() : onErrorInternal("mediadecodeerror"))
            }
        }

        function applySrc(elem, src, options) {
            return window.Windows && options.mediaSource && options.mediaSource.IsLocal ? Windows.Storage.StorageFile.getFileFromPathAsync(options.url).then(function(file) {
                var playlist = new Windows.Media.Playback.MediaPlaybackList,
                    source1 = Windows.Media.Core.MediaSource.createFromStorageFile(file),
                    startTime = (options.playerStartPositionTicks || 0) / 1e4;
                return playlist.items.append(new Windows.Media.Playback.MediaPlaybackItem(source1, startTime)), elem.src = URL.createObjectURL(playlist, {
                    oneTimeOnly: !0
                }), Promise.resolve()
            }) : (elem.src = src, Promise.resolve())
        }

        function onSuccessfulPlay(elem) {
            elem.addEventListener("error", onError)
        }

        function playWithPromise(elem) {
            try {
                var promise = elem.play();
                return promise && promise.then ? promise.catch(function(e) {
                    var errorName = (e.name || "").toLowerCase();
                    return "notallowederror" === errorName || "aborterror" === errorName ? (onSuccessfulPlay(elem), Promise.resolve()) : Promise.reject()
                }) : (onSuccessfulPlay(elem), Promise.resolve())
            } catch (err) {
                return console.log("error calling video.play: " + err), Promise.reject()
            }
        }

        function destroyHlsPlayer() {
            var player = hlsPlayer;
            if (player) {
                try {
                    player.destroy()
                } catch (err) {
                    console.log(err)
                }
                hlsPlayer = null
            }
        }

        function onEnded() {
            destroyCustomTrack(this), onEndedInternal(!0, this)
        }

        function onEndedInternal(triggerEnded, elem) {
            if (elem.removeEventListener("error", onError), elem.src = "", elem.innerHTML = "", elem.removeAttribute("src"), destroyHlsPlayer(), self.originalDocumentTitle && (document.title = self.originalDocumentTitle, self.originalDocumentTitle = null), triggerEnded) {
                var stopInfo = {
                    src: currentSrc
                };
                events.trigger(self, "stopped", [stopInfo]), _currentTime = null
            }
            currentSrc = null
        }

        function onTimeUpdate(e) {
            var time = this.currentTime;
            _currentTime = time;
            var timeMs = 1e3 * time;
            timeMs += (currentPlayOptions.transcodingOffsetTicks || 0) / 1e4, updateSubtitleText(timeMs), events.trigger(self, "timeupdate")
        }

        function onVolumeChange() {
            saveVolume(this.volume), events.trigger(self, "volumechange")
        }

        function onNavigatedToOsd() {
            videoDialog.classList.remove("videoPlayerContainer-withBackdrop"), videoDialog.classList.remove("videoPlayerContainer-onTop")
        }

        function onPlaying(e) {
            started ? events.trigger(self, "unpause") : (started = !0, this.removeAttribute("controls"), currentPlayOptions.title ? (self.originalDocumentTitle = document.title, document.title = currentPlayOptions.title) : self.originalDocumentTitle = null, setCurrentTrackElement(subtitleTrackIndexToSetOnPlaying), seekOnPlaybackStart(e.target), currentPlayOptions.fullscreen ? embyRouter.showVideoOsd().then(onNavigatedToOsd) : (embyRouter.setTransparency("backdrop"), videoDialog.classList.remove("videoPlayerContainer-withBackdrop"), videoDialog.classList.remove("videoPlayerContainer-onTop")), loading.hide(), ensureValidVideo(this)), events.trigger(self, "playing")
        }

        function ensureValidVideo(elem) {
            setTimeout(function() {
                if (elem === mediaElement) return 0 === elem.videoWidth && 0 === elem.videoHeight ? void onErrorInternal("mediadecodeerror") : void 0
            }, 100)
        }

        function seekOnPlaybackStart(element) {
            var seconds = (currentPlayOptions.playerStartPositionTicks || 0) / 1e7;
            if (seconds) {
                var src = (self.currentSrc() || "").toLowerCase();
                if (!browser.chrome || src.indexOf(".m3u8") !== -1) {
                    var delay = browser.safari ? 2500 : 0;
                    delay ? setTimeout(function() {
                        element.currentTime = seconds
                    }, delay) : element.currentTime = seconds
                }
            }
        }

        function onClick() {
            events.trigger(self, "click")
        }

        function onDblClick() {
            events.trigger(self, "dblclick")
        }

        function onPause() {
            events.trigger(self, "pause")
        }

        function onError() {
            var errorCode = this.error ? this.error.code || 0 : 0;
            console.log("Media element error code: " + errorCode.toString());
            var type;
            switch (errorCode) {
                case 1:
                    return;
                case 2:
                    type = "network";
                    break;
                case 3:
                    if (hlsPlayer) return void handleMediaError();
                    type = "mediadecodeerror";
                    break;
                case 4:
                    type = "medianotsupported";
                    break;
                default:
                    return
            }
            onErrorInternal(type)
        }

        function onErrorInternal(type) {
            destroyCustomTrack(mediaElement), events.trigger(self, "error", [{
                type: type
            }])
        }

        function onLoadedMetadata(e) {
            var mediaElem = e.target;
            if (mediaElem.removeEventListener("loadedmetadata", onLoadedMetadata), !hlsPlayer) try {
                mediaElem.play()
            } catch (err) {
                console.log("error calling mediaElement.play: " + err)
            }
        }

        function enableHlsPlayer(src, item, mediaSource) {
            if (src && src.indexOf(".m3u8") === -1) return !1;
            if (null == window.MediaSource) return !1;
            if (canPlayNativeHls()) {
                if (browser.edge) return !0;
                if (mediaSource.RunTimeTicks) return !1
            }
            return !(browser.safari && !browser.osx)
        }

        function canPlayNativeHls() {
            var media = document.createElement("video");
            return !(!media.canPlayType("application/x-mpegURL").replace(/no/, "") && !media.canPlayType("application/vnd.apple.mpegURL").replace(/no/, ""))
        }

        function setTracks(elem, tracks, mediaSource, serverId) {
            elem.innerHTML = getTracksHtml(tracks, mediaSource, serverId)
        }

        function getTextTrackUrl(track, serverId) {
            return playbackManager.getSubtitleUrl(track, serverId)
        }

        function getTracksHtml(tracks, mediaSource, serverId) {
            return tracks.map(function(t) {
                var defaultAttribute = mediaSource.DefaultSubtitleStreamIndex === t.Index ? " default" : "",
                    language = t.Language || "und",
                    label = t.Language || "und";
                return '<track id="textTrack' + t.Index + '" label="' + label + '" kind="subtitles" src="' + getTextTrackUrl(t, serverId) + '" srclang="' + language + '"' + defaultAttribute + "></track>"
            }).join("")
        }

        function enableNativeTrackSupport(track) {
            if (browser.firefox && (currentSrc || "").toLowerCase().indexOf(".m3u8") !== -1) return !1;
            if (browser.ps4) return !1;
            if (browser.edge) return !1;
            if (track) {
                var format = (track.Codec || "").toLowerCase();
                if ("ssa" === format || "ass" === format) return !1
            }
            return !0
        }

        function destroyCustomTrack(videoElement) {
            if (window.removeEventListener("resize", onVideoResize), window.removeEventListener("orientationchange", onVideoResize), videoSubtitlesElem) {
                var subtitlesContainer = videoSubtitlesElem.parentNode;
                subtitlesContainer.parentNode.removeChild(subtitlesContainer), videoSubtitlesElem = null
            }
            if (currentTrackEvents = null, videoElement)
                for (var allTracks = videoElement.textTracks || [], i = 0; i < allTracks.length; i++) {
                    var currentTrack = allTracks[i];
                    currentTrack.label.indexOf("manualTrack") !== -1 && (currentTrack.mode = "disabled")
                }
            customTrackIndex = -1, currentClock = null, currentAspectRatio = null;
            var renderer = currentAssRenderer;
            renderer && renderer.setEnabled(!1), currentAssRenderer = null
        }

        function fetchSubtitles(track, serverId) {
            return new Promise(function(resolve, reject) {
                require(["fetchHelper"], function(fetchHelper) {
                    fetchHelper.ajax({
                        url: getTextTrackUrl(track, serverId).replace(".vtt", ".js"),
                        type: "GET",
                        dataType: "json"
                    }).then(resolve, reject)
                })
            })
        }

        function setTrackForCustomDisplay(videoElement, track) {
            if (!track) return void destroyCustomTrack(videoElement);
            if (customTrackIndex !== track.Index) {
                var serverId = currentPlayOptions.item.ServerId;
                destroyCustomTrack(videoElement), customTrackIndex = track.Index, renderTracksEvents(videoElement, track, serverId), lastCustomTrackMs = 0
            }
        }

        function renderWithLibjass(videoElement, track, serverId) {
            var rendererSettings = {};
            require(["libjass"], function(libjass) {
                libjass.ASS.fromUrl(getTextTrackUrl(track, serverId)).then(function(ass) {
                    var clock = new libjass.renderers.ManualClock;
                    currentClock = clock;
                    var renderer = new libjass.renderers.WebRenderer(ass, clock, videoElement.parentNode, rendererSettings);
                    currentAssRenderer = renderer, renderer.addEventListener("ready", function() {
                        try {
                            renderer.resize(videoElement.offsetWidth, videoElement.offsetHeight, 0, 0), window.removeEventListener("resize", onVideoResize), window.addEventListener("resize", onVideoResize), window.removeEventListener("orientationchange", onVideoResize), window.addEventListener("orientationchange", onVideoResize)
                        } catch (ex) {}
                    })
                }, function() {
                    onErrorInternal("mediadecodeerror")
                })
            })
        }

        function onVideoResize() {
            var renderer = currentAssRenderer;
            if (renderer) {
                var videoElement = mediaElement,
                    width = videoElement.offsetWidth,
                    height = videoElement.offsetHeight;
                console.log("videoElement resized: " + width + "x" + height), renderer.resize(width, height, 0, 0)
            }
        }

        function requiresCustomSubtitlesElement() {
            return !!browser.ps4 || !!browser.edge
        }

        function renderSubtitlesWithCustomElement(videoElement, track, serverId) {
            fetchSubtitles(track, serverId).then(function(data) {
                if (!videoSubtitlesElem) {
                    var subtitlesContainer = document.createElement("div");
                    subtitlesContainer.classList.add("videoSubtitles"), subtitlesContainer.innerHTML = '<div class="videoSubtitlesInner"></div>', videoSubtitlesElem = subtitlesContainer.querySelector(".videoSubtitlesInner"), videoElement.parentNode.appendChild(subtitlesContainer), currentTrackEvents = data.TrackEvents
                }
            })
        }

        function renderTracksEvents(videoElement, track, serverId) {
            var format = (track.Codec || "").toLowerCase();
            if ("ssa" === format || "ass" === format) return void renderWithLibjass(videoElement, track, serverId);
            if (requiresCustomSubtitlesElement()) return void renderSubtitlesWithCustomElement(videoElement, track, serverId);
            for (var trackElement = null, expectedId = "manualTrack" + track.Index, allTracks = videoElement.textTracks, i = 0; i < allTracks.length; i++) {
                var currentTrack = allTracks[i];
                if (currentTrack.label === expectedId) {
                    trackElement = currentTrack;
                    break
                }
                currentTrack.mode = "disabled"
            }
            trackElement ? trackElement.mode = "showing" : (trackElement = videoElement.addTextTrack("subtitles", "manualTrack" + track.Index, track.Language || "und"), fetchSubtitles(track, serverId).then(function(data) {
                console.log("downloaded " + data.TrackEvents.length + " track events"), data.TrackEvents.forEach(function(trackEvent) {
                    var trackCueObject = window.VTTCue || window.TextTrackCue,
                        cue = new trackCueObject(trackEvent.StartPositionTicks / 1e7, trackEvent.EndPositionTicks / 1e7, normalizeTrackEventText(trackEvent.Text));
                    trackElement.addCue(cue)
                }), trackElement.mode = "showing"
            }))
        }

        function normalizeTrackEventText(text) {
            return text.replace(/\\N/gi, "\n")
        }

        function updateSubtitleText(timeMs) {
            var clock = currentClock;
            if (clock) try {
                clock.seek(timeMs / 1e3)
            } catch (err) {
                console.log("Error in libjass: " + err)
            } else {
                var trackEvents = currentTrackEvents;
                if (trackEvents && videoSubtitlesElem) {
                    for (var selectedTrackEvent, ticks = 1e4 * timeMs, i = 0; i < trackEvents.length; i++) {
                        var currentTrackEvent = trackEvents[i];
                        if (currentTrackEvent.StartPositionTicks <= ticks && currentTrackEvent.EndPositionTicks >= ticks) {
                            selectedTrackEvent = currentTrackEvent;
                            break
                        }
                    }
                    selectedTrackEvent ? (videoSubtitlesElem.innerHTML = normalizeTrackEventText(selectedTrackEvent.Text), videoSubtitlesElem.classList.remove("hide")) : (videoSubtitlesElem.innerHTML = "", videoSubtitlesElem.classList.add("hide"))
                }
            }
        }

        function getMediaStreamAudioTracks(mediaSource) {
            return mediaSource.MediaStreams.filter(function(s) {
                return "Audio" === s.Type
            })
        }

        function getMediaStreamTextTracks(mediaSource) {
            return mediaSource.MediaStreams.filter(function(s) {
                return "Subtitle" === s.Type && "External" === s.DeliveryMethod
            })
        }

        function setCurrentTrackElement(streamIndex) {
            console.log("Setting new text track index to: " + streamIndex);
            var mediaStreamTextTracks = getMediaStreamTextTracks(currentPlayOptions.mediaSource),
                track = streamIndex === -1 ? null : mediaStreamTextTracks.filter(function(t) {
                    return t.Index === streamIndex
                })[0];
            enableNativeTrackSupport(track) ? setTrackForCustomDisplay(mediaElement, null) : (setTrackForCustomDisplay(mediaElement, track), streamIndex = -1, track = null);
            for (var expectedId = "textTrack" + streamIndex, trackIndex = streamIndex !== -1 && track ? mediaStreamTextTracks.indexOf(track) : -1, modes = ["disabled", "showing", "hidden"], allTracks = mediaElement.textTracks, i = 0; i < allTracks.length; i++) {
                var currentTrack = allTracks[i];
                console.log("currentTrack id: " + currentTrack.id);
                var mode;
                if (console.log("expectedId: " + expectedId + "--currentTrack.Id:" + currentTrack.id), browser.msie || browser.edge) mode = trackIndex === i ? 1 : 0;
                else {
                    if (currentTrack.label.indexOf("manualTrack") !== -1) continue;
                    mode = currentTrack.id === expectedId ? 1 : 0
                }
                console.log("Setting track " + i + " mode to: " + mode);
                var useNumericMode = !1;
                !isNaN(currentTrack.mode), useNumericMode ? currentTrack.mode = mode : currentTrack.mode = modes[mode]
            }
        }

        function zoomIn(elem) {
            var duration = 240;
            return elem.style.animation = "htmlvideoplayer-zoomin " + duration + "ms ease-in normal", new Promise(function(resolve, reject) {
                setTimeout(resolve, duration)
            })
        }

        function createMediaElement(options) {
            return (browser.tv || browser.noAnimation || browser.iOS) && (options.backdropUrl = null), new Promise(function(resolve, reject) {
                var dlg = document.querySelector(".videoPlayerContainer");
                dlg ? (options.backdropUrl && (dlg.classList.add("videoPlayerContainer-withBackdrop"), dlg.style.backgroundImage = "url('" + options.backdropUrl + "')"), resolve(dlg.querySelector("video"))) : require(["css!" + pluginManager.mapPath(self, "style.css")], function() {
                    loading.show();
                    var dlg = document.createElement("div");
                    dlg.classList.add("videoPlayerContainer"), options.backdropUrl && (dlg.classList.add("videoPlayerContainer-withBackdrop"), dlg.style.backgroundImage = "url('" + options.backdropUrl + "')"), options.fullscreen && dlg.classList.add("videoPlayerContainer-onTop");
                    var html = "";
                    html += appHost.supports("htmlvideoautoplay") ? '<video class="htmlvideoplayer" preload="metadata" autoplay="autoplay" webkit-playsinline playsinline>' : '<video class="htmlvideoplayer" preload="metadata" autoplay="autoplay" controls="controls" webkit-playsinline playsinline>', html += "</video>", dlg.innerHTML = html;
                    var videoElement = dlg.querySelector("video");
                    videoElement.volume = getSavedVolume(), videoElement.addEventListener("timeupdate", onTimeUpdate), videoElement.addEventListener("ended", onEnded), videoElement.addEventListener("volumechange", onVolumeChange), videoElement.addEventListener("pause", onPause), videoElement.addEventListener("playing", onPlaying), videoElement.addEventListener("click", onClick), videoElement.addEventListener("dblclick", onDblClick), document.body.insertBefore(dlg, document.body.firstChild), videoDialog = dlg, mediaElement = videoElement, options.fullscreen && browser.supportsCssAnimation() && !browser.slow ? zoomIn(dlg).then(function() {
                        resolve(videoElement)
                    }) : resolve(videoElement)
                })
            })
        }
        var self = this;
        self.name = "Html Video Player", self.type = "mediaplayer", self.id = "htmlvideoplayer", self.priority = 1;
        var mediaElement, videoDialog, currentSrc, hlsPlayer, currentPlayOptions, subtitleTrackIndexToSetOnPlaying, currentClock, currentAssRenderer, currentAspectRatio, videoSubtitlesElem, currentTrackEvents, started = !1,
            lastCustomTrackMs = 0,
            customTrackIndex = -1;
        self.canPlayMediaType = function(mediaType) {
            return "video" === (mediaType || "").toLowerCase()
        }, self.getDeviceProfile = function(item, options) {
            return appHost.getDeviceProfile ? appHost.getDeviceProfile(item, options) : getDefaultProfile()
        }, self.currentSrc = function() {
            return currentSrc
        }, self.play = function(options) {
            return browser.msie && "Transcode" === options.playMethod && !window.MediaSource ? (alert("Playback of this content is not supported in Internet Explorer. For a better experience, try a modern browser such as Microsoft Edge, Google Chrome, Firefox or Opera."), Promise.reject()) : (started = !1, _currentTime = null, createMediaElement(options).then(function(elem) {
                return updateVideoUrl(options, options.mediaSource).then(function() {
                    return setCurrentSrc(elem, options)
                })
            }))
        };
        var supportedFeatures;
        self.supports = function(feature) {
            return supportedFeatures || (supportedFeatures = getSupportedFeatures()), supportedFeatures.indexOf(feature) !== -1
        }, self.setAspectRatio = function(val) {
            var video = mediaElement;
            video && (currentAspectRatio = val)
        }, self.getAspectRatio = function() {
            return currentAspectRatio
        }, self.getSupportedAspectRatios = function() {
            return []
        }, self.togglePictureInPicture = function() {
            return self.setPictureInPictureEnabled(!self.isPictureInPictureEnabled())
        }, self.setPictureInPictureEnabled = function(isEnabled) {
            var video = mediaElement;
            video && video.webkitSupportsPresentationMode && "function" == typeof video.webkitSetPresentationMode && video.webkitSetPresentationMode(isEnabled ? "picture-in-picture" : "inline")
        }, self.isPictureInPictureEnabled = function(isEnabled) {
            var video = mediaElement;
            return !!video && "picture-in-picture" === video.webkitPresentationMode
        };
        var recoverDecodingErrorDate, recoverSwapAudioCodecDate;
        self.setSubtitleStreamIndex = function(index) {
            setCurrentTrackElement(index)
        }, self.canSetAudioStreamIndex = function() {
            return !(!browser.edge && !browser.msie)
        }, self.setAudioStreamIndex = function(index) {
            var i, length, audioStreams = getMediaStreamAudioTracks(currentPlayOptions.mediaSource),
                audioTrackOffset = -1;
            for (i = 0, length = audioStreams.length; i < length; i++)
                if (audioStreams[i].Index === index) {
                    audioTrackOffset = i;
                    break
                }
            if (audioTrackOffset !== -1) {
                var elem = mediaElement;
                if (elem) {
                    var elemAudioTracks = elem.audioTracks || [];
                    for (i = 0, length = elemAudioTracks.length; i < length; i++) audioTrackOffset === i ? elemAudioTracks[i].enabled = !0 : elemAudioTracks[i].enabled = !1
                }
            }
        };
        var _currentTime;
        self.currentTime = function(val) {
            if (mediaElement) return null != val ? void(mediaElement.currentTime = val / 1e3) : _currentTime ? 1e3 * _currentTime : 1e3 * (mediaElement.currentTime || 0)
        }, self.duration = function(val) {
            if (mediaElement) {
                var duration = mediaElement.duration;
                if (duration && !isNaN(duration) && duration !== Number.POSITIVE_INFINITY && duration !== Number.NEGATIVE_INFINITY) return 1e3 * duration
            }
            return null
        }, self.stop = function(destroyPlayer, reportEnded) {
            var elem = mediaElement,
                src = currentSrc;
            return elem && (src && elem.pause(), onEndedInternal(reportEnded, elem), destroyPlayer && self.destroy()), destroyCustomTrack(elem), Promise.resolve()
        }, self.destroy = function() {
            destroyHlsPlayer(), embyRouter.setTransparency("none");
            var videoElement = mediaElement;
            videoElement && (mediaElement = null, destroyCustomTrack(videoElement), videoElement.removeEventListener("timeupdate", onTimeUpdate), videoElement.removeEventListener("ended", onEnded), videoElement.removeEventListener("volumechange", onVolumeChange), videoElement.removeEventListener("pause", onPause), videoElement.removeEventListener("playing", onPlaying), videoElement.removeEventListener("loadedmetadata", onLoadedMetadata), videoElement.removeEventListener("click", onClick), videoElement.removeEventListener("dblclick", onDblClick), videoElement.parentNode.removeChild(videoElement));
            var dlg = videoDialog;
            dlg && (videoDialog = null, dlg.parentNode.removeChild(dlg))
        }, self.pause = function() {
            mediaElement && mediaElement.pause()
        }, self.resume = function() {
            mediaElement && mediaElement.play()
        }, self.unpause = function() {
            mediaElement && mediaElement.play()
        }, self.paused = function() {
            return !!mediaElement && mediaElement.paused
        }, self.setBrightness = function(val) {
            var elem = mediaElement;
            if (elem) {
                val = Math.max(0, val), val = Math.min(100, val);
                var rawValue = val;
                rawValue = Math.max(20, rawValue);
                var cssValue = rawValue >= 100 ? "none" : rawValue / 100;
                elem.style["-webkit-filter"] = "brightness(" + cssValue + ");", elem.style.filter = "brightness(" + cssValue + ")", elem.brightnessValue = val, events.trigger(self, "brightnesschange")
            }
        }, self.getBrightness = function() {
            if (mediaElement) {
                var val = mediaElement.brightnessValue;
                return null == val ? 100 : val
            }
        }, self.setVolume = function(val) {
            mediaElement && (mediaElement.volume = val / 100)
        }, self.getVolume = function() {
            if (mediaElement) return 100 * mediaElement.volume
        }, self.volumeUp = function() {
            self.setVolume(Math.min(self.getVolume() + 2, 100))
        }, self.volumeDown = function() {
            self.setVolume(Math.max(self.getVolume() - 2, 0))
        }, self.setMute = function(mute) {
            mediaElement && (mediaElement.muted = mute)
        }, self.isMuted = function() {
            return !!mediaElement && mediaElement.muted
        }
    }
});