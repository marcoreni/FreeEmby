define(["playbackManager", "focusManager", "embyRouter", "dom"], function(playbackManager, focusManager, embyRouter, dom) {
    "use strict";

    function notify() {
        lastInputTime = (new Date).getTime(), handleCommand("unknown")
    }

    function notifyMouseMove() {
        lastInputTime = (new Date).getTime()
    }

    function idleTime() {
        return (new Date).getTime() - lastInputTime
    }

    function select(sourceElement) {
        sourceElement.click()
    }

    function on(scope, fn) {
        eventListenerCount++, dom.addEventListener(scope, "command", fn, {})
    }

    function off(scope, fn) {
        eventListenerCount && eventListenerCount--, dom.removeEventListener(scope, "command", fn, {})
    }

    function checkCommandTime(command) {
        var last = commandTimes[command] || 0,
            now = (new Date).getTime();
        return !(now - last < 1e3) && (commandTimes[command] = now, !0)
    }

    function handleCommand(name, options) {
        lastInputTime = (new Date).getTime();
        var sourceElement = options ? options.sourceElement : null;
        if (sourceElement && (sourceElement = focusManager.focusableParent(sourceElement)), sourceElement = sourceElement || document.activeElement || window, eventListenerCount) {
            var customEvent = new CustomEvent("command", {
                    detail: {
                        command: name
                    },
                    bubbles: !0,
                    cancelable: !0
                }),
                eventResult = sourceElement.dispatchEvent(customEvent);
            if (!eventResult) return
        }
        switch (name) {
            case "up":
                focusManager.moveUp(sourceElement);
                break;
            case "down":
                focusManager.moveDown(sourceElement);
                break;
            case "left":
                focusManager.moveLeft(sourceElement);
                break;
            case "right":
                focusManager.moveRight(sourceElement);
                break;
            case "home":
                embyRouter.goHome();
                break;
            case "settings":
                embyRouter.showSettings();
                break;
            case "back":
                embyRouter.back();
                break;
            case "forward":
                break;
            case "select":
                select(sourceElement);
                break;
            case "pageup":
                break;
            case "pagedown":
                break;
            case "end":
                break;
            case "menu":
            case "info":
                break;
            case "next":
                playbackManager.nextChapter();
                break;
            case "previous":
                playbackManager.previousChapter();
                break;
            case "guide":
                embyRouter.showGuide();
                break;
            case "recordedtv":
                embyRouter.showRecordedTV();
                break;
            case "record":
                break;
            case "livetv":
                embyRouter.showLiveTV();
                break;
            case "mute":
                playbackManager.setMute(!0);
                break;
            case "unmute":
                playbackManager.setMute(!1);
                break;
            case "togglemute":
                playbackManager.toggleMute();
                break;
            case "channelup":
                playbackManager.nextTrack();
                break;
            case "channeldown":
                playbackManager.previousTrack();
                break;
            case "volumedown":
                playbackManager.volumeDown();
                break;
            case "volumeup":
                playbackManager.volumeUp();
                break;
            case "play":
                playbackManager.unpause();
                break;
            case "pause":
                playbackManager.pause();
                break;
            case "playpause":
                playbackManager.playPause();
                break;
            case "stop":
                checkCommandTime("stop") && playbackManager.stop();
                break;
            case "changezoom":
                playbackManager.toggleAspectRatio();
                break;
            case "changeaudiotrack":
                break;
            case "changesubtitletrack":
                break;
            case "search":
                embyRouter.showSearch();
                break;
            case "favorites":
                embyRouter.showFavorites();
                break;
            case "fastforward":
                playbackManager.fastForward();
                break;
            case "rewind":
                playbackManager.rewind();
                break;
            case "togglefullscreen":
                playbackManager.toggleFullscreen();
                break;
            case "disabledisplaymirror":
                playbackManager.enableDisplayMirroring(!1);
                break;
            case "enabledisplaymirror":
                playbackManager.enableDisplayMirroring(!0);
                break;
            case "toggledisplaymirror":
                playbackManager.toggleDisplayMirroring();
                break;
            case "movies":
                break;
            case "music":
                break;
            case "tv":
                break;
            case "latestepisodes":
                break;
            case "nowplaying":
                break;
            case "upcomingtv":
                break;
            case "nextup":
        }
    }
    var lastInputTime = (new Date).getTime(),
        eventListenerCount = 0,
        commandTimes = {};
    return dom.addEventListener(document, "click", notify, {
        passive: !0
    }), {
        trigger: handleCommand,
        handle: handleCommand,
        notify: notify,
        notifyMouseMove: notifyMouseMove,
        idleTime: idleTime,
        on: on,
        off: off
    }
});