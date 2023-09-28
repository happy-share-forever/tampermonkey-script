// ==UserScript==
// @name         kubenav
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       JiajieH
// @include      /^http(s)?:\/\/dashboard(-.*)?.*$/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var style = document.createElement('style')
    style.innerHTML = 'ion-popover [popover]:not(:popover-open):not(dialog[open]) {display: contents;}'
    document.head.append(style)
})();
