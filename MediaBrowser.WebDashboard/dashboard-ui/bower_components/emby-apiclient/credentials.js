define(["events", "appStorage"], function(events, appStorage) {
    "use strict";
    return function(key) {
        function ensure() {
            if (!credentials) {
                var json = appStorage.getItem(key) || "{}";
                console.log("credentials initialized with: " + json), credentials = JSON.parse(json), credentials.Servers = credentials.Servers || []
            }
        }

        function get() {
            return ensure(), credentials
        }

        function set(data) {
            data ? (credentials = data, appStorage.setItem(key, JSON.stringify(data))) : self.clear(), events.trigger(self, "credentialsupdated")
        }
        var self = this,
            credentials = null;
        key = key || "servercredentials3", self.clear = function() {
            credentials = null, appStorage.removeItem(key)
        }, self.credentials = function(data) {
            return data && set(data), get()
        }, self.addOrUpdateServer = function(list, server) {
            if (!server.Id) throw new Error("Server.Id cannot be null or empty");
            var existing = list.filter(function(s) {
                return s.Id === server.Id
            })[0];
            return existing ? (existing.DateLastAccessed = Math.max(existing.DateLastAccessed || 0, server.DateLastAccessed || 0), existing.UserLinkType = server.UserLinkType, server.AccessToken && (existing.AccessToken = server.AccessToken, existing.UserId = server.UserId), server.ExchangeToken && (existing.ExchangeToken = server.ExchangeToken), server.RemoteAddress && (existing.RemoteAddress = server.RemoteAddress), server.ManualAddress && (existing.ManualAddress = server.ManualAddress), server.LocalAddress && (existing.LocalAddress = server.LocalAddress), server.Name && (existing.Name = server.Name), server.WakeOnLanInfos && server.WakeOnLanInfos.length && (existing.WakeOnLanInfos = server.WakeOnLanInfos), null != server.LastConnectionMode && (existing.LastConnectionMode = server.LastConnectionMode), server.ConnectServerId && (existing.ConnectServerId = server.ConnectServerId), existing) : (list.push(server), server)
        }, self.addOrUpdateUser = function(server, user) {
            server.Users = server.Users || [];
            var existing = server.Users.filter(function(s) {
                return s.Id === user.Id
            })[0];
            existing ? existing.IsSignedInOffline = !0 : server.Users.push(user)
        }
    }
});