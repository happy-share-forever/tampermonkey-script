// ==UserScript==
// @name         Codeup
// @namespace    https://iin.ink
// @version      1.0.0
// @description  Codeup function enhancement
// @author       happy share forever core team
// @match        https://codeup.aliyun.com/*
// ==/UserScript==

(function () {
  'use strict';

  const regex = /merge_request\/(\d+)/
  const href = window.location.href

  function hookReact (commitMsgTitle, oldCommitMsgTitle) {
    const event = new Event('input', { bubbles: true })
    event.simulated = true
    const tracker = commitMsgTitle._valueTracker
    if (tracker) {
      tracker.setValue(oldCommitMsgTitle)
    }
    commitMsgTitle.dispatchEvent(event)
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.type !== 'childList') {
        return
      }
      if (mutation.addedNodes.length === 0) {
        return
      }
      const commitMsgTitleInput = mutation.target.querySelector('#merge_commit_message_title')
      if (!commitMsgTitleInput) {
        return
      }
      if (mutation.target.querySelector('.commit-message-form').textContent.indexOf('Squash 合并') === -1) {
        // 仅 Squash 合并修改提交信息
        return
      }
      const mrTitleMainInfo = document.querySelector('.mr-title-info-main-info')
      const newCommitMsgTitle  = `${mrTitleMainInfo.textContent} (#${regex.exec(href)[1]})`
      const oldCommitMsgTitle = commitMsgTitleInput.textContent;
      console.log('原标题: ' + oldCommitMsgTitle)
      console.log('新标题: ' + newCommitMsgTitle)
      setTimeout(() => {
        commitMsgTitleInput.value = newCommitMsgTitle
        hookReact(commitMsgTitleInput, oldCommitMsgTitle);
      }, 300)
    })
  })
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
})()
