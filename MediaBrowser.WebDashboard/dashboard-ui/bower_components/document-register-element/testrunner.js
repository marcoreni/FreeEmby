console.log("Loading: test.html");
var page = require("webpage").create(),
    url = "index.html";
page.open(url, function(status) {
    "success" === status ? setTimeout(function() {
        var results = page.evaluate(function() {
            var passed = Math.max(0, document.querySelectorAll(".pass").length - 1);
            return {
                total: "".concat(passed, " blocks (", document.querySelector("#wru strong").textContent.replace(/\D/g, ""), " single tests)"),
                passed: passed,
                failed: Math.max(0, document.querySelectorAll(".fail").length - 1),
                failures: [].map.call(document.querySelectorAll(".fail"), function(node) {
                    return node.textContent
                }),
                errored: Math.max(0, document.querySelectorAll(".error").length - 1),
                errors: [].map.call(document.querySelectorAll(".error"), function(node) {
                    return node.textContent
                })
            }
        });
        console.log("- - - - - - - - - -"), console.log("total:   " + results.total), console.log("- - - - - - - - - -"), console.log("passed:  " + results.passed), results.failed ? console.log("failures: \n" + results.failures.join("\n")) : console.log("failed: " + results.failed), results.errored ? console.log("errors: \n" + results.errors.join("\n")) : console.log("errored: " + results.errored), console.log("- - - - - - - - - -"), 0 < results.failed + results.errored && (status = "failed"), phantom.exit(0)
    }, 2e3) : phantom.exit(1)
});