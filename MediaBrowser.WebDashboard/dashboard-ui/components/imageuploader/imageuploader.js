define(["dialogHelper", "jQuery", "loading", "emby-button", "emby-select"], function(dialogHelper, $, loading) {
    "use strict";

    function onFileReaderError(evt) {
        switch (loading.hide(), evt.target.error.code) {
            case evt.target.error.NOT_FOUND_ERR:
                require(["toast"], function(toast) {
                    toast(Globalize.translate("MessageFileNotFound"))
                });
                break;
            case evt.target.error.ABORT_ERR:
                break;
            default:
                require(["toast"], function(toast) {
                    toast(Globalize.translate("MessageFileReadError"))
                })
        }
    }

    function setFiles(page, files) {
        var file = files[0];
        if (!file || !file.type.match("image.*")) return $("#imageOutput", page).html(""), $("#fldUpload", page).hide(), void(currentFile = null);
        currentFile = file;
        var reader = new FileReader;
        reader.onerror = onFileReaderError, reader.onloadstart = function() {
            $("#fldUpload", page).hide()
        }, reader.onabort = function() {
            loading.hide(), console.log("File read cancelled")
        }, reader.onload = function(theFile) {
            return function(e) {
                var html = ['<img style="max-width:300px;max-height:100px;" src="', e.target.result, '" title="', escape(theFile.name), '"/>'].join("");
                $("#imageOutput", page).html(html), $("#fldUpload", page).show()
            }
        }(file), reader.readAsDataURL(file)
    }

    function processImageChangeResult(page) {
        hasChanges = !0, history.back()
    }

    function onSubmit() {
        var file = currentFile;
        if (!file) return !1;
        if ("image/png" != file.type && "image/jpeg" != file.type && "image/jpeg" != file.type) return !1;
        loading.show();
        var page = $(this).parents(".dialog"),
            imageType = $("#selectImageType", page).val();
        return ApiClient.uploadItemImage(currentItemId, imageType, file).then(function() {
            $("#uploadImage", page).val("").trigger("change"), loading.hide(), processImageChangeResult(page)
        }), !1
    }

    function initEditor(page) {
        $("form", page).off("submit", onSubmit).on("submit", onSubmit), $("#uploadImage", page).on("change", function() {
            setFiles(page, this.files)
        }), $("#imageDropZone", page).on("dragover", function(e) {
            return e.preventDefault(), e.originalEvent.dataTransfer.dropEffect = "Copy", !1
        }).on("drop", function(e) {
            return e.preventDefault(), setFiles(page, e.originalEvent.dataTransfer.files), !1
        })
    }

    function showEditor(itemId, options) {
        options = options || {};
        var xhr = new XMLHttpRequest;
        xhr.open("GET", "components/imageuploader/imageuploader.template.html", !0), xhr.onload = function(e) {
            var template = this.response;
            currentItemId = itemId;
            var dlg = dialogHelper.createDialog({
                    size: "fullscreen-border"
                }),
                theme = options.theme || "b";
            dlg.classList.add("ui-body-" + theme), dlg.classList.add("background-theme-" + theme);
            var html = "";
            html += '<h2 class="dialogHeader">', html += '<button type="button" is="emby-button" icon="arrow-back" class="fab mini btnCloseDialog autoSize" tabindex="-1"><i class="md-icon">&#xE5C4;</i></button>', html += '<div style="display:inline-block;margin-left:.6em;vertical-align:middle;">' + Globalize.translate("HeaderUploadImage") + "</div>", html += "</h2>", html += '<div class="editorContent" style="padding:0 1em;">', html += Globalize.translateDocument(template), html += "</div>", dlg.innerHTML = html, $(dlg).on("close", onDialogClosed), dialogHelper.open(dlg);
            var editorContent = dlg.querySelector(".editorContent");
            initEditor(editorContent), $("#selectImageType", dlg).val(options.imageType || "Primary"), $(".btnCloseDialog", dlg).on("click", function() {
                dialogHelper.close(dlg)
            })
        }, xhr.send()
    }

    function onDialogClosed() {
        $(this).remove(), loading.hide(), currentDeferred.resolveWith(null, [hasChanges])
    }
    var currentItemId, currentFile, currentDeferred, hasChanges = !1;
    return {
        show: function(itemId, options) {
            var deferred = jQuery.Deferred();
            return currentDeferred = deferred, hasChanges = !1, showEditor(itemId, options), deferred.promise()
        }
    }
});