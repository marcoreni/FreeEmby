define([], function() {
    "use strict";

    function processcommands(text, commandgroups) {
        var result = {
                groupid: "",
                name: "",
                item: {
                    actionid: "",
                    groupid: "",
                    sourceid: "",
                    menuid: "",
                    deviceid: "",
                    itemName: "",
                    itemType: "",
                    shuffle: !1,
                    filters: [],
                    sortBy: "",
                    sortOrder: "",
                    item: 100,
                    category: "",
                    usedefaultvalues: !0
                },
                defaultValues: {
                    sourceid: "",
                    deviceid: "",
                    itemName: "",
                    itemType: "",
                    shuffle: !1,
                    filters: [],
                    sortBy: "",
                    sortOrder: "",
                    limit: 100,
                    category: ""
                },
                properties: {
                    movieName: null,
                    devicename: null,
                    songName: null,
                    artistName: null,
                    albumName: null,
                    serieName: null,
                    seasonName: null,
                    pictureName: null,
                    authorname: null
                },
                command: null,
                text: text,
                success: !1
            },
            isvalid = !1;
        return commandgroups.map(function(group) {
            isvalid || (group.defaultValues && group.defaultValues.length > 0 && group.defaultValues.map(function(item) {}), group.items && group.items.length > 0 && group.items.map(function(item) {
                var regex = NamedRegExp(item.command, text);
                if (!regex && item.altcommand && (regex = NamedRegExp(item.altcommand, text)), regex && regex.length > 0) {
                    group.groupid && (result.groupid = group.groupid), group.name && (result.name = group.name), group.defaultValues && (result.defaultValues.sourceid = group.defaultValues.sourceid || result.defaultValues.sourceid, result.defaultValues.deviceid = group.defaultValues.deviceid || result.defaultValues.deviceid, result.defaultValues.itemName = group.defaultValues.itemName || result.defaultValues.itemName, result.defaultValues.itemType = group.defaultValues.itemType || result.defaultValues.itemType, result.defaultValues.shuffle = group.defaultValues.shuffle || result.defaultValues.shuffle, result.defaultValues.filters = group.defaultValues.filters || result.defaultValues.filters, result.defaultValues.sortBy = group.defaultValues.sortBy || result.defaultValues.sortBy, result.defaultValues.sortOrder = group.defaultValues.sortOrder || result.defaultValues.sortOrder, result.defaultValues.limit = group.defaultValues.limit || result.defaultValues.limit, result.defaultValues.category = group.defaultValues.category || result.defaultValues.category), group.name && (result.name = group.name);
                    var usegroupDefault = checkItemProperty(item.usedefaultvalues, result.item.usedefaultvalues);
                    result.item.usedefaultvalues = usegroupDefault, result.item.actionid = checkItemProperty(item.actionid, result.item.actionid), result.item.groupid = checkItemProperty(item.groupid, result.item.groupid), result.item.menuid = checkItemProperty(item.menuid, result.item.menuid), result.item.sourceid = checkItemProperty(item.sourceid, result.item.sourceid, usegroupDefault, result.defaultValues.sourceid), result.item.deviceid = checkItemProperty(item.deviceid, result.item.deviceid, usegroupDefault, result.defaultValues.deviceid), result.item.itemName = checkItemProperty(item.itemName, result.item.itemName, usegroupDefault, result.defaultValues.itemName), result.item.itemType = checkItemProperty(item.itemType, result.item.itemType, usegroupDefault, result.defaultValues.itemType), result.item.shuffle = checkItemProperty(item.shuffle, result.item.shuffle, usegroupDefault, result.defaultValues.shuffle), result.item.filters = checkItemProperty(item.filters, result.item.filters, usegroupDefault, result.defaultValues.filters), result.item.sortBy = checkItemProperty(item.sortBy, result.item.sortBy, usegroupDefault, result.defaultValues.sortBy), result.item.sortOrder = checkItemProperty(item.sortOrder, result.item.sortOrder, usegroupDefault, result.defaultValues.sortOrder), result.item.limit = checkItemProperty(item.limit, result.item.limit, usegroupDefault, result.defaultValues.limit), result.command = item, regex.map(function(regresult) {
                        switch (regresult.name) {
                            case "moviename":
                                result.properties.movieName = regresult.value;
                                break;
                            case "devicename":
                                result.properties.devicename = regresult.value;
                                break;
                            case "songname":
                                result.properties.songName = regresult.value;
                                break;
                            case "artistname":
                                result.properties.artistName = regresult.value;
                                break;
                            case "albumname":
                                result.properties.albumName = regresult.value;
                                break;
                            case "seriename":
                                result.properties.serieName = regresult.value;
                                break;
                            case "seasonname":
                                result.properties.seasonName = regresult.value;
                                break;
                            case "picturename":
                                result.properties.pictureName = regresult.value;
                                break;
                            case "authorname":
                                result.properties.authorname = regresult.value
                        }
                        result.text && (result.text = result.text.replace(regresult.value, "").trim())
                    }), isvalid = !0
                }
            }))
        }), result
    }

    function checkItemProperty(property, itemDefaultValue, useGroupDefaultValue, groupDefaultValue) {
        return property ? property : useGroupDefaultValue && groupDefaultValue ? groupDefaultValue : itemDefaultValue
    }
    var NamedRegExp = function(pattern, string) {
        pattern = pattern.toString();
        for (var regexp = [], groupRX = /\(\?<(.*?)\>\s?(.*?)\)/i; groupRX.test(pattern);) {
            var match = groupRX.exec(pattern);
            regexp.push({
                name: match[1].trim().toLowerCase(),
                pattern: match[2].trim().toLowerCase(),
                value: null,
                title: ""
            }), pattern = pattern.replace(groupRX, "(" + match[2].trim() + ")")
        }
        var finalMatch = new RegExp(pattern, "i").exec(string);
        if (finalMatch) {
            for (var i = 0, len = regexp.length; i < len; i++)
                if (finalMatch[i + 1] !== !1) {
                    var mth = finalMatch[i + 1];
                    mth && (mth = mth.trim().toLowerCase()), regexp[i].value = mth
                }
        } else regexp = null;
        return regexp
    };
    return function(commandgroups, text) {
        var result;
        return commandgroups && (result = processcommands(text, commandgroups), console.log(text), console.log(commandgroups)), result
    }
});