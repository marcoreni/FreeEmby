define(["pluginManager", "events", "browser", "embyRouter"], function(pluginManager, Events, browser, embyRouter) {
    "use strict";
    return function() {
        function setCurrentSrc(elem, options) {
            return new Promise(function(resolve, reject) {
                require(["queryString"], function(queryString) {
                    currentSrc = options.url;
                    var params = queryString.parse(options.url.split("?")[1]);
                    if (window.onYouTubeIframeAPIReady = function() {
                            currentYoutubePlayer = new YT.Player("player", {
                                height: videoDialog.offsetHeight,
                                width: videoDialog.offsetWidth,
                                videoId: params.v,
                                events: {
                                    onReady: onPlayerReady,
                                    onStateChange: function(event) {
                                        event.data === YT.PlayerState.PLAYING ? onPlaying(options, resolve) : event.data === YT.PlayerState.ENDED ? onEnded() : event.data === YT.PlayerState.PAUSED && onPause()
                                    }
                                },
                                playerVars: {
                                    controls: 0,
                                    enablejsapi: 1,
                                    modestbranding: 1,
                                    rel: 0,
                                    showinfo: 0,
                                    fs: 0,
                                    playsinline: 1
                                }
                            }), window.removeEventListener("resize", onVideoResize), window.addEventListener("resize", onVideoResize), window.removeEventListener("orientationChange", onVideoResize), window.addEventListener("orientationChange", onVideoResize)
                        }, window.YT) window.onYouTubeIframeAPIReady();
                    else {
                        var tag = document.createElement("script");
                        tag.src = "https://www.youtube.com/iframe_api";
                        var firstScriptTag = document.getElementsByTagName("script")[0];
                        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
                    }
                })
            })
        }

        function onVideoResize() {
            var player = currentYoutubePlayer,
                dlg = videoDialog;
            player && dlg && player.setSize(dlg.offsetWidth, dlg.offsetHeight)
        }

        function onPlayerReady(event) {
            event.target.playVideo()
        }

        function onEnded() {
            onEndedInternal(!0)
        }

        function clearTimeUpdateInterval() {
            timeUpdateInterval && clearInterval(timeUpdateInterval), timeUpdateInterval = null
        }

        function onEndedInternal(triggerEnded) {
            if (clearTimeUpdateInterval(), window.removeEventListener("resize", onVideoResize), window.removeEventListener("orientationChange", onVideoResize), triggerEnded) {
                var stopInfo = {
                    src: currentSrc
                };
                Events.trigger(self, "stopped", [stopInfo])
            }
            currentSrc = null, currentYoutubePlayer && currentYoutubePlayer.destroy(), currentYoutubePlayer = null
        }

        function onTimeUpdate(e) {
            Events.trigger(self, "timeupdate")
        }

        function onPlaying(playOptions, resolve) {
            started || (started = !0, resolve(), clearTimeUpdateInterval(), timeUpdateInterval = setInterval(onTimeUpdate, 500), playOptions.fullscreen ? embyRouter.showVideoOsd().then(function() {
                videoDialog.classList.remove("onTop")
            }) : (embyRouter.setTransparency("backdrop"), videoDialog.classList.remove("onTop")), require(["loading"], function(loading) {
                loading.hide()
            })), Events.trigger(self, "playing")
        }

        function onPause() {
            Events.trigger(self, "pause")
        }

        function zoomIn(elem, iterations) {
            var keyframes = [{
                    transform: "scale3d(.2, .2, .2)  ",
                    opacity: ".6",
                    offset: 0
                }, {
                    transform: "none",
                    opacity: "1",
                    offset: 1
                }],
                timing = {
                    duration: 240,
                    iterations: iterations
                };
            return elem.animate(keyframes, timing)
        }

        function createMediaElement(options) {
            return new Promise(function(resolve, reject) {
                var dlg = document.querySelector(".youtubePlayerContainer");
                dlg ? resolve(dlg.querySelector("#player")) : require(["loading", "css!" + pluginManager.mapPath(self, "style.css")], function(loading) {
                    loading.show();
                    var dlg = document.createElement("div");
                    dlg.classList.add("youtubePlayerContainer"), options.fullscreen && dlg.classList.add("onTop"), dlg.innerHTML = '<div id="player"></div>';
                    var videoElement = dlg.querySelector("#player");
                    document.body.insertBefore(dlg, document.body.firstChild), videoDialog = dlg, options.fullscreen && dlg.animate && !browser.slow ? zoomIn(dlg, 1).onfinish = function() {
                        resolve(videoElement)
                    } : resolve(videoElement)
                })
            })
        }
        var self = this;
        self.name = "Youtube Player", self.type = "mediaplayer", self.id = "youtubeplayer", self.priority = 1;
        var videoDialog, currentSrc, currentYoutubePlayer, timeUpdateInterval, started = !1;
        self.canPlayMediaType = function(mediaType) {
            return mediaType = (mediaType || "").toLowerCase(), "audio" === mediaType || "video" === mediaType
        }, self.canPlayItem = function(item) {
            return !1
        }, self.canPlayUrl = function(url) {
            return url.toLowerCase().indexOf("youtube.com") !== -1
        }, self.getDeviceProfile = function() {
            return Promise.resolve({})
        }, self.currentSrc = function() {
            return currentSrc
        }, self.play = function(options) {
            return started = !1, createMediaElement(options).then(function(elem) {
                return setCurrentSrc(elem, options)
            })
        }, self.setSubtitleStreamIndex = function(index) {}, self.canSetAudioStreamIndex = function() {
            return !1
        }, self.setAudioStreamIndex = function(index) {}, self.currentTime = function(val) {
            if (currentYoutubePlayer) return null != val ? void currentYoutubePlayer.seekTo(val / 1e3, !0) : 1e3 * currentYoutubePlayer.getCurrentTime()
        }, self.duration = function(val) {
            return currentYoutubePlayer ? 1e3 * currentYoutubePlayer.getDuration() : null
        }, self.stop = function(destroyPlayer, reportEnded) {
            var src = currentSrc;
            return src && (currentYoutubePlayer && currentYoutubePlayer.stopVideo(), onEndedInternal(reportEnded), destroyPlayer && self.destroy()), Promise.resolve()
        }, self.destroy = function() {
            embyRouter.setTransparency("none");
            var dlg = videoDialog;
            dlg && (videoDialog = null, dlg.parentNode.removeChild(dlg))
        }, self.pause = function() {
            currentYoutubePlayer && (currentYoutubePlayer.pauseVideo(), setTimeout(onPause, 200))
        }, self.unpause = function() {
            currentYoutubePlayer && (currentYoutubePlayer.playVideo(), setTimeout(onPlaying, 200))
        }, self.paused = function() {
            return !!currentYoutubePlayer && (console.log(currentYoutubePlayer.getPlayerState()), 2 === currentYoutubePlayer.getPlayerState())
        }, self.volume = function(val) {
            return null != val ? self.setVolume(val) : self.getVolume()
        }, self.setVolume = function(val) {
            currentYoutubePlayer && null != val && currentYoutubePlayer.setVolume(val)
        }, self.getVolume = function() {
            if (currentYoutubePlayer) return currentYoutubePlayer.getVolume()
        }, self.setMute = function(mute) {
            mute ? currentYoutubePlayer && currentYoutubePlayer.mute() : currentYoutubePlayer && currentYoutubePlayer.unMute()
        }, self.isMuted = function() {
            currentYoutubePlayer && currentYoutubePlayer.isMuted()
        }
    }
});