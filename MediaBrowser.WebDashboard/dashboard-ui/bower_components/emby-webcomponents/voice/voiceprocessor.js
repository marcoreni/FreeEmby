define(["./voicecommands.js", "./grammarprocessor.js", "require"], function(voicecommands, grammarprocessor, require) {
    "use strict";

    function getCommandGroups() {
        return commandgroups ? Promise.resolve(commandgroups) : new Promise(function(resolve, reject) {
            var file = "grammar";
            require(["text!./grammar/" + file + ".json"], function(response) {
                commandgroups = JSON.parse(response), resolve(commandgroups)
            })
        })
    }

    function processTranscript(text) {
        return text ? getCommandGroups().then(function(commandgroups) {
            var processor = grammarprocessor(commandgroups, text);
            return processor && processor.command ? (console.log("Command from Grammar Processor", processor), voicecommands(processor).then(function(result) {
                return console.log("Result of executed command", result), "show" === result.item.actionid && "group" === result.item.sourceid ? Promise.resolve({
                    error: "group",
                    item: result.item,
                    groupName: result.name,
                    fn: result.fn
                }) : Promise.resolve({
                    item: result.item,
                    fn: result.fn
                })
            }, function() {
                return Promise.reject({
                    error: "unrecognized-command",
                    text: text
                })
            })) : Promise.reject({
                error: "unrecognized-command",
                text: text
            })
        }) : Promise.reject({
            error: "empty"
        })
    }
    var commandgroups;
    return {
        processTranscript: processTranscript,
        getCommandGroups: getCommandGroups
    }
});