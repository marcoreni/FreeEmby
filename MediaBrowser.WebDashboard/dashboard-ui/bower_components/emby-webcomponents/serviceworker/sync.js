self.addEventListener("sync", function(event) {
    "use strict";
    "emby-sync" === event.tag
});