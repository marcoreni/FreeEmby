define(["viewcontainer", "focusManager", "queryString", "layoutManager"], function(viewcontainer, focusManager, queryString, layoutManager) {
    "use strict";

    function onViewChange(view, options, isRestore) {
        var lastView = currentView;
        lastView && dispatchViewEvent(lastView, "viewhide"), currentView = view;
        var eventDetail = getViewEventDetail(view, options, isRestore);
        isRestore ? layoutManager.mobile || (view.activeElement && document.body.contains(view.activeElement) && focusManager.isCurrentlyFocusable(view.activeElement) ? focusManager.focus(view.activeElement) : focusManager.autoFocus(view)) : options.autoFocus !== !1 && focusManager.autoFocus(view), view.dispatchEvent(new CustomEvent("viewshow", eventDetail)), dispatchPageEvents && view.dispatchEvent(new CustomEvent("pageshow", eventDetail))
    }

    function getProperties(view) {
        var props = view.getAttribute("data-properties");
        return props ? props.split(",") : []
    }

    function dispatchViewEvent(view, eventName, isRestored, isCancellable) {
        var eventDetail = {
                type: view.getAttribute("data-type"),
                isRestored: isRestored,
                properties: getProperties(view)
            },
            eventResult = view.dispatchEvent(new CustomEvent(eventName, {
                detail: eventDetail,
                bubbles: !0,
                cancelable: isCancellable || !1
            }));
        return dispatchPageEvents && view.dispatchEvent(new CustomEvent(eventName.replace("view", "page"), {
            detail: eventDetail,
            bubbles: !0,
            cancelable: !1
        })), eventResult
    }

    function getViewEventDetail(view, options, isRestore) {
        var url = options.url,
            index = url.indexOf("?"),
            params = index === -1 ? {} : queryString.parse(url.substring(index + 1));
        return {
            detail: {
                type: view.getAttribute("data-type"),
                properties: getProperties(view),
                params: params,
                isRestored: isRestore,
                state: options.state,
                options: options.options || {}
            },
            bubbles: !0,
            cancelable: !1
        }
    }

    function resetCachedViews() {
        viewcontainer.reset()
    }

    function ViewManager() {}
    var currentView, dispatchPageEvents;
    return viewcontainer.setOnBeforeChange(function(newView, isRestored, options) {
        var lastView = currentView;
        if (lastView) {
            dispatchViewEvent(lastView, "viewbeforehide", null, !0)
        }
        if (!newView.initComplete) {
            newView.initComplete = !0;
            var eventDetail = getViewEventDetail(newView, options, !1);
            if (options.controllerFactory) {
                new options.controllerFactory(newView, eventDetail.detail.params)
            }
            options.controllerFactory && !dispatchPageEvents || dispatchViewEvent(newView, "viewinit")
        }
        dispatchViewEvent(newView, "viewbeforeshow", isRestored)
    }), document.addEventListener("skinunload", resetCachedViews), ViewManager.prototype.loadView = function(options) {
        var lastView = currentView;
        lastView && (lastView.activeElement = document.activeElement), options.cancel || viewcontainer.loadView(options).then(function(view) {
            onViewChange(view, options)
        })
    }, ViewManager.prototype.tryRestoreView = function(options, onViewChanging) {
        return options.cancel ? Promise.reject({
            cancelled: !0
        }) : (currentView && (currentView.activeElement = document.activeElement), viewcontainer.tryRestoreView(options).then(function(view) {
            onViewChanging(), onViewChange(view, options, !0)
        }))
    }, ViewManager.prototype.currentView = function() {
        return currentView
    }, ViewManager.prototype.dispatchPageEvents = function(value) {
        dispatchPageEvents = value
    }, new ViewManager
});