define(["layoutManager", "browser", "dom", "css!./emby-input", "registerElement"], function(layoutManager, browser, dom) {
    "use strict";

    function onChange() {
        var label = this.labelElement;
        if (this.value) label.classList.remove("inputLabel-float");
        else {
            var instanceSupportsFloat = supportsFloatingLabel && "date" !== this.type && "time" !== this.type;
            instanceSupportsFloat && label.classList.add("inputLabel-float")
        }
    }
    var EmbyInputPrototype = Object.create(HTMLInputElement.prototype),
        inputId = 0,
        supportsFloatingLabel = !1;
    if (Object.getOwnPropertyDescriptor && Object.defineProperty) {
        var descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
        if (descriptor && descriptor.configurable) {
            var baseSetMethod = descriptor.set;
            descriptor.set = function(value) {
                baseSetMethod.call(this, value), this.dispatchEvent(new CustomEvent("valueset", {
                    bubbles: !1,
                    cancelable: !1
                }))
            }, Object.defineProperty(HTMLInputElement.prototype, "value", descriptor), supportsFloatingLabel = !0
        }
    }
    EmbyInputPrototype.createdCallback = function() {
        if (this.id || (this.id = "embyinput" + inputId, inputId++), !this.classList.contains("emby-input")) {
            this.classList.add("emby-input");
            var parentNode = this.parentNode,
                document = this.ownerDocument,
                label = document.createElement("label");
            label.innerHTML = this.getAttribute("label") || "", label.classList.add("inputLabel"), label.classList.add("inputLabelUnfocused"), label.htmlFor = this.id, parentNode.insertBefore(label, this), this.labelElement = label;
            var div = document.createElement("div");
            div.classList.add("emby-input-selectionbar"), parentNode.insertBefore(div, this.nextSibling), dom.addEventListener(this, "focus", function() {
                onChange.call(this), document.attachIME && document.attachIME(this), label.classList.add("inputLabelFocused"), label.classList.remove("inputLabelUnfocused")
            }, {
                passive: !0
            }), dom.addEventListener(this, "blur", function() {
                onChange.call(this), label.classList.remove("inputLabelFocused"), label.classList.add("inputLabelUnfocused")
            }, {
                passive: !0
            }), dom.addEventListener(this, "change", onChange, {
                passive: !0
            }), dom.addEventListener(this, "input", onChange, {
                passive: !0
            }), dom.addEventListener(this, "valueset", onChange, {
                passive: !0
            })
        }
    }, EmbyInputPrototype.attachedCallback = function() {
        this.labelElement.htmlFor = this.id, onChange.call(this)
    }, EmbyInputPrototype.label = function(text) {
        this.labelElement.innerHTML = text
    }, document.registerElement("emby-input", {
        prototype: EmbyInputPrototype,
        extends: "input"
    })
});