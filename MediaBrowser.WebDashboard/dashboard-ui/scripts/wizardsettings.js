define(["jQuery", "loading"], function($, loading) {
    "use strict";

    function save(page) {
        loading.show();
        var apiClient = ApiClient;
        apiClient.getJSON(apiClient.getUrl("Startup/Configuration")).then(function(config) {
            config.PreferredMetadataLanguage = $("#selectLanguage", page).val(), config.MetadataCountryCode = $("#selectCountry", page).val(), apiClient.ajax({
                type: "POST",
                data: config,
                url: apiClient.getUrl("Startup/Configuration")
            }).then(function() {
                loading.hide(), navigateToNextPage()
            })
        })
    }

    function populateLanguages(select, languages) {
        var html = "";
        html += "<option value=''></option>";
        for (var i = 0, length = languages.length; i < length; i++) {
            var culture = languages[i];
            html += "<option value='" + culture.TwoLetterISOLanguageName + "'>" + culture.DisplayName + "</option>"
        }
        select.innerHTML = html
    }

    function populateCountries(select, allCountries) {
        var html = "";
        html += "<option value=''></option>";
        for (var i = 0, length = allCountries.length; i < length; i++) {
            var culture = allCountries[i];
            html += "<option value='" + culture.TwoLetterISORegionName + "'>" + culture.DisplayName + "</option>"
        }
        select.innerHTML = html
    }

    function reloadData(page, config, cultures, countries) {
        populateLanguages(page.querySelector("#selectLanguage"), cultures), populateCountries(page.querySelector("#selectCountry"), countries), $("#selectLanguage", page).val(config.PreferredMetadataLanguage), $("#selectCountry", page).val(config.MetadataCountryCode), loading.hide()
    }

    function reload(page) {
        loading.show();
        var apiClient = ApiClient,
            promise1 = apiClient.getJSON(apiClient.getUrl("Startup/Configuration")),
            promise2 = apiClient.getCultures(),
            promise3 = apiClient.getCountries();
        Promise.all([promise1, promise2, promise3]).then(function(responses) {
            reloadData(page, responses[0], responses[1], responses[2])
        })
    }

    function navigateToNextPage() {
        require(["scripts/wizardcontroller"], function(wizardcontroller) {
            wizardcontroller.navigateToComponents()
        })
    }

    function onSubmit() {
        var form = this;
        return save(form), !1
    }
    $(document).on("pageinit", "#wizardSettingsPage", function() {
        var page = this;
        $(".wizardSettingsForm", page).off("submit", onSubmit).on("submit", onSubmit)
    }).on("pageshow", "#wizardSettingsPage", function() {
        var page = this;
        reload(page)
    })
});