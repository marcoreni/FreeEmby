define(["connectionManager", "itemHelper", "mediaInfo", "userdataButtons", "playbackManager", "globalize", "dom", "apphost", "css!./itemhovermenu", "emby-button"], function(connectionManager, itemHelper, mediaInfo, userdataButtons, playbackManager, globalize, dom, appHost) {
    "use strict";

    function onHoverOut(e) {
        var elem = e.target;
        showOverlayTimeout && (clearTimeout(showOverlayTimeout), showOverlayTimeout = null), elem = elem.classList.contains("cardOverlayTarget") ? elem : elem.querySelector(".cardOverlayTarget"), elem && slideDownToHide(elem)
    }

    function onSlideTransitionComplete() {
        this.classList.add("hide")
    }

    function slideDownToHide(elem) {
        elem.classList.contains("hide") || (dom.addEventListener(elem, dom.whichTransitionEvent(), onSlideTransitionComplete, {
            once: !0
        }), elem.classList.remove("cardOverlayTarget-open"))
    }

    function slideUpToShow(elem) {
        dom.removeEventListener(elem, dom.whichTransitionEvent(), onSlideTransitionComplete, {
            once: !0
        }), elem.classList.remove("hide"), void elem.offsetWidth, elem.classList.add("cardOverlayTarget-open")
    }

    function getOverlayHtml(apiClient, item, card) {
        var html = "";
        html += '<div class="cardOverlayInner">';
        var className = card.className.toLowerCase(),
            isMiniItem = className.indexOf("mini") !== -1,
            isSmallItem = isMiniItem || className.indexOf("small") !== -1,
            isPortrait = className.indexOf("portrait") !== -1,
            parentName = isSmallItem || isMiniItem || isPortrait ? null : item.SeriesName,
            name = item.EpisodeTitle ? item.Name : itemHelper.getDisplayName(item);
        html += "<div>";
        var imgUrl, logoHeight = 26;
        parentName && item.ParentLogoItemId ? (imgUrl = apiClient.getScaledImageUrl(item.ParentLogoItemId, {
            maxHeight: logoHeight,
            type: "logo",
            tag: item.ParentLogoImageTag
        }), html += '<img src="' + imgUrl + '" style="max-height:' + logoHeight + 'px;max-width:100%;" />') : item.ImageTags.Logo ? (imgUrl = apiClient.getScaledImageUrl(item.Id, {
            maxHeight: logoHeight,
            type: "logo",
            tag: item.ImageTags.Logo
        }), html += '<img src="' + imgUrl + '" style="max-height:' + logoHeight + 'px;max-width:100%;" />') : html += parentName || name, html += "</div>", parentName ? (html += "<p>", html += name, html += "</p>") : isSmallItem || isMiniItem || (html += '<div class="cardOverlayMediaInfo">', html += mediaInfo.getPrimaryMediaInfoHtml(item, {
            endsAt: !1
        }), html += "</div>"), html += '<div class="cardOverlayButtons">';
        var buttonCount = 0;
        playbackManager.canPlay(item) && (html += '<button is="emby-button" class="itemAction autoSize fab cardOverlayFab mini" data-action="resume"><i class="md-icon cardOverlayFab-md-icon">&#xE037;</i></button>', buttonCount++), item.LocalTrailerCount && (html += '<button title="' + globalize.translate("sharedcomponents#Trailer") + '" is="emby-button" class="itemAction autoSize fab cardOverlayFab mini" data-action="playtrailer"><i class="md-icon cardOverlayFab-md-icon">&#xE04B;</i></button>', buttonCount++);
        var moreIcon = "dots-horiz" === appHost.moreIcon ? "&#xE5D3;" : "&#xE5D4;";
        return html += '<button is="emby-button" class="itemAction autoSize fab cardOverlayFab mini" data-action="menu" data-playoptions="false"><i class="md-icon cardOverlayFab-md-icon">' + moreIcon + "</i></button>", buttonCount++, html += "</div>", html += "</div>"
    }

    function onCardOverlayButtonsClick(e) {
        var button = dom.parentWithClass(e.target, "btnUserData");
        button && e.stopPropagation()
    }

    function onShowTimerExpired(elem) {
        var innerElem = elem.querySelector(".cardOverlayTarget");
        if (!innerElem) {
            innerElem = document.createElement("div"), innerElem.classList.add("hide"), innerElem.classList.add("cardOverlayTarget"), innerElem.classList.add("itemAction"), innerElem.setAttribute("data-action", "link");
            var appendTo = elem.querySelector("div.cardContent") || elem.querySelector(".cardScalable") || elem.querySelector(".cardBox");
            appendTo || (appendTo = elem), appendTo.classList.add("withHoverMenu"), appendTo.appendChild(innerElem)
        }
        var dataElement = dom.parentWithAttribute(elem, "data-id");
        if (dataElement) {
            var id = dataElement.getAttribute("data-id"),
                type = dataElement.getAttribute("data-type");
            if ("Timer" !== type && "SeriesTimer" !== type) {
                var serverId = dataElement.getAttribute("data-serverid"),
                    apiClient = connectionManager.getApiClient(serverId);
                apiClient.getItem(apiClient.getCurrentUserId(), id).then(function(item) {
                    innerElem.innerHTML = getOverlayHtml(apiClient, item, dataElement), userdataButtons.fill({
                        item: item,
                        style: "fab-mini",
                        cssClass: "cardOverlayFab",
                        iconCssClass: "cardOverlayFab-md-icon",
                        element: innerElem.querySelector(".cardOverlayButtons"),
                        fillMode: "insertAdjacent",
                        insertLocation: "beforeend"
                    }), innerElem.querySelector(".cardOverlayButtons").addEventListener("click", onCardOverlayButtonsClick)
                }), slideUpToShow(innerElem)
            }
        }
    }

    function onHoverIn(e) {
        var elem = e.target,
            card = dom.parentWithClass(elem, "cardBox");
        if (card) {
            if (preventHover === !0) return void(preventHover = !1);
            showOverlayTimeout && (clearTimeout(showOverlayTimeout), showOverlayTimeout = null), showOverlayTimeout = setTimeout(function() {
                onShowTimerExpired(card)
            }, 1400)
        }
    }

    function preventTouchHover() {
        preventHover = !0
    }

    function ItemHoverMenu(parentElement) {
        this.parent = parentElement, this.parent.addEventListener("mouseenter", onHoverIn, !0), this.parent.addEventListener("mouseleave", onHoverOut, !0), dom.addEventListener(this.parent, "touchstart", preventTouchHover, {
            passive: !0
        })
    }
    var showOverlayTimeout, preventHover = !1;
    return ItemHoverMenu.prototype = {
        constructor: ItemHoverMenu,
        destroy: function() {
            this.parent.removeEventListener("mouseenter", onHoverIn, !0), this.parent.removeEventListener("mouseleave", onHoverOut, !0), dom.removeEventListener(this.parent, "touchstart", preventTouchHover, {
                passive: !0
            })
        }
    }, ItemHoverMenu
});