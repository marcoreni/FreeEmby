define(["events", "playbackManager"], function(events, playbackManager) {
    "use strict";

    function transferPlayback(oldPlayer, newPlayer) {
        playbackManager.getPlayerState(oldPlayer).then(function(state) {
            var item = state.NowPlayingItem;
            if (item) {
                var playState = state.PlayState || {};
                playbackManager.stop(oldPlayer);
                var itemId = item.Id,
                    resumePositionTicks = playState.PositionTicks || 0;
                playbackManager.play({
                    ids: [itemId],
                    startPositionTicks: resumePositionTicks
                }, newPlayer)
            }
        })
    }
    events.on(playbackManager, "playerchange", function(e, newPlayer, newTarget, oldPlayer) {
        if (oldPlayer && newPlayer) return oldPlayer.isLocalPlayer ? newPlayer.isLocalPlayer ? void console.log("Skipping remote control autoplay because newPlayer is a local player") : void transferPlayback(oldPlayer, newPlayer) : void console.log("Skipping remote control autoplay because oldPlayer is not a local player")
    })
});