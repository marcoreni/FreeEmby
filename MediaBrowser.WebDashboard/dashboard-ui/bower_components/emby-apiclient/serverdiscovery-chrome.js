define([], function() {
    "use strict";

    function stringToArrayBuffer(string) {
        for (var buf = new ArrayBuffer(2 * string.length), bufView = new Uint16Array(buf), i = 0, strLen = string.length; i < strLen; i++) bufView[i] = string.charCodeAt(i);
        return buf
    }

    function arrayBufferToString(buf) {
        return String.fromCharCode.apply(null, new Uint16Array(buf))
    }

    function getResultCode(result) {
        return null != result && null != result.resultCode ? result.resultCode : result
    }

    function closeSocket(socketId) {
        try {
            chrome.sockets.udp.close(socketId)
        } catch (err) {}
    }

    function findServersInternal(timeoutMs) {
        return new Promise(function(resolve, reject) {
            function onTimerExpired() {
                resolve(servers), socketId && (chrome.sockets.udp.onReceive.removeListener(onReceive), closeSocket(socketId))
            }

            function startTimer() {
                console.log("starting udp receive timer with timeout ms: " + timeoutMs), timeout = setTimeout(onTimerExpired, timeoutMs)
            }

            function onReceive(info) {
                try {
                    if (console.log("ServerDiscovery message received"), console.log(info), null != info && info.socketId === socketId) {
                        var json = arrayBufferToString(info.data);
                        console.log("Server discovery json: " + json);
                        var server = JSON.parse(json);
                        server.RemoteAddress = info.remoteAddress, info.remotePort && (server.RemoteAddress += ":" + info.remotePort), servers.push(server)
                    }
                } catch (err) {
                    console.log("Error receiving server info: " + err)
                }
            }
            var servers = [],
                chrome = window.chrome;
            if (!chrome) return void resolve(servers);
            if (!chrome.sockets) return void resolve(servers);
            var timeout, socketId, port = 7359;
            console.log("chrome.sockets.udp.create"), startTimer(), chrome.sockets.udp.create(function(createInfo) {
                return createInfo && createInfo.socketId ? (socketId = createInfo.socketId, console.log("chrome.sockets.udp.bind"), void chrome.sockets.udp.bind(createInfo.socketId, "0.0.0.0", 0, function(bindResult) {
                    if (0 !== getResultCode(bindResult)) return void console.log("bind fail: " + bindResult);
                    var data = stringToArrayBuffer("who is EmbyServer?");
                    console.log("chrome.sockets.udp.send"), chrome.sockets.udp.send(createInfo.socketId, data, "255.255.255.255", port, function(sendResult) {
                        0 !== getResultCode(sendResult) ? console.log("send fail: " + sendResult) : (chrome.sockets.udp.onReceive.addListener(onReceive), console.log("sendTo: success " + port))
                    })
                })) : void console.log("create fail")
            })
        })
    }
    return {
        findServers: function(timeoutMs) {
            return new Promise(function(resolve, reject) {
                try {
                    findServersInternal(timeoutMs).then(resolve, function() {
                        resolve([])
                    })
                } catch (err) {
                    resolve([])
                }
            })
        }
    }
});