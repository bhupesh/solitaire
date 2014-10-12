/**
 * Some utility functions to use with game
 *
 * @author Bhupesh Pranami (bpranami at live dot com)
 */
(function(window) {

    var docElem = document.documentElement,
        matches =    docElem.matches || docElem.webkitMatchesSelector 
                  || docElem.mozMatchesSelector || docElem.oMatchesSelector 
                  || docElem.msMatchesSelector;


    var Util = {
        getParentBySelector: function(elem, selector) {
            if (!matches.call(elem, selector + ' ' + elem.tagName)) {
                return null;
            }

            function parent(elem, selector) {
                if (matches.call(elem.parentNode, selector))
                    return elem.parentNode;
                else
                    return parent(elem.parentNode, selector);
            }
            return parent(elem, selector);
        },
        shuffle: function(array) {
            var currentIndex = array.length, temporaryValue, randomIndex;

            while (0 !== currentIndex) {

                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;

                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }

            return array;
        },
        on: function(type, elm, fn) {
            elm.events = elm.events || {};
            elm.events[type] = fn;
            elm.addEventListener(type, fn);
        },
        off: function(type, elm) {
            if(!elm.events) return;
            if(!elm.events[type]) return;
            elm.removeEventListener(type, elm.events[type]);
            delete elm.events[type];
        }
    };

    window.Util = Util;

})(window);