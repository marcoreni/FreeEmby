define(["appSettings", "backdrop", "browser", "globalize", "require", "paper-icon-button-light"], function(appSettings, backdrop, browser, globalize, require) {
    "use strict";

    function onPageShow() {
        var page = this;
        if (!destroyed) {
            if (appSettings.get(cancelKey) == cancelValue) return void(destroyed = !0);
            browser.mobile || (require(["css!./style.css"]), page.classList.contains("itemDetailPage") || backdrop.setBackdrop("themes/halloween/bg.jpg"), 0 == lastSound ? playSound("http://github.com/MediaBrowser/Emby.Resources/raw/master/themes/halloween/monsterparadefade.mp3", .1) : (new Date).getTime() - lastSound > 3e4 && playSound("http://github.com/MediaBrowser/Emby.Resources/raw/master/themes/halloween/howl.wav"), addIcon())
        }
    }

    function addIcon() {
        if (!iconCreated) {
            iconCreated = !0;
            var viewMenuSecondary = document.querySelector(".viewMenuSecondary");
            if (viewMenuSecondary) {
                var html = '<button is="paper-icon-button-light" class="halloweenInfoButton"><i class="md-icon">info</i></button>';
                viewMenuSecondary.insertAdjacentHTML("afterbegin", html), viewMenuSecondary.querySelector(".halloweenInfoButton").addEventListener("click", onIconClick)
            }
        }
    }

    function onIconClick() {
        require(["dialog"], function(dialog) {
            dialog({
                title: "Happy Halloween",
                text: "Happy Halloween from the Emby Team. We hope your Halloween is spooktacular! Would you like to allow the Halloween theme to continue?",
                buttons: [{
                    id: "yes",
                    name: globalize.translate("ButtonYes"),
                    type: "submit"
                }, {
                    id: "no",
                    name: globalize.translate("ButtonNo"),
                    type: "cancel"
                }]
            }).then(function(result) {
                "no" == result && destroyTheme()
            })
        })
    }

    function destroyTheme() {
        destroyed = !0;
        var halloweenInfoButton = document.querySelector(".halloweenInfoButton");
        halloweenInfoButton && halloweenInfoButton.parentNode.removeChild(halloweenInfoButton), currentSound && currentSound.stop(), backdrop.clear(), appSettings.set(cancelKey, cancelValue), window.location.reload(!0)
    }

    function playSound(path, volume) {
        require(["howler"], function(howler) {
            var sound = new Howl({
                urls: [path],
                volume: volume || .3
            });
            sound.play(), currentSound = sound, lastSound = (new Date).getTime()
        })
    }
    var iconCreated, destroyed, currentSound, lastSound = 0,
        cancelKey = "cancelHalloween2015",
        cancelValue = "6";
    pageClassOn("pageshow", "libraryPage", onPageShow)
});