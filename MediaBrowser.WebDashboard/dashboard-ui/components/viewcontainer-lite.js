define(["browser", "dom", "layoutManager", "css!bower_components/emby-webcomponents/viewmanager/viewcontainer-lite"], function(browser, dom, layoutManager) {
    "use strict";

    function enableAnimation() {
        return !browser.tv && (!forceDisableAnimation && (!(window.MainActivity && window.MainActivity.getChromeVersion() <= 53) && browser.supportsCssAnimation()))
    }

    function loadView(options) {
        if (!options.cancel) {
            cancelActiveAnimations();
            var selected = selectedPageIndex,
                previousAnimatable = selected == -1 ? null : allPages[selected],
                pageIndex = selected + 1;
            pageIndex >= pageContainerCount && (pageIndex = 0);
            var newViewInfo = normalizeNewView(options),
                newView = newViewInfo.elem,
                dependencies = "string" == typeof newView ? null : newView.getAttribute("data-require");
            dependencies = dependencies ? dependencies.split(",") : [];
            var isPluginpage = options.url.toLowerCase().indexOf("/configurationpage?") != -1;
            return isPluginpage && (dependencies.push("jqmpopup"), dependencies.push("legacy/dashboard"), dependencies.push("legacy/selectmenu"), dependencies.push("jqmlistview"), dependencies.push("fnchecked")), (isPluginpage || newView.classList && newView.classList.contains("type-interior")) && (dependencies.push("scripts/notifications"), dependencies.push("css!css/notifications.css"), dependencies.push("dashboardcss")), new Promise(function(resolve, reject) {
                var dependencyNames = dependencies.join(",");
                require(dependencies, function() {
                    var currentPage = allPages[pageIndex];
                    currentPage && triggerDestroy(currentPage);
                    var view = newView;
                    "string" == typeof view && (view = document.createElement("div"), view.innerHTML = newView), view.classList.add("mainAnimatedPage"), currentPage ? newViewInfo.hasScript && window.$ ? (view = $(view).appendTo(mainAnimatedPages)[0], mainAnimatedPages.removeChild(currentPage)) : mainAnimatedPages.replaceChild(view, currentPage) : newViewInfo.hasScript && window.$ ? view = $(view).appendTo(mainAnimatedPages)[0] : mainAnimatedPages.appendChild(view), "string" != typeof newView && enhanceNewView(dependencyNames, view), options.type && view.setAttribute("data-type", options.type);
                    var properties = [];
                    options.fullscreen && properties.push("fullscreen"), properties.length && view.setAttribute("data-properties", properties.join(","));
                    var animatable = view;
                    allPages[pageIndex] = view, onBeforeChange && onBeforeChange(view, !1, options), beforeAnimate(allPages, pageIndex, selected), animate(animatable, previousAnimatable, options.transition, options.isBack).then(function() {
                        selectedPageIndex = pageIndex, currentUrls[pageIndex] = options.url, !options.cancel && previousAnimatable && afterAnimate(allPages, pageIndex), window.IntersectionObserver || document.dispatchEvent(new CustomEvent("scroll", {})), window.$ && ($.mobile = $.mobile || {}, $.mobile.activePage = view), resolve(view)
                    })
                })
            })
        }
    }

    function enhanceNewView(dependencyNames, newView) {
        var hasJqm = dependencyNames.indexOf("jqm") !== -1;
        hasJqm && window.$ && $(newView).trigger("create")
    }

    function replaceAll(str, find, replace) {
        return str.split(find).join(replace)
    }

    function parseHtml(html, hasScript) {
        hasScript && (html = replaceAll(html, "<!--<script", "<script"), html = replaceAll(html, "</script>-->", "</script>"));
        var wrapper = document.createElement("div");
        return wrapper.innerHTML = html, wrapper.querySelector('div[data-role="page"]')
    }

    function normalizeNewView(options) {
        if (options.view.indexOf('data-role="page"') == -1) return options.view;
        var hasScript = options.view.indexOf("<script") != -1,
            elem = parseHtml(options.view, hasScript);
        return hasScript && (hasScript = null != elem.querySelector("script")), {
            elem: elem,
            hasScript: hasScript
        }
    }

    function beforeAnimate(allPages, newPageIndex, oldPageIndex) {
        for (var i = 0, length = allPages.length; i < length; i++) newPageIndex === i || oldPageIndex === i || allPages[i].classList.add("hide")
    }

    function afterAnimate(allPages, newPageIndex) {
        for (var i = 0, length = allPages.length; i < length; i++) newPageIndex === i || allPages[i].classList.add("hide")
    }

    function animate(newAnimatedPage, oldAnimatedPage, transition, isBack) {
        if (enableAnimation() && oldAnimatedPage) {
            if ("slide" === transition) return slide(newAnimatedPage, oldAnimatedPage, transition, isBack);
            if ("fade" === transition) return fade(newAnimatedPage, oldAnimatedPage, transition, isBack);
            clearAnimation(newAnimatedPage), oldAnimatedPage && clearAnimation(oldAnimatedPage)
        }
        return Promise.resolve()
    }

    function clearAnimation(elem) {
        setAnimation(elem, "none")
    }

    function slide(newAnimatedPage, oldAnimatedPage, transition, isBack) {
        return new Promise(function(resolve, reject) {
            var duration = 450,
                animations = [];
            oldAnimatedPage && (isBack ? setAnimation(oldAnimatedPage, "view-slideright-r " + duration + "ms ease-out normal both") : setAnimation(oldAnimatedPage, "view-slideleft-r " + duration + "ms ease-out normal both"), animations.push(oldAnimatedPage)), isBack ? setAnimation(newAnimatedPage, "view-slideright " + duration + "ms ease-out normal both") : setAnimation(newAnimatedPage, "view-slideleft " + duration + "ms ease-out normal both"), animations.push(newAnimatedPage), currentAnimations = animations;
            var onAnimationComplete = function() {
                dom.removeEventListener(newAnimatedPage, dom.whichAnimationEvent(), onAnimationComplete, {
                    once: !0
                }), resolve()
            };
            dom.addEventListener(newAnimatedPage, dom.whichAnimationEvent(), onAnimationComplete, {
                once: !0
            })
        })
    }

    function fade(newAnimatedPage, oldAnimatedPage, transition, isBack) {
        return new Promise(function(resolve, reject) {
            var duration = layoutManager.tv ? 450 : 160,
                animations = [];
            newAnimatedPage.style.opacity = 0, setAnimation(newAnimatedPage, "view-fadein " + duration + "ms ease-in normal both"), animations.push(newAnimatedPage), oldAnimatedPage && (setAnimation(oldAnimatedPage, "view-fadeout " + duration + "ms ease-out normal both"), animations.push(oldAnimatedPage)), currentAnimations = animations;
            var onAnimationComplete = function() {
                dom.removeEventListener(newAnimatedPage, dom.whichAnimationEvent(), onAnimationComplete, {
                    once: !0
                }), resolve()
            };
            dom.addEventListener(newAnimatedPage, dom.whichAnimationEvent(), onAnimationComplete, {
                once: !0
            })
        })
    }

    function setAnimation(elem, value) {
        requestAnimationFrame(function() {
            elem.style.animation = value
        })
    }

    function cancelActiveAnimations() {
        for (var animations = currentAnimations, i = 0, length = animations.length; i < length; i++) animations[i].animation = "none"
    }

    function setOnBeforeChange(fn) {
        onBeforeChange = fn
    }

    function tryRestoreView(options) {
        var url = options.url,
            index = currentUrls.indexOf(url);
        if (index != -1) {
            var animatable = allPages[index],
                view = animatable;
            if (view) {
                if (options.cancel) return;
                cancelActiveAnimations();
                var selected = selectedPageIndex,
                    previousAnimatable = selected == -1 ? null : allPages[selected];
                return onBeforeChange && onBeforeChange(view, !0, options), beforeAnimate(allPages, index, selected), animatable.classList.remove("hide"), animate(animatable, previousAnimatable, options.transition, options.isBack).then(function() {
                    return selectedPageIndex = index, !options.cancel && previousAnimatable && afterAnimate(allPages, index), document.dispatchEvent(new CustomEvent("scroll", {})), window.$ && ($.mobile = $.mobile || {}, $.mobile.activePage = view), view
                })
            }
        }
        return Promise.reject()
    }

    function triggerDestroy(view) {
        view.dispatchEvent(new CustomEvent("viewdestroy", {}))
    }

    function reset() {
        allPages = [], currentUrls = [], mainAnimatedPages.innerHTML = "", selectedPageIndex = -1
    }
    var onBeforeChange, mainAnimatedPages = document.querySelector(".mainAnimatedPages"),
        allPages = [],
        currentUrls = [],
        pageContainerCount = 3,
        selectedPageIndex = -1,
        forceDisableAnimation = navigator.userAgent.toLowerCase().indexOf("embytheaterpi") !== -1,
        currentAnimations = [];
    return reset(), mainAnimatedPages.classList.remove("hide"), {
        loadView: loadView,
        tryRestoreView: tryRestoreView,
        reset: reset,
        setOnBeforeChange: setOnBeforeChange
    }
});