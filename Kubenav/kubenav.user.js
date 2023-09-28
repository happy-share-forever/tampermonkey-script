// ==UserScript==
// @name         kubenav
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the world!
// @author       JiajieH, happy share forever core team
// @include      /^http(s)?:\/\/dashboard(-.*)?.*$/
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';
    GM_addStyle('ion-popover [popover]:not(:popover-open):not(dialog[open]) {display: contents;}')
})();
