define(["jqmwidget"], function() {
    var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/;
    $.extend($.mobile, {
        getAttribute: function(element, key) {
            var data;
            element = element.jquery ? element[0] : element, element && element.getAttribute && (data = element.getAttribute("data-" + key));
            try {
                data = "true" === data || "false" !== data && ("null" === data ? null : +data + "" === data ? +data : rbrace.test(data) ? JSON.parse(data) : data)
            } catch (err) {}
            return data
        }
    }), $.widget("mobile.table", {
        options: {
            enhanced: !1
        },
        _create: function() {
            this.options.enhanced || this.element.addClass("ui-table"), $.extend(this, {
                headers: void 0,
                allHeaders: void 0
            }), this._refresh(!0)
        },
        _setHeaders: function() {
            var trs = this.element.find("thead tr");
            this.headers = this.element.find("tr:eq(0)").children(), this.allHeaders = this.headers.add(trs.children())
        },
        refresh: function() {
            this._refresh()
        },
        rebuild: $.noop,
        _refresh: function() {
            var table = this.element,
                trs = table.find("thead tr");
            this._setHeaders(), trs.each(function() {
                var columnCount = 0;
                $(this).children().each(function() {
                    var j, span = parseInt(this.getAttribute("colspan"), 10),
                        selector = ":nth-child(" + (columnCount + 1) + ")";
                    if (this.setAttribute("data-colstart", columnCount + 1), span)
                        for (j = 0; j < span - 1; j++) columnCount++, selector += ", :nth-child(" + (columnCount + 1) + ")";
                    $(this).data("cells", table.find("tr").not(trs.eq(0)).not(this).children(selector)), columnCount++
                })
            })
        }
    }), $.widget("mobile.table", $.mobile.table, {
        options: {
            mode: "reflow"
        },
        _create: function() {
            this._super(), "reflow" === this.options.mode && (this.options.enhanced || (this.element.addClass("ui-table-reflow"), this._updateReflow()))
        },
        rebuild: function() {
            this._super(), "reflow" === this.options.mode && this._refresh(!1)
        },
        _refresh: function(create) {
            this._super(create), create || "reflow" !== this.options.mode || this._updateReflow()
        },
        _updateReflow: function() {
            var table = this;
            this.options;
            $(table.allHeaders.get().reverse()).each(function() {
                var iteration, filter, cells = $(this).data("cells"),
                    colstart = $.mobile.getAttribute(this, "colstart"),
                    hierarchyClass = cells.not(this).filter("thead th").length && " ui-table-cell-label-top",
                    contents = $(this).clone().contents();
                contents.length > 0 && (hierarchyClass ? (iteration = parseInt(this.getAttribute("colspan"), 10), filter = "", iteration && (filter = "td:nth-child(" + iteration + "n + " + colstart + ")"), table._addLabels(cells.filter(filter), "ui-table-cell-label" + hierarchyClass, contents)) : table._addLabels(cells, "ui-table-cell-label", contents))
            })
        },
        _addLabels: function(cells, label, contents) {
            1 === contents.length && "abbr" === contents[0].nodeName.toLowerCase() && (contents = contents.eq(0).attr("title")), cells.not(":has(b." + label + ")").prepend($("<b class='" + label + "'></b>").append(contents))
        }
    })
});