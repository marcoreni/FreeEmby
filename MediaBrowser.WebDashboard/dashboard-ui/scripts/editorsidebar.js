define(["datetime", "jQuery", "material-icons"], function(datetime, $) {
    "use strict";

    function getNode(item, folderState, selected) {
        var htmlName = getNodeInnerHtml(item),
            node = {
                id: item.Id,
                text: htmlName,
                state: {
                    opened: item.IsFolder && "open" == folderState,
                    selected: selected
                },
                li_attr: {
                    serveritemtype: item.Type,
                    collectiontype: item.CollectionType
                }
            };
        return item.IsFolder ? (node.children = [{
            text: "Loading...",
            icon: !1
        }], node.icon = !1) : node.icon = !1, node.state.opened && (node.li_attr.loadedFromServer = !0), selected && (selectedNodeId = item.Id), node
    }

    function getNodeInnerHtml(item) {
        var name = item.Name;
        item.Number && (name = item.Number + " - " + name), null != item.IndexNumber && "Season" != item.Type && (name = item.IndexNumber + " - " + name);
        var cssClass = "editorNode";
        "Offline" == item.LocationType && (cssClass += " offlineEditorNode");
        var htmlName = "<div class='" + cssClass + "'>";
        if (item.LockData && (htmlName += '<i class="md-icon">lock</i>'), htmlName += name, item.ImageTags && item.ImageTags.Primary || (htmlName += '<img src="css/images/editor/missingprimaryimage.png" title="' + Globalize.translate("MissingPrimaryImage") + '" />'), item.BackdropImageTags && item.BackdropImageTags.length || "Episode" !== item.Type && "Season" !== item.Type && "Audio" !== item.MediaType && "TvChannel" !== item.Type && "MusicAlbum" !== item.Type && (htmlName += '<img src="css/images/editor/missingbackdrop.png" title="' + Globalize.translate("MissingBackdropImage") + '" />'), item.ImageTags && item.ImageTags.Logo || "Movie" != item.Type && "Trailer" != item.Type && "Series" != item.Type && "MusicArtist" != item.Type && "BoxSet" != item.Type || (htmlName += '<img src="css/images/editor/missinglogo.png" title="' + Globalize.translate("MissingLogoImage") + '" />'), "Episode" == item.Type && "Virtual" == item.LocationType) try {
            item.PremiereDate && (new Date).getTime() >= datetime.parseISO8601Date(item.PremiereDate, !0).getTime() && (htmlName += '<img src="css/images/editor/missing.png" title="' + Globalize.translate("MissingEpisode") + '" />')
        } catch (err) {}
        return htmlName += "</div>"
    }

    function loadChildrenOfRootNode(page, scope, callback) {
        ApiClient.getLiveTvChannels({
            limit: 0
        }).then(function(result) {
            var nodes = [];
            nodes.push({
                id: "MediaFolders",
                text: Globalize.translate("HeaderMediaFolders"),
                state: {
                    opened: !0
                },
                li_attr: {
                    itemtype: "mediafolders",
                    loadedFromServer: !0
                },
                icon: !1
            }), result.TotalRecordCount && nodes.push({
                id: "livetv",
                text: Globalize.translate("HeaderLiveTV"),
                state: {
                    opened: !1
                },
                li_attr: {
                    itemtype: "livetv"
                },
                children: [{
                    text: "Loading...",
                    icon: !1
                }],
                icon: !1
            }), callback.call(scope, nodes), nodesToLoad.push("MediaFolders")
        })
    }

    function loadLiveTvChannels(service, openItems, callback) {
        ApiClient.getLiveTvChannels({
            ServiceName: service,
            AddCurrentProgram: !1
        }).then(function(result) {
            var nodes = result.Items.map(function(i) {
                var state = openItems.indexOf(i.Id) == -1 ? "closed" : "open";
                return getNode(i, state, !1)
            });
            callback(nodes)
        })
    }

    function loadMediaFolders(page, scope, openItems, callback) {
        ApiClient.getJSON(ApiClient.getUrl("Library/MediaFolders")).then(function(result) {
            var nodes = result.Items.map(function(n) {
                var state = openItems.indexOf(n.Id) == -1 ? "closed" : "open";
                return getNode(n, state, !1)
            });
            callback.call(scope, nodes);
            for (var i = 0, length = nodes.length; i < length; i++) nodes[i].state.opened && nodesToLoad.push(nodes[i].id)
        })
    }

    function loadNode(page, scope, node, openItems, selectedId, currentUser, callback) {
        var id = node.id;
        if ("#" == id) return void loadChildrenOfRootNode(page, scope, callback);
        if ("livetv" == id) return void loadLiveTvChannels(id, openItems, callback);
        if ("MediaFolders" == id) return void loadMediaFolders(page, scope, openItems, callback);
        var query = {
                ParentId: id,
                Fields: "Settings"
            },
            itemtype = node.li_attr.itemtype;
        "Season" != itemtype && "Series" != itemtype && (query.SortBy = "SortName"), ApiClient.getItems(Dashboard.getCurrentUserId(), query).then(function(result) {
            var nodes = result.Items.map(function(n) {
                var state = openItems.indexOf(n.Id) == -1 ? "closed" : "open";
                return getNode(n, state, n.Id == selectedId)
            });
            callback.call(scope, nodes);
            for (var i = 0, length = nodes.length; i < length; i++) nodes[i].state.opened && nodesToLoad.push(nodes[i].id)
        })
    }

    function scrollToNode(id) {
        var elem = $("#" + id)[0];
        elem && elem.scrollIntoView()
    }

    function initializeTree(page, currentUser, openItems, selectedId) {
        require(["jstree"], function() {
            initializeTreeInternal(page, currentUser, openItems, selectedId)
        })
    }

    function onNodeSelect(event, data) {
        var node = data.node,
            eventData = {
                id: node.id,
                itemType: node.li_attr.itemtype,
                serverItemType: node.li_attr.serveritemtype,
                collectionType: node.li_attr.collectiontype
            };
        "livetv" != eventData.itemType && "mediafolders" != eventData.itemType && this.dispatchEvent(new CustomEvent("itemclicked", {
            detail: eventData,
            bubbles: !0,
            cancelable: !1
        }))
    }

    function onNodeOpen(event, data) {
        var page = $(this).parents(".page")[0],
            node = data.node;
        node.children && node.children && loadNodesToLoad(page, node), node.li_attr && "#" != node.id && !node.li_attr.loadedFromServer && (node.li_attr.loadedFromServer = !0, $.jstree.reference(".libraryTree", page).load_node(node.id, loadNodeCallback))
    }

    function onNodeLoad(event, data) {
        var page = $(this).parents(".page")[0],
            node = data.node;
        node.children && node.children && loadNodesToLoad(page, node), node.li_attr && "#" != node.id && !node.li_attr.loadedFromServer && (node.li_attr.loadedFromServer = !0, $.jstree.reference(".libraryTree", page).load_node(node.id, loadNodeCallback))
    }

    function initializeTreeInternal(page, currentUser, openItems, selectedId) {
        nodesToLoad = [], selectedNodeId = null, $.jstree.destroy(), $(".libraryTree", page).jstree({
            plugins: ["wholerow"],
            core: {
                check_callback: !0,
                data: function(node, callback) {
                    loadNode(page, this, node, openItems, selectedId, currentUser, callback)
                },
                themes: {
                    variant: "large"
                }
            }
        }).off("select_node.jstree", onNodeSelect).on("select_node.jstree", onNodeSelect).off("open_node.jstree", onNodeOpen).on("open_node.jstree", onNodeOpen).off("load_node.jstree", onNodeLoad).on("load_node.jstree", onNodeLoad)
    }

    function loadNodesToLoad(page, node) {
        for (var children = node.children, i = 0, length = children.length; i < length; i++) {
            var child = children[i];
            nodesToLoad.indexOf(child) != -1 && (nodesToLoad = nodesToLoad.filter(function(n) {
                return n != child
            }), $.jstree.reference(".libraryTree", page).load_node(child, loadNodeCallback))
        }
    }

    function loadNodeCallback(node) {
        selectedNodeId && node.children && node.children.indexOf(selectedNodeId) != -1 && setTimeout(function() {
            scrollToNode(selectedNodeId)
        }, 500)
    }

    function updateEditorNode(page, item) {
        var elem = $("#" + item.Id + ">a", page)[0];
        if (null != elem && ($(".editorNode", elem).remove(), $(elem).append(getNodeInnerHtml(item)), item.IsFolder)) {
            var tree = jQuery.jstree._reference(".libraryTree"),
                currentNode = tree._get_node(null, !1);
            tree.refresh(currentNode)
        }
    }

    function setCurrentItemId(id) {
        itemId = id
    }

    function getCurrentItemId() {
        if (itemId) return itemId;
        var url = window.location.hash || window.location.href;
        return getParameterByName("id", url)
    }
    var selectedNodeId, nodesToLoad = [];
    $(document).on("itemsaved", ".metadataEditorPage", function(e, item) {
        updateEditorNode(this, item)
    }).on("pagebeforeshow", ".metadataEditorPage", function() {
        require(["css!css/metadataeditor.css"])
    }).on("pagebeforeshow", ".metadataEditorPage", function() {
        var page = this;
        Dashboard.getCurrentUser().then(function(user) {
            var id = getCurrentItemId();
            id ? ApiClient.getAncestorItems(id, user.Id).then(function(ancestors) {
                var ids = ancestors.map(function(i) {
                    return i.Id
                });
                initializeTree(page, user, ids, id)
            }) : initializeTree(page, user, [])
        })
    }).on("pagebeforehide", ".metadataEditorPage", function() {
        var page = this;
        $(".libraryTree", page).off("select_node.jstree", onNodeSelect).off("open_node.jstree", onNodeOpen).off("load_node.jstree", onNodeLoad)
    });
    var itemId;
    window.MetadataEditor = {
        getItemPromise: function() {
            var currentItemId = getCurrentItemId();
            return currentItemId ? ApiClient.getItem(Dashboard.getCurrentUserId(), currentItemId) : ApiClient.getRootFolder(Dashboard.getCurrentUserId())
        },
        getCurrentItemId: getCurrentItemId,
        setCurrentItemId: setCurrentItemId
    }
});