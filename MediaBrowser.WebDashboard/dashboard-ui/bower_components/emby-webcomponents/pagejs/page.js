define([], function() {
    "use strict";

    function page(path, fn) {
        if ("function" == typeof path) return page("*", path);
        if ("function" == typeof fn)
            for (var route = new Route(path), i = 1; i < arguments.length; ++i) page.callbacks.push(route.middleware(arguments[i]));
        else "string" == typeof path ? page["string" == typeof fn ? "redirect" : "show"](path, fn) : page.start(path)
    }

    function unhandled(ctx) {
        if (!ctx.handled) {
            var current;
            current = hashbang ? base + location.hash.replace("#!", "") : location.pathname + location.search, current !== ctx.canonicalPath && (page.stop(), ctx.handled = !1, location.href = ctx.canonicalPath)
        }
    }

    function decodeURLEncodedURIComponent(val) {
        return "string" != typeof val ? val : decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, " ")) : val
    }

    function Context(path, state) {
        "/" === path[0] && 0 !== path.indexOf(base) && (path = base + (hashbang ? "#!" : "") + path);
        var i = path.indexOf("?");
        if (this.canonicalPath = path, this.path = path.replace(base, "") || "/", hashbang && (this.path = this.path.replace("#!", "") || "/"), this.title = document.title, this.state = state || {}, this.state.path = path, this.querystring = ~i ? decodeURLEncodedURIComponent(path.slice(i + 1)) : "", this.pathname = decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path), this.params = {}, this.hash = "", !hashbang) {
            if (!~this.path.indexOf("#")) return;
            var parts = this.path.split("#");
            this.path = parts[0], this.hash = decodeURLEncodedURIComponent(parts[1]) || "", this.querystring = this.querystring.split("#")[0]
        }
    }

    function Route(path, options) {
        options = options || {}, this.path = "*" === path ? "(.*)" : path, this.method = "GET", this.regexp = pathToRegexp(this.path, this.keys = [], options.sensitive, options.strict)
    }

    function ignorePopState(event) {
        var state = event.state || {};
        return previousPopState.navigate === !1 ? (previousPopState = state, !0) : (previousPopState = state, !1)
    }

    function onclick(e, checkWhich) {
        if ((1 === which(e) || checkWhich === !1) && !(e.metaKey || e.ctrlKey || e.shiftKey || e.defaultPrevented)) {
            for (var el = e.target; el && "A" !== el.nodeName;) el = el.parentNode;
            if (el && "A" === el.nodeName && !el.hasAttribute("download") && "external" !== el.getAttribute("rel")) {
                var link = el.getAttribute("href");
                if ("#" === link) return void e.preventDefault();
                if ((hashbang || el.pathname !== location.pathname || !el.hash && "#" !== link) && !el.target && sameOrigin(el.href)) {
                    var path = el.pathname + el.search + (el.hash || ""),
                        orig = path;
                    0 === path.indexOf(base) && (path = path.substr(base.length)), hashbang && (path = path.replace("#!", "")), base && orig === path || (e.preventDefault(), page.show(orig))
                }
            }
        }
    }

    function which(e) {
        return e = e || window.event, null === e.which ? e.button : e.which
    }

    function sameOrigin(href) {
        var origin = location.protocol + "//" + location.hostname;
        return location.port && (origin += ":" + location.port), href && 0 === href.indexOf(origin)
    }

    function parse(str) {
        for (var res, tokens = [], key = 0, index = 0, path = ""; null != (res = PATH_REGEXP.exec(str));) {
            var m = res[0],
                escaped = res[1],
                offset = res.index;
            if (path += str.slice(index, offset), index = offset + m.length, escaped) path += escaped[1];
            else {
                path && (tokens.push(path), path = "");
                var prefix = res[2],
                    name = res[3],
                    capture = res[4],
                    group = res[5],
                    suffix = res[6],
                    asterisk = res[7],
                    repeat = "+" === suffix || "*" === suffix,
                    optional = "?" === suffix || "*" === suffix,
                    delimiter = prefix || "/",
                    pattern = capture || group || (asterisk ? ".*" : "[^" + delimiter + "]+?");
                tokens.push({
                    name: name || key++,
                    prefix: prefix || "",
                    delimiter: delimiter,
                    optional: optional,
                    repeat: repeat,
                    pattern: escapeGroup(pattern)
                })
            }
        }
        return index < str.length && (path += str.substr(index)), path && tokens.push(path), tokens
    }

    function escapeString(str) {
        return str.replace(/([.+*?=^!:${}()[\]|\/])/g, "\\$1")
    }

    function escapeGroup(group) {
        return group.replace(/([=!:$\/()])/g, "\\$1")
    }

    function attachKeys(re, keys) {
        return re.keys = keys, re
    }

    function flags(options) {
        return options.sensitive ? "" : "i"
    }

    function regexpToRegexp(path, keys) {
        var groups = path.source.match(/\((?!\?)/g);
        if (groups)
            for (var i = 0; i < groups.length; i++) keys.push({
                name: i,
                prefix: null,
                delimiter: null,
                optional: !1,
                repeat: !1,
                pattern: null
            });
        return attachKeys(path, keys)
    }

    function arrayToRegexp(path, keys, options) {
        for (var parts = [], i = 0; i < path.length; i++) parts.push(pathToRegexp(path[i], keys, options).source);
        var regexp = new RegExp("(?:" + parts.join("|") + ")", flags(options));
        return attachKeys(regexp, keys)
    }

    function stringToRegexp(path, keys, options) {
        for (var tokens = parse(path), re = tokensToRegExp(tokens, options), i = 0; i < tokens.length; i++) "string" != typeof tokens[i] && keys.push(tokens[i]);
        return attachKeys(re, keys)
    }

    function tokensToRegExp(tokens, options) {
        options = options || {};
        for (var strict = options.strict, end = options.end !== !1, route = "", lastToken = tokens[tokens.length - 1], endsWithSlash = "string" == typeof lastToken && /\/$/.test(lastToken), i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if ("string" == typeof token) route += escapeString(token);
            else {
                var prefix = escapeString(token.prefix),
                    capture = token.pattern;
                token.repeat && (capture += "(?:" + prefix + capture + ")*"), capture = token.optional ? prefix ? "(?:" + prefix + "(" + capture + "))?" : "(" + capture + ")?" : prefix + "(" + capture + ")", route += capture
            }
        }
        return strict || (route = (endsWithSlash ? route.slice(0, -2) : route) + "(?:\\/(?=$))?"), route += end ? "$" : strict && endsWithSlash ? "" : "(?=\\/|$)", new RegExp("^" + route, flags(options))
    }

    function pathToRegexp(path, keys, options) {
        return keys = keys || [], isarray(keys) ? options || (options = {}) : (options = keys, keys = []), path instanceof RegExp ? regexpToRegexp(path, keys, options) : isarray(path) ? arrayToRegexp(path, keys, options) : stringToRegexp(path, keys, options)
    }
    var running, prevContext, clickEvent = "undefined" != typeof document && document.ontouchstart ? "touchstart" : "click",
        location = "undefined" != typeof window && (window.history.location || window.location),
        dispatch = !0,
        decodeURLComponents = !0,
        base = "",
        hashbang = !1,
        enableHistory = !1;
    page.callbacks = [], page.exits = [], page.current = "", page.len = 0, page.base = function(path) {
        return 0 === arguments.length ? base : void(base = path)
    }, page.start = function(options) {
        if (options = options || {}, !running && (running = !0, !1 === options.dispatch && (dispatch = !1), !1 === options.decodeURLComponents && (decodeURLComponents = !1), !1 !== options.popstate && window.addEventListener("popstate", onpopstate, !1), !1 !== options.click && document.addEventListener(clickEvent, onclick, !1), null != options.enableHistory && (enableHistory = options.enableHistory), !0 === options.hashbang && (hashbang = !0), dispatch)) {
            var url = hashbang && ~location.hash.indexOf("#!") ? location.hash.substr(2) + location.search : location.pathname + location.search + location.hash;
            page.replace(url, null, !0, dispatch)
        }
    }, page.stop = function() {
        running && (page.current = "", page.len = 0, running = !1, document.removeEventListener(clickEvent, onclick, !1), window.removeEventListener("popstate", onpopstate, !1))
    }, page.show = function(path, state, dispatch, push, isBack) {
        var ctx = new Context(path, state);
        return ctx.isBack = isBack, page.current = ctx.path, !1 !== dispatch && page.dispatch(ctx), !1 !== ctx.handled && !1 !== push && ctx.pushState(), ctx
    }, page.back = function(path, state) {
        if (enableHistory) return void history.back();
        if (page.len > 0) {
            if (enableHistory) history.back();
            else if (backStack.length > 2) {
                backStack.length--;
                var previousState = backStack[backStack.length - 1];
                page.show(previousState.path, previousState.state, !0, !1, !0)
            }
            page.len--
        } else path ? setTimeout(function() {
            page.show(path, state)
        }) : setTimeout(function() {
            page.show(base, state)
        })
    }, page.enableNativeHistory = function() {
        return enableHistory
    }, page.canGoBack = function() {
        return enableHistory ? history.length > 1 : (page.len || 0) > 0
    }, page.redirect = function(from, to) {
        "string" == typeof from && "string" == typeof to && page(from, function(e) {
            setTimeout(function() {
                page.replace(to)
            }, 0)
        }), "string" == typeof from && "undefined" == typeof to && setTimeout(function() {
            page.replace(from)
        }, 0)
    }, page.replace = function(path, state, init, dispatch, isBack) {
        var ctx = new Context(path, state);
        return ctx.isBack = isBack, page.current = ctx.path, ctx.init = init, ctx.save(), !1 !== dispatch && page.dispatch(ctx), ctx
    }, page.dispatch = function(ctx) {
        function nextExit() {
            var fn = page.exits[j++];
            return fn ? void fn(prev, nextExit) : nextEnter()
        }

        function nextEnter() {
            var fn = page.callbacks[i++];
            return ctx.path !== page.current ? void(ctx.handled = !1) : fn ? void fn(ctx, nextEnter) : unhandled(ctx)
        }
        var prev = prevContext,
            i = 0,
            j = 0;
        prevContext = ctx, prev ? nextExit() : nextEnter()
    }, page.exit = function(path, fn) {
        if ("function" == typeof path) return page.exit("*", path);
        for (var route = new Route(path), i = 1; i < arguments.length; ++i) page.exits.push(route.middleware(arguments[i]))
    }, page.Context = Context;
    var backStack = [];
    Context.prototype.pushState = function() {
        page.len++, enableHistory ? history.pushState(this.state, this.title, hashbang && "/" !== this.path ? "#!" + this.path : this.canonicalPath) : backStack.push({
            state: this.state,
            title: this.title,
            url: hashbang && "/" !== this.path ? "#!" + this.path : this.canonicalPath,
            path: this.path
        })
    }, Context.prototype.save = function() {
        enableHistory ? history.replaceState(this.state, this.title, hashbang && "/" !== this.path ? "#!" + this.path : this.canonicalPath) : backStack[page.len || 0] = {
            state: this.state,
            title: this.title,
            url: hashbang && "/" !== this.path ? "#!" + this.path : this.canonicalPath,
            path: this.path
        }
    }, page.Route = Route, Route.prototype.middleware = function(fn) {
        var self = this;
        return function(ctx, next) {
            return self.match(ctx.path, ctx.params) ? fn(ctx, next) : void next()
        }
    }, Route.prototype.match = function(path, params) {
        var keys = this.keys,
            qsIndex = path.indexOf("?"),
            pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
            m = this.regexp.exec(decodeURIComponent(pathname));
        if (!m) return !1;
        for (var i = 1, len = m.length; i < len; ++i) {
            var key = keys[i - 1],
                val = decodeURLEncodedURIComponent(m[i]);
            void 0 === val && hasOwnProperty.call(params, key.name) || (params[key.name] = val)
        }
        return !0
    };
    var previousPopState = {};
    page.pushState = function(state, title, url) {
        hashbang && (url = "#!" + url), history.pushState(state, title, url), previousPopState = state
    };
    var onpopstate = function() {
        var loaded = !1;
        if ("undefined" != typeof window) return "complete" === document.readyState ? loaded = !0 : window.addEventListener("load", function() {
                setTimeout(function() {
                    loaded = !0
                }, 0)
            }),
            function(e) {
                if (loaded && !ignorePopState(e))
                    if (e.state) {
                        var path = e.state.path;
                        page.replace(path, e.state, null, null, !0)
                    } else page.show(location.pathname + location.hash, void 0, void 0, !1, !0)
            }
    }();
    page.handleAnchorClick = onclick, page.sameOrigin = sameOrigin;
    var PATH_REGEXP = new RegExp(["(\\\\.)", "([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^()])+)\\))?|\\(((?:\\\\.|[^()])+)\\))([+*?])?|(\\*))"].join("|"), "g"),
        isarray = Array.isArray || function(arr) {
            return "[object Array]" === Object.prototype.toString.call(arr)
        };
    return page
});