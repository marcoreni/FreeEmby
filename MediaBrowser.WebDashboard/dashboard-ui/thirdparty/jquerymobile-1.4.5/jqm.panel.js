define(["jqmwidget"], function() {
    ! function($, undefined) {
        var props = {
                animation: {},
                transition: {}
            },
            testElement = document.createElement("a"),
            vendorPrefixes = ["", "webkit-", "moz-", "o-"];
        $.each(["animation", "transition"], function(i, test) {
            var testName = 0 === i ? test + "-name" : test;
            $.each(vendorPrefixes, function(j, prefix) {
                if (testElement.style[$.camelCase(prefix + testName)] !== undefined) return props[test].prefix = prefix, !1
            }), props[test].duration = $.camelCase(props[test].prefix + test + "-duration"), props[test].event = $.camelCase(props[test].prefix + test + "-end"), "" === props[test].prefix && (props[test].event = props[test].event.toLowerCase())
        }), $(testElement).remove(), $.fn.animationComplete = function(callback, type, fallbackTime) {
            var timer, duration, that = this,
                eventBinding = function() {
                    clearTimeout(timer), callback.apply(this, arguments)
                },
                animationType = type && "animation" !== type ? "transition" : "animation";
            return fallbackTime === undefined && ($(this).context !== document && (duration = 3e3 * parseFloat($(this).css(props[animationType].duration))), (0 === duration || duration === undefined || isNaN(duration)) && (duration = $.fn.animationComplete.defaultDuration)), timer = setTimeout(function() {
                $(that).off(props[animationType].event, eventBinding), callback.apply(that)
            }, duration), $(this).one(props[animationType].event, eventBinding)
        }, $.fn.animationComplete.defaultDuration = 1e3
    }(jQuery),
    function($, undefined) {
        $.widget("mobile.panel", {
            options: {
                animate: !0,
                theme: null,
                position: "left",
                dismissible: !0,
                display: "overlay",
                swipeClose: !0,
                positionFixed: !0
            },
            _parentPage: null,
            _page: null,
            _modal: null,
            _panelInner: null,
            _wrapper: null,
            _create: function() {
                var el = this.element,
                    parentPage = el.closest(".ui-page, [data-role='page']");
                $.extend(this, {
                    _parentPage: parentPage.length > 0 && parentPage,
                    _openedPage: null,
                    _page: this._getPage,
                    _panelInner: this._getPanelInner()
                }), "overlay" !== this.options.display && this._getWrapper(), this._addPanelClasses(), this.options.animate && this.element.addClass("ui-panel-animate"), this._bindUpdateLayout(), this._bindCloseEvents(), this._bindLinkListeners(), this._bindPageEvents(), this.options.dismissible && this._createModal(), this._bindSwipeEvents()
            },
            _getPanelInner: function() {
                var panelInner = this.element[0].querySelector(".ui-panel-inner");
                return panelInner = panelInner ? $(panelInner) : this.element.children().wrapAll("<div class='ui-panel-inner' />").parent()
            },
            _createModal: function() {
                var self = this,
                    target = self._parentPage ? self._parentPage.parent() : self.element.parent();
                self._modal = $("<div class='ui-panel-dismiss'></div>").on("mousedown", function() {
                    self.close()
                }).appendTo(target)
            },
            _getPage: function() {
                var page = this._openedPage || this._parentPage || $(".ui-page-active");
                return page
            },
            _getWrapper: function() {
                var wrapper = this._page().find(".ui-panel-wrapper");
                0 === wrapper.length && (wrapper = this._page().children(".ui-header:not(.ui-header-fixed), .ui-content:not(.ui-popup), .ui-footer:not(.ui-footer-fixed)").wrapAll("<div class='ui-panel-wrapper'></div>").parent()), this._wrapper = wrapper
            },
            _getPosDisplayClasses: function(prefix) {
                return prefix + "-position-right " + prefix + "-display-" + this.options.display
            },
            _getPanelClasses: function() {
                var panelClasses = "ui-panel " + this._getPosDisplayClasses("ui-panel") + " ui-panel-closed ui-body-" + (this.options.theme ? this.options.theme : "inherit");
                return this.options.positionFixed && (panelClasses += " ui-panel-fixed"), panelClasses
            },
            _addPanelClasses: function() {
                this.element.addClass(this._getPanelClasses())
            },
            _handleCloseClick: function(event) {
                event.isDefaultPrevented() || this.close()
            },
            _bindCloseEvents: function() {},
            _positionPanel: function(scrollToTop) {
                var self = this,
                    panelInnerHeight = self._panelInner.outerHeight(),
                    expand = panelInnerHeight > (window.innerHeight || $(window).height());
                expand || !self.options.positionFixed ? (expand && self._unfixPanel(), scrollToTop && this.window[0].scrollTo(0, $.mobile.defaultHomeScroll)) : self._fixPanel()
            },
            _bindFixListener: function() {
                this._on($(window), {
                    resize: "_positionPanel"
                })
            },
            _unbindFixListener: function() {
                this._off($(window), "resize")
            },
            _unfixPanel: function() {
                this.options.positionFixed && this.element.removeClass("ui-panel-fixed")
            },
            _fixPanel: function() {
                this.options.positionFixed && this.element.addClass("ui-panel-fixed")
            },
            _bindUpdateLayout: function() {
                var self = this;
                self.element.on("updatelayout", function() {
                    self._open && self._positionPanel()
                })
            },
            _bindLinkListeners: function() {
                this._on("body", {
                    "click a": "_handleClick"
                })
            },
            _handleClick: function(e) {
                var link, panelId = this.element.attr("id");
                e.currentTarget.href.split("#")[1] === panelId && panelId !== undefined && (e.preventDefault(), link = $(e.target), link.hasClass("ui-btn") && (link.addClass($.mobile.activeBtnClass), this.element.one("panelopen panelclose", function() {
                    link.removeClass($.mobile.activeBtnClass)
                })), this.toggle())
            },
            _bindSwipeEvents: function() {
                var self = this,
                    area = self._modal ? self.element.add(self._modal) : self.element;
                self.options.swipeClose && ("left" === self.options.position ? area.on("swipeleft.panel", function() {
                    self.close()
                }) : area.on("swiperight.panel", function() {
                    self.close()
                }))
            },
            _bindPageEvents: function() {
                var self = this;
                this.document.on("panelbeforeopen", function(e) {
                    self._open && e.target !== self.element[0] && self.close()
                }).on("keyup.panel", function(e) {
                    27 === e.keyCode && self._open && self.close()
                }), this._parentPage || "overlay" === this.options.display || this._on(this.document, {
                    pageshow: function() {
                        this._openedPage = null, this._getWrapper()
                    }
                }), self._parentPage ? this.document.on("pagehide", "[data-role='page']", function() {
                    self._open && self.close(!0)
                }) : this.document.on("pagebeforehide", function() {
                    self._open && self.close(!0)
                })
            },
            _open: !1,
            _pageContentOpenClasses: null,
            _modalOpenClasses: null,
            open: function(immediate) {
                if (!this._open) {
                    var self = this,
                        o = self.options,
                        _openPanel = function() {
                            self._off(self.document, "panelclose"), self._page().data("panel", "open"), o.animate && "overlay" !== o.display && self._wrapper.addClass("ui-panel-animate"), !immediate && o.animate ? (self._wrapper || self.element).animationComplete(complete, "transition") : setTimeout(complete, 0), o.theme && "overlay" !== o.display && self._page().parent().addClass("ui-panel-page-container-themed ui-panel-page-container-" + o.theme), self.element.removeClass("ui-panel-closed").addClass("ui-panel-open"), self._positionPanel(!0), self._pageContentOpenClasses = self._getPosDisplayClasses("ui-panel-page-content"), "overlay" !== o.display && (self._page().parent().addClass("ui-panel-page-container"), self._wrapper.addClass(self._pageContentOpenClasses)), self._modalOpenClasses = self._getPosDisplayClasses("ui-panel-dismiss") + " ui-panel-dismiss-open", self._modal && self._modal.addClass(self._modalOpenClasses).height(Math.max(self._modal.height(), self.document.height()))
                        },
                        complete = function() {
                            self._open && ("overlay" !== o.display && self._wrapper.addClass("ui-panel-page-content-open"), self._bindFixListener(), self._trigger("open"), self._openedPage = self._page())
                        };
                    self._trigger("beforeopen"), "open" === self._page().data("panel") ? self._on(self.document, {
                        panelclose: _openPanel
                    }) : _openPanel(), self._open = !0
                }
            },
            close: function(immediate) {
                if (this._open) {
                    var self = this,
                        o = this.options,
                        _closePanel = function() {
                            self.element.removeClass("ui-panel-open"), "overlay" !== o.display && self._wrapper.removeClass(self._pageContentOpenClasses), !immediate && o.animate ? (self._wrapper || self.element).animationComplete(complete, "transition") : setTimeout(complete, 0), self._modal && self._modal.removeClass(self._modalOpenClasses).height("")
                        },
                        complete = function() {
                            o.theme && "overlay" !== o.display && self._page().parent().removeClass("ui-panel-page-container-themed ui-panel-page-container-" + o.theme), self.element.addClass("ui-panel-closed"), "overlay" !== o.display && (self._page().parent().removeClass("ui-panel-page-container"), self._wrapper.removeClass("ui-panel-page-content-open")), o.animate && "overlay" !== o.display && self._wrapper.removeClass("ui-panel-animate"), self._fixPanel(), self._unbindFixListener(), self._page().removeData("panel"), self._trigger("close"), self._openedPage = null
                        };
                    self._trigger("beforeclose"), _closePanel(), self._open = !1
                }
            },
            toggle: function() {
                this[this._open ? "close" : "open"]()
            },
            _destroy: function() {
                var otherPanels, o = this.options,
                    multiplePanels = $("body > :mobile-panel").length + $.mobile.activePage.find(":mobile-panel").length > 1;
                "overlay" !== o.display && (otherPanels = $("body > :mobile-panel").add($.mobile.activePage.find(":mobile-panel")), 0 === otherPanels.not(".ui-panel-display-overlay").not(this.element).length && this._wrapper.children().unwrap(), this._open && (this._page().parent().removeClass("ui-panel-page-container"), o.theme && this._page().parent().removeClass("ui-panel-page-container-themed ui-panel-page-container-" + o.theme))), multiplePanels || this.document.off("panelopen panelclose"), this._open && this._page().removeData("panel"), this._panelInner.children().unwrap(), this.element.removeClass([this._getPanelClasses(), "ui-panel-open", "ui-panel-animate"].join(" ")).off("swipeleft.panel swiperight.panel").off("panelbeforeopen").off("panelhide").off("keyup.panel").off("updatelayout"), this._modal && this._modal.remove()
            }
        })
    }(jQuery)
});