define([], function() {
    "use strict";

    function listenerSession(resolve, timeoutMs) {
        function closeListenerSocket() {
            timeout && clearTimeout(timeout), null !== listenerSocket && (listenerSocket.close(), listenerSocket = null), resolve(servers)
        }

        function startListener(eventObject) {
            listenerSocket = new Windows.Networking.Sockets.DatagramSocket, listenerSocket.addEventListener("messagereceived", onMessageReceived), listenerSocket.bindServiceNameAsync("").done(function() {
                sendMessage(stringToSend)
            }, onError)
        }

        function sendMessage(txt) {
            try {
                var remoteHostname = new Windows.Networking.HostName("255.255.255.255");
                listenerSocket.getOutputStreamAsync(remoteHostname, serviceName).done(function(outputStream) {
                    try {
                        var writer = new Windows.Storage.Streams.DataWriter(outputStream);
                        writer.writeString(txt), writer.storeAsync().done(function() {
                            timeout = setTimeout(closeListenerSocket, timeoutMs)
                        }, onError)
                    } catch (exception) {
                        onError("Error sending message: " + exception.message)
                    }
                }, onError)
            } catch (exception) {
                onError("Error sending message outer: " + exception.message)
            }
        }

        function onMessageReceived(eventArguments) {
            try {
                var stringLength = eventArguments.getDataReader().unconsumedBufferLength,
                    receivedMessage = eventArguments.getDataReader().readString(stringLength);
                if (receivedMessage === stringToSend) return;
                var server = JSON.parse(receivedMessage);
                servers.push(server)
            } catch (exception) {
                onError("Error receiving message: " + exception)
            }
        }

        function onError(reason) {
            closeListenerSocket()
        }
        var timeout, listenerSocket = null,
            serviceName = "7359",
            servers = [],
            stringToSend = "who is EmbyServer?|emby";
        startListener()
    }
    return {
        findServers: function(timeoutMs) {
            return new Promise(function(resolve, reject) {
                new listenerSession(resolve, timeoutMs)
            })
        }
    }
});