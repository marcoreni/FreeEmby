define(["appStorage", "browser"], function(appStorage, browser) {
    "use strict";

    function getBaseProfileOptions(item) {
        var disableHlsVideoAudioCodecs = [];
        return item && (!browser.edge && canPlayNativeHls() || (disableHlsVideoAudioCodecs.push("mp3"), disableHlsVideoAudioCodecs.push("ac3"))), {
            enableMkvProgressive: !1,
            disableHlsVideoAudioCodecs: disableHlsVideoAudioCodecs
        }
    }

    function canPlayNativeHls() {
        var media = document.createElement("video");
        return !(!media.canPlayType("application/x-mpegURL").replace(/no/, "") && !media.canPlayType("application/vnd.apple.mpegURL").replace(/no/, ""))
    }

    function getDeviceProfileForWindowsUwp(item) {
        return new Promise(function(resolve, reject) {
            require(["browserdeviceprofile", "environments/windows-uwp/mediacaps"], function(profileBuilder, uwpMediaCaps) {
                var profileOptions = getBaseProfileOptions(item);
                profileOptions.supportsDts = uwpMediaCaps.supportsDTS(), profileOptions.supportsTrueHd = uwpMediaCaps.supportsDolby(), profileOptions.audioChannels = uwpMediaCaps.getAudioChannels(), resolve(profileBuilder(profileOptions))
            })
        })
    }

    function getDeviceProfile(item, options) {
        return options = options || {}, self.Windows ? getDeviceProfileForWindowsUwp(item) : new Promise(function(resolve, reject) {
            require(["browserdeviceprofile"], function(profileBuilder) {
                var profile = profileBuilder(getBaseProfileOptions(item));
                item && !options.isRetry && (browser.edge || browser.msie || browser.orsay || browser.tizen || (profile.SubtitleProfiles.push({
                    Format: "ass",
                    Method: "External"
                }), profile.SubtitleProfiles.push({
                    Format: "ssa",
                    Method: "External"
                }))), resolve(profile)
            })
        })
    }

    function getCapabilities() {
        return getDeviceProfile().then(function(profile) {
            var supportsPersistentIdentifier = !!browser.edgeUwp,
                caps = {
                    PlayableMediaTypes: ["Audio", "Video"],
                    SupportsPersistentIdentifier: supportsPersistentIdentifier,
                    DeviceProfile: profile
                };
            return caps
        })
    }

    function generateDeviceId() {
        return new Promise(function(resolve, reject) {
            require(["cryptojs-sha1"], function() {
                var keys = [];
                keys.push(navigator.userAgent), keys.push((new Date).getTime()), resolve(CryptoJS.SHA1(keys.join("|")).toString())
            })
        })
    }

    function getDeviceId() {
        var key = "_deviceId2",
            deviceId = appStorage.getItem(key);
        return deviceId ? Promise.resolve(deviceId) : generateDeviceId().then(function(deviceId) {
            return appStorage.setItem(key, deviceId), deviceId
        })
    }

    function getDeviceName() {
        var deviceName;
        return deviceName = browser.tizen ? "Samsung Smart TV" : browser.web0S ? "LG Smart TV" : browser.operaTv ? "Opera TV" : browser.xboxOne ? "Xbox One" : browser.ps4 ? "Sony PS4" : browser.chrome ? "Chrome" : browser.edge ? "Edge" : browser.firefox ? "Firefox" : browser.msie ? "Internet Explorer" : "Web Browser", browser.ipad ? deviceName += " Ipad" : browser.iphone ? deviceName += " Iphone" : browser.android && (deviceName += " Android"), deviceName
    }

    function supportsVoiceInput() {
        return !browser.tv && (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.oSpeechRecognition || window.msSpeechRecognition)
    }

    function supportsFullscreen() {
        if (browser.tv) return !1;
        var element = document.documentElement;
        return !!(element.requestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen || element.msRequestFullscreen) || !!document.createElement("video").webkitEnterFullscreen
    }

    function getSyncProfile() {
        return new Promise(function(resolve, reject) {
            require(["browserdeviceprofile", "appSettings"], function(profileBuilder, appSettings) {
                var profile = profileBuilder();
                profile.MaxStaticMusicBitrate = appSettings.maxStaticMusicBitrate(), resolve(profile)
            })
        })
    }

    function getDefaultLayout() {
        return "desktop"
    }

    function supportsHtmlMediaAutoplay() {
        if (browser.edgeUwp || browser.tv || browser.ps4 || browser.xboxOne) return !0;
        if (browser.mobile) return !1;
        var savedResult = appStorage.getItem(htmlMediaAutoplayAppStorageKey);
        return "true" === savedResult || "false" !== savedResult && null
    }
    var htmlMediaAutoplayAppStorageKey = "supportshtmlmediaautoplay0",
        supportedFeatures = function() {
            var features = ["sharing", "externalpremium"];
            return browser.edgeUwp || browser.tv || browser.xboxOne || browser.ps4 || features.push("filedownload"), browser.operaTv || browser.tizen || browser.web0s ? features.push("exit") : features.push("exitmenu"), browser.operaTv || features.push("externallinks"), supportsVoiceInput() && features.push("voiceinput"), supportsHtmlMediaAutoplay() && (features.push("htmlaudioautoplay"), features.push("htmlvideoautoplay")), window.SyncRegistered, supportsFullscreen() && features.push("fullscreenchange"), (browser.chrome || browser.edge && !browser.slow) && (browser.noAnimation || browser.edgeUwp || browser.xboxOne || features.push("imageanalysis")), Dashboard.isConnectMode() && features.push("multiserver"), (browser.tv || browser.xboxOne || browser.ps4 || browser.mobile) && features.push("physicalvolumecontrol"), browser.tv || browser.xboxOne || browser.ps4 || features.push("remotecontrol"), browser.operaTv || browser.tizen || browser.orsay || browser.web0s || browser.edgeUwp || features.push("remotemedia"), features.push("otherapppromotions"), features
        }();
    supportedFeatures.indexOf("htmlvideoautoplay") === -1 && supportsHtmlMediaAutoplay() !== !1 && require(["autoPlayDetect"], function(autoPlayDetect) {
        autoPlayDetect.supportsHtmlMediaAutoplay().then(function() {
            appStorage.setItem(htmlMediaAutoplayAppStorageKey, "true"), supportedFeatures.push("htmlvideoautoplay"), supportedFeatures.push("htmlaudioautoplay")
        }, function() {
            appStorage.setItem(htmlMediaAutoplayAppStorageKey, "false")
        })
    });
    var appInfo, version = window.dashboardVersion || "3.0";
    return {
        getWindowState: function() {
            return document.windowState || "Normal"
        },
        setWindowState: function(state) {
            alert("setWindowState is not supported and should not be called")
        },
        exit: function() {
            if (browser.tizen) try {
                tizen.application.getCurrentApplication().exit()
            } catch (err) {
                console.log("error closing application: " + err)
            } else window.close()
        },
        supports: function(command) {
            return supportedFeatures.indexOf(command.toLowerCase()) != -1
        },
        appInfo: function() {
            return appInfo ? Promise.resolve(appInfo) : getDeviceId().then(function(deviceId) {
                return appInfo = {
                    deviceId: deviceId,
                    deviceName: getDeviceName(),
                    appName: "Emby Mobile",
                    appVersion: version
                }
            })
        },
        getCapabilities: getCapabilities,
        preferVisualCards: browser.android || browser.chrome,
        moreIcon: browser.safari || browser.edge ? "dots-horiz" : "dots-vert",
        getSyncProfile: getSyncProfile,
        getDefaultLayout: getDefaultLayout,
        getDeviceProfile: getDeviceProfile
    }
});