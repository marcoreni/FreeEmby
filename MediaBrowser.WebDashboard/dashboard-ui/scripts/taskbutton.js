define(["userSettings", "emby-button"], function(userSettings) {
    "use strict";
    return function(options) {
        function pollTasks() {
            ApiClient.getScheduledTasks({
                IsEnabled: !0
            }).then(updateTasks)
        }

        function updateTasks(tasks) {
            var task = tasks.filter(function(t) {
                return t.Key == options.taskKey
            })[0];
            if (options.panel && (task ? options.panel.classList.remove("hide") : options.panel.classList.add("hide")), task) {
                "Idle" == task.State ? button.removeAttribute("disabled") : button.setAttribute("disabled", "disabled"), button.setAttribute("data-taskid", task.Id);
                var progress = (task.CurrentProgressPercentage || 0).toFixed(1);
                if (options.progressElem && (options.progressElem.value = progress, "Running" == task.State ? options.progressElem.classList.remove("hide") : options.progressElem.classList.add("hide")), options.lastResultElem) {
                    var lastResult = task.LastExecutionResult ? task.LastExecutionResult.Status : "";
                    "Failed" == lastResult ? options.lastResultElem.html('<span style="color:#FF0000;">(' + Globalize.translate("LabelFailed") + ")</span>") : "Cancelled" == lastResult ? options.lastResultElem.html('<span style="color:#0026FF;">(' + Globalize.translate("LabelCancelled") + ")</span>") : "Aborted" == lastResult ? options.lastResultElem.html('<span style="color:#FF0000;">' + Globalize.translate("LabelAbortedByServerShutdown") + "</span>") : options.lastResultElem.html(lastResult)
                }
            }
        }

        function onScheduledTaskMessageConfirmed(id) {
            ApiClient.startScheduledTask(id).then(pollTasks)
        }

        function onButtonClick() {
            var button = this,
                taskId = button.getAttribute("data-taskid");
            onScheduledTaskMessageConfirmed(taskId)
        }

        function onSocketOpen() {
            startInterval()
        }

        function onSocketMessage(e, msg) {
            if ("ScheduledTasksInfo" == msg.MessageType) {
                var tasks = msg.Data;
                updateTasks(tasks)
            }
        }

        function onPollIntervalFired() {
            ApiClient.isWebSocketOpen() || pollTasks()
        }

        function startInterval() {
            ApiClient.isWebSocketOpen() && ApiClient.sendWebSocketMessage("ScheduledTasksInfoStart", "1000,1000"), pollInterval && clearInterval(pollInterval), pollInterval = setInterval(onPollIntervalFired, 5e3)
        }

        function stopInterval() {
            ApiClient.isWebSocketOpen() && ApiClient.sendWebSocketMessage("ScheduledTasksInfoStop"), pollInterval && clearInterval(pollInterval)
        }
        var pollInterval, button = options.button;
        options.panel && options.panel.classList.add("hide"), "off" == options.mode ? (button.removeEventListener("click", onButtonClick), Events.off(ApiClient, "websocketmessage", onSocketMessage), Events.off(ApiClient, "websocketopen", onSocketOpen), stopInterval()) : (button.addEventListener("click", onButtonClick), pollTasks(), startInterval(), Events.on(ApiClient, "websocketmessage", onSocketMessage), Events.on(ApiClient, "websocketopen", onSocketOpen))
    }
});