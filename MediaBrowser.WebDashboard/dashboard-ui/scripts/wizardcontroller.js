define([], function() {
    "use strict";

    function navigateToComponents() {
        var apiClient = ApiClient;
        apiClient.getJSON(apiClient.getUrl("Startup/Info")).then(function(info) {
            info.HasMediaEncoder ? Dashboard.navigate("wizardagreement.html") : Dashboard.navigate("wizardcomponents.html")
        })
    }
    return {
        navigateToComponents: navigateToComponents
    }
});