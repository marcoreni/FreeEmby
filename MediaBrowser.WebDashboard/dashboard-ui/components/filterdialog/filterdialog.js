define(["dialogHelper", "events", "browser", "emby-checkbox", "emby-collapse", "css!components/filterdialog/style"], function(dialogHelper, events, browser) {
    "use strict";

    function renderOptions(context, selector, cssClass, items, isCheckedFn) {
        var elem = context.querySelector(selector);
        items.length ? elem.classList.remove("hide") : elem.classList.add("hide");
        var html = "";
        html += '<div class="checkboxList">', html += items.map(function(filter) {
            var itemHtml = "",
                checkedHtml = isCheckedFn(filter) ? " checked" : "";
            return itemHtml += "<label>", itemHtml += '<input is="emby-checkbox" type="checkbox"' + checkedHtml + ' data-filter="' + filter + '" class="' + cssClass + '"/>', itemHtml += "<span>" + filter + "</span>", itemHtml += "</label>"
        }).join(""), html += "</div>", elem.querySelector(".filterOptions").innerHTML = html
    }

    function renderFilters(context, result, query) {
        result.Tags && (result.Tags.length = Math.min(result.Tags.length, 50)), renderOptions(context, ".genreFilters", "chkGenreFilter", result.Genres, function(i) {
            var delimeter = "|";
            return (delimeter + (query.Genres || "") + delimeter).indexOf(delimeter + i + delimeter) != -1
        }), renderOptions(context, ".officialRatingFilters", "chkOfficialRatingFilter", result.OfficialRatings, function(i) {
            var delimeter = "|";
            return (delimeter + (query.OfficialRatings || "") + delimeter).indexOf(delimeter + i + delimeter) != -1
        }), renderOptions(context, ".tagFilters", "chkTagFilter", result.Tags, function(i) {
            var delimeter = "|";
            return (delimeter + (query.Tags || "") + delimeter).indexOf(delimeter + i + delimeter) != -1
        }), renderOptions(context, ".yearFilters", "chkYearFilter", result.Years, function(i) {
            var delimeter = ",";
            return (delimeter + (query.Years || "") + delimeter).indexOf(delimeter + i + delimeter) != -1
        })
    }

    function loadDynamicFilters(context, userId, itemQuery) {
        return ApiClient.getJSON(ApiClient.getUrl("Items/Filters", {
            UserId: userId,
            ParentId: itemQuery.ParentId,
            IncludeItemTypes: itemQuery.IncludeItemTypes
        })).then(function(result) {
            renderFilters(context, result, itemQuery)
        })
    }

    function updateFilterControls(context, options) {
        var elems, i, length, query = options.query;
        if ("livetvchannels" == options.mode) context.querySelector(".chkFavorite").checked = 1 == query.IsFavorite, context.querySelector(".chkLikes").checked = 1 == query.IsLiked, context.querySelector(".chkDislikes").checked = 1 == query.IsDisliked;
        else
            for (elems = context.querySelectorAll(".chkStandardFilter"), i = 0, length = elems.length; i < length; i++) {
                var chkStandardFilter = elems[i],
                    filters = "," + (query.Filters || ""),
                    filterName = chkStandardFilter.getAttribute("data-filter");
                chkStandardFilter.checked = filters.indexOf("," + filterName) != -1
            }
        for (elems = context.querySelectorAll(".chkVideoTypeFilter"), i = 0, length = elems.length; i < length; i++) {
            var chkVideoTypeFilter = elems[i],
                filters = "," + (query.VideoTypes || ""),
                filterName = chkVideoTypeFilter.getAttribute("data-filter");
            chkVideoTypeFilter.checked = filters.indexOf("," + filterName) != -1
        }
        for (context.querySelector(".chk3DFilter").checked = 1 == query.Is3D, context.querySelector(".chkHDFilter").checked = 1 == query.IsHD, context.querySelector(".chkSDFilter").checked = 1 == query.IsHD, context.querySelector("#chkSubtitle").checked = 1 == query.HasSubtitles, context.querySelector("#chkTrailer").checked = 1 == query.HasTrailer, context.querySelector("#chkThemeSong").checked = 1 == query.HasThemeSong, context.querySelector("#chkThemeVideo").checked = 1 == query.HasThemeVideo, context.querySelector("#chkSpecialFeature").checked = 1 == query.HasSpecialFeature, context.querySelector("#chkSpecialEpisode").checked = 0 == query.ParentIndexNumber, context.querySelector("#chkMissingEpisode").checked = 1 == query.IsMissing, context.querySelector("#chkFutureEpisode").checked = 1 == query.IsUnaired, i = 0, length = elems.length; i < length; i++) {
            var chkStatus = elems[i],
                filters = "," + (query.SeriesStatus || ""),
                filterName = chkStatus.getAttribute("data-filter");
            chkStatus.checked = filters.indexOf("," + filterName) != -1
        }
        for (elems = context.querySelectorAll(".chkAirDays"), i = 0, length = elems.length; i < length; i++) {
            var chkAirDays = elems[i],
                filters = "," + (query.AirDays || ""),
                filterName = chkAirDays.getAttribute("data-filter");
            chkAirDays.checked = filters.indexOf("," + filterName) != -1
        }
    }

    function triggerChange(instance) {
        events.trigger(instance, "filterchange")
    }

    function parentWithClass(elem, className) {
        for (; !elem.classList || !elem.classList.contains(className);)
            if (elem = elem.parentNode, !elem) return null;
        return elem
    }

    function setVisibility(context, options) {
        "livetvchannels" != options.mode && "albums" != options.mode && "artists" != options.mode && "albumartists" != options.mode && "songs" != options.mode || hideByClass(context, "videoStandard"), enableDynamicFilters(options.mode) && (context.querySelector(".genreFilters").classList.remove("hide"), context.querySelector(".officialRatingFilters").classList.remove("hide"), context.querySelector(".tagFilters").classList.remove("hide"), context.querySelector(".yearFilters").classList.remove("hide")), "movies" != options.mode && "episodes" != options.mode || context.querySelector(".videoTypeFilters").classList.remove("hide"), "games" == options.mode, "movies" != options.mode && "series" != options.mode && "games" != options.mode && "episodes" != options.mode || context.querySelector(".features").classList.remove("hide"), "series" == options.mode && (context.querySelector(".airdays").classList.remove("hide"), context.querySelector(".seriesStatus").classList.remove("hide")), "episodes" == options.mode && showByClass(context, "episodeFilter")
    }

    function showByClass(context, className) {
        for (var elems = context.querySelectorAll("." + className), i = 0, length = elems.length; i < length; i++) elems[i].classList.remove("hide")
    }

    function hideByClass(context, className) {
        for (var elems = context.querySelectorAll("." + className), i = 0, length = elems.length; i < length; i++) elems[i].classList.add("hide")
    }

    function enableDynamicFilters(mode) {
        return "movies" == mode || "games" == mode || "series" == mode || "albums" == mode || "albumartists" == mode || "artists" == mode || "songs" == mode || "episodes" == mode
    }
    return function(options) {
        function onFavoriteChange() {
            var query = options.query;
            query.StartIndex = 0, query.IsFavorite = !!this.checked || null, triggerChange(self)
        }

        function onStandardFilterChange() {
            var query = options.query,
                filterName = this.getAttribute("data-filter"),
                filters = query.Filters || "";
            filters = ("," + filters).replace("," + filterName, "").substring(1), this.checked && (filters = filters ? filters + "," + filterName : filterName), query.StartIndex = 0, query.Filters = filters, triggerChange(self)
        }

        function onVideoTypeFilterChange() {
            var query = options.query,
                filterName = this.getAttribute("data-filter"),
                filters = query.VideoTypes || "";
            filters = ("," + filters).replace("," + filterName, "").substring(1), this.checked && (filters = filters ? filters + "," + filterName : filterName), query.StartIndex = 0, query.VideoTypes = filters, triggerChange(self)
        }

        function onStatusChange() {
            var query = options.query,
                filterName = this.getAttribute("data-filter"),
                filters = query.SeriesStatus || "";
            filters = ("," + filters).replace("," + filterName, "").substring(1), this.checked && (filters = filters ? filters + "," + filterName : filterName), query.SeriesStatus = filters, query.StartIndex = 0, triggerChange(self)
        }

        function onAirDayChange() {
            var query = options.query,
                filterName = this.getAttribute("data-filter"),
                filters = query.AirDays || "";
            filters = ("," + filters).replace("," + filterName, "").substring(1), this.checked && (filters = filters ? filters + "," + filterName : filterName), query.AirDays = filters, query.StartIndex = 0, triggerChange(self)
        }

        function bindEvents(context) {
            var elems, i, length, query = options.query;
            if ("livetvchannels" == options.mode) {
                for (elems = context.querySelectorAll(".chkFavorite"), i = 0, length = elems.length; i < length; i++) elems[i].addEventListener("change", onFavoriteChange);
                context.querySelector(".chkLikes").addEventListener("change", function() {
                    query.StartIndex = 0, query.IsLiked = !!this.checked || null, triggerChange(self)
                }), context.querySelector(".chkDislikes").addEventListener("change", function() {
                    query.StartIndex = 0, query.IsDisliked = !!this.checked || null, triggerChange(self)
                })
            } else
                for (elems = context.querySelectorAll(".chkStandardFilter"), i = 0, length = elems.length; i < length; i++) elems[i].addEventListener("change", onStandardFilterChange);
            for (elems = context.querySelectorAll(".chkVideoTypeFilter"), i = 0, length = elems.length; i < length; i++) elems[i].addEventListener("change", onVideoTypeFilterChange);
            for (context.querySelector(".chk3DFilter").addEventListener("change", function() {
                    query.StartIndex = 0, query.Is3D = !!this.checked || null, triggerChange(self)
                }), context.querySelector(".chkHDFilter").addEventListener("change", function() {
                    query.StartIndex = 0, query.IsHD = !!this.checked || null, triggerChange(self)
                }), context.querySelector(".chkSDFilter").addEventListener("change", function() {
                    query.StartIndex = 0, query.IsHD = !this.checked && null, triggerChange(self)
                }), elems = context.querySelectorAll(".chkStatus"), i = 0, length = elems.length; i < length; i++) elems[i].addEventListener("change", onStatusChange);
            for (elems = context.querySelectorAll(".chkAirDays"), i = 0, length = elems.length; i < length; i++) elems[i].addEventListener("change", onAirDayChange);
            context.querySelector("#chkTrailer").addEventListener("change", function() {
                query.StartIndex = 0, query.HasTrailer = !!this.checked || null, triggerChange(self)
            }), context.querySelector("#chkThemeSong").addEventListener("change", function() {
                query.StartIndex = 0, query.HasThemeSong = !!this.checked || null, triggerChange(self)
            }), context.querySelector("#chkSpecialFeature").addEventListener("change", function() {
                query.StartIndex = 0, query.HasSpecialFeature = !!this.checked || null, triggerChange(self)
            }), context.querySelector("#chkThemeVideo").addEventListener("change", function() {
                query.StartIndex = 0, query.HasThemeVideo = !!this.checked || null, triggerChange(self)
            }), context.querySelector("#chkMissingEpisode").addEventListener("change", function() {
                query.StartIndex = 0, query.IsMissing = !!this.checked, triggerChange(self)
            }), context.querySelector("#chkSpecialEpisode").addEventListener("change", function() {
                query.StartIndex = 0, query.ParentIndexNumber = this.checked ? 0 : null, triggerChange(self)
            }), context.querySelector("#chkFutureEpisode").addEventListener("change", function() {
                query.StartIndex = 0, this.checked ? (query.IsUnaired = !0, query.IsVirtualUnaired = null) : (query.IsUnaired = null, query.IsVirtualUnaired = !1), triggerChange(self)
            }), context.querySelector("#chkSubtitle").addEventListener("change", function() {
                query.StartIndex = 0, query.HasSubtitles = !!this.checked || null, triggerChange(self)
            }), context.addEventListener("change", function(e) {
                var chkGenreFilter = parentWithClass(e.target, "chkGenreFilter");
                if (chkGenreFilter) {
                    var filterName = chkGenreFilter.getAttribute("data-filter"),
                        filters = query.Genres || "",
                        delimiter = "|";
                    return filters = (delimiter + filters).replace(delimiter + filterName, "").substring(1), chkGenreFilter.checked && (filters = filters ? filters + delimiter + filterName : filterName), query.StartIndex = 0, query.Genres = filters, void triggerChange(self)
                }
                var chkTagFilter = parentWithClass(e.target, "chkTagFilter");
                if (chkTagFilter) {
                    var filterName = chkTagFilter.getAttribute("data-filter"),
                        filters = query.Tags || "",
                        delimiter = "|";
                    return filters = (delimiter + filters).replace(delimiter + filterName, "").substring(1), chkTagFilter.checked && (filters = filters ? filters + delimiter + filterName : filterName), query.StartIndex = 0, query.Tags = filters, void triggerChange(self)
                }
                var chkYearFilter = parentWithClass(e.target, "chkYearFilter");
                if (chkYearFilter) {
                    var filterName = chkYearFilter.getAttribute("data-filter"),
                        filters = query.Years || "",
                        delimiter = ",";
                    return filters = (delimiter + filters).replace(delimiter + filterName, "").substring(1), chkYearFilter.checked && (filters = filters ? filters + delimiter + filterName : filterName), query.StartIndex = 0, query.Years = filters, void triggerChange(self)
                }
                var chkOfficialRatingFilter = parentWithClass(e.target, "chkOfficialRatingFilter");
                if (chkOfficialRatingFilter) {
                    var filterName = chkOfficialRatingFilter.getAttribute("data-filter"),
                        filters = query.OfficialRatings || "",
                        delimiter = "|";
                    return filters = (delimiter + filters).replace(delimiter + filterName, "").substring(1), chkOfficialRatingFilter.checked && (filters = filters ? filters + delimiter + filterName : filterName), query.StartIndex = 0, query.OfficialRatings = filters, void triggerChange(self)
                }
            })
        }
        var self = this;
        self.show = function() {
            return new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest;
                xhr.open("GET", "components/filterdialog/filterdialog.template.html", !0), xhr.onload = function(e) {
                    var template = this.response,
                        dlg = dialogHelper.createDialog({
                            removeOnClose: !0,
                            modal: !1,
                            entryAnimationDuration: 160,
                            exitAnimationDuration: 200,
                            autoFocus: !1
                        });
                    dlg.classList.add("ui-body-a"), dlg.classList.add("background-theme-a"), dlg.classList.add("formDialog"), dlg.classList.add("filterDialog"), dlg.innerHTML = Globalize.translateDocument(template), setVisibility(dlg, options), dialogHelper.open(dlg), dlg.addEventListener("close", resolve), updateFilterControls(dlg, options), bindEvents(dlg), enableDynamicFilters(options.mode) && (dlg.classList.add("dynamicFilterDialog"), loadDynamicFilters(dlg, Dashboard.getCurrentUserId(), options.query))
                }, xhr.send()
            })
        }
    }
});