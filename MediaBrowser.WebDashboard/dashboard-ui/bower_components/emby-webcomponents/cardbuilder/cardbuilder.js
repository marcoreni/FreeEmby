define(["datetime", "imageLoader", "connectionManager", "itemHelper", "focusManager", "indicators", "globalize", "layoutManager", "apphost", "dom", "browser", "itemShortcuts", "css!./card", "paper-icon-button-light", "clearButtonStyle"], function(datetime, imageLoader, connectionManager, itemHelper, focusManager, indicators, globalize, layoutManager, appHost, dom, browser, itemShortcuts) {
    "use strict";

    function getCardsHtml(items, options) {
        1 === arguments.length && (options = arguments[0], items = options.items);
        var html = buildCardsHtmlInternal(items, options);
        return html
    }

    function getPostersPerRow(shape, screenWidth) {
        switch (shape) {
            case "portrait":
                return screenWidth >= 2200 ? 10 : screenWidth >= 2100 ? 9 : screenWidth >= 1600 ? 8 : screenWidth >= 1400 ? 7 : screenWidth >= 1200 ? 6 : screenWidth >= 800 ? 5 : screenWidth >= 640 ? 4 : 3;
            case "square":
                return screenWidth >= 2100 ? 9 : screenWidth >= 1800 ? 8 : screenWidth >= 1400 ? 7 : screenWidth >= 1200 ? 6 : screenWidth >= 900 ? 5 : screenWidth >= 700 ? 4 : screenWidth >= 500 ? 3 : 2;
            case "banner":
                return screenWidth >= 2200 ? 4 : screenWidth >= 1200 ? 3 : screenWidth >= 800 ? 2 : 1;
            case "backdrop":
                return screenWidth >= 2500 ? 6 : screenWidth >= 1600 ? 5 : screenWidth >= 1200 ? 4 : screenWidth >= 770 ? 3 : screenWidth >= 420 ? 2 : 1;
            case "smallBackdrop":
                return screenWidth >= 1440 ? 8 : screenWidth >= 1100 ? 6 : screenWidth >= 800 ? 5 : screenWidth >= 600 ? 4 : screenWidth >= 540 ? 3 : screenWidth >= 420 ? 2 : 1;
            case "overflowPortrait":
                return screenWidth >= 1e3 ? 100 / 22 : screenWidth >= 540 ? 100 / 30 : 100 / 42;
            case "overflowSquare":
                return screenWidth >= 1e3 ? 100 / 22 : screenWidth >= 540 ? 100 / 30 : 100 / 42;
            case "overflowBackdrop":
                return screenWidth >= 1e3 ? 2.5 : screenWidth >= 640 ? 100 / 56 : screenWidth >= 540 ? 1.5625 : 100 / 72;
            case "overflowSmallBackdrop":
                return screenWidth >= 1200 ? 100 / 18 : screenWidth >= 1e3 ? 100 / 24 : screenWidth >= 770 ? 100 / 30 : screenWidth >= 540 ? 2.5 : 100 / 60;
            default:
                return 4
        }
    }

    function isResizable(windowWidth) {
        var screen = window.screen;
        if (screen) {
            var screenWidth = screen.availWidth;
            if (screenWidth - windowWidth > 20) return !0
        }
        return !1
    }

    function getImageWidth(shape) {
        var screenWidth = dom.getWindowSize().innerWidth;
        if (isResizable(screenWidth)) {
            var roundScreenTo = 100;
            screenWidth = Math.floor(screenWidth / roundScreenTo) * roundScreenTo
        }
        window.screen && (screenWidth = Math.min(screenWidth, screen.availWidth || screenWidth));
        var imagesPerRow = getPostersPerRow(shape, screenWidth),
            shapeWidth = screenWidth / imagesPerRow;
        return Math.round(shapeWidth)
    }

    function setCardData(items, options) {
        options.shape = options.shape || "auto";
        var primaryImageAspectRatio = imageLoader.getPrimaryImageAspectRatio(items),
            isThumbAspectRatio = primaryImageAspectRatio && Math.abs(primaryImageAspectRatio - 1.777777778) < .3,
            isSquareAspectRatio = primaryImageAspectRatio && Math.abs(primaryImageAspectRatio - 1) < .33 || primaryImageAspectRatio && Math.abs(primaryImageAspectRatio - 1.3333334) < .01;
        "auto" !== options.shape && "autohome" !== options.shape && "autooverflow" !== options.shape && "autoVertical" !== options.shape || (options.preferThumb === !0 || isThumbAspectRatio ? options.shape = "autooverflow" === options.shape ? "overflowBackdrop" : "backdrop" : isSquareAspectRatio ? (options.coverImage = !0, options.shape = "autooverflow" === options.shape ? "overflowSquare" : "square") : primaryImageAspectRatio && primaryImageAspectRatio > 1.9 ? (options.shape = "banner", options.coverImage = !0) : primaryImageAspectRatio && Math.abs(primaryImageAspectRatio - .6666667) < .2 ? options.shape = "autooverflow" === options.shape ? "overflowPortrait" : "portrait" : options.shape = options.defaultShape || ("autooverflow" === options.shape ? "overflowSquare" : "square")), "auto" === options.preferThumb && (options.preferThumb = "backdrop" === options.shape || "overflowBackdrop" === options.shape), options.uiAspect = getDesiredAspect(options.shape), options.primaryImageAspectRatio = primaryImageAspectRatio, !options.width && options.widths && (options.width = options.widths[options.shape]), options.rows && "number" != typeof options.rows && (options.rows = options.rows[options.shape]), layoutManager.tv && ("backdrop" === options.shape ? options.width = options.width || 500 : "portrait" === options.shape ? options.width = options.width || 256 : "square" === options.shape ? options.width = options.width || 256 : "banner" === options.shape && (options.width = options.width || 800)), options.width = options.width || getImageWidth(options.shape)
    }

    function buildCardsHtmlInternal(items, options) {
        var isVertical;
        "autoVertical" === options.shape && (isVertical = !0), options.vibrant && !appHost.supports("imageanalysis") && (options.vibrant = !1), setCardData(items, options);
        var className = "card";
        options.shape && (className += " " + options.shape + "Card"), options.cardCssClass && (className += " " + options.cardCssClass);
        var currentIndexValue, hasOpenRow, hasOpenSection, apiClient, lastServerId, i, length, html = "",
            itemsInRow = 0,
            sectionTitleTagName = options.sectionTitleTagName || "div";
        for (i = 0, length = items.length; i < length; i++) {
            var item = items[i],
                serverId = item.ServerId || options.serverId;
            if (serverId !== lastServerId && (lastServerId = serverId, apiClient = connectionManager.getApiClient(lastServerId)), options.indexBy) {
                var newIndexValue = "";
                if ("PremiereDate" === options.indexBy) {
                    if (item.PremiereDate) try {
                        newIndexValue = datetime.toLocaleDateString(datetime.parseISO8601Date(item.PremiereDate), {
                            weekday: "long",
                            month: "long",
                            day: "numeric"
                        })
                    } catch (err) {}
                } else "ProductionYear" === options.indexBy ? newIndexValue = item.ProductionYear : "CommunityRating" === options.indexBy && (newIndexValue = item.CommunityRating ? Math.floor(item.CommunityRating) + (item.CommunityRating % 1 >= .5 ? .5 : 0) + "+" : null);
                newIndexValue !== currentIndexValue && (hasOpenRow && (html += "</div>", hasOpenRow = !1, itemsInRow = 0), hasOpenSection && (html += "</div>", isVertical && (html += "</div>"), hasOpenSection = !1), html += isVertical ? '<div class="verticalSection">' : '<div class="horizontalSection">', html += "<" + sectionTitleTagName + ' class="sectionTitle">' + newIndexValue + "</" + sectionTitleTagName + ">", isVertical && (html += '<div class="itemsContainer vertical-wrap">'), currentIndexValue = newIndexValue, hasOpenSection = !0)
            }
            options.rows && 0 === itemsInRow && (hasOpenRow && (html += "</div>", hasOpenRow = !1), html += '<div class="cardColumn">', hasOpenRow = !0);
            var cardClass = className;
            html += buildCard(i, item, apiClient, options, cardClass), itemsInRow++, options.rows && itemsInRow >= options.rows && (html += "</div>", hasOpenRow = !1, itemsInRow = 0)
        }
        if (hasOpenRow && (html += "</div>"), hasOpenSection && (html += "</div>", isVertical && (html += "</div>")), options.leadingButtons)
            for (i = 0, length = options.leadingButtons.length; i < length; i++) html = '<button data-textcardid="' + options.leadingButtons[i].id + '" class="textButtonCard card ' + options.shape + "Card scalableCard " + options.shape + "Card-scalable " + options.shape + 'Card-textCard itemAction card-withuserdata"><div class="cardBox cardBox-focustransform"><div class="cardScalable card-focuscontent"><div class="' + options.shape + 'Card-textCardPadder"></div><div class="cardContent cardContent-shadow"><div class="cardImageContainer coveredImage textCardImageContainer"><div class="cardText cardDefaultText">' + options.leadingButtons[i].name + "</div></div></div></div></div></button>" + html;
        if (options.trailingButtons)
            for (i = 0, length = options.trailingButtons.length; i < length; i++) html += '<button data-textcardid="' + options.trailingButtons[i].id + '" class="textButtonCard card ' + options.shape + "Card scalableCard " + options.shape + "Card-scalable " + options.shape + 'Card-textCard itemAction card-withuserdata"><div class="cardBox cardBox-focustransform"><div class="cardScalable card-focuscontent"><div class="' + options.shape + 'Card-textCardPadder"></div><div class="cardContent cardContent-shadow"><div class="cardImageContainer coveredImage textCardImageContainer"><div class="cardText cardDefaultText">' + options.trailingButtons[i].name + "</div></div></div></div></div></button>";
        return html
    }

    function getDesiredAspect(shape) {
        if (shape) {
            if (shape = shape.toLowerCase(), shape.indexOf("portrait") !== -1) return 2 / 3;
            if (shape.indexOf("backdrop") !== -1) return 16 / 9;
            if (shape.indexOf("square") !== -1) return 1;
            if (shape.indexOf("banner") !== -1) return 1e3 / 185
        }
        return null
    }

    function getCardImageUrl(item, apiClient, options) {
        var imageItem = item.ProgramInfo || item;
        item = imageItem;
        var width = options.width,
            height = null,
            primaryImageAspectRatio = imageLoader.getPrimaryImageAspectRatio([item]),
            forceName = !1,
            imgUrl = null,
            coverImage = !1,
            uiAspect = null;
        return options.preferThumb && item.ImageTags && item.ImageTags.Thumb ? imgUrl = apiClient.getScaledImageUrl(item.Id, {
            type: "Thumb",
            maxWidth: width,
            tag: item.ImageTags.Thumb
        }) : options.preferBanner && item.ImageTags && item.ImageTags.Banner ? imgUrl = apiClient.getScaledImageUrl(item.Id, {
            type: "Banner",
            maxWidth: width,
            tag: item.ImageTags.Banner
        }) : options.preferThumb && item.SeriesThumbImageTag && options.inheritThumb !== !1 ? imgUrl = apiClient.getScaledImageUrl(item.SeriesId, {
            type: "Thumb",
            maxWidth: width,
            tag: item.SeriesThumbImageTag
        }) : options.preferThumb && item.ParentThumbItemId && options.inheritThumb !== !1 && "Photo" !== item.MediaType ? imgUrl = apiClient.getScaledImageUrl(item.ParentThumbItemId, {
            type: "Thumb",
            maxWidth: width,
            tag: item.ParentThumbImageTag
        }) : options.preferThumb && item.BackdropImageTags && item.BackdropImageTags.length ? (imgUrl = apiClient.getScaledImageUrl(item.Id, {
            type: "Backdrop",
            maxWidth: width,
            tag: item.BackdropImageTags[0]
        }), forceName = !0) : item.ImageTags && item.ImageTags.Primary ? (height = width && primaryImageAspectRatio ? Math.round(width / primaryImageAspectRatio) : null, imgUrl = apiClient.getScaledImageUrl(item.Id, {
            type: "Primary",
            maxHeight: height,
            maxWidth: width,
            tag: item.ImageTags.Primary
        }), options.preferThumb && options.showTitle !== !1 && (forceName = !0), primaryImageAspectRatio && (uiAspect = getDesiredAspect(options.shape), uiAspect && (coverImage = Math.abs(primaryImageAspectRatio - uiAspect) <= .2))) : item.PrimaryImageTag ? (height = width && primaryImageAspectRatio ? Math.round(width / primaryImageAspectRatio) : null, imgUrl = apiClient.getScaledImageUrl(item.PrimaryImageItemId || item.Id || item.ItemId, {
            type: "Primary",
            maxHeight: height,
            maxWidth: width,
            tag: item.PrimaryImageTag
        }), options.preferThumb && options.showTitle !== !1 && (forceName = !0), primaryImageAspectRatio && (uiAspect = getDesiredAspect(options.shape), uiAspect && (coverImage = Math.abs(primaryImageAspectRatio - uiAspect) <= .2))) : item.ParentPrimaryImageTag ? imgUrl = apiClient.getScaledImageUrl(item.ParentPrimaryImageItemId, {
            type: "Primary",
            maxWidth: width,
            tag: item.ParentPrimaryImageTag
        }) : item.AlbumId && item.AlbumPrimaryImageTag ? (width = primaryImageAspectRatio ? Math.round(height * primaryImageAspectRatio) : null, imgUrl = apiClient.getScaledImageUrl(item.AlbumId, {
            type: "Primary",
            maxHeight: height,
            maxWidth: width,
            tag: item.AlbumPrimaryImageTag
        }), primaryImageAspectRatio && (uiAspect = getDesiredAspect(options.shape), uiAspect && (coverImage = Math.abs(primaryImageAspectRatio - uiAspect) <= .2))) : "Season" === item.Type && item.ImageTags && item.ImageTags.Thumb ? imgUrl = apiClient.getScaledImageUrl(item.Id, {
            type: "Thumb",
            maxWidth: width,
            tag: item.ImageTags.Thumb
        }) : item.BackdropImageTags && item.BackdropImageTags.length ? imgUrl = apiClient.getScaledImageUrl(item.Id, {
            type: "Backdrop",
            maxWidth: width,
            tag: item.BackdropImageTags[0]
        }) : item.ImageTags && item.ImageTags.Thumb ? imgUrl = apiClient.getScaledImageUrl(item.Id, {
            type: "Thumb",
            maxWidth: width,
            tag: item.ImageTags.Thumb
        }) : item.SeriesThumbImageTag && options.inheritThumb !== !1 ? imgUrl = apiClient.getScaledImageUrl(item.SeriesId, {
            type: "Thumb",
            maxWidth: width,
            tag: item.SeriesThumbImageTag
        }) : item.ParentThumbItemId && options.inheritThumb !== !1 && (imgUrl = apiClient.getScaledImageUrl(item.ParentThumbItemId, {
            type: "Thumb",
            maxWidth: width,
            tag: item.ParentThumbImageTag
        })), {
            imgUrl: imgUrl,
            forceName: forceName,
            coverImage: coverImage
        }
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min
    }

    function getDefaultColorIndex(str) {
        if (str) {
            for (var charIndex = Math.floor(str.length / 2), character = String(str.substr(charIndex, 1).charCodeAt()), sum = 0, i = 0; i < character.length; i++) sum += parseInt(character.charAt(i));
            var index = String(sum).substr(-1);
            return index % numRandomColors + 1
        }
        return getRandomInt(1, numRandomColors)
    }

    function getDefaultColorClass(str) {
        return "defaultCardColor" + getDefaultColorIndex(str)
    }

    function getCardTextLines(lines, cssClass, forceLines, isOuterFooter, cardLayout, addRightMargin, maxLines) {
        var i, length, html = "",
            valid = 0;
        for (i = 0, length = lines.length; i < length; i++) {
            var currentCssClass = cssClass,
                text = lines[i];
            if (valid > 0 && isOuterFooter && (currentCssClass += " cardText-secondary"), addRightMargin && (currentCssClass += " cardText-rightmargin"), text && (html += "<div class='" + currentCssClass + "'>", html += text, html += "</div>", valid++, maxLines && valid >= maxLines)) break
        }
        if (forceLines)
            for (length = Math.min(lines.length, maxLines || lines.length); valid < length;) html += "<div class='" + cssClass + "'>&nbsp;</div>", valid++;
        return html
    }

    function isUsingLiveTvNaming(item) {
        return "Program" === item.Type || "Timer" === item.Type || "Recording" === item.Type
    }

    function getCardFooterText(item, apiClient, options, showTitle, forceName, overlayText, imgUrl, footerClass, progressHtml, isOuterFooter, cardFooterId, vibrantSwatch) {
        var html = "",
            showOtherText = isOuterFooter ? !overlayText : overlayText;
        if (isOuterFooter && options.cardLayout && !layoutManager.tv && "none" !== options.cardFooterAside) {
            var moreIcon = "dots-horiz" === appHost.moreIcon ? "&#xE5D3;" : "&#xE5D4;";
            html += '<button is="paper-icon-button-light" class="itemAction btnCardOptions autoSize" data-action="menu"><i class="md-icon">' + moreIcon + "</i></button>"
        }
        var titleAdded, cssClass = options.centerText ? "cardText cardTextCentered" : "cardText",
            lines = [],
            parentTitleUnderneath = "MusicAlbum" === item.Type || "Audio" === item.Type || "MusicVideo" === item.Type;
        if (showOtherText && (options.showParentTitle || options.showParentTitleOrTitle) && !parentTitleUnderneath)
            if (isOuterFooter && "Episode" === item.Type && item.SeriesName && item.SeriesId) lines.push(getTextActionButton({
                Id: item.SeriesId,
                ServerId: item.ServerId,
                Name: item.SeriesName,
                Type: "Series",
                IsFolder: !0
            }));
            else if (isUsingLiveTvNaming(item)) lines.push(item.Name), item.IsSeries || (titleAdded = !0);
        else {
            var parentTitle = item.SeriesName || item.Series || item.Album || item.AlbumArtist || item.GameSystem || "";
            (parentTitle || showTitle) && lines.push(parentTitle)
        }
        var showMediaTitle = showTitle && !titleAdded || options.showParentTitleOrTitle && !lines.length;
        if (showMediaTitle || titleAdded || !showTitle && !forceName || (showMediaTitle = !0), showMediaTitle) {
            var name = "auto" !== options.showTitle || item.IsFolder || "Photo" !== item.MediaType ? itemHelper.getDisplayName(item, {
                includeParentInfo: options.includeParentInfoInTitle
            }) : "";
            lines.push(name)
        }
        if (showOtherText) {
            if (options.showParentTitle && parentTitleUnderneath && (isOuterFooter && item.AlbumArtists && item.AlbumArtists.length ? (item.AlbumArtists[0].Type = "MusicArtist", item.AlbumArtists[0].IsFolder = !0, lines.push(getTextActionButton(item.AlbumArtists[0], null, item.ServerId))) : lines.push(isUsingLiveTvNaming(item) ? item.Name : item.SeriesName || item.Series || item.Album || item.AlbumArtist || item.GameSystem || "")), options.showItemCounts) {
                var itemCountHtml = getItemCountsHtml(options, item);
                lines.push(itemCountHtml)
            }
            if (options.textLines)
                for (var additionalLines = options.textLines(item), i = 0, length = additionalLines.length; i < length; i++) lines.push(additionalLines[i]);
            if (options.showSongCount) {
                var songLine = "";
                item.SongCount && (songLine = 1 === item.SongCount ? globalize.translate("sharedcomponents#ValueOneSong") : globalize.translate("sharedcomponents#ValueSongCount", item.SongCount)), lines.push(songLine)
            }
            if (options.showPremiereDate)
                if (item.PremiereDate) try {
                    lines.push(getPremiereDateText(item))
                } catch (err) {
                    lines.push("")
                } else lines.push("");
            if ((options.showYear || options.showSeriesYear) && ("Series" === item.Type ? "Continuing" === item.Status ? lines.push(globalize.translate("sharedcomponents#SeriesYearToPresent", item.ProductionYear || "")) : item.EndDate && item.ProductionYear ? lines.push(item.ProductionYear + " - " + datetime.parseISO8601Date(item.EndDate).getFullYear()) : lines.push(item.ProductionYear || "") : lines.push(item.ProductionYear || "")), options.showRuntime && (item.RunTimeTicks ? lines.push(datetime.getDisplayRunningTime(item.RunTimeTicks)) : lines.push("")), options.showAirTime) {
                var airTimeText = "";
                if (item.StartDate) try {
                    var date = datetime.parseISO8601Date(item.StartDate);
                    options.showAirDateTime && (airTimeText += datetime.toLocaleDateString(date, {
                        weekday: "short",
                        month: "short",
                        day: "numeric"
                    }) + " "), airTimeText += datetime.getDisplayTime(date), item.EndDate && options.showAirEndTime && (date = datetime.parseISO8601Date(item.EndDate), airTimeText += " - " + datetime.getDisplayTime(date))
                } catch (e) {
                    console.log("Error parsing date: " + item.PremiereDate)
                }
                lines.push(airTimeText || "")
            }
            if (options.showChannelName)
                if (item.ChannelId) {
                    var channelText = item.ChannelName;
                    lines.push(getTextActionButton({
                        Id: item.ChannelId,
                        ServerId: item.ServerId,
                        Name: item.ChannelName,
                        Type: "TvChannel",
                        MediaType: item.MediaType,
                        IsFolder: !1
                    }, channelText))
                } else lines.push(item.ChannelName || "&nbsp;");
            options.showCurrentProgram && "TvChannel" === item.Type && (item.CurrentProgram ? lines.push(item.CurrentProgram.Name) : lines.push("")), options.showSeriesTimerTime && (item.RecordAnyTime ? lines.push(globalize.translate("sharedcomponents#Anytime")) : lines.push(datetime.getDisplayTime(item.StartDate))), options.showSeriesTimerChannel && (item.RecordAnyChannel ? lines.push(globalize.translate("sharedcomponents#AllChannels")) : lines.push(item.ChannelName || globalize.translate("sharedcomponents#OneChannel"))), options.showPersonRoleOrType && (item.Role ? lines.push("as " + item.Role) : item.Type ? lines.push(globalize.translate("sharedcomponents#" + item.Type)) : lines.push(""))
        }(showTitle || !imgUrl) && forceName && overlayText && 1 === lines.length && (lines = []);
        var addRightTextMargin = isOuterFooter && options.cardLayout && !options.centerText && "none" !== options.cardFooterAside && !layoutManager.tv;
        if (html += getCardTextLines(lines, cssClass, !options.overlayText, isOuterFooter, options.cardLayout, addRightTextMargin, options.lines), progressHtml && (html += progressHtml), html) {
            var style = "";
            if (options.vibrant && vibrantSwatch) {
                var swatch = vibrantSwatch.split("|");
                if (swatch.length) {
                    var index = 0;
                    style = ' style="color:' + swatch[index + 1] + ";background-color:" + swatch[index] + ';"'
                }
            }
            html = '<div id="' + cardFooterId + '" class="' + footerClass + '"' + style + ">" + html, html += "</div>"
        }
        return html
    }

    function getTextActionButton(item, text, serverId) {
        if (text || (text = itemHelper.getDisplayName(item)), layoutManager.tv) return text;
        var html = "<button " + itemShortcuts.getShortcutAttributesHtml(item, serverId) + ' type="button" class="itemAction textActionButton" data-action="link">';
        return html += text, html += "</button>"
    }

    function getItemCountsHtml(options, item) {
        var childText, counts = [];
        if ("Playlist" === item.Type) {
            if (childText = "", item.RunTimeTicks) {
                var minutes = item.RunTimeTicks / 6e8;
                minutes = minutes || 1, childText += globalize.translate("sharedcomponents#ValueMinutes", Math.round(minutes))
            } else childText += globalize.translate("sharedcomponents#ValueMinutes", 0);
            counts.push(childText)
        } else "Genre" === item.Type || "Studio" === item.Type ? (item.MovieCount && (childText = 1 === item.MovieCount ? globalize.translate("sharedcomponents#ValueOneMovie") : globalize.translate("sharedcomponents#ValueMovieCount", item.MovieCount), counts.push(childText)), item.SeriesCount && (childText = 1 === item.SeriesCount ? globalize.translate("sharedcomponents#ValueOneSeries") : globalize.translate("sharedcomponents#ValueSeriesCount", item.SeriesCount), counts.push(childText)), item.EpisodeCount && (childText = 1 === item.EpisodeCount ? globalize.translate("sharedcomponents#ValueOneEpisode") : globalize.translate("sharedcomponents#ValueEpisodeCount", item.EpisodeCount), counts.push(childText)), item.GameCount && (childText = 1 === item.GameCount ? globalize.translate("sharedcomponents#ValueOneGame") : globalize.translate("sharedcomponents#ValueGameCount", item.GameCount), counts.push(childText))) : "GameGenre" === item.Type ? item.GameCount && (childText = 1 === item.GameCount ? globalize.translate("sharedcomponents#ValueOneGame") : globalize.translate("sharedcomponents#ValueGameCount", item.GameCount), counts.push(childText)) : "MusicGenre" === item.Type || "MusicArtist" === options.context ? (item.AlbumCount && (childText = 1 === item.AlbumCount ? globalize.translate("sharedcomponents#ValueOneAlbum") : globalize.translate("sharedcomponents#ValueAlbumCount", item.AlbumCount), counts.push(childText)), item.SongCount && (childText = 1 === item.SongCount ? globalize.translate("sharedcomponents#ValueOneSong") : globalize.translate("sharedcomponents#ValueSongCount", item.SongCount), counts.push(childText)), item.MusicVideoCount && (childText = 1 === item.MusicVideoCount ? globalize.translate("sharedcomponents#ValueOneMusicVideo") : globalize.translate("sharedcomponents#ValueMusicVideoCount", item.MusicVideoCount), counts.push(childText))) : "Series" === item.Type && (childText = 1 === item.RecursiveItemCount ? globalize.translate("sharedcomponents#ValueOneEpisode") : globalize.translate("sharedcomponents#ValueEpisodeCount", item.RecursiveItemCount), counts.push(childText));
        return counts.join(", ")
    }

    function buildCard(index, item, apiClient, options, className) {
        var action = options.action || "link",
            scalable = options.scalable !== !1;
        scalable && (className += " scalableCard " + options.shape + "Card-scalable");
        var imgInfo = getCardImageUrl(item, apiClient, options),
            imgUrl = imgInfo.imgUrl,
            forceName = imgInfo.forceName,
            showTitle = "auto" === options.showTitle || (options.showTitle || "PhotoAlbum" === item.Type || "Folder" === item.Type),
            overlayText = options.overlayText;
        forceName && !options.cardLayout && null == overlayText && (overlayText = !0);
        var cardImageContainerClass = "cardImageContainer",
            coveredImage = options.coverImage || imgInfo.coverImage;
        coveredImage && (cardImageContainerClass += " coveredImage", ("Photo" === item.MediaType || "PhotoAlbum" === item.Type || "Folder" === item.Type || item.ProgramInfo || "Program" === item.Type || "Recording" === item.Type) && (cardImageContainerClass += " coveredImage-noScale")), imgUrl || (cardImageContainerClass += " " + getDefaultColorClass(item.Name));
        var separateCardBox = scalable,
            cardBoxClass = options.cardLayout ? "cardBox visualCardBox" : "cardBox";
        layoutManager.tv && (cardBoxClass += " cardBox-focustransform", !options.cardLayout && separateCardBox || (cardBoxClass += " card-focuscontent"));
        var footerCssClass, progressHtml = indicators.getProgressBarHtml(item),
            innerCardFooter = "",
            footerOverlayed = !1,
            cardFooterId = "cardFooter" + uniqueFooterIndex;
        uniqueFooterIndex++, overlayText ? (footerCssClass = progressHtml ? "innerCardFooter fullInnerCardFooter" : "innerCardFooter", innerCardFooter += getCardFooterText(item, apiClient, options, showTitle, forceName, overlayText, imgUrl, footerCssClass, progressHtml, !1, cardFooterId), footerOverlayed = !0) : progressHtml && (innerCardFooter += '<div class="innerCardFooter fullInnerCardFooter innerCardFooterClear">', innerCardFooter += progressHtml, innerCardFooter += "</div>", progressHtml = "");
        var mediaSourceCount = item.MediaSourceCount || 1;
        mediaSourceCount > 1 && (innerCardFooter += '<div class="mediaSourceIndicator">' + mediaSourceCount + "</div>");
        var vibrantSwatch = options.vibrant && imgUrl ? imageLoader.getCachedVibrantInfo(imgUrl) : null,
            outerCardFooter = "";
        overlayText || footerOverlayed || (footerCssClass = options.cardLayout ? "cardFooter" : "cardFooter cardFooter-transparent", outerCardFooter = getCardFooterText(item, apiClient, options, showTitle, forceName, overlayText, imgUrl, footerCssClass, progressHtml, !0, cardFooterId, vibrantSwatch)), outerCardFooter && !options.cardLayout && options.allowBottomPadding !== !1 && (cardBoxClass += " cardBox-bottompadded"), separateCardBox || (cardImageContainerClass += " " + cardBoxClass);
        var overlayButtons = "";
        if (!layoutManager.tv) {
            var overlayPlayButton = options.overlayPlayButton;
            if (null != overlayPlayButton || options.overlayMoreButton || options.cardLayout || (overlayPlayButton = "Video" === item.MediaType), !overlayPlayButton || item.IsPlaceHolder || "Virtual" === item.LocationType && item.MediaType && "Program" !== item.Type || "Person" === item.Type || (overlayButtons += '<button is="paper-icon-button-light" class="cardOverlayButton itemAction autoSize" data-action="play" onclick="return false;"><i class="md-icon">play_arrow</i></button>'), options.overlayMoreButton) {
                var moreIcon = "dots-horiz" === appHost.moreIcon ? "&#xE5D3;" : "&#xE5D4;";
                overlayButtons += '<button is="paper-icon-button-light" class="cardOverlayButton itemAction autoSize" data-action="menu" onclick="return false;"><i class="md-icon">' + moreIcon + "</i></button>"
            }
        }
        options.showChildCountIndicator && item.ChildCount && (className += " groupedCard");
        var cardImageContainerOpen, cardImageContainerClose = "",
            cardBoxClose = "",
            cardContentClose = "",
            cardScalableClose = "";
        if (separateCardBox) {
            var cardContentOpen, cardContentClass = "cardContent";
            options.cardLayout || (cardContentClass += " cardContent-shadow"), layoutManager.tv ? (cardContentOpen = '<div class="' + cardContentClass + '">', cardContentClose = "</div>") : (cardContentOpen = '<button type="button" class="clearButton ' + cardContentClass + ' itemAction" data-action="' + action + '">', cardContentClose = "</button>");
            var vibrantAttributes = options.vibrant && imgUrl && !vibrantSwatch ? ' data-vibrant="' + cardFooterId + '" data-swatch="db"' : "";
            if (vibrantAttributes && !browser.safari) {
                cardImageContainerOpen = '<div class="' + cardImageContainerClass + '">';
                var imgClass = "cardImage cardImage-img lazy";
                coveredImage && (imgClass += 1 === devicePixelRatio ? " coveredImage-noscale-img" : " coveredImage-img"), cardImageContainerOpen += '<img crossOrigin="Anonymous" class="' + imgClass + '"' + vibrantAttributes + ' data-src="' + imgUrl + '" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" />'
            } else cardImageContainerOpen = imgUrl ? '<div class="' + cardImageContainerClass + ' lazy"' + vibrantAttributes + ' data-src="' + imgUrl + '">' : '<div class="' + cardImageContainerClass + '">';
            var cardScalableClass = "cardScalable";
            layoutManager.tv && !options.cardLayout && (cardScalableClass += " card-focuscontent"), cardImageContainerOpen = '<div class="' + cardBoxClass + '"><div class="' + cardScalableClass + '"><div class="cardPadder-' + options.shape + '"></div>' + cardContentOpen + cardImageContainerOpen, cardBoxClose = "</div>", cardScalableClose = "</div>", cardImageContainerClose = "</div>"
        } else overlayButtons && !separateCardBox ? (cardImageContainerClass += " cardImageContainerClass-button", cardImageContainerOpen = imgUrl ? '<button type="button" data-action="' + action + '" class="itemAction ' + cardImageContainerClass + ' lazy" data-src="' + imgUrl + '">' : '<button type="button" data-action="' + action + '" class="itemAction ' + cardImageContainerClass + '">', cardImageContainerClose = "</button>", className += " forceRelative") : (cardImageContainerOpen = imgUrl ? '<div class="' + cardImageContainerClass + ' lazy" data-src="' + imgUrl + '">' : '<div class="' + cardImageContainerClass + '">', cardImageContainerClose = "</div>");
        var indicatorsHtml = "";
        if (indicatorsHtml += indicators.getSyncIndicator(item), indicatorsHtml += indicators.getTimerIndicator(item), indicatorsHtml += options.showGroupCount ? indicators.getChildCountIndicatorHtml(item, {
                minCount: 1
            }) : indicators.getPlayedIndicatorHtml(item), indicatorsHtml && (cardImageContainerOpen += '<div class="cardIndicators ' + options.shape + 'CardIndicators">' + indicatorsHtml + "</div>"), !imgUrl) {
            var defaultName = isUsingLiveTvNaming(item) ? item.Name : itemHelper.getDisplayName(item);
            cardImageContainerOpen += '<div class="cardText cardDefaultText">' + defaultName + "</div>"
        }
        var tagName = !layoutManager.tv && scalable || overlayButtons ? "div" : "button",
            nameWithPrefix = item.SortName || item.Name || "",
            prefix = nameWithPrefix.substring(0, Math.min(3, nameWithPrefix.length));
        prefix && (prefix = prefix.toUpperCase());
        var timerAttributes = "";
        item.TimerId && (timerAttributes += ' data-timerid="' + item.TimerId + '"'), item.SeriesTimerId && (timerAttributes += ' data-seriestimerid="' + item.SeriesTimerId + '"');
        var actionAttribute;
        "button" === tagName ? (className += " itemAction", actionAttribute = ' data-action="' + action + '"') : actionAttribute = "", "MusicAlbum" !== item.Type && "MusicArtist" !== item.Type && "Audio" !== item.Type && (className += " card-withuserdata");
        var positionTicksData = item.UserData && item.UserData.PlaybackPositionTicks ? ' data-positionticks="' + item.UserData.PlaybackPositionTicks + '"' : "",
            collectionIdData = options.collectionId ? ' data-collectionid="' + options.collectionId + '"' : "",
            playlistIdData = options.playlistId ? ' data-playlistid="' + options.playlistId + '"' : "",
            mediaTypeData = item.MediaType ? ' data-mediatype="' + item.MediaType + '"' : "",
            collectionTypeData = item.CollectionType ? ' data-collectiontype="' + item.CollectionType + '"' : "",
            channelIdData = item.ChannelId ? ' data-channelid="' + item.ChannelId + '"' : "",
            contextData = options.context ? ' data-context="' + options.context + '"' : "",
            parentIdData = options.parentId ? ' data-parentid="' + options.parentId + '"' : "";
        return "<" + tagName + ' data-index="' + index + '"' + timerAttributes + actionAttribute + ' data-isfolder="' + (item.IsFolder || !1) + '" data-serverid="' + (item.ServerId || options.serverId) + '" data-id="' + (item.Id || item.ItemId) + '" data-type="' + item.Type + '"' + mediaTypeData + collectionTypeData + channelIdData + positionTicksData + collectionIdData + playlistIdData + contextData + parentIdData + ' data-prefix="' + prefix + '" class="' + className + '">' + cardImageContainerOpen + innerCardFooter + cardImageContainerClose + cardContentClose + overlayButtons + cardScalableClose + outerCardFooter + cardBoxClose + "</" + tagName + ">"
    }

    function buildCards(items, options) {
        if (document.body.contains(options.itemsContainer)) {
            if (options.parentContainer) {
                if (!items.length) return void options.parentContainer.classList.add("hide");
                options.parentContainer.classList.remove("hide")
            }
            var html = buildCardsHtmlInternal(items, options);
            html ? (options.itemsContainer.cardBuilderHtml !== html && (options.itemsContainer.innerHTML = html, items.length < 50 ? options.itemsContainer.cardBuilderHtml = html : options.itemsContainer.cardBuilderHtml = null), imageLoader.lazyChildren(options.itemsContainer)) : (options.itemsContainer.innerHTML = html, options.itemsContainer.cardBuilderHtml = null), options.autoFocus && focusManager.autoFocus(options.itemsContainer, !0)
        }
    }

    function ensureIndicators(card, indicatorsElem) {
        if (indicatorsElem) return indicatorsElem;
        if (indicatorsElem = card.querySelector(".cardIndicators"), !indicatorsElem) {
            var cardImageContainer = card.querySelector(".cardImageContainer");
            indicatorsElem = document.createElement("div"), indicatorsElem.classList.add("cardIndicators"), cardImageContainer.appendChild(indicatorsElem)
        }
        return indicatorsElem
    }

    function updateUserData(card, userData) {
        var type = card.getAttribute("data-type"),
            enableCountIndicator = "Series" === type || "BoxSet" === type || "Season" === type,
            indicatorsElem = null,
            playedIndicator = null,
            countIndicator = null,
            itemProgressBar = null;
        userData.Played ? (playedIndicator = card.querySelector(".playedIndicator"), playedIndicator || (playedIndicator = document.createElement("div"), playedIndicator.classList.add("playedIndicator"), playedIndicator.classList.add("indicator"), indicatorsElem = ensureIndicators(card, indicatorsElem), indicatorsElem.appendChild(playedIndicator)), playedIndicator.innerHTML = '<i class="md-icon indicatorIcon">check</i>') : (playedIndicator = card.querySelector(".playedIndicator"), playedIndicator && playedIndicator.parentNode.removeChild(playedIndicator)), userData.UnplayedItemCount ? (countIndicator = card.querySelector(".countIndicator"), countIndicator || (countIndicator = document.createElement("div"), countIndicator.classList.add("countIndicator"), indicatorsElem = ensureIndicators(card, indicatorsElem), indicatorsElem.appendChild(countIndicator)), countIndicator.innerHTML = userData.UnplayedItemCount) : enableCountIndicator && (countIndicator = card.querySelector(".countIndicator"), countIndicator && countIndicator.parentNode.removeChild(countIndicator));
        var progressHtml = indicators.getProgressBarHtml({
            Type: type,
            UserData: userData,
            MediaType: "Video"
        });
        if (progressHtml) {
            if (itemProgressBar = card.querySelector(".itemProgressBar"), !itemProgressBar) {
                itemProgressBar = document.createElement("div"), itemProgressBar.classList.add("itemProgressBar");
                var innerCardFooter = card.querySelector(".innerCardFooter");
                if (!innerCardFooter) {
                    innerCardFooter = document.createElement("div"), innerCardFooter.classList.add("innerCardFooter");
                    var cardImageContainer = card.querySelector(".cardImageContainer");
                    cardImageContainer.appendChild(innerCardFooter)
                }
                innerCardFooter.appendChild(itemProgressBar)
            }
            itemProgressBar.innerHTML = progressHtml
        } else itemProgressBar = card.querySelector(".itemProgressBar"), itemProgressBar && itemProgressBar.parentNode.removeChild(itemProgressBar)
    }

    function onUserDataChanged(userData, scope) {
        for (var cards = (scope || document.body).querySelectorAll('.card-withuserdata[data-id="' + userData.ItemId + '"]'), i = 0, length = cards.length; i < length; i++) updateUserData(cards[i], userData)
    }

    function onTimerCreated(programId, newTimerId, itemsContainer) {
        for (var cells = itemsContainer.querySelectorAll('.card[data-id="' + programId + '"]'), i = 0, length = cells.length; i < length; i++) {
            var cell = cells[i],
                icon = cell.querySelector(".timerIndicator");
            if (!icon) {
                var indicatorsElem = ensureIndicators(cell);
                indicatorsElem.insertAdjacentHTML("beforeend", '<i class="md-icon timerIndicator indicatorIcon">&#xE061;</i>');
            }
            cell.setAttribute("data-timerid", newTimerId)
        }
    }

    function onTimerCancelled(id, itemsContainer) {
        for (var cells = itemsContainer.querySelectorAll('.card[data-timerid="' + id + '"]'), i = 0, length = cells.length; i < length; i++) {
            var cell = cells[i],
                icon = cell.querySelector(".timerIndicator");
            icon && icon.parentNode.removeChild(icon), cell.removeAttribute("data-timerid")
        }
    }

    function onSeriesTimerCancelled(id, itemsContainer) {
        for (var cells = itemsContainer.querySelectorAll('.card[data-seriestimerid="' + id + '"]'), i = 0, length = cells.length; i < length; i++) {
            var cell = cells[i],
                icon = cell.querySelector(".timerIndicator");
            icon && icon.parentNode.removeChild(icon), cell.removeAttribute("data-seriestimerid")
        }
    }
    var devicePixelRatio = window.devicePixelRatio || 1,
        numRandomColors = 5,
        uniqueFooterIndex = 0;
    return {
        getCardsHtml: getCardsHtml,
        buildCards: buildCards,
        onUserDataChanged: onUserDataChanged,
        getDefaultColorClass: getDefaultColorClass,
        onTimerCreated: onTimerCreated,
        onTimerCancelled: onTimerCancelled,
        onSeriesTimerCancelled: onSeriesTimerCancelled
    }
});