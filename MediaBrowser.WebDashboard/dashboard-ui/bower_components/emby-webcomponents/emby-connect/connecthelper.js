define(["globalize", "loading", "alert"], function(globalize, loading, alert) {
    "use strict";

    function showNewUserInviteMessage(result) {
        if (!result.IsNewUserInvitation && !result.IsPending) return Promise.resolve();
        var message = result.IsNewUserInvitation ? globalize.translate("MessageInvitationSentToNewUser", result.GuestDisplayName) : globalize.translate("MessageInvitationSentToUser", result.GuestDisplayName);
        alert({
            text: message,
            title: globalize.translate("HeaderInvitationSent")
        })
    }

    function inviteGuest(options) {
        var apiClient = options.apiClient;
        return loading.show(), apiClient.ajax({
            type: "POST",
            url: apiClient.getUrl("Connect/Invite"),
            dataType: "json",
            data: options.guestOptions || {}
        }).then(function(result) {
            return loading.hide(), showNewUserInviteMessage(result)
        }, function(response) {
            loading.hide(), 404 === response.status ? alert({
                text: globalize.translate("GuestUserNotFound")
            }) : (response.status || 0) >= 500 ? alert({
                text: globalize.translate("ErrorReachingEmbyConnect")
            }) : showGuestGeneralErrorMessage()
        })
    }

    function showGuestGeneralErrorMessage() {
        var html = globalize.translate("ErrorAddingGuestAccount1", '<a href="https://emby.media/connect" target="_blank">https://emby.media/connect</a>');
        html += "<br/><br/>" + globalize.translate("ErrorAddingGuestAccount2", "apps@emby.media");
        var text = globalize.translate("ErrorAddingGuestAccount1", "https://emby.media/connect");
        text += "\n\n" + globalize.translate("ErrorAddingGuestAccount2", "apps@emby.media"), alert({
            text: text,
            html: html
        })
    }

    function showLinkUserMessage(username) {
        var html, text;
        return username ? (html = globalize.translate("ErrorAddingEmbyConnectAccount1", '<a href="https://emby.media/connect" target="_blank">https://emby.media/connect</a>'), html += "<br/><br/>" + globalize.translate("ErrorAddingEmbyConnectAccount2", "apps@emby.media"), text = globalize.translate("ErrorAddingEmbyConnectAccount1", "https://emby.media/connect"), text += "\n\n" + globalize.translate("ErrorAddingEmbyConnectAccount2", "apps@emby.media")) : html = text = globalize.translate("DefaultErrorMessage"), alert({
            text: text,
            html: html
        })
    }

    function updateUserLink(apiClient, user, newConnectUsername) {
        var currentConnectUsername = user.ConnectUserName || "",
            enteredConnectUsername = newConnectUsername,
            linkUrl = apiClient.getUrl("Users/" + user.Id + "/Connect/Link");
        return currentConnectUsername && !enteredConnectUsername ? apiClient.ajax({
            type: "DELETE",
            url: linkUrl
        }).then(function() {
            return alert({
                text: globalize.translate("MessageEmbyAccontRemoved"),
                title: globalize.translate("HeaderEmbyAccountRemoved")
            }).catch(function() {
                return Promise.resolve()
            })
        }, function() {
            return alert({
                text: globalize.translate("ErrorRemovingEmbyConnectAccount")
            }).then(function() {
                return Promise.reject()
            })
        }) : currentConnectUsername !== enteredConnectUsername ? apiClient.ajax({
            type: "POST",
            url: linkUrl,
            data: {
                ConnectUsername: enteredConnectUsername
            },
            dataType: "json"
        }).then(function(result) {
            var msgKey = result.IsPending ? "MessagePendingEmbyAccountAdded" : "MessageEmbyAccountAdded";
            return alert({
                text: globalize.translate(msgKey),
                title: globalize.translate("HeaderEmbyAccountAdded")
            }).catch(function() {
                return Promise.resolve()
            })
        }, function() {
            return showLinkUserMessage(".").then(function() {
                return Promise.reject()
            })
        }) : Promise.reject()
    }
    return {
        inviteGuest: inviteGuest,
        updateUserLink: updateUserLink
    }
});