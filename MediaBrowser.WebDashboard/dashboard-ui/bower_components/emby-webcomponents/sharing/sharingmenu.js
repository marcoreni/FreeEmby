define(["dialogHelper", "layoutManager", "globalize", "./social-share-kit-1.0.10/dist/js/social-share-kit.min", "css!./social-share-kit-1.0.10/dist/css/social-share-kit.css", "emby-button"], function(dialogHelper, layoutManager, globalize) {
    "use strict";

    function showMenu(options) {
        function onSskButtonClick(e) {
            isShared = !0, dialogHelper.close(dlg)
        }
        var dlg = dialogHelper.createDialog({
            removeOnClose: !0,
            autoFocus: layoutManager.tv,
            modal: !1
        });
        dlg.id = "dlg" + (new Date).getTime();
        var html = "";
        html += "<h2>" + Globalize.translate("Share") + "</h2>", html += '<div class="ssk-group ssk-round ssk-lg">', html += '<a href="#" class="ssk ssk-facebook" style="color:#fff;"></a>', html += '<a href="#" class="ssk ssk-twitter" style="color:#fff;"></a>', html += '<a href="#" class="ssk ssk-google-plus" style="color:#fff;"></a>', html += '<a href="#" class="ssk ssk-pinterest" style="color:#fff;"></a>', html += '<a href="#" class="ssk ssk-tumblr" style="color:#fff;"></a>', html += "</div>", dlg.style.padding = ".5em 1.5em 1.5em", dlg.innerHTML = html;
        for (var isShared = !1, shareInfo = options.share, sskButtons = dlg.querySelectorAll(".ssk"), i = 0, length = sskButtons.length; i < length; i++) sskButtons[i].addEventListener("click", onSskButtonClick);
        return dlg.addEventListener("open", function() {
            SocialShareKit.init({
                selector: "#" + dlg.id + " .ssk",
                url: shareInfo.Url,
                title: shareInfo.Name,
                text: shareInfo.Overview,
                image: shareInfo.ImageUrl,
                via: "Emby"
            })
        }), dialogHelper.open(dlg).then(function() {
            return isShared ? Promise.resolve() : Promise.reject()
        })
    }
    return {
        showMenu: showMenu
    }
});