define(["globalize"], function(globalize) {
    "use strict";

    function getVideoQualityOptions(options) {
        var maxStreamingBitrate = options.currentMaxBitrate,
            videoWidth = options.videoWidth,
            maxAllowedWidth = videoWidth || 4096,
            qualityOptions = [];
        maxAllowedWidth >= 3800 && (qualityOptions.push({
            name: "4K - 120Mbps",
            maxHeight: 2160,
            bitrate: 12e7
        }), qualityOptions.push({
            name: "4K - 100Mbps",
            maxHeight: 2160,
            bitrate: 1e8
        }), qualityOptions.push({
            name: "4K - 80Mbps",
            maxHeight: 2160,
            bitrate: 8e7
        })), maxAllowedWidth >= 1900 ? (qualityOptions.push({
            name: "1080p - 60Mbps",
            maxHeight: 1080,
            bitrate: 6e7
        }), qualityOptions.push({
            name: "1080p - 50Mbps",
            maxHeight: 1080,
            bitrate: 5e7
        }), qualityOptions.push({
            name: "1080p - 40Mbps",
            maxHeight: 1080,
            bitrate: 4e7
        }), qualityOptions.push({
            name: "1080p - 30Mbps",
            maxHeight: 1080,
            bitrate: 3e7
        }), qualityOptions.push({
            name: "1080p - 25Mbps",
            maxHeight: 1080,
            bitrate: 25e6
        }), qualityOptions.push({
            name: "1080p - 20Mbps",
            maxHeight: 1080,
            bitrate: 2e7
        }), qualityOptions.push({
            name: "1080p - 15Mbps",
            maxHeight: 1080,
            bitrate: 15e6
        }), qualityOptions.push({
            name: "1080p - 10Mbps",
            maxHeight: 1080,
            bitrate: 10000001
        }), qualityOptions.push({
            name: "1080p - 8Mbps",
            maxHeight: 1080,
            bitrate: 8000001
        }), qualityOptions.push({
            name: "1080p - 6Mbps",
            maxHeight: 1080,
            bitrate: 6000001
        }), qualityOptions.push({
            name: "1080p - 5Mbps",
            maxHeight: 1080,
            bitrate: 5000001
        }), qualityOptions.push({
            name: "1080p - 4Mbps",
            maxHeight: 1080,
            bitrate: 4000002
        })) : maxAllowedWidth >= 1260 ? (qualityOptions.push({
            name: "720p - 10Mbps",
            maxHeight: 720,
            bitrate: 1e7
        }), qualityOptions.push({
            name: "720p - 8Mbps",
            maxHeight: 720,
            bitrate: 8e6
        }), qualityOptions.push({
            name: "720p - 6Mbps",
            maxHeight: 720,
            bitrate: 6e6
        }), qualityOptions.push({
            name: "720p - 5Mbps",
            maxHeight: 720,
            bitrate: 5e6
        })) : maxAllowedWidth >= 620 && (qualityOptions.push({
            name: "480p - 4Mbps",
            maxHeight: 480,
            bitrate: 4000001
        }), qualityOptions.push({
            name: "480p - 3Mbps",
            maxHeight: 480,
            bitrate: 3000001
        }), qualityOptions.push({
            name: "480p - 2.5Mbps",
            maxHeight: 480,
            bitrate: 25e5
        }), qualityOptions.push({
            name: "480p - 2Mbps",
            maxHeight: 480,
            bitrate: 2000001
        }), qualityOptions.push({
            name: "480p - 1.5Mbps",
            maxHeight: 480,
            bitrate: 1500001
        })), maxAllowedWidth >= 1260 && (qualityOptions.push({
            name: "720p - 4Mbps",
            maxHeight: 720,
            bitrate: 4e6
        }), qualityOptions.push({
            name: "720p - 3Mbps",
            maxHeight: 720,
            bitrate: 3e6
        }), qualityOptions.push({
            name: "720p - 2Mbps",
            maxHeight: 720,
            bitrate: 2e6
        }), qualityOptions.push({
            name: "720p - 1.5Mbps",
            maxHeight: 720,
            bitrate: 15e5
        }), qualityOptions.push({
            name: "720p - 1Mbps",
            maxHeight: 720,
            bitrate: 1000001
        })), qualityOptions.push({
            name: "480p - 1.0Mbps",
            maxHeight: 480,
            bitrate: 1e6
        }), qualityOptions.push({
            name: "480p - 720kbps",
            maxHeight: 480,
            bitrate: 72e4
        }), qualityOptions.push({
            name: "480p - 420kbps",
            maxHeight: 480,
            bitrate: 42e4
        }), qualityOptions.push({
            name: "360p",
            maxHeight: 360,
            bitrate: 4e5
        }), qualityOptions.push({
            name: "240p",
            maxHeight: 240,
            bitrate: 32e4
        }), qualityOptions.push({
            name: "144p",
            maxHeight: 144,
            bitrate: 192e3
        });
        var autoQualityOption = {
            name: globalize.translate("sharedcomponents#Auto"),
            bitrate: 0,
            selected: options.isAutomaticBitrateEnabled
        };
        if (options.enableAuto && qualityOptions.push(autoQualityOption), maxStreamingBitrate) {
            for (var selectedIndex = -1, i = 0, length = qualityOptions.length; i < length; i++) {
                var option = qualityOptions[i];
                selectedIndex === -1 && option.bitrate <= maxStreamingBitrate && (selectedIndex = i)
            }
            selectedIndex === -1 && (selectedIndex = qualityOptions.length - 1);
            var currentQualityOption = qualityOptions[selectedIndex];
            options.isAutomaticBitrateEnabled ? autoQualityOption.autoText = currentQualityOption.name : currentQualityOption.selected = !0
        }
        return qualityOptions
    }
    return {
        getVideoQualityOptions: getVideoQualityOptions
    }
});