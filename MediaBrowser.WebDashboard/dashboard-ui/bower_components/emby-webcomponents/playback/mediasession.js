define(["playbackManager", "nowPlayingHelper", "events", "connectionManager"], function(playbackManager, nowPlayingHelper, events, connectionManager) {
    "use strict";

    function seriesImageUrl(item, options) {
        if ("Episode" !== item.Type) return null;
        if (options = options || {}, options.type = options.type || "Primary", "Primary" === options.type && item.SeriesPrimaryImageTag) return options.tag = item.SeriesPrimaryImageTag, connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.SeriesId, options);
        if ("Thumb" === options.type) {
            if (item.SeriesThumbImageTag) return options.tag = item.SeriesThumbImageTag, connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.SeriesId, options);
            if (item.ParentThumbImageTag) return options.tag = item.ParentThumbImageTag, connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.ParentThumbItemId, options)
        }
        return null
    }

    function imageUrl(item, options) {
        return options = options || {}, options.type = options.type || "Primary", item.ImageTags && item.ImageTags[options.type] ? (options.tag = item.ImageTags[options.type], connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.Id, options)) : item.AlbumId && item.AlbumPrimaryImageTag ? (options.tag = item.AlbumPrimaryImageTag, connectionManager.getApiClient(item.ServerId).getScaledImageUrl(item.AlbumId, options)) : null
    }

    function pushImageUrl(item, height, list) {
        var imageOptions = {
                height: height
            },
            url = seriesImageUrl(item, imageOptions) || imageUrl(item, imageOptions);
        url && list.push({
            src: url,
            sizes: height + "x" + height
        })
    }

    function getImageUrls(item) {
        var list = [];
        return pushImageUrl(item, 96, list), pushImageUrl(item, 128, list), pushImageUrl(item, 192, list), pushImageUrl(item, 256, list), pushImageUrl(item, 384, list), pushImageUrl(item, 512, list), list
    }

    function updatePlayerState(player, state, eventName) {
        var item = state.NowPlayingItem;
        if (!item) return void hideMediaControls();
        var playState = state.PlayState || {},
            parts = nowPlayingHelper.getNowPlayingNames(item),
            artist = 1 === parts.length ? "" : parts[0].text,
            title = parts[parts.length - 1].text,
            isVideo = "Video" === item.MediaType;
        if (isVideo && parts.length > 1) {
            var temp = artist;
            artist = title, title = temp
        }
        var albumArtist;
        item.AlbumArtists && item.AlbumArtists[0] && (albumArtist = item.AlbumArtists[0].Name);
        var album = item.Album || "",
            itemId = item.Id,
            duration = parseInt(item.RunTimeTicks ? item.RunTimeTicks / 1e4 : 0),
            currentTime = parseInt(playState.PositionTicks ? playState.PositionTicks / 1e4 : 0),
            isPaused = playState.IsPaused || !1;
        playState.CanSeek || !1;
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: artist,
            album: album,
            artwork: getImageUrls(item),
            albumArtist: albumArtist,
            currentTime: currentTime,
            duration: duration,
            paused: isPaused,
            itemId: itemId,
            mediaType: item.MediaType
        })
    }

    function onGeneralEvent(e, state) {
        var player = this;
        playbackManager.getPlayerState(player).then(function(state) {
            updatePlayerState(player, state, e.type)
        })
    }

    function onStateChanged(e, state) {
        var player = this;
        updatePlayerState(player, state, "statechange")
    }

    function onPlaybackStart(e, state) {
        console.log("nowplaying event: " + e.type);
        var player = this;
        updatePlayerState(player, state, e.type)
    }

    function onPlaybackStopped(e, state) {
        console.log("nowplaying event: " + e.type);
        hideMediaControls()
    }

    function releaseCurrentPlayer() {
        currentPlayer && (events.off(currentPlayer, "playbackstart", onPlaybackStart), events.off(currentPlayer, "playbackstop", onPlaybackStopped), events.off(currentPlayer, "play", onGeneralEvent), events.off(currentPlayer, "pause", onGeneralEvent), events.off(currentPlayer, "statechange", onStateChanged), events.off(currentPlayer, "timeupdate", onGeneralEvent), currentPlayer = null, hideMediaControls())
    }

    function hideMediaControls() {
        navigator.mediaSession.metadata = null
    }

    function bindToPlayer(player) {
        releaseCurrentPlayer(), player && (currentPlayer = player, console.log("binding remotecontrols to " + player.name), playbackManager.getPlayerState(player).then(function(state) {
            updatePlayerState(player, state, "init")
        }), events.on(currentPlayer, "playbackstart", onPlaybackStart), events.on(currentPlayer, "playbackstop", onPlaybackStopped), events.on(currentPlayer, "play", onGeneralEvent), events.on(currentPlayer, "pause", onGeneralEvent), events.on(currentPlayer, "statechange", onStateChanged), events.on(currentPlayer, "timeupdate", onGeneralEvent))
    }

    function execute(name) {
        playbackManager[name](currentPlayer)
    }
    var currentPlayer;
    console.log("binding remotecontrols to playbackManager"), navigator.mediaSession.setActionHandler("previoustrack", function() {
        execute("previousChapter")
    }), navigator.mediaSession.setActionHandler("nexttrack", function() {
        execute("nextChapter")
    }), navigator.mediaSession.setActionHandler("play", function() {
        execute("unpause")
    }), navigator.mediaSession.setActionHandler("pause", function() {
        execute("pause")
    }), navigator.mediaSession.setActionHandler("seekbackward", function() {
        execute("rewind")
    }), navigator.mediaSession.setActionHandler("seekforward", function() {
        execute("fastForward")
    }), events.on(playbackManager, "playerchange", function() {
        bindToPlayer(playbackManager.getCurrentPlayer())
    }), bindToPlayer(playbackManager.getCurrentPlayer())
});