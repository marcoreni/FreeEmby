define(["jQuery", "loading", "humanedate", "listViewStyle"], function($, loading) {
    "use strict";

    function reloadList(page) {
        ApiClient.getScheduledTasks({
            isHidden: !1
        }).then(function(tasks) {
            populateList(page, tasks), loading.hide()
        })
    }

    function populateList(page, tasks) {
        tasks = tasks.sort(function(a, b) {
            return a = a.Category + " " + a.Name, b = b.Category + " " + b.Name, a == b ? 0 : a < b ? -1 : 1
        });
        for (var currentCategory, html = "", i = 0, length = tasks.length; i < length; i++) {
            var task = tasks[i];
            task.Category != currentCategory && (currentCategory = task.Category, currentCategory && (html += "</div>", html += "</div>"), html += '<div style="margin-bottom:2em;">', html += "<h1>", html += currentCategory, html += "</h1>", html += '<div class="paperList">'), html += '<div class="listItem scheduledTaskPaperIconItem" data-status="' + task.State + '">', html += "<a item-icon class='clearLink listItemIconContainer' href='scheduledtask.html?id=" + task.Id + "'>", html += '<i class="md-icon listItemIcon">schedule</i>', html += "</a>", html += '<div class="listItemBody two-line">', html += "<a class='clearLink' href='scheduledtask.html?id=" + task.Id + "'>", html += "<h3 class='listItemBodyText'>" + task.Name + "</h3>", html += "<div class='secondary listItemBodyText' id='taskProgress" + task.Id + "'>" + getTaskProgressHtml(task) + "</div>", html += "</a>", html += "</div>", html += "Idle" == task.State ? '<button type="button" is="paper-icon-button-light" id="btnTask' + task.Id + '" class="btnStartTask" data-taskid="' + task.Id + '" title="' + Globalize.translate("ButtonStart") + '"><i class="md-icon">play_arrow</i></button>' : "Running" == task.State ? '<button type="button" is="paper-icon-button-light" id="btnTask' + task.Id + '" class="btnStopTask" data-taskid="' + task.Id + '" title="' + Globalize.translate("ButtonStop") + '"><i class="md-icon">stop</i></button>' : '<button type="button" is="paper-icon-button-light" id="btnTask' + task.Id + '" class="btnStartTask hide" data-taskid="' + task.Id + '" title="' + Globalize.translate("ButtonStart") + '"><i class="md-icon">play_arrow</i></button>', html += "</div>"
        }
        tasks.length && (html += "</div>", html += "</div>");
        var divScheduledTasks = page.querySelector(".divScheduledTasks");
        divScheduledTasks.innerHTML = html
    }

    function humane_elapsed(firstDateStr, secondDateStr) {
        var dt1 = new Date(firstDateStr),
            dt2 = new Date(secondDateStr),
            seconds = (dt2.getTime() - dt1.getTime()) / 1e3,
            numdays = Math.floor(seconds % 31536e3 / 86400),
            numhours = Math.floor(seconds % 31536e3 % 86400 / 3600),
            numminutes = Math.floor(seconds % 31536e3 % 86400 % 3600 / 60),
            numseconds = Math.round(seconds % 31536e3 % 86400 % 3600 % 60),
            elapsedStr = "";
        return elapsedStr += 1 == numdays ? numdays + " day " : "", elapsedStr += numdays > 1 ? numdays + " days " : "", elapsedStr += 1 == numhours ? numhours + " hour " : "", elapsedStr += numhours > 1 ? numhours + " hours " : "", elapsedStr += 1 == numminutes ? numminutes + " minute " : "", elapsedStr += numminutes > 1 ? numminutes + " minutes " : "", elapsedStr += elapsedStr.length > 0 ? "and " : "", elapsedStr += 1 == numseconds ? numseconds + " second" : "", elapsedStr += 0 == numseconds || numseconds > 1 ? numseconds + " seconds" : ""
    }

    function getTaskProgressHtml(task) {
        var html = "";
        if ("Idle" == task.State) task.LastExecutionResult && (html += Globalize.translate("LabelScheduledTaskLastRan").replace("{0}", humane_date(task.LastExecutionResult.EndTimeUtc)).replace("{1}", humane_elapsed(task.LastExecutionResult.StartTimeUtc, task.LastExecutionResult.EndTimeUtc)), "Failed" == task.LastExecutionResult.Status ? html += " <span style='color:#FF0000;'>(" + Globalize.translate("LabelFailed") + ")</span>" : "Cancelled" == task.LastExecutionResult.Status ? html += " <span style='color:#0026FF;'>(" + Globalize.translate("LabelCancelled") + ")</span>" : "Aborted" == task.LastExecutionResult.Status && (html += " <span style='color:#FF0000;'>" + Globalize.translate("LabelAbortedByServerShutdown") + "</span>"));
        else if ("Running" == task.State) {
            var progress = (task.CurrentProgressPercentage || 0).toFixed(1);
            html += '<div style="display:flex;align-items:center;">', html += '<div class="taskProgressOuter" title="' + progress + '%" style="flex-grow:1;">', html += '<div class="taskProgressInner" style="width:' + progress + '%;">', html += "</div>", html += "</div>", html += "<span style='color:#009F00;margin-left:5px;'>" + progress + "%</span>", html += "</div>"
        } else html += "<span style='color:#FF0000;'>" + Globalize.translate("LabelStopping") + "</span>";
        return html
    }

    function onWebSocketMessage(e, msg) {
        if ("ScheduledTasksInfo" == msg.MessageType) {
            var tasks = msg.Data,
                page = $($.mobile.activePage)[0];
            updateTasks(page, tasks)
        }
    }

    function updateTasks(page, tasks) {
        for (var i = 0, length = tasks.length; i < length; i++) {
            var task = tasks[i];
            page.querySelector("#taskProgress" + task.Id).innerHTML = getTaskProgressHtml(task);
            var btnTask = page.querySelector("#btnTask" + task.Id);
            updateTaskButton(btnTask, task.State)
        }
    }

    function updateTaskButton(elem, state) {
        "Idle" == state ? (elem.classList.add("btnStartTask"), elem.classList.remove("btnStopTask"), elem.classList.remove("hide"), elem.querySelector("i").innerHTML = "play_arrow", elem.title = Globalize.translate("ButtonStart")) : "Running" == state ? (elem.classList.remove("btnStartTask"), elem.classList.add("btnStopTask"), elem.classList.remove("hide"), elem.querySelector("i").innerHTML = "stop", elem.title = Globalize.translate("ButtonStop")) : (elem.classList.add("btnStartTask"), elem.classList.remove("btnStopTask"), elem.classList.add("hide"), elem.querySelector("i").innerHTML = "play_arrow", elem.title = Globalize.translate("ButtonStart"));
        var item = $(elem).parents(".listItem")[0];
        item.setAttribute("data-status", state)
    }

    function onWebSocketConnectionOpen() {
        var page = $($.mobile.activePage)[0];
        startInterval(), reloadList(page)
    }

    function onPollIntervalFired() {
        var page = $($.mobile.activePage)[0];
        ApiClient.isWebSocketOpen() || reloadList(page)
    }

    function startInterval() {
        ApiClient.isWebSocketOpen() && ApiClient.sendWebSocketMessage("ScheduledTasksInfoStart", "1000,1000"), pollInterval && clearInterval(pollInterval), pollInterval = setInterval(onPollIntervalFired, 5e3)
    }

    function stopInterval() {
        ApiClient.isWebSocketOpen() && ApiClient.sendWebSocketMessage("ScheduledTasksInfoStop"), pollInterval && clearInterval(pollInterval)
    }
    var pollInterval;
    $(document).on("pageinit", "#scheduledTasksPage", function() {
        var page = this;
        $(".divScheduledTasks", page).on("click", ".btnStartTask", function() {
            var button = this,
                id = button.getAttribute("data-taskid");
            ApiClient.startScheduledTask(id).then(function() {
                updateTaskButton(button, "Running"), reloadList(page)
            })
        }).on("click", ".btnStopTask", function() {
            var button = this,
                id = button.getAttribute("data-taskid");
            ApiClient.stopScheduledTask(id).then(function() {
                updateTaskButton(button, ""), reloadList(page)
            })
        })
    }).on("pageshow", "#scheduledTasksPage", function() {
        var page = this;
        loading.show(), startInterval(), reloadList(page), Events.on(ApiClient, "websocketmessage", onWebSocketMessage), Events.on(ApiClient, "websocketopen", onWebSocketConnectionOpen)
    }).on("pagebeforehide", "#scheduledTasksPage", function() {
        Events.off(ApiClient, "websocketmessage", onWebSocketMessage), Events.off(ApiClient, "websocketopen", onWebSocketConnectionOpen), stopInterval()
    })
});