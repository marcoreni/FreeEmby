define(["jQuery"], function($) {
    "use strict";
    $(document).on("pageshow", "#notificationsPage", function() {
        if (Dashboard.getCurrentUserId()) {
            var elem = $(".notificationsList"),
                startIndex = 0,
                limit = 10;
            Notifications.showNotificationsList(startIndex, limit, elem), elem.on("click", ".btnPreviousPage", function(e) {
                e.preventDefault(), startIndex -= limit, startIndex < 0 && (startIndex = 0), Notifications.showNotificationsList(startIndex, limit, elem)
            }).on("click", ".btnNextPage", function(e) {
                e.preventDefault(), startIndex += limit, Notifications.showNotificationsList(startIndex, limit, elem)
            }), Notifications.markNotificationsRead([])
        }
    })
});