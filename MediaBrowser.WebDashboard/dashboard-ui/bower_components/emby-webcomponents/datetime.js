define(["globalize"], function(globalize) {
    "use strict";

    function parseISO8601Date(s, toLocal) {
        var re = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|([+-])(\d{2}):(\d{2}))?/,
            d = s.match(re);
        if (!d) throw "Couldn't parse ISO 8601 date string '" + s + "'";
        var a = [1, 2, 3, 4, 5, 6, 10, 11];
        for (var i in a) d[a[i]] = parseInt(d[a[i]], 10);
        d[7] = parseFloat(d[7]);
        var ms = Date.UTC(d[1], d[2] - 1, d[3], d[4], d[5], d[6]);
        if (d[7] > 0 && (ms += Math.round(1e3 * d[7])), "Z" !== d[8] && d[10]) {
            var offset = 60 * d[10] * 60 * 1e3;
            d[11] && (offset += 60 * d[11] * 1e3), "-" === d[9] ? ms -= offset : ms += offset
        } else toLocal === !1 && (ms += 6e4 * (new Date).getTimezoneOffset());
        return new Date(ms)
    }

    function getDisplayRunningTime(ticks) {
        var ticksPerHour = 36e9,
            ticksPerMinute = 6e8,
            ticksPerSecond = 1e7,
            parts = [],
            hours = ticks / ticksPerHour;
        hours = Math.floor(hours), hours && parts.push(hours), ticks -= hours * ticksPerHour;
        var minutes = ticks / ticksPerMinute;
        minutes = Math.floor(minutes), ticks -= minutes * ticksPerMinute, minutes < 10 && hours && (minutes = "0" + minutes), parts.push(minutes);
        var seconds = ticks / ticksPerSecond;
        return seconds = Math.floor(seconds), seconds < 10 && (seconds = "0" + seconds), parts.push(seconds), parts.join(":")
    }

    function getCurrentLocale() {
        var locale = globalize.getCurrentLocale();
        return locale
    }

    function getOptionList(options) {
        var list = [];
        for (var i in options) list.push({
            name: i,
            value: options[i]
        });
        return list
    }

    function toLocaleString(date, options) {
        if (!date) throw new Error("date cannot be null");
        if (options = options || {}, toLocaleTimeStringSupportsLocales) {
            var currentLocale = getCurrentLocale();
            if (currentLocale) return date.toLocaleString(currentLocale, options)
        }
        return date.toLocaleString()
    }

    function toLocaleDateString(date, options) {
        if (!date) throw new Error("date cannot be null");
        if (options = options || {}, toLocaleTimeStringSupportsLocales) {
            var currentLocale = getCurrentLocale();
            if (currentLocale) return date.toLocaleDateString(currentLocale, options)
        }
        var optionList = getOptionList(options);
        if (1 === optionList.length && "weekday" === optionList[0].name) {
            var weekday = [];
            return weekday[0] = "Sun", weekday[1] = "Mon", weekday[2] = "Tue", weekday[3] = "Wed", weekday[4] = "Thu", weekday[5] = "Fri", weekday[6] = "Sat", weekday[date.getDay()]
        }
        return date.toLocaleDateString()
    }

    function toLocaleTimeString(date, options) {
        if (!date) throw new Error("date cannot be null");
        if (options = options || {}, toLocaleTimeStringSupportsLocales) {
            var currentLocale = getCurrentLocale();
            if (currentLocale) return date.toLocaleTimeString(currentLocale, options)
        }
        return date.toLocaleTimeString()
    }

    function getDisplayTime(date) {
        if (!date) throw new Error("date cannot be null");
        if ("string" === (typeof date).toString().toLowerCase()) try {
            date = parseISO8601Date(date, !0)
        } catch (err) {
            return date
        }
        if (toLocaleTimeStringSupportsLocales) return toLocaleTimeString(date, {
            hour: "numeric",
            minute: "2-digit"
        });
        var time = toLocaleTimeString(date),
            timeLower = time.toLowerCase();
        if (timeLower.indexOf("am") !== -1 || timeLower.indexOf("pm") !== -1) {
            time = timeLower;
            var hour = date.getHours() % 12,
                suffix = date.getHours() > 11 ? "pm" : "am";
            hour || (hour = 12);
            var minutes = date.getMinutes();
            minutes < 10 && (minutes = "0" + minutes), minutes = ":" + minutes, time = hour + minutes + suffix
        } else {
            var timeParts = time.split(":");
            timeParts.length > 2 && (timeParts.length -= 1, time = timeParts.join(":"))
        }
        return time
    }

    function isRelativeDay(date, offsetInDays) {
        if (!date) throw new Error("date cannot be null");
        var yesterday = new Date,
            day = yesterday.getDate() + offsetInDays;
        return yesterday.setDate(day), date.getFullYear() === yesterday.getFullYear() && date.getMonth() === yesterday.getMonth() && date.getDate() === day
    }
    var toLocaleTimeStringSupportsLocales = function() {
        try {
            (new Date).toLocaleTimeString("i")
        } catch (e) {
            return "RangeError" === e.name
        }
        return !1
    }();
    return {
        parseISO8601Date: parseISO8601Date,
        getDisplayRunningTime: getDisplayRunningTime,
        toLocaleDateString: toLocaleDateString,
        toLocaleString: toLocaleString,
        getDisplayTime: getDisplayTime,
        isRelativeDay: isRelativeDay
    }
});