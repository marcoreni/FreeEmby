define(["dom"], function(dom) {
    "use strict";

    function pushScope(elem) {
        scopes.push(elem)
    }

    function popScope(elem) {
        scopes.length && (scopes.length -= 1)
    }

    function autoFocus(view, defaultToFirst, findAutoFocusElement) {
        var element;
        return findAutoFocusElement !== !1 && (element = view.querySelector("*[autofocus]")) ? (focus(element), element) : defaultToFirst !== !1 && (element = getFocusableElements(view, 1, "noautofocus")[0]) ? (focus(element), element) : null
    }

    function focus(element) {
        try {
            element.focus()
        } catch (err) {
            console.log("Error in focusManager.autoFocus: " + err)
        }
    }

    function isFocusable(elem) {
        return focusableTagNames.indexOf(elem.tagName) !== -1 || !(!elem.classList || !elem.classList.contains("focusable"))
    }

    function focusableParent(elem) {
        for (; !isFocusable(elem);)
            if (elem = elem.parentNode, !elem) return null;
        return elem
    }

    function isCurrentlyFocusableInternal(elem) {
        return null !== elem.offsetParent
    }

    function isCurrentlyFocusable(elem) {
        if (elem.disabled) return !1;
        if ("-1" === elem.getAttribute("tabindex")) return !1;
        if ("INPUT" === elem.tagName) {
            var type = elem.type;
            if ("range" === type) return !1
        }
        return isCurrentlyFocusableInternal(elem)
    }

    function getDefaultScope() {
        return scopes[0] || document.body
    }

    function getFocusableElements(parent, limit, excludeClass) {
        for (var elems = (parent || getDefaultScope()).querySelectorAll(focusableQuery), focusableElements = [], i = 0, length = elems.length; i < length; i++) {
            var elem = elems[i];
            if ((!excludeClass || !elem.classList.contains(excludeClass)) && isCurrentlyFocusableInternal(elem) && (focusableElements.push(elem), limit && focusableElements.length >= limit)) break
        }
        return focusableElements
    }

    function isFocusContainer(elem, direction) {
        if (focusableContainerTagNames.indexOf(elem.tagName) !== -1) return !0;
        var classList = elem.classList;
        if (classList.contains("focuscontainer")) return !0;
        if (0 === direction) {
            if (classList.contains("focuscontainer-x")) return !0;
            if (classList.contains("focuscontainer-left")) return !0
        } else if (1 === direction) {
            if (classList.contains("focuscontainer-x")) return !0;
            if (classList.contains("focuscontainer-right")) return !0
        } else if (2 === direction) {
            if (classList.contains("focuscontainer-y")) return !0
        } else if (3 === direction) {
            if (classList.contains("focuscontainer-y")) return !0;
            if (classList.contains("focuscontainer-down")) return !0
        }
        return !1
    }

    function getFocusContainer(elem, direction) {
        for (; !isFocusContainer(elem, direction);)
            if (elem = elem.parentNode, !elem) return getDefaultScope();
        return elem
    }

    function getOffset(elem) {
        var box;
        if (box = elem.getBoundingClientRect ? elem.getBoundingClientRect() : {
                top: 0,
                left: 0,
                width: 0,
                height: 0
            }, null === box.right) {
            var newBox = {
                top: box.top,
                left: box.left,
                width: box.width,
                height: box.height
            };
            box = newBox, box.right = box.left + box.width, box.bottom = box.top + box.height
        }
        return box
    }

    function nav(activeElement, direction) {
        activeElement = activeElement || document.activeElement, activeElement && (activeElement = focusableParent(activeElement));
        var container = activeElement ? getFocusContainer(activeElement, direction) : getDefaultScope();
        if (!activeElement) return void autoFocus(container, !0, !1);
        for (var nearestElement, focusableContainer = dom.parentWithClass(activeElement, "focusable"), rect = getOffset(activeElement), point1x = parseFloat(rect.left) || 0, point1y = parseFloat(rect.top) || 0, point2x = parseFloat(point1x + rect.width - 1) || point1x, point2y = parseFloat(point1y + rect.height - 1) || point1y, sourceMidX = (Math.min, Math.max, rect.left + rect.width / 2), sourceMidY = rect.top + rect.height / 2, focusable = container.querySelectorAll(focusableQuery), maxDistance = 1 / 0, minDistance = maxDistance, i = 0, length = focusable.length; i < length; i++) {
            var curr = focusable[i];
            if (curr !== activeElement && curr !== focusableContainer) {
                var elementRect = getOffset(curr);
                if (elementRect.width || elementRect.height) {
                    switch (direction) {
                        case 0:
                            if (elementRect.left >= rect.left) continue;
                            if (elementRect.right === rect.right) continue;
                            break;
                        case 1:
                            if (elementRect.right <= rect.right) continue;
                            if (elementRect.left === rect.left) continue;
                            break;
                        case 2:
                            if (elementRect.top >= rect.top) continue;
                            if (elementRect.bottom >= rect.bottom) continue;
                            break;
                        case 3:
                            if (elementRect.bottom <= rect.bottom) continue;
                            if (elementRect.top <= rect.top) continue
                    }
                    var distX, distY, x = elementRect.left,
                        y = elementRect.top,
                        x2 = x + elementRect.width - 1,
                        y2 = y + elementRect.height - 1,
                        intersectX = intersects(point1x, point2x, x, x2),
                        intersectY = intersects(point1y, point2y, y, y2),
                        midX = elementRect.left + elementRect.width / 2,
                        midY = elementRect.top + elementRect.height / 2;
                    switch (direction) {
                        case 0:
                            distX = Math.abs(point1x - Math.min(point1x, x2)), distY = intersectY ? 0 : Math.abs(sourceMidY - midY);
                            break;
                        case 1:
                            distX = Math.abs(point2x - Math.max(point2x, x)), distY = intersectY ? 0 : Math.abs(sourceMidY - midY);
                            break;
                        case 2:
                            distY = Math.abs(point1y - Math.min(point1y, y2)), distX = intersectX ? 0 : Math.abs(sourceMidX - midX);
                            break;
                        case 3:
                            distY = Math.abs(point2y - Math.max(point2y, y)), distX = intersectX ? 0 : Math.abs(sourceMidX - midX)
                    }
                    var dist = Math.sqrt(distX * distX + distY * distY);
                    dist < minDistance && (nearestElement = curr, minDistance = dist)
                }
            }
        }
        if (nearestElement) {
            if (activeElement) {
                var nearestElementFocusableParent = dom.parentWithClass(nearestElement, "focusable");
                nearestElementFocusableParent && nearestElementFocusableParent !== nearestElement && focusableContainer !== nearestElementFocusableParent && (nearestElement = nearestElementFocusableParent)
            }
            focus(nearestElement)
        }
    }

    function intersectsInternal(a1, a2, b1, b2) {
        return b1 >= a1 && b1 <= a2 || b2 >= a1 && b2 <= a2
    }

    function intersects(a1, a2, b1, b2) {
        return intersectsInternal(a1, a2, b1, b2) || intersectsInternal(b1, b2, a1, a2)
    }

    function sendText(text) {
        var elem = document.activeElement;
        elem.value = text
    }

    function focusFirst(container, focusableSelector) {
        for (var elems = container.querySelectorAll(focusableSelector), i = 0, length = elems.length; i < length; i++) {
            var elem = elems[i];
            if (isCurrentlyFocusableInternal(elem)) {
                focus(elem);
                break
            }
        }
    }

    function focusLast(container, focusableSelector) {
        for (var elems = [].slice.call(container.querySelectorAll(focusableSelector), 0).reverse(), i = 0, length = elems.length; i < length; i++) {
            var elem = elems[i];
            if (isCurrentlyFocusableInternal(elem)) {
                focus(elem);
                break
            }
        }
    }

    function moveFocus(sourceElement, container, focusableSelector, offset) {
        var i, length, elem, elems = container.querySelectorAll(focusableSelector),
            list = [];
        for (i = 0, length = elems.length; i < length; i++) elem = elems[i], isCurrentlyFocusableInternal(elem) && list.push(elem);
        var currentIndex = -1;
        for (i = 0, length = list.length; i < length; i++)
            if (elem = list[i], sourceElement === elem || elem.contains(sourceElement)) {
                currentIndex = i;
                break
            }
        if (currentIndex !== -1) {
            var newIndex = currentIndex + offset;
            newIndex = Math.max(0, newIndex), newIndex = Math.min(newIndex, list.length - 1);
            var newElem = list[newIndex];
            newElem && focus(newElem)
        }
    }
    var scopes = [],
        focusableTagNames = ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"],
        focusableContainerTagNames = ["BODY", "DIALOG"],
        focusableQuery = focusableTagNames.map(function(t) {
            return "INPUT" === t && (t += ':not([type="range"])'), t + ':not([tabindex="-1"]):not(:disabled)'
        }).join(",") + ",.focusable";
    return {
        autoFocus: autoFocus,
        focus: focus,
        focusableParent: focusableParent,
        getFocusableElements: getFocusableElements,
        moveLeft: function(sourceElement) {
            nav(sourceElement, 0)
        },
        moveRight: function(sourceElement) {
            nav(sourceElement, 1)
        },
        moveUp: function(sourceElement) {
            nav(sourceElement, 2)
        },
        moveDown: function(sourceElement) {
            nav(sourceElement, 3)
        },
        sendText: sendText,
        isCurrentlyFocusable: isCurrentlyFocusable,
        pushScope: pushScope,
        popScope: popScope,
        focusFirst: focusFirst,
        focusLast: focusLast,
        moveFocus: moveFocus
    }
});