define(["jQuery"], function() {
    jQuery.mobile = {},
        function($, window, undefined) {
            $.extend($.mobile, {
                behaviors: {}
            }), $.fn.extend({
                enhanceWithin: function() {
                    var index, widgetElements = {},
                        that = this;
                    $.each($.mobile.widgets, function(name, constructor) {
                        if (constructor.initSelector) {
                            var elements = that[0].querySelectorAll(constructor.initSelector);
                            elements.length > 0 && (widgetElements[constructor.prototype.widgetName] = $(elements))
                        }
                    });
                    for (index in widgetElements) widgetElements[index][index]();
                    return this
                }
            })
        }(jQuery, this), jQuery.mobile.widgets = {}, $.fn.extend({
            enhanceWithin: function() {
                var index, widgetElements = {},
                    that = this;
                $.each($.mobile.widgets, function(name, constructor) {
                    if (constructor.initSelector) {
                        var elements = that[0].querySelectorAll(constructor.initSelector);
                        elements.length > 0 && (widgetElements[constructor.prototype.widgetName] = $(elements))
                    }
                });
                for (index in widgetElements) widgetElements[index][index]();
                return this
            }
        }), jQuery(document).on("create", function(event) {
            jQuery(event.target).enhanceWithin()
        }),
        function($, undefined) {
            var uuid = 0,
                slice = Array.prototype.slice,
                _cleanData = $.cleanData;
            $.cleanData = function(elems) {
                for (var elem, i = 0; null != (elem = elems[i]); i++) try {
                    $(elem).triggerHandler("remove")
                } catch (e) {}
                _cleanData(elems)
            }, $.widget = function(name, base, prototype) {
                var fullName, existingConstructor, constructor, basePrototype, proxiedPrototype = {},
                    namespace = name.split(".")[0];
                return name = name.split(".")[1], fullName = namespace + "-" + name, prototype || (prototype = base, base = $.Widget), $.expr[":"][fullName.toLowerCase()] = function(elem) {
                    return !!$.data(elem, fullName)
                }, $[namespace] = $[namespace] || {}, existingConstructor = $[namespace][name], constructor = $[namespace][name] = function(options, element) {
                    return this._createWidget ? void(arguments.length && this._createWidget(options, element)) : new constructor(options, element)
                }, $.extend(constructor, existingConstructor, {
                    version: prototype.version,
                    _proto: $.extend({}, prototype),
                    _childConstructors: []
                }), basePrototype = new base, basePrototype.options = $.widget.extend({}, basePrototype.options), $.each(prototype, function(prop, value) {
                    return $.isFunction(value) ? void(proxiedPrototype[prop] = function() {
                        var _super = function() {
                                return base.prototype[prop].apply(this, arguments)
                            },
                            _superApply = function(args) {
                                return base.prototype[prop].apply(this, args)
                            };
                        return function() {
                            var returnValue, __super = this._super,
                                __superApply = this._superApply;
                            return this._super = _super, this._superApply = _superApply, returnValue = value.apply(this, arguments), this._super = __super, this._superApply = __superApply, returnValue
                        }
                    }()) : void(proxiedPrototype[prop] = value)
                }), constructor.prototype = $.widget.extend(basePrototype, {
                    widgetEventPrefix: existingConstructor ? basePrototype.widgetEventPrefix || name : name
                }, proxiedPrototype, {
                    constructor: constructor,
                    namespace: namespace,
                    widgetName: name,
                    widgetFullName: fullName
                }), existingConstructor ? ($.each(existingConstructor._childConstructors, function(i, child) {
                    var childPrototype = child.prototype;
                    $.widget(childPrototype.namespace + "." + childPrototype.widgetName, constructor, child._proto)
                }), delete existingConstructor._childConstructors) : base._childConstructors.push(constructor), $.widget.bridge(name, constructor), constructor
            }, $.widget.extend = function(target) {
                for (var key, value, input = slice.call(arguments, 1), inputIndex = 0, inputLength = input.length; inputIndex < inputLength; inputIndex++)
                    for (key in input[inputIndex]) value = input[inputIndex][key], input[inputIndex].hasOwnProperty(key) && value !== undefined && ($.isPlainObject(value) ? target[key] = $.isPlainObject(target[key]) ? $.widget.extend({}, target[key], value) : $.widget.extend({}, value) : target[key] = value);
                return target
            }, $.widget.bridge = function(name, object) {
                var fullName = object.prototype.widgetFullName || name;
                $.fn[name] = function(options) {
                    var isMethodCall = "string" == typeof options,
                        args = slice.call(arguments, 1),
                        returnValue = this;
                    return options = !isMethodCall && args.length ? $.widget.extend.apply(null, [options].concat(args)) : options, isMethodCall ? this.each(function() {
                        var methodValue, instance = $.data(this, fullName);
                        return "instance" === options ? (returnValue = instance, !1) : instance ? $.isFunction(instance[options]) && "_" !== options.charAt(0) ? (methodValue = instance[options].apply(instance, args), methodValue !== instance && methodValue !== undefined ? (returnValue = methodValue && methodValue.jquery ? returnValue.pushStack(methodValue.get()) : methodValue, !1) : void 0) : $.error("no such method '" + options + "' for " + name + " widget instance") : $.error("cannot call methods on " + name + " prior to initialization; attempted to call method '" + options + "'")
                    }) : this.each(function() {
                        var instance = $.data(this, fullName);
                        instance ? instance.option(options || {})._init() : $.data(this, fullName, new object(options, this))
                    }), returnValue
                }
            }, $.Widget = function() {}, $.Widget._childConstructors = [], $.Widget.prototype = {
                widgetName: "widget",
                widgetEventPrefix: "",
                defaultElement: "<div>",
                options: {
                    disabled: !1,
                    create: null
                },
                _createWidget: function(options, element) {
                    element = $(element || this.defaultElement || this)[0], this.element = $(element), this.uuid = uuid++, this.eventNamespace = "." + this.widgetName + this.uuid, this.options = $.widget.extend({}, this.options, this._getCreateOptions(), options), this.bindings = $(), this.hoverable = $(), this.focusable = $(), element !== this && ($.data(element, this.widgetFullName, this), this._on(!0, this.element, {
                        remove: function(event) {
                            event.target === element && this.destroy()
                        }
                    }), this.document = $(element.style ? element.ownerDocument : element.document || element), this.window = $(this.document[0].defaultView || this.document[0].parentWindow)), this._create(), this._trigger("create", null, this._getCreateEventData()), this._init()
                },
                _getCreateOptions: $.noop,
                _getCreateEventData: $.noop,
                _create: $.noop,
                _init: $.noop,
                destroy: function() {
                    this._destroy(), this.element.unbind(this.eventNamespace).removeData(this.widgetFullName).removeData($.camelCase(this.widgetFullName)), this.widget().unbind(this.eventNamespace).removeAttr("aria-disabled").removeClass(this.widgetFullName + "-disabled ui-state-disabled"), this.bindings.unbind(this.eventNamespace), this.hoverable.removeClass("ui-state-hover"), this.focusable.removeClass("ui-state-focus")
                },
                _destroy: $.noop,
                widget: function() {
                    return this.element
                },
                option: function(key, value) {
                    var parts, curOption, i, options = key;
                    if (0 === arguments.length) return $.widget.extend({}, this.options);
                    if ("string" == typeof key)
                        if (options = {}, parts = key.split("."), key = parts.shift(), parts.length) {
                            for (curOption = options[key] = $.widget.extend({}, this.options[key]), i = 0; i < parts.length - 1; i++) curOption[parts[i]] = curOption[parts[i]] || {}, curOption = curOption[parts[i]];
                            if (key = parts.pop(), value === undefined) return curOption[key] === undefined ? null : curOption[key];
                            curOption[key] = value
                        } else {
                            if (value === undefined) return this.options[key] === undefined ? null : this.options[key];
                            options[key] = value
                        }
                    return this._setOptions(options), this
                },
                _setOptions: function(options) {
                    var key;
                    for (key in options) this._setOption(key, options[key]);
                    return this
                },
                _setOption: function(key, value) {
                    return this.options[key] = value, "disabled" === key && (this.widget().toggleClass(this.widgetFullName + "-disabled", !!value), this.hoverable.removeClass("ui-state-hover"), this.focusable.removeClass("ui-state-focus")), this
                },
                enable: function() {
                    return this._setOptions({
                        disabled: !1
                    })
                },
                disable: function() {
                    return this._setOptions({
                        disabled: !0
                    })
                },
                _on: function(suppressDisabledCheck, element, handlers) {
                    var delegateElement, instance = this;
                    "boolean" != typeof suppressDisabledCheck && (handlers = element, element = suppressDisabledCheck, suppressDisabledCheck = !1), handlers ? (element = delegateElement = $(element), this.bindings = this.bindings.add(element)) : (handlers = element, element = this.element, delegateElement = this.widget()), $.each(handlers, function(event, handler) {
                        function handlerProxy() {
                            if (suppressDisabledCheck || instance.options.disabled !== !0 && !$(this).hasClass("ui-state-disabled")) return ("string" == typeof handler ? instance[handler] : handler).apply(instance, arguments)
                        }
                        "string" != typeof handler && (handlerProxy.guid = handler.guid = handler.guid || handlerProxy.guid || $.guid++);
                        var match = event.match(/^(\w+)\s*(.*)$/),
                            eventName = match[1] + instance.eventNamespace,
                            selector = match[2];
                        selector ? delegateElement.on(eventName, selector, handlerProxy) : element.on(eventName, handlerProxy)
                    })
                },
                _off: function(element, eventName) {
                    eventName = (eventName || "").split(" ").join(this.eventNamespace + " ") + this.eventNamespace, element.off(eventName).off(eventName)
                },
                _trigger: function(type, event, data) {
                    var prop, orig, callback = this.options[type];
                    if (data = data || {}, event = $.Event(event), event.type = (type === this.widgetEventPrefix ? type : this.widgetEventPrefix + type).toLowerCase(), event.target = this.element[0], orig = event.originalEvent)
                        for (prop in orig) prop in event || (event[prop] = orig[prop]);
                    return this.element[0].dispatchEvent(new CustomEvent(event.type, {
                        bubbles: !0,
                        detail: {
                            data: data,
                            originalEvent: event
                        }
                    })), !($.isFunction(callback) && callback.apply(this.element[0], [event].concat(data)) === !1 || event.isDefaultPrevented())
                }
            }
        }(jQuery),
        function($, undefined) {
            $.extend($.Widget.prototype, {
                _getCreateOptions: function() {
                    var option, value, options = (this.element[0], {});
                    if (!this.element.data("defaults"))
                        for (option in this.options) value = this.element.data(option), null != value && (options[option] = value);
                    return options
                }
            })
        }(jQuery),
        function($, undefined) {
            var originalWidget = $.widget;
            $.widget = function(orig) {
                return function() {
                    var constructor = orig.apply(this, arguments),
                        name = constructor.prototype.widgetName;
                    return constructor.initSelector = constructor.prototype.initSelector !== undefined ? constructor.prototype.initSelector : "*[data-role='" + name + "']:not([data-role='none'])", $.mobile.widgets[name] = constructor, constructor
                }
            }($.widget), $.extend($.widget, originalWidget)
        }(jQuery)
});