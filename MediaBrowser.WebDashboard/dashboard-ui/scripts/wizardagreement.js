define(["jQuery"], function($) {
    "use strict";

    function onSubmit() {
        var page = $(this).parents(".page")[0];
        return page.querySelector(".chkAccept").checked ? Dashboard.navigate("wizardfinish.html") : Dashboard.alert({
            message: Globalize.translate("MessagePleaseAcceptTermsOfServiceBeforeContinuing"),
            title: ""
        }), !1
    }
    $(document).on("pageinit", "#wizardAgreementPage", function() {
        $(".wizardAgreementForm").off("submit", onSubmit).on("submit", onSubmit)
    })
});