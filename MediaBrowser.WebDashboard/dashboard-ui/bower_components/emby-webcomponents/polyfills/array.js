Array.prototype.filter || (Array.prototype.filter = function(fun) {
    "use strict";
    if (null == this) throw new TypeError;
    var t = Object(this),
        len = t.length >>> 0;
    if ("function" != typeof fun) throw new TypeError;
    for (var res = [], thisp = arguments[1], i = 0; i < len; i++)
        if (i in t) {
            var val = t[i];
            fun.call(thisp, val, i, t) && res.push(val)
        }
    return res
});