define(["jQuery", "loading"], function($, loading) {
    "use strict";

    function loadUser(page, user) {
        LibraryMenu.setTitle(user.Name), "Guest" == user.ConnectLinkType ? $(".connectMessage", page).show() : $(".connectMessage", page).hide(), loading.hide()
    }

    function loadData(page) {
        loading.show();
        var userId = getParameterByName("userId");
        ApiClient.getUser(userId).then(function(user) {
            loadUser(page, user)
        })
    }
    $(document).on("pageinit", "#userPasswordPage", function() {
        $(".adminUpdatePasswordForm").off("submit", UpdatePasswordPage.onSubmit).on("submit", UpdatePasswordPage.onSubmit), $(".adminLocalAccessForm").off("submit", UpdatePasswordPage.onLocalAccessSubmit).on("submit", UpdatePasswordPage.onLocalAccessSubmit)
    }).on("pagebeforeshow", "#userPasswordPage", function() {
        var page = this;
        loadData(page)
    })
});