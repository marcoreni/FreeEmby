define(["jQuery", "loading"], function($, loading) {
    "use strict";

    function loadPage(page, config, languageOptions) {
        $("#selectLocalizationLanguage", page).html(languageOptions.map(function(l) {
            return '<option value="' + l.Value + '">' + l.Name + "</option>"
        })).val(config.UICulture), loading.hide()
    }

    function save(page) {
        loading.show();
        var apiClient = ApiClient;
        apiClient.getJSON(apiClient.getUrl("Startup/Configuration")).then(function(config) {
            config.UICulture = $("#selectLocalizationLanguage", page).val(), apiClient.ajax({
                type: "POST",
                data: config,
                url: apiClient.getUrl("Startup/Configuration")
            }).then(function() {
                Dashboard.navigate("wizarduser.html")
            })
        })
    }

    function onSubmit() {
        return save($(this).parents(".page")), !1
    }
    $(document).on("pageinit", "#wizardStartPage", function() {
        $(".wizardStartForm").off("submit", onSubmit).on("submit", onSubmit), window.ConnectionManager.clearData()
    }).on("pageshow", "#wizardStartPage", function() {
        loading.show();
        var page = this,
            apiClient = ApiClient,
            promise1 = apiClient.getJSON(apiClient.getUrl("Startup/Configuration")),
            promise2 = apiClient.getJSON(apiClient.getUrl("Localization/Options"));
        Promise.all([promise1, promise2]).then(function(responses) {
            loadPage(page, responses[0], responses[1])
        })
    })
});