define(["dialogHelper", "connectionManager", "loading", "dom", "layoutManager", "focusManager", "globalize", "scrollHelper", "imageLoader", "require", "cardStyle", "formDialogStyle", "emby-button", "paper-icon-button-light", "css!./imageeditor"], function(dialogHelper, connectionManager, loading, dom, layoutManager, focusManager, globalize, scrollHelper, imageLoader, require) {
    "use strict";

    function getBaseRemoteOptions() {
        var options = {};
        return options.itemId = currentItem.Id, options
    }

    function reload(page, item, focusContext) {
        loading.show();
        var apiClient;
        item ? (apiClient = connectionManager.getApiClient(item.ServerId), reloadItem(page, item, apiClient, focusContext)) : (apiClient = connectionManager.getApiClient(currentItem.ServerId), apiClient.getItem(apiClient.getCurrentUserId(), currentItem.Id).then(function(item) {
            reloadItem(page, item, apiClient, focusContext)
        }))
    }

    function addListeners(container, className, eventName, fn) {
        container.addEventListener(eventName, function(e) {
            var elem = dom.parentWithClass(e.target, className);
            elem && fn.call(elem, e)
        })
    }

    function reloadItem(page, item, apiClient, focusContext) {
        currentItem = item, apiClient.getRemoteImageProviders(getBaseRemoteOptions()).then(function(providers) {
            for (var btnBrowseAllImages = page.querySelectorAll(".btnBrowseAllImages"), i = 0, length = btnBrowseAllImages.length; i < length; i++) providers.length ? btnBrowseAllImages[i].classList.remove("hide") : btnBrowseAllImages[i].classList.add("hide");
            apiClient.getItemImageInfos(currentItem.Id).then(function(imageInfos) {
                renderStandardImages(page, apiClient, item, imageInfos, providers), renderBackdrops(page, apiClient, item, imageInfos, providers), renderScreenshots(page, apiClient, item, imageInfos, providers), loading.hide(), layoutManager.tv && focusManager.autoFocus(focusContext || page)
            })
        })
    }

    function getImageUrl(item, apiClient, type, index, options) {
        return options = options || {}, options.type = type, options.index = index, "Backdrop" === type ? options.tag = item.BackdropImageTags[index] : "Screenshot" === type ? options.tag = item.ScreenshotImageTags[index] : "Primary" === type ? options.tag = item.PrimaryImageTag || item.ImageTags[type] : options.tag = item.ImageTags[type], apiClient.getScaledImageUrl(item.Id || item.ItemId, options)
    }

    function getCardHtml(image, index, numImages, apiClient, imageProviders, imageSize, tagName, enableFooterButtons) {
        var html = "",
            cssClass = "card scalableCard imageEditorCard",
            cardBoxCssClass = "cardBox visualCardBox";
        cssClass += " backdropCard backdropCard-scalable", "button" === tagName ? (cssClass += " btnImageCard", layoutManager.tv && (cssClass += " card-focusscale", cardBoxCssClass += " cardBox-focustransform"), cardBoxCssClass += " card-focuscontent", html += '<button type="button" class="' + cssClass + '"') : html += '<div class="' + cssClass + '"', html += ' data-id="' + currentItem.Id + '" data-serverid="' + apiClient.serverId() + '" data-index="' + index + '" data-numimages="' + numImages + '" data-imagetype="' + image.ImageType + '" data-providers="' + imageProviders.length + '"', html += ">", html += '<div class="' + cardBoxCssClass + '">', html += '<div class="cardScalable visualCardBox-cardScalable" style="background-color:transparent;">', html += '<div class="cardPadder-backdrop"></div>', html += '<div class="cardContent">';
        var imageUrl = getImageUrl(currentItem, apiClient, image.ImageType, image.ImageIndex, {
            maxWidth: imageSize
        });
        return html += '<div class="cardImageContainer" style="background-image:url(\'' + imageUrl + "');background-position:center bottom;\"></div>", html += "</div>", html += "</div>", html += '<div class="cardFooter visualCardBox-cardFooter">', html += '<h3 class="cardText cardTextCentered" style="margin:0;">' + image.ImageType + "</h3>", html += '<div class="cardText cardText-secondary cardTextCentered">', html += image.Width && image.Height ? image.Width + " X " + image.Height : "&nbsp;", html += "</div>", enableFooterButtons && (html += '<div class="cardText cardTextCentered">', "Backdrop" === image.ImageType || "Screenshot" === image.ImageType ? (html += index > 0 ? '<button type="button" is="paper-icon-button-light" class="btnMoveImage autoSize" data-imagetype="' + image.ImageType + '" data-index="' + image.ImageIndex + '" data-newindex="' + (image.ImageIndex - 1) + '" title="' + globalize.translate("sharedcomponents#MoveLeft") + '"><i class="md-icon">chevron_left</i></button>' : '<button type="button" is="paper-icon-button-light" class="autoSize" disabled title="' + globalize.translate("sharedcomponents#MoveLeft") + '"><i class="md-icon">chevron_left</i></button>', html += index < numImages - 1 ? '<button type="button" is="paper-icon-button-light" class="btnMoveImage autoSize" data-imagetype="' + image.ImageType + '" data-index="' + image.ImageIndex + '" data-newindex="' + (image.ImageIndex + 1) + '" title="' + globalize.translate("sharedcomponents#MoveRight") + '"><i class="md-icon">chevron_right</i></button>' : '<button type="button" is="paper-icon-button-light" class="autoSize" disabled title="' + globalize.translate("sharedcomponents#MoveRight") + '"><i class="md-icon">chevron_right</i></button>') : imageProviders.length && (html += '<button type="button" is="paper-icon-button-light" data-imagetype="' + image.ImageType + '" class="btnSearchImages autoSize" title="' + globalize.translate("sharedcomponents#Search") + '"><i class="md-icon">search</i></button>'), html += '<button type="button" is="paper-icon-button-light" data-imagetype="' + image.ImageType + '" data-index="' + (null != image.ImageIndex ? image.ImageIndex : "null") + '" class="btnDeleteImage autoSize" title="' + globalize.translate("sharedcomponents#Delete") + '"><i class="md-icon">delete</i></button>', html += "</div>"), html += "</div>", html += "</div>", html += "</div>", html += "</" + tagName + ">"
    }

    function deleteImage(context, itemId, type, index, apiClient, enableConfirmation) {
        var afterConfirm = function() {
            apiClient.deleteItemImage(itemId, type, index).then(function() {
                hasChanges = !0, reload(context)
            })
        };
        return enableConfirmation ? void require(["confirm"], function(confirm) {
            confirm({
                text: globalize.translate("sharedcomponents#ConfirmDeleteImage"),
                confirmText: globalize.translate("sharedcomponents#Delete"),
                primary: "cancel"
            }).then(afterConfirm)
        }) : void afterConfirm()
    }

    function moveImage(context, apiClient, itemId, type, index, newIndex, focusContext) {
        apiClient.updateItemImageIndex(itemId, type, index, newIndex).then(function() {
            hasChanges = !0, reload(context, null, focusContext)
        }, function() {
            require(["alert"], function(alert) {
                alert(globalize.translate("sharedcomponents#DefaultErrorMessage"))
            })
        })
    }

    function renderImages(page, item, apiClient, images, imageProviders, elem) {
        var html = "",
            imageSize = 300,
            windowSize = dom.getWindowSize();
        windowSize.innerWidth >= 1280 && (imageSize = Math.round(windowSize.innerWidth / 4));
        for (var tagName = layoutManager.tv ? "button" : "div", enableFooterButtons = !layoutManager.tv, i = 0, length = images.length; i < length; i++) {
            var image = images[i];
            html += getCardHtml(image, i, length, apiClient, imageProviders, imageSize, tagName, enableFooterButtons)
        }
        elem.innerHTML = html, imageLoader.lazyChildren(elem)
    }

    function renderStandardImages(page, apiClient, item, imageInfos, imageProviders) {
        var images = imageInfos.filter(function(i) {
            return "Screenshot" !== i.ImageType && "Backdrop" !== i.ImageType && "Chapter" !== i.ImageType
        });
        renderImages(page, item, apiClient, images, imageProviders, page.querySelector("#images"))
    }

    function renderBackdrops(page, apiClient, item, imageInfos, imageProviders) {
        var images = imageInfos.filter(function(i) {
            return "Backdrop" === i.ImageType
        }).sort(function(a, b) {
            return a.ImageIndex - b.ImageIndex
        });
        images.length ? (page.querySelector("#backdropsContainer", page).classList.remove("hide"), renderImages(page, item, apiClient, images, imageProviders, page.querySelector("#backdrops"))) : page.querySelector("#backdropsContainer", page).classList.add("hide")
    }

    function renderScreenshots(page, apiClient, item, imageInfos, imageProviders) {
        var images = imageInfos.filter(function(i) {
            return "Screenshot" === i.ImageType
        }).sort(function(a, b) {
            return a.ImageIndex - b.ImageIndex
        });
        images.length ? (page.querySelector("#screenshotsContainer", page).classList.remove("hide"), renderImages(page, item, apiClient, images, imageProviders, page.querySelector("#screenshots"))) : page.querySelector("#screenshotsContainer", page).classList.add("hide")
    }

    function showImageDownloader(page, imageType) {
        require(["components/imagedownloader/imagedownloader"], function(ImageDownloader) {
            ImageDownloader.show(currentItem.Id, currentItem.Type, imageType).then(function() {
                hasChanges = !0, reload(page)
            })
        }, function() {
            require(["alert"], function(alert) {
                alert("This feature is coming soon to Emby Theater.")
            })
        })
    }

    function showActionSheet(context, imageCard) {
        var itemId = imageCard.getAttribute("data-id"),
            serverId = imageCard.getAttribute("data-serverid"),
            apiClient = connectionManager.getApiClient(serverId),
            type = imageCard.getAttribute("data-imagetype"),
            index = parseInt(imageCard.getAttribute("data-index")),
            providerCount = parseInt(imageCard.getAttribute("data-providers")),
            numImages = parseInt(imageCard.getAttribute("data-numimages"));
        require(["actionsheet"], function(actionSheet) {
            var commands = [];
            commands.push({
                name: globalize.translate("sharedcomponents#Delete"),
                id: "delete"
            }), "Backdrop" !== type && "Screenshot" !== type || (index > 0 && commands.push({
                name: globalize.translate("sharedcomponents#MoveLeft"),
                id: "moveleft"
            }), index < numImages - 1 && commands.push({
                name: globalize.translate("sharedcomponents#MoveRight"),
                id: "moveright"
            })), providerCount && commands.push({
                name: globalize.translate("sharedcomponents#Search"),
                id: "search"
            }), actionSheet.show({
                items: commands,
                positionTo: imageCard
            }).then(function(id) {
                switch (id) {
                    case "delete":
                        deleteImage(context, itemId, type, index, apiClient, !1);
                        break;
                    case "search":
                        showImageDownloader(context, type);
                        break;
                    case "moveleft":
                        moveImage(context, apiClient, itemId, type, index, index - 1, dom.parentWithClass(imageCard, "itemsContainer"));
                        break;
                    case "moveright":
                        moveImage(context, apiClient, itemId, type, index, index + 1, dom.parentWithClass(imageCard, "itemsContainer"))
                }
            })
        })
    }

    function initEditor(context, options) {
        addListeners(context, "btnOpenUploadMenu", "click", function() {
            var imageType = this.getAttribute("data-imagetype");
            require(["components/imageuploader/imageuploader"], function(imageUploader) {
                imageUploader.show(currentItem.Id, {
                    theme: options.theme,
                    imageType: imageType
                }).then(function(hasChanged) {
                    hasChanged && (hasChanges = !0, reload(context))
                })
            }, function() {
                require(["alert"], function(alert) {
                    alert("This feature is coming soon to Emby Theater.")
                })
            })
        }), addListeners(context, "btnSearchImages", "click", function() {
            showImageDownloader(context, this.getAttribute("data-imagetype"))
        }), addListeners(context, "btnBrowseAllImages", "click", function() {
            showImageDownloader(context, this.getAttribute("data-imagetype") || "Primary")
        }), addListeners(context, "btnImageCard", "click", function() {
            showActionSheet(context, this)
        }), addListeners(context, "btnDeleteImage", "click", function() {
            var type = this.getAttribute("data-imagetype"),
                index = this.getAttribute("data-index");
            index = "null" === index ? null : parseInt(index);
            var apiClient = connectionManager.getApiClient(currentItem.ServerId);
            deleteImage(context, currentItem.Id, type, index, apiClient, !0)
        }), addListeners(context, "btnMoveImage", "click", function() {
            var type = this.getAttribute("data-imagetype"),
                index = this.getAttribute("data-index"),
                newIndex = this.getAttribute("data-newindex"),
                apiClient = connectionManager.getApiClient(currentItem.ServerId);
            moveImage(context, apiClient, currentItem.Id, type, index, newIndex, dom.parentWithClass(this, "itemsContainer"))
        })
    }

    function showEditor(options, resolve, reject) {
        var itemId = options.itemId,
            serverId = options.serverId;
        loading.show(), require(["text!./imageeditor.template.html"], function(template) {
            var apiClient = connectionManager.getApiClient(serverId);
            apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(function(item) {
                var dialogOptions = {
                    removeOnClose: !0
                };
                layoutManager.tv ? dialogOptions.size = "fullscreen" : dialogOptions.size = "fullscreen-border";
                var dlg = dialogHelper.createDialog(dialogOptions);
                dlg.classList.add("formDialog"), dlg.innerHTML = globalize.translateDocument(template, "sharedcomponents"), layoutManager.tv && scrollHelper.centerFocus.on(dlg, !1), initEditor(dlg, options), dlg.addEventListener("close", function() {
                    layoutManager.tv && scrollHelper.centerFocus.off(dlg, !1), loading.hide(), hasChanges ? resolve() : reject()
                }), dialogHelper.open(dlg), reload(dlg, item), dlg.querySelector(".btnCancel").addEventListener("click", function() {
                    dialogHelper.close(dlg)
                })
            })
        })
    }
    var currentItem, hasChanges = !1;
    return {
        show: function(options) {
            return new Promise(function(resolve, reject) {
                hasChanges = !1, showEditor(options, resolve, reject)
            })
        }
    }
});