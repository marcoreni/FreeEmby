var SocialShareKit = function() {
    function init(opts) {
        return wrap(opts).share()
    }

    function ready(fn) {
        "loading" != document.readyState ? fn() : document.addEventListener ? document.addEventListener("DOMContentLoaded", fn) : document.attachEvent("onreadystatechange", function() {
            "loading" != document.readyState && fn()
        })
    }

    function $(selector) {
        return document.querySelectorAll(selector)
    }

    function each(elements, fn) {
        for (var i = 0; i < elements.length; i++) fn(elements[i], i)
    }

    function addEventListener(el, eventName, handler) {
        el.addEventListener ? el.addEventListener(eventName, handler) : el.attachEvent("on" + eventName, function() {
            handler.call(el)
        })
    }

    function removeEventListener(el, eventName, handler) {
        el.removeEventListener ? el.removeEventListener(eventName, handler) : el.detachEvent("on" + eventName, handler)
    }

    function elSupportsShare(el) {
        return el.className.match(supportsShare)
    }

    function preventDefault(e) {
        var evt = e || window.event;
        return evt.preventDefault ? evt.preventDefault() : (evt.returnValue = !1, evt.cancelBubble = !0), evt.currentTarget || evt.srcElement
    }

    function winOpen(url) {
        var width = 575,
            height = 400,
            left = document.documentElement.clientWidth / 2 - width / 2,
            top = (document.documentElement.clientHeight - height) / 2,
            opts = "status=1,resizable=yes,width=" + width + ",height=" + height + ",top=" + top + ",left=" + left,
            win = window.open(url, "", opts);
        return win.focus(), win
    }

    function getUrl(options, network, el) {
        var url, dataOpts = getDataOpts(options, network, el),
            shareUrl = getShareUrl(options, network, el, dataOpts),
            title = "undefined" != typeof dataOpts.title ? dataOpts.title : getTitle(network),
            text = "undefined" != typeof dataOpts.text ? dataOpts.text : getText(network),
            image = dataOpts.image ? dataOpts.image : getMetaContent("og:image"),
            via = "undefined" != typeof dataOpts.via ? dataOpts.via : getMetaContent("twitter:site"),
            paramsObj = {
                shareUrl: shareUrl,
                title: title,
                text: text,
                image: image,
                via: via,
                options: options,
                shareUrlEncoded: function() {
                    return encodeURIComponent(this.shareUrl)
                }
            };
        switch (network) {
            case "facebook":
                url = "https://www.facebook.com/share.php?u=" + paramsObj.shareUrlEncoded();
                break;
            case "twitter":
                url = "https://twitter.com/intent/tweet?url=" + paramsObj.shareUrlEncoded() + "&text=" + encodeURIComponent(title + (text && title ? " - " : "") + text), via && (url += "&via=" + via.replace("@", ""));
                break;
            case "google-plus":
                url = "https://plus.google.com/share?url=" + paramsObj.shareUrlEncoded();
                break;
            case "pinterest":
                url = "https://pinterest.com/pin/create/button/?url=" + paramsObj.shareUrlEncoded() + "&description=" + encodeURIComponent(text), image && (url += "&media=" + encodeURIComponent(image));
                break;
            case "tumblr":
                url = "https://www.tumblr.com/share/link?url=" + paramsObj.shareUrlEncoded() + "&name=" + encodeURIComponent(title) + "&description=" + encodeURIComponent(text);
                break;
            case "linkedin":
                url = "https://www.linkedin.com/shareArticle?mini=true&url=" + paramsObj.shareUrlEncoded() + "&title=" + encodeURIComponent(title) + "&summary=" + encodeURIComponent(text);
                break;
            case "vk":
                url = "https://vkontakte.ru/share.php?url=" + paramsObj.shareUrlEncoded();
                break;
            case "email":
                url = "mailto:?subject=" + encodeURIComponent(title) + "&body=" + encodeURIComponent(title + "\n" + shareUrl + "\n\n" + text + "\n")
        }
        return paramsObj.networkUrl = url, options.onBeforeOpen && options.onBeforeOpen(el, network, paramsObj), paramsObj.networkUrl
    }

    function getShareUrl(options, network, el, dataOpts) {
        return dataOpts = dataOpts || getDataOpts(options, network, el), dataOpts.url || window.location.href
    }

    function getTitle(network) {
        var title;
        return "twitter" == network && (title = getMetaContent("twitter:title")), title || document.title
    }

    function getText(network) {
        var text;
        return "twitter" == network && (text = getMetaContent("twitter:description")), text || getMetaContent("description")
    }

    function getMetaContent(tagName, attr) {
        var text, tag = $("meta[" + (attr ? attr : 0 === tagName.indexOf("og:") ? "property" : "name") + '="' + tagName + '"]');
        return tag.length && (text = tag[0].getAttribute("content") || ""), text || ""
    }

    function getDataOpts(options, network, el) {
        var optValue, optKey, dataKey, a, validOpts = ["url", "title", "text", "image"],
            opts = {},
            parent = el.parentNode;
        "twitter" == network && validOpts.push("via");
        for (a in validOpts) optKey = validOpts[a], dataKey = "data-" + optKey, optValue = el.getAttribute(dataKey) || parent.getAttribute(dataKey) || (options[network] && "undefined" != typeof options[network][optKey] ? options[network][optKey] : options[optKey]), "undefined" != typeof optValue && (opts[optKey] = optValue);
        return opts
    }

    function addCount(el, cnt) {
        var newEl = document.createElement("div");
        newEl.innerHTML = cnt, newEl.className = "ssk-num", el.appendChild(newEl)
    }

    function getCount(network, shareUrl, options, onReady) {
        var url, parseFunc, body, shareUrlEnc = encodeURIComponent(shareUrl);
        switch (network) {
            case "facebook":
                url = "https://graph.facebook.com/?id=" + shareUrlEnc, parseFunc = function(r) {
                    return onReady(r.share ? r.share.share_count : 0)
                };
                break;
            case "twitter":
                options && options.twitter && options.twitter.countCallback && options.twitter.countCallback(shareUrl, onReady);
                break;
            case "google-plus":
                return url = "https://clients6.google.com/rpc?key=AIzaSyCKSbrvQasunBoV16zDH9R33D88CeLr9gQ", body = '[{"method":"pos.plusones.get","id":"p","params":{"id":"' + shareUrl + '","userId":"@viewer","groupId":"@self","nolog":true},"jsonrpc":"2.0","key":"p","apiVersion":"v1"}]', parseFunc = function(r) {
                    if (r = JSON.parse(r), r.length) return onReady(r[0].result.metadata.globalCounts.count)
                }, void ajax(url, parseFunc, body);
            case "linkedin":
                url = "https://www.linkedin.com/countserv/count/share?url=" + shareUrlEnc, parseFunc = function(r) {
                    return onReady(r.count)
                };
                break;
            case "pinterest":
                url = "https://api.pinterest.com/v1/urls/count.json?url=" + shareUrlEnc, parseFunc = function(r) {
                    return onReady(r.count)
                };
                break;
            case "vk":
                url = "https://vk.com/share.php?act=count&url=" + shareUrlEnc, parseFunc = function(r) {
                    return onReady(r)
                }
        }
        url && parseFunc && JSONPRequest(network, url, parseFunc, body)
    }

    function ajax(url, callback, body) {
        var request = new XMLHttpRequest;
        request.onreadystatechange = function() {
            4 === this.readyState && this.status >= 200 && this.status < 400 && callback(this.responseText)
        }, request.open("POST", url, !0), request.setRequestHeader("Content-Type", "application/json"), request.send(body)
    }

    function JSONPRequest(network, url, callback) {
        var callbackName = "cb_" + network + "_" + Math.round(1e5 * Math.random()),
            script = document.createElement("script");
        return window[callbackName] = function(data) {
            try {
                delete window[callbackName]
            } catch (e) {}
            document.body.removeChild(script), callback(data)
        }, "vk" == network ? window.VK = {
            Share: {
                count: function(a, b) {
                    window[callbackName](b)
                }
            }
        } : "google-plus" == network && (window.services = {
            gplus: {
                cb: window[callbackName]
            }
        }), script.src = url + (url.indexOf("?") >= 0 ? "&" : "?") + "callback=" + callbackName, document.body.appendChild(script), !0
    }
    var wrap, _wrap, supportsShare = /(twitter|facebook|google-plus|pinterest|tumblr|vk|linkedin|email)/,
        sep = "*|*";
    return _wrap = function(opts) {
        var options = opts || {},
            selector = options.selector || ".ssk";
        this.nodes = $(selector), this.options = options
    }, _wrap.prototype = {
        share: function() {
            function onClick(e) {
                var url, target = preventDefault(e),
                    match = elSupportsShare(target),
                    network = match[0];
                if (match && (url = getUrl(options, network, target))) {
                    if (window.twttr && target.getAttribute("href").indexOf("twitter.com/intent/") !== -1) return void target.setAttribute("href", url);
                    if ("email" != network) {
                        var win = winOpen(url);
                        if (options.onOpen && options.onOpen(target, network, url, win), options.onClose) var closeInt = window.setInterval(function() {
                            win.closed !== !1 && (window.clearInterval(closeInt), options.onClose(target, network, url, win))
                        }, 250)
                    } else document.location = url
                }
            }

            function processShareCount() {
                var a, ref;
                for (a in urlsToCount) ref = a.split(sep),
                    function(els) {
                        getCount(ref[0], ref[1], options, function(cnt) {
                            for (var c in els) addCount(els[c], cnt)
                        })
                    }(urlsToCount[a])
            }
            var els = this.nodes,
                options = this.options,
                urlsToCount = {};
            return ready(function() {
                els.length && (each(els, function(el) {
                    var uniqueKey, network = elSupportsShare(el);
                    network && (removeEventListener(el, "click", onClick), addEventListener(el, "click", onClick), el.parentNode.className.indexOf("ssk-count") !== -1 && (network = network[0], uniqueKey = network + sep + getShareUrl(options, network, el), uniqueKey in urlsToCount || (urlsToCount[uniqueKey] = []), urlsToCount[uniqueKey].push(el)))
                }), processShareCount())
            }), this.nodes
        }
    }, wrap = function(selector) {
        return new _wrap(selector)
    }, {
        init: init
    }
}();
window.SocialShareKit = SocialShareKit;