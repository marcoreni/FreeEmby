define(["jQuery", "libraryBrowser", "loading", "fnchecked"], function($, libraryBrowser, loading) {
    "use strict";

    function getTable(result) {
        var html = "";
        return html += '<table id="tblReport" data-role="table" data-mode="reflow" class="tblLibraryReport stripedTable ui-responsive table-stroke detailTable" style="display:table;">', html += "<thead>", result.Headers.map(function(header) {
            var cellHtml = '<th data-priority="persist">';
            header.ShowHeaderLabel && (header.SortField && (cellHtml += '<a class="lnkColumnSort" href="#" data-sortfield="' + header.SortField + '" style="text-decoration:underline;">'), cellHtml += header.Name || "&nbsp;", header.SortField && (cellHtml += "</a>", header.SortField === defaultSortBy && (cellHtml += "Descending" === query.SortOrder ? '<span style="font-weight:bold;margin-left:5px;vertical-align:top;">&darr;</span>' : '<span style="font-weight:bold;margin-left:5px;vertical-align:top;">&uarr;</span>'))), cellHtml += "</th>", html += cellHtml
        }), html += "</thead>", html += "<tbody>", result.IsGrouped === !1 ? result.Rows.map(function(row) {
            html += getRow(result.Headers, row)
        }) : result.Groups.map(function(group) {
            html += '<tr style="background-color: rgb(51, 51, 51);">', html += '<th scope="rowgroup" colspan="' + result.Headers.length + '">' + (group.Name || "&nbsp;") + "</th>", html += "</tr>", group.Rows.map(function(row) {
                html += getRow(result.Headers, row)
            }), html += "<tr>", html += '<th scope="rowgroup" colspan="' + result.Headers.length + '">&nbsp;</th>', html += "</tr>"
        }), html += "</tbody>", html += "</table>"
    }

    function getRow(rHeaders, rRow) {
        var html = "";
        html += "<tr>";
        for (var j = 0; j < rHeaders.length; j++) {
            var rHeader = rHeaders[j],
                rItem = rRow.Columns[j];
            html += getItem(rHeader, rRow, rItem)
        }
        return html += "</tr>"
    }

    function getItem(rHeader, rRow, rItem) {
        var html = "";
        switch (html += "<td>", rHeader.ItemViewType) {
            case "None":
                html += rItem.Name;
                break;
            case "Detail":
                var id = rRow.Id;
                rItem.Id && (id = rItem.Id), html += '<a href="itemdetails.html?id=' + id + '">' + rItem.Name + "</a>";
                break;
            case "Edit":
                html += '<a href="edititemmetadata.html?id=' + rRow.Id + '">' + rItem.Name + "</a>";
                break;
            case "List":
                html += '<a href="itemlist.html?id=' + rRow.Id + '">' + rItem.Name + "</a>";
                break;
            case "ItemByNameDetails":
                html += '<a href="itemdetails.html?id=' + rItem.Id + "&context=" + rRow.RowType + '">' + rItem.Name + "</a>";
                break;
            case "EmbeddedImage":
                rRow.HasEmbeddedImage && (html += '<div class="libraryReportIndicator clearLibraryReportIndicator"><div class="ui-icon-check ui-btn-icon-notext"></div></div>');
                break;
            case "SubtitleImage":
                rRow.HasSubtitles && (html += '<div class="libraryReportIndicator clearLibraryReportIndicator"><div class="ui-icon-check ui-btn-icon-notext"></div></div>');
                break;
            case "TrailersImage":
                rRow.HasLocalTrailer && (html += '<div class="libraryReportIndicator clearLibraryReportIndicator"><div class="ui-icon-check ui-btn-icon-notext"></div></div>');
                break;
            case "SpecialsImage":
                rRow.HasSpecials && (html += '<div class="libraryReportIndicator clearLibraryReportIndicator"><div class="ui-icon-check ui-btn-icon-notext"></div></div>');
                break;
            case "LockDataImage":
                rRow.HasLockData && (html += '<i class="md-icon">lock</i>');
                break;
            case "TagsPrimaryImage":
                rRow.HasImageTagsPrimary || (html += '<a href="edititemimages.html?id=' + rRow.Id + '"><img src="css/images/editor/missingprimaryimage.png" title="Missing primary image." style="width:18px"/></a>');
                break;
            case "TagsBackdropImage":
                rRow.HasImageTagsBackdrop || "Episode" !== rRow.RowType && "Season" !== rRow.RowType && "Audio" !== rRow.MediaType && "TvChannel" !== rRow.RowType && "MusicAlbum" !== rRow.RowType && (html += '<a href="edititemimages.html?id=' + rRow.Id + '"><img src="css/images/editor/missingbackdrop.png" title="Missing backdrop image." style="width:18px"/></a>');
                break;
            case "TagsLogoImage":
                rRow.HasImageTagsLogo || "Movie" !== rRow.RowType && "Trailer" !== rRow.RowType && "Series" !== rRow.RowType && "MusicArtist" !== rRow.RowType && "BoxSet" !== rRow.RowType || (html += '<a href="edititemimages.html?id=' + rRow.Id + '"><img src="css/images/editor/missinglogo.png" title="Missing logo image." style="width:18px"/></a>');
                break;
            case "UserPrimaryImage":
                if (rRow.UserId) {
                    var userImage = ApiClient.getUserImageUrl(rRow.UserId, {
                        height: 24,
                        type: "Primary"
                    });
                    html += userImage ? '<img src="' + userImage + '" />' : ""
                }
                break;
            case "StatusImage":
                rRow.HasLockData && (html += '<i class="md-icon">lock</i>'), rRow.HasLocalTrailer || "Movie" !== rRow.RowType || (html += '<i title="Missing local trailer." class="md-icon">videocam</i>'), rRow.HasImageTagsPrimary || (html += '<a href="edititemimages.html?id=' + rRow.Id + '"><img src="css/images/editor/missingprimaryimage.png" title="Missing primary image." style="width:18px"/></a>'), rRow.HasImageTagsBackdrop || "Episode" !== rRow.RowType && "Season" !== rRow.RowType && "Audio" !== rRow.MediaType && "TvChannel" !== rRow.RowType && "MusicAlbum" !== rRow.RowType && (html += '<a href="edititemimages.html?id=' + rRow.Id + '"><img src="css/images/editor/missingbackdrop.png" title="Missing backdrop image." style="width:18px"/></a>'), rRow.HasImageTagsLogo || "Movie" !== rRow.RowType && "Trailer" !== rRow.RowType && "Series" !== rRow.RowType && "MusicArtist" !== rRow.RowType && "BoxSet" !== rRow.RowType || (html += '<a href="edititemimages.html?id=' + rRow.Id + '"><img src="css/images/editor/missinglogo.png" title="Missing logo image." style="width:18px"/></a>');
                break;
            default:
                html += rItem.Name
        }
        return html += "</td>"
    }

    function ExportReport(page, e) {
        query.UserId = Dashboard.getCurrentUserId(), query.HasQueryLimit = !1;
        var url = ApiClient.getUrl("Reports/Items/Download", query);
        url && (window.location.href = url)
    }

    function loadGroupByFilters(page) {
        query.UserId = Dashboard.getCurrentUserId();
        var url = "";
        url = ApiClient.getUrl("Reports/Headers", query), ApiClient.getJSON(url).then(function(result) {
            var selected = "None";
            $("#selectReportGroup", page).find("option").remove().end(), $("#selectReportGroup", page).append('<option value="None"></option>'), result.map(function(header) {
                if (("Screen" === header.DisplayType || "ScreenExport" === header.DisplayType) && header.CanGroup && header.FieldName.length > 0) {
                    var option = '<option value="' + header.FieldName + '">' + header.Name + "</option>";
                    $("#selectReportGroup", page).append(option), query.GroupBy === header.FieldName && (selected = header.FieldName)
                }
            }), $("#selectPageSize", page).val(selected)
        })
    }

    function renderItems(page, result) {
        window.scrollTo(0, 0);
        var html = "";
        "ReportData" === query.ReportView ? ($("#selectIncludeItemTypesBox", page).show(), $("#tabFilter", page).show()) : ($("#selectIncludeItemTypesBox", page).hide(), $("#tabFilterBox", page).hide(), $("#tabFilter", page).hide());
        var pagingHtml = libraryBrowser.getQueryPagingHtml({
            startIndex: query.StartIndex,
            limit: query.Limit,
            totalRecordCount: result.TotalRecordCount,
            updatePageSizeSetting: !1,
            viewButton: !0,
            showLimit: !1
        });
        switch ("ReportData" !== query.ReportView && "ReportActivities" !== query.ReportView || ($(".listTopPaging", page).html(pagingHtml).trigger("create"), $(".listTopPaging", page).show(), $(".listBottomPaging", page).html(pagingHtml).trigger("create"), $(".listBottomPaging", page).show(), $(".btnNextPage", page).on("click", function() {
            query.StartIndex += query.Limit, reloadItems(page)
        }), $(".btnNextPage", page).show(), $(".btnPreviousPage", page).on("click", function() {
            query.StartIndex -= query.Limit, reloadItems(page)
        }), $(".btnPreviousPage", page).show(), $("#btnReportExport", page).show(), $("#selectPageSizeBox", page).show(), $("#selectReportGroupingBox", page).show(), $("#grpReportsColumns", page).show(), html += getTable(result), $(".reporContainer", page).html(html).trigger("create"), $(".lnkColumnSort", page).on("click", function() {
            var order = this.getAttribute("data-sortfield");
            query.SortBy === order ? "Descending" === query.SortOrder ? (query.SortOrder = "Ascending", query.SortBy = defaultSortBy) : (query.SortOrder = "Descending", query.SortBy = order) : (query.SortOrder = "Ascending", query.SortBy = order), query.StartIndex = 0, reloadItems(page)
        })), $("#GroupStatus", page).hide(), $("#GroupAirDays", page).hide(), $("#GroupEpisodes", page).hide(), query.IncludeItemTypes) {
            case "Series":
            case "Season":
                $("#GroupStatus", page).show(), $("#GroupAirDays", page).show();
                break;
            case "Episode":
                $("#GroupStatus", page).show(), $("#GroupAirDays", page).show(), $("#GroupEpisodes", page).show()
        }
        $(".viewPanel", page).refresh
    }

    function reloadItems(page) {
        loading.show(), query.UserId = Dashboard.getCurrentUserId();
        var url = "";
        switch (query.ReportView) {
            case "ReportData":
                query.HasQueryLimit = !0, url = ApiClient.getUrl("Reports/Items", query);
                break;
            case "ReportActivities":
                query.HasQueryLimit = !0, url = ApiClient.getUrl("Reports/Activities", query)
        }
        ApiClient.getJSON(url).then(function(result) {
            updateFilterControls(page), renderItems(page, result)
        }), loading.hide()
    }

    function updateFilterControls(page) {
        $(".chkStandardFilter", page).each(function() {
            var filters = "," + (query.Filters || ""),
                filterName = this.getAttribute("data-filter");
            this.checked = filters.indexOf("," + filterName) != -1
        }), $(".chkVideoTypeFilter", page).each(function() {
            var filters = "," + (query.VideoTypes || ""),
                filterName = this.getAttribute("data-filter");
            this.checked = filters.indexOf("," + filterName) != -1
        }), $(".chkStatus", page).each(function() {
            var filters = "," + (query.SeriesStatus || ""),
                filterName = this.getAttribute("data-filter");
            this.checked = filters.indexOf("," + filterName) != -1
        }), $(".chkAirDays", page).each(function() {
            var filters = "," + (query.AirDays || ""),
                filterName = this.getAttribute("data-filter");
            this.checked = filters.indexOf("," + filterName) != -1
        }), $("#chk3D", page).checked(1 == query.Is3D), $("#chkHD", page).checked(1 == query.IsHD), $("#chkSD", page).checked(0 == query.IsHD), $("#chkSubtitle", page).checked(1 == query.HasSubtitles), $("#chkTrailer", page).checked(1 == query.HasTrailer), $("#chkMissingTrailer", page).checked(0 == query.HasTrailer), $("#chkSpecialFeature", page).checked(1 == query.HasSpecialFeature), $("#chkThemeSong", page).checked(1 == query.HasThemeSong), $("#chkThemeVideo", page).checked(1 == query.HasThemeVideo), $("#selectPageSize", page).val(query.Limit), $("#chkMissingRating", page).checked(0 == query.HasOfficialRating), $("#chkMissingOverview", page).checked(0 == query.HasOverview), $("#chkIsLocked", page).checked(1 == query.IsLocked), $("#chkMissingImdbId", page).checked(0 == query.HasImdbId), $("#chkMissingTmdbId", page).checked(0 == query.HasTmdbId), $("#chkMissingTvdbId", page).checked(0 == query.HasTvdbId), $("#chkSpecialEpisode", page).checked(0 == query.ParentIndexNumber), $("#chkMissingEpisode", page).checked(1 == query.IsMissing), $("#chkFutureEpisode", page).checked(1 == query.IsUnaired), $("#selectIncludeItemTypes").val(query.IncludeItemTypes), 1 == query.IsFavorite ? $("#isFavorite").val("true") : 0 == query.IsFavorite ? $("#isFavorite").val("false") : $("#isFavorite").val("-")
    }

    function reloadFiltersIfNeeded(page) {
        filtersLoaded || (filtersLoaded = !0, QueryReportFilters.loadFilters(page, Dashboard.getCurrentUserId(), query, function() {
            reloadItems(page)
        }), QueryReportColumns.loadColumns(page, Dashboard.getCurrentUserId(), query, function() {
            reloadItems(page)
        }))
    }

    function renderOptions(page, selector, cssClass, items) {
        var elem;
        elem = items.length ? $(selector, page).show() : $(selector, page).hide();
        var html = "";
        html += '<div data-role="controlgroup">';
        var index = 0,
            idPrefix = "chk" + selector.substring(1);
        html += items.map(function(filter) {
            var itemHtml = "",
                id = idPrefix + index,
                label = filter,
                value = filter,
                checked = !1;
            return filter.FieldName && (label = filter.Name, value = filter.FieldName, checked = filter.Visible), itemHtml += '<label for="' + id + '">' + label + "</label>", itemHtml += '<input id="' + id + '" type="checkbox" data-filter="' + value + '" class="' + cssClass + '"', checked && (itemHtml += ' checked="checked" '), itemHtml += "/>", index++, itemHtml
        }).join(""), html += "</div>", $(".filterOptions", elem).html(html).trigger("create")
    }

    function renderFilters(page, result) {
        result.Tags && (result.Tags.length = Math.min(result.Tags.length, 50)), renderOptions(page, ".genreFilters", "chkGenreFilter", result.Genres), renderOptions(page, ".officialRatingFilters", "chkOfficialRatingFilter", result.OfficialRatings), renderOptions(page, ".tagFilters", "chkTagFilter", result.Tags), renderOptions(page, ".yearFilters", "chkYearFilter", result.Years)
    }

    function renderColumnss(page, result) {
        result.Tags && (result.Tags.length = Math.min(result.Tags.length, 50)), renderOptions(page, ".reportsColumns", "chkReportColumns", result)
    }

    function onFiltersLoaded(page, query, reloadItemsFn) {
        $(".chkGenreFilter", page).on("change", function() {
            var filterName = this.getAttribute("data-filter"),
                filters = query.Genres || "",
                delimiter = "|";
            filters = (delimiter + filters).replace(delimiter + filterName, "").substring(1), this.checked && (filters = filters ? filters + delimiter + filterName : filterName), query.StartIndex = 0, query.Genres = filters, reloadItemsFn()
        }), $(".chkTagFilter", page).on("change", function() {
            var filterName = this.getAttribute("data-filter"),
                filters = query.Tags || "",
                delimiter = "|";
            filters = (delimiter + filters).replace(delimiter + filterName, "").substring(1), this.checked && (filters = filters ? filters + delimiter + filterName : filterName), query.StartIndex = 0, query.Tags = filters, reloadItemsFn()
        }), $(".chkYearFilter", page).on("change", function() {
            var filterName = this.getAttribute("data-filter"),
                filters = query.Years || "",
                delimiter = ",";
            filters = (delimiter + filters).replace(delimiter + filterName, "").substring(1), this.checked && (filters = filters ? filters + delimiter + filterName : filterName), query.StartIndex = 0, query.Years = filters, reloadItemsFn()
        }), $(".chkOfficialRatingFilter", page).on("change", function() {
            var filterName = this.getAttribute("data-filter"),
                filters = query.OfficialRatings || "",
                delimiter = "|";
            filters = (delimiter + filters).replace(delimiter + filterName, "").substring(1), this.checked && (filters = filters ? filters + delimiter + filterName : filterName), query.StartIndex = 0, query.OfficialRatings = filters, reloadItemsFn()
        })
    }

    function onColumnsLoaded(page, query, reloadItemsFn) {
        $(".chkReportColumns", page).on("change", function() {
            var filterName = this.getAttribute("data-filter"),
                filters = query.ReportColumns || "",
                delimiter = "|";
            filters = (delimiter + filters).replace(delimiter + filterName, "").substring(1), this.checked && (filters = filters ? filters + delimiter + filterName : filterName), query.StartIndex = 0, query.ReportColumns = filters, reloadItemsFn()
        })
    }

    function loadFilters(page, userId, itemQuery, reloadItemsFn) {
        return ApiClient.getJSON(ApiClient.getUrl("Items/Filters", {
            UserId: userId,
            ParentId: itemQuery.ParentId,
            IncludeItemTypes: itemQuery.IncludeItemTypes,
            ReportView: itemQuery.ReportView
        })).then(function(result) {
            renderFilters(page, result), onFiltersLoaded(page, itemQuery, reloadItemsFn)
        })
    }

    function loadColumns(page, userId, itemQuery, reloadItemsFn) {
        return ApiClient.getJSON(ApiClient.getUrl("Reports/Headers", {
            UserId: userId,
            IncludeItemTypes: itemQuery.IncludeItemTypes,
            ReportView: itemQuery.ReportView
        })).then(function(result) {
            renderColumnss(page, result);
            var filters = "",
                delimiter = "|";
            result.map(function(item) {
                "Screen" !== item.DisplayType && "ScreenExport" !== item.DisplayType || (filters = filters ? filters + delimiter + item.FieldName : item.FieldName)
            }), itemQuery.ReportColumns || (itemQuery.ReportColumns = filters), onColumnsLoaded(page, itemQuery, reloadItemsFn)
        })
    }

    function onPageShow(page, query) {
        query.Genres = null, query.Years = null, query.OfficialRatings = null, query.Tags = null
    }

    function onPageReportColumnsShow(page, query) {
        query.ReportColumns = null
    }
    var filtersLoaded, defaultSortBy = "SortName",
        query = {
            StartIndex: 0,
            Limit: 100,
            IncludeItemTypes: "Movie",
            HasQueryLimit: !0,
            GroupBy: "None",
            ReportView: "ReportData",
            DisplayType: "Screen"
        };
    $(document).on("pageinit", "#libraryReportManagerPage", function() {
        var page = this;
        $("#selectIncludeItemTypes", page).on("change", function() {
            query.StartIndex = 0, query.ReportView = $("#selectViewType", page).val(), query.IncludeItemTypes = this.value, query.SortOrder = "Ascending", query.ReportColumns = null, $(".btnReportExport", page).hide(), filtersLoaded = !1, loadGroupByFilters(page), reloadFiltersIfNeeded(page), reloadItems(page)
        }), $("#selectViewType", page).on("change", function() {
            query.StartIndex = 0, query.ReportView = this.value, query.IncludeItemTypes = $("#selectIncludeItemTypes", page).val(), query.SortOrder = "Ascending", filtersLoaded = !1, query.ReportColumns = null, loadGroupByFilters(page), reloadFiltersIfNeeded(page), reloadItems(page)
        }), $("#selectReportGroup", page).on("change", function() {
            query.GroupBy = this.value, query.StartIndex = 0, reloadItems(page)
        }), $("#btnReportExportCsv", page).on("click", function(e) {
            query.ExportType = "CSV", ExportReport(page, e)
        }), $("#btnReportExportExcel", page).on("click", function(e) {
            query.ExportType = "Excel", ExportReport(page, e)
        }), $("#btnResetReportColumns", page).on("click", function(e) {
            query.ReportColumns = null, query.StartIndex = 0, filtersLoaded = !1, reloadFiltersIfNeeded(page), reloadItems(page)
        }), $(".viewPanel", page).on("panelopen", function() {
            reloadFiltersIfNeeded(page)
        }), $("#selectPageSize", page).on("change", function() {
            query.Limit = parseInt(this.value), query.StartIndex = 0, reloadItems(page)
        }), $("#isFavorite", page).on("change", function() {
            "true" == this.value ? query.IsFavorite = !0 : "false" == this.value ? query.IsFavorite = !1 : query.IsFavorite = null, query.StartIndex = 0, reloadItems(page)
        }), $(".chkStandardFilter", this).on("change", function() {
            var filterName = this.getAttribute("data-filter"),
                filters = query.Filters || "";
            filters = ("," + filters).replace("," + filterName, "").substring(1), this.checked && (filters = filters ? filters + "," + filterName : filterName), query.StartIndex = 0, query.Filters = filters, reloadItems(page)
        }), $(".chkVideoTypeFilter", this).on("change", function() {
            var filterName = this.getAttribute("data-filter"),
                filters = query.VideoTypes || "";
            filters = ("," + filters).replace("," + filterName, "").substring(1), this.checked && (filters = filters ? filters + "," + filterName : filterName), query.StartIndex = 0, query.VideoTypes = filters, reloadItems(page)
        }), $("#chk3D", this).on("change", function() {
            query.StartIndex = 0, query.Is3D = !!this.checked || null, reloadItems(page)
        }), $("#chkHD", this).on("change", function() {
            query.StartIndex = 0, query.IsHD = !!this.checked || null, reloadItems(page)
        }), $("#chkSD", this).on("change", function() {
            query.StartIndex = 0, query.IsHD = !this.checked && null, reloadItems(page)
        }), $("#chkSubtitle", this).on("change", function() {
            query.StartIndex = 0, query.HasSubtitles = !!this.checked || null, reloadItems(page)
        }), $("#chkTrailer", this).on("change", function() {
            query.StartIndex = 0, query.HasTrailer = !!this.checked || null, reloadItems(page)
        }), $("#chkMissingTrailer", this).on("change", function() {
            query.StartIndex = 0, query.HasTrailer = !this.checked && null, reloadItems(page)
        }), $("#chkSpecialFeature", this).on("change", function() {
            query.StartIndex = 0, query.HasSpecialFeature = !!this.checked || null, reloadItems(page)
        }), $("#chkThemeSong", this).on("change", function() {
            query.StartIndex = 0, query.HasThemeSong = !!this.checked || null, reloadItems(page)
        }), $("#chkThemeVideo", this).on("change", function() {
            query.StartIndex = 0, query.HasThemeVideo = !!this.checked || null, reloadItems(page)
        }), $("#radioBasicFilters", this).on("change", function() {
            this.checked ? ($(".basicFilters", page).show(), $(".advancedFilters", page).hide()) : $(".basicFilters", page).hide()
        }), $("#radioAdvancedFilters", this).on("change", function() {
            this.checked ? ($(".advancedFilters", page).show(), $(".basicFilters", page).hide()) : $(".advancedFilters", page).hide()
        }), $("#chkIsLocked", page).on("change", function() {
            query.StartIndex = 0, query.IsLocked = !!this.checked || null, reloadItems(page)
        }), $("#chkMissingOverview", page).on("change", function() {
            query.StartIndex = 0, query.HasOverview = !this.checked && null, reloadItems(page)
        }), $("#chkMissingEpisode", page).on("change", function() {
            query.StartIndex = 0, query.IsMissing = !!this.checked, reloadItems(page)
        }), $("#chkMissingRating", page).on("change", function() {
            query.StartIndex = 0, query.HasOfficialRating = !this.checked && null, reloadItems(page)
        }), $("#chkMissingImdbId", page).on("change", function() {
            query.StartIndex = 0, query.HasImdbId = !this.checked && null, reloadItems(page)
        }), $("#chkMissingTmdbId", page).on("change", function() {
            query.StartIndex = 0, query.HasTmdbId = !this.checked && null, reloadItems(page)
        }), $("#chkMissingTvdbId", page).on("change", function() {
            query.StartIndex = 0, query.HasTvdbId = !this.checked && null, reloadItems(page)
        }), $("#chkMissingEpisode", page).on("change", function() {
            query.StartIndex = 0, query.IsMissing = !!this.checked, reloadItems(page)
        }), $("#chkFutureEpisode", page).on("change", function() {
            query.StartIndex = 0, this.checked ? (query.IsUnaired = !0, query.IsVirtualUnaired = null) : (query.IsUnaired = null, query.IsVirtualUnaired = !1), reloadItems(page)
        }), $("#chkSpecialEpisode", page).on("change", function() {
            query.ParentIndexNumber = this.checked ? 0 : null, reloadItems(page)
        }), $(".chkAirDays", this).on("change", function() {
            var filterName = this.getAttribute("data-filter"),
                filters = query.AirDays || "";
            filters = ("," + filters).replace("," + filterName, "").substring(1), this.checked && (filters = filters ? filters + "," + filterName : filterName), query.AirDays = filters, query.StartIndex = 0, reloadItems(page)
        }), $(".chkStatus", this).on("change", function() {
            var filterName = this.getAttribute("data-filter"),
                filters = query.SeriesStatus || "";
            filters = ("," + filters).replace("," + filterName, "").substring(1), this.checked && (filters = filters ? filters + "," + filterName : filterName), query.SeriesStatus = filters, query.StartIndex = 0, reloadItems(page)
        }), $(page.getElementsByClassName("viewTabButton")).on("click", function() {
            var parent = $(this).parents(".viewPanel");
            $(".viewTabButton", parent).removeClass("ui-btn-active"), this.classList.add("ui-btn-active"), $(".viewTab", parent).addClass("hide"), $("." + this.getAttribute("data-tab"), parent).removeClass("hide")
        })
    }).on("pageshow", "#libraryReportManagerPage", function() {
        query.UserId = Dashboard.getCurrentUserId();
        var page = this;
        query.SortOrder = "Ascending", QueryReportFilters.onPageShow(page, query), QueryReportColumns.onPageShow(page, query), $("#selectIncludeItemTypes", page).val(query.IncludeItemTypes).trigger("change"), updateFilterControls(page), filtersLoaded = !1, updateFilterControls(this)
    }), window.QueryReportFilters = {
        loadFilters: loadFilters,
        onPageShow: onPageShow
    }, window.QueryReportColumns = {
        loadColumns: loadColumns,
        onPageShow: onPageReportColumnsShow
    }
});