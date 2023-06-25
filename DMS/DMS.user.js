// ==UserScript==
// @name         DMS
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://dms.aliyun.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=aliyun.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    setTimeout(()=>{document.querySelector('.top-announcement').remove()}, 2000);
})();
