define(["components/remotecontrol", "emby-button"], function(remotecontrolFactory) {
    "use strict";
    return function(view, params) {
        var remoteControl = new remotecontrolFactory;
        remoteControl.init(view, view.querySelector(".remoteControlContent")), view.addEventListener("viewbeforeshow", function(e) {
            document.body.classList.add("hiddenViewMenuBar"), document.body.classList.add("hiddenNowPlayingBar"), remoteControl && remoteControl.onShow()
        }), view.addEventListener("viewbeforehide", function(e) {
            remoteControl && remoteControl.destroy(), document.body.classList.remove("hiddenViewMenuBar"), document.body.classList.remove("hiddenNowPlayingBar")
        })
    }
});