define(["cardBuilder"], function(cardBuilder) {
    "use strict";

    function buildPeopleCards(items, options) {
        options = Object.assign(options || {}, {
            cardLayout: !0,
            centerText: !0,
            showTitle: !0,
            cardFooterAside: "none",
            showPersonRoleOrType: !0,
            cardCssClass: "personCard"
        }), cardBuilder.buildCards(items, options)
    }
    return {
        buildPeopleCards: buildPeopleCards
    }
});