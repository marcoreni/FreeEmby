define(["dialogHelper", "voiceReceiver", "voiceProcessor", "globalize", "emby-button", "css!./voice.css", "material-icons", "css!./../formdialog"], function(dialogHelper, voicereceiver, voiceprocessor, globalize) {
    "use strict";

    function shuffleArray(array) {
        for (var temporaryValue, randomIndex, currentIndex = array.length; 0 !== currentIndex;) randomIndex = Math.floor(Math.random() * currentIndex), currentIndex -= 1, temporaryValue = array[currentIndex], array[currentIndex] = array[randomIndex], array[randomIndex] = temporaryValue;
        return array
    }

    function getSampleCommands(groupid) {
        return voiceprocessor.getCommandGroups().then(function(commandGroups) {
            groupid = "undefined" != typeof groupid ? groupid : "";
            var commands = [];
            return commandGroups.map(function(group) {
                group.items && group.items.length > 0 && (groupid !== group.groupid || "" === groupid) && group.items.map(function(item) {
                    item.commandtemplates && item.commandtemplates.length > 0 && item.commandtemplates.map(function(templates) {
                        commands.push(templates)
                    })
                })
            }), shuffleArray(commands)
        })
    }

    function getCommandGroup(groupid) {
        return voicereceiver.getCommandGroups().then(function(commandgroups) {
            if (commandgroups) {
                var idx = -1;
                return idx = commandgroups.map(function(e) {
                    return e.groupid
                }).indexOf(groupid), idx > -1 ? commandgroups[idx] : null
            }
            return null
        })
    }

    function renderSampleCommands(elem, commands) {
        commands.length = Math.min(commands.length, 4), commands = commands.map(function(c) {
            return '<div class="exampleCommand"><span class="exampleCommandText">"' + c + '"</span></div>'
        }).join(""), elem.querySelector(".exampleCommands").innerHTML = commands
    }

    function showVoiceHelp(groupid, title) {
        function onCancelClick() {
            dialogHelper.close(dlg)
        }
        console.log("Showing Voice Help", groupid, title);
        var dlg, isNewDialog = !1;
        if (!currentDialog) {
            isNewDialog = !0, dlg = dialogHelper.createDialog({
                size: "medium",
                removeOnClose: !0
            }), dlg.classList.add("formDialog");
            var html = "";
            html += '<div class="formDialogHeader">', html += '<button is="paper-icon-button-light" class="btnCancelVoiceInput autoSize" tabindex="-1"><i class="md-icon">&#xE5C4;</i></button>', html += '<h3 class="formDialogHeaderTitle">', html += globalize.translate("sharedcomponents#VoiceInput"), html += "</h3>", html += "</div>", html += "<div>", html += '<div class="formDialogContent smoothScrollY" style="padding-top:2em;">', html += '<div class="dialogContentInner dialog-content-centered">', html += '<div class="voiceHelpContent">', html += '<div class="defaultVoiceHelp">', html += '<h1 style="margin-bottom:1.25em;margin-top:0;">' + globalize.translate("sharedcomponents#HeaderSaySomethingLike") + "</h1>", html += '<div class="exampleCommands">', html += "</div>", html += "</div>", html += '<div class="unrecognizedCommand hide">', html += '<h1 style="margin-top:0;">' + globalize.translate("sharedcomponents#HeaderYouSaid") + "</h1>", html += '<p class="exampleCommand voiceInputContainer"><i class="fa fa-quote-left"></i><span class="voiceInputText exampleCommandText"></span><i class="fa fa-quote-right"></i></p>', html += "<p>" + globalize.translate("sharedcomponents#MessageWeDidntRecognizeCommand") + "</p>", html += "<br/>", html += '<button is="emby-button" type="button" class="button-submit block btnRetry raised"><i class="md-icon">mic</i><span>' + globalize.translate("sharedcomponents#ButtonTryAgain") + "</span></button>", html += '<p class="blockedMessage hide">' + globalize.translate("sharedcomponents#MessageIfYouBlockedVoice") + "<br/><br/></p>", html += "</div>", html += "</div>", html += "</div>", html += "</div>", html += "</div>", dlg.innerHTML = html, dialogHelper.open(dlg), currentDialog = dlg, dlg.addEventListener("close", function() {
                voicereceiver.cancel(), currentDialog = null
            });
            for (var closeButtons = dlg.querySelectorAll(".btnCancelVoiceInput"), i = 0, length = closeButtons.length; i < length; i++) closeButtons[i].addEventListener("click", onCancelClick);
            dlg.querySelector(".btnRetry").addEventListener("click", function() {
                dlg.querySelector(".unrecognizedCommand").classList.add("hide"), dlg.querySelector(".defaultVoiceHelp").classList.remove("hide"), listen()
            })
        }
        dlg = currentDialog, groupid ? (getCommandGroup(groupid).then(function(grp) {
            dlg.querySelector("#voiceDialogGroupName").innerText = "  " + grp.name
        }), getSampleCommands(groupid).then(function(commands) {
            renderSampleCommands(currentDialog, commands), listen()
        }).catch(function(e) {
            console.log("Error", e)
        })) : isNewDialog && getSampleCommands().then(function(commands) {
            renderSampleCommands(currentDialog, commands)
        })
    }

    function processInput(input) {
        return voiceprocessor.processTranscript(input)
    }

    function showUnrecognizedCommandHelp(command) {
        command && (currentDialog.querySelector(".voiceInputText").innerText = command), currentDialog.querySelector(".unrecognizedCommand").classList.remove("hide"), currentDialog.querySelector(".defaultVoiceHelp").classList.add("hide")
    }

    function showCommands(result) {
        result ? showVoiceHelp(result.groupid, result.name) : showVoiceHelp()
    }

    function resetDialog() {
        currentDialog && (currentDialog.querySelector(".unrecognizedCommand").classList.add("hide"), currentDialog.querySelector(".defaultVoiceHelp").classList.remove("hide"))
    }

    function showDialog() {
        resetDialog(), showCommands(), listen()
    }

    function listen() {
        voicereceiver.listen({
            lang: lang || "en-US"
        }).then(processInput).then(function(result) {
            closeDialog(), setTimeout(function() {
                result.fn()
            }, 1)
        }, function(result) {
            return "group" === result.error ? void showVoiceHelp(result.item.groupid, result.groupName) : void showUnrecognizedCommandHelp(result.text || "")
        })
    }

    function closeDialog() {
        dialogHelper.close(currentDialog), voicereceiver.cancel()
    }
    var currentDialog, lang = "en-US";
    return {
        showDialog: showDialog
    }
});