define(["jQuery", "loading"], function($, loading) {
    "use strict";
    Array.prototype.remove = function(from, to) {
            var rest = this.slice((to || from) + 1 || this.length);
            return this.length = from < 0 ? this.length + from : from, this.push.apply(this, rest)
        }, window.ScheduledTaskPage = {
            refreshScheduledTask: function() {
                loading.show();
                var id = getParameterByName("id");
                ApiClient.getScheduledTask(id).then(ScheduledTaskPage.loadScheduledTask)
            },
            loadScheduledTask: function(task) {
                var page = $($.mobile.activePage)[0];
                $(".taskName", page).html(task.Name), $("#pTaskDescription", page).html(task.Description), require(["listViewStyle"], function() {
                    ScheduledTaskPage.loadTaskTriggers(page, task)
                }), loading.hide()
            },
            loadTaskTriggers: function(context, task) {
                var html = "";
                html += '<div class="paperList">';
                for (var i = 0, length = task.Triggers.length; i < length; i++) {
                    var trigger = task.Triggers[i];
                    if (html += '<div class="listItem">', html += '<i class="md-icon listItemIcon">schedule</i>', html += trigger.MaxRuntimeMs ? '<div class="listItemBody two-line">' : '<div class="listItemBody">', html += "<div class='listItemBodyText'>" + ScheduledTaskPage.getTriggerFriendlyName(trigger) + "</div>", trigger.MaxRuntimeMs) {
                        html += '<div class="listItemBodyText secondary">';
                        var hours = trigger.MaxRuntimeMs / 36e5;
                        html += 1 == hours ? Globalize.translate("ValueTimeLimitSingleHour") : Globalize.translate("ValueTimeLimitMultiHour", hours), html += "</div>"
                    }
                    html += "</div>", html += '<button type="button" is="paper-icon-button-light" title="' + Globalize.translate("ButtonDelete") + '" onclick="ScheduledTaskPage.confirmDeleteTrigger(' + i + ');"><i class="md-icon">delete</i></button>', html += "</div>"
                }
                html += "</div>", context.querySelector(".taskTriggers").innerHTML = html
            },
            getTriggerFriendlyName: function(trigger) {
                if ("DailyTrigger" == trigger.Type) return "Daily at " + ScheduledTaskPage.getDisplayTime(trigger.TimeOfDayTicks);
                if ("WeeklyTrigger" == trigger.Type) return trigger.DayOfWeek + "s at " + ScheduledTaskPage.getDisplayTime(trigger.TimeOfDayTicks);
                if ("SystemEventTrigger" == trigger.Type && "WakeFromSleep" == trigger.SystemEvent) return "On wake from sleep";
                if ("IntervalTrigger" == trigger.Type) {
                    var hours = trigger.IntervalTicks / 36e9;
                    return .25 == hours ? "Every 15 minutes" : .5 == hours ? "Every 30 minutes" : .75 == hours ? "Every 45 minutes" : 1 == hours ? "Every hour" : "Every " + hours + " hours"
                }
                return "StartupTrigger" == trigger.Type ? "On application startup" : trigger.Type
            },
            getDisplayTime: function(ticks) {
                var hours = ticks / 36e9;
                hours < 1 && (hours = 0), hours = Math.floor(hours), ticks -= 36e9 * hours;
                var minutes = Math.floor(ticks / 6e8),
                    suffix = "am";
                return hours > 11 && (suffix = "pm"), hours %= 12, 0 == hours && (hours = 12), minutes < 10 && (minutes = "0" + minutes), hours + ":" + minutes + " " + suffix
            },
            showAddTriggerPopup: function() {
                var page = $.mobile.activePage;
                $("#selectTriggerType", page).val("DailyTrigger").trigger("change"), $("#popupAddTrigger", page).on("popupafteropen", function() {
                    $("#addTriggerForm input:first", this).focus()
                }).popup("open").on("popupafterclose", function() {
                    $("#addTriggerForm", page).off("submit"), $(this).off("popupafterclose")
                })
            },
            confirmDeleteTrigger: function(index) {
                require(["confirm"], function(confirm) {
                    confirm(Globalize.translate("MessageDeleteTaskTrigger"), Globalize.translate("HeaderDeleteTaskTrigger")).then(function() {
                        ScheduledTaskPage.deleteTrigger(index)
                    })
                })
            },
            deleteTrigger: function(index) {
                loading.show();
                var id = getParameterByName("id");
                ApiClient.getScheduledTask(id).then(function(task) {
                    task.Triggers.remove(index), ApiClient.updateScheduledTaskTriggers(task.Id, task.Triggers).then(function() {
                        ScheduledTaskPage.refreshScheduledTask()
                    })
                })
            },
            refreshTriggerFields: function(triggerType) {
                var page = $.mobile.activePage;
                "DailyTrigger" == triggerType ? ($("#fldTimeOfDay", page).show(), $("#fldDayOfWeek", page).hide(), $("#fldSelectSystemEvent", page).hide(), $("#fldSelectInterval", page).hide(), $("#txtTimeOfDay", page).attr("required", "required")) : "WeeklyTrigger" == triggerType ? ($("#fldTimeOfDay", page).show(), $("#fldDayOfWeek", page).show(), $("#fldSelectSystemEvent", page).hide(), $("#fldSelectInterval", page).hide(), $("#txtTimeOfDay", page).attr("required", "required")) : "SystemEventTrigger" == triggerType ? ($("#fldTimeOfDay", page).hide(), $("#fldDayOfWeek", page).hide(), $("#fldSelectSystemEvent", page).show(), $("#fldSelectInterval", page).hide(), $("#txtTimeOfDay", page).removeAttr("required")) : "IntervalTrigger" == triggerType ? ($("#fldTimeOfDay", page).hide(), $("#fldDayOfWeek", page).hide(), $("#fldSelectSystemEvent", page).hide(), $("#fldSelectInterval", page).show(), $("#txtTimeOfDay", page).removeAttr("required")) : "StartupTrigger" == triggerType && ($("#fldTimeOfDay", page).hide(), $("#fldDayOfWeek", page).hide(), $("#fldSelectSystemEvent", page).hide(), $("#fldSelectInterval", page).hide(), $("#txtTimeOfDay", page).removeAttr("required"))
            },
            getTriggerToAdd: function() {
                var page = $.mobile.activePage,
                    trigger = {
                        Type: $("#selectTriggerType", page).val()
                    };
                "DailyTrigger" == trigger.Type ? trigger.TimeOfDayTicks = ScheduledTaskPage.getTimeOfDayTicks($("#txtTimeOfDay", page).val()) : "WeeklyTrigger" == trigger.Type ? (trigger.DayOfWeek = $("#selectDayOfWeek", page).val(), trigger.TimeOfDayTicks = ScheduledTaskPage.getTimeOfDayTicks($("#txtTimeOfDay", page).val())) : "SystemEventTrigger" == trigger.Type ? trigger.SystemEvent = $("#selectSystemEvent", page).val() : "IntervalTrigger" == trigger.Type && (trigger.IntervalTicks = $("#selectInterval", page).val());
                var timeLimit = $("#txtTimeLimit", page).val() || "0";
                return timeLimit = 36e5 * parseFloat(timeLimit), trigger.MaxRuntimeMs = timeLimit || null, trigger
            },
            getTimeOfDayTicks: function(val) {
                var vals = val.split(":"),
                    hours = vals[0],
                    minutes = vals[1].split(" ")[0],
                    ticks = 60 * hours * 60 * 1e3 * 1e4;
                return ticks += 60 * minutes * 1e3 * 1e4
            }
        },
        function() {
            function onSubmit() {
                loading.show();
                var id = getParameterByName("id");
                return ApiClient.getScheduledTask(id).then(function(task) {
                    task.Triggers.push(ScheduledTaskPage.getTriggerToAdd()), ApiClient.updateScheduledTaskTriggers(task.Id, task.Triggers).then(function() {
                        $("#popupAddTrigger").popup("close"), ScheduledTaskPage.refreshScheduledTask()
                    })
                }), !1
            }
            $(document).on("pageinit", "#scheduledTaskPage", function() {
                var page = this;
                $(".addTriggerForm").off("submit", onSubmit).on("submit", onSubmit), page.querySelector(".timeFieldExample").innerHTML = Globalize.translate("ValueExample", "1:00 PM")
            }).on("pageshow", "#scheduledTaskPage", function() {
                ScheduledTaskPage.refreshScheduledTask()
            })
        }()
});