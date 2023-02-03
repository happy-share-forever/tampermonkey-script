// ==UserScript==
// @name         ZenTao
// @namespace    https://iin.ink
// @version      2.2
// @description  ZenTao style and function enhancement
// @author       happy share org
// @include      /^https:\/\/zentao.*$/
// @grant        GM_addStyle
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
  'use strict'
  GM_addStyle('td.c-name, td.c-title {white-space: normal;}')
  GM_addStyle('.main-table tbody>tr:nth-child(odd) { background: #fff !important; }')
  GM_addStyle('.main-table tbody>tr.table-children { background: #90939442 !important; }')
  GM_addStyle('.main-table .c-actions { width: 300px !important; text-align: left; }')
  GM_addStyle('.datatable-head-span.datatable-span.fixed-right,.datatable-rows-span.datatable-span.fixed-right { width: 300px !important; text-align: left; }')
  GM_addStyle('.main-table .c-actions-5 { width: 300px !important; text-align: left; }')
  GM_addStyle('.chosen-container .chosen-drop { right: 0; }')
  GM_addStyle('#main .container { max-width: unset !important; }')
  GM_addStyle('.table-datatable { min-width: unset !important; }')
  GM_addStyle('.board-item > .title { max-height: unset !important; -webkit-line-clamp: unset !important; -webkit-box-orient: unset !important; font-size: 15px !important; }')
  GM_addStyle('#kanban .group-title { line-height: 20px !important; font-size: 15px !important; }')
  GM_addStyle('.histories-custom-filter-btn { margin-right: 8px }')
  // 根据需要修改分支前缀

  const _window = window
  const urlDomain = location.origin
  let cachedPrefix = _window.localStorage.getItem('_customFilter_projectPrefix')
  if (!cachedPrefix) {
    cachedPrefix = _window.prompt('请补全项目代号，之后可以通过 localStorage _customFilter_projectPrefix 来修改。', 'XXX')
    _window.localStorage.setItem('_customFilter_projectPrefix', cachedPrefix || 'XXX')
  }

  const projectPrefix = cachedPrefix || 'XXX'

  function debounce (fn, delay) {
    let timerID = null
    return function () {
      const context = this
      const args = arguments
      if (timerID) {
        clearTimeout(timerID)
      }
      timerID = setTimeout(function () {
        fn.apply(context, args)
      }, delay)
    }
  }

  function enhanceTask (document) {
    const target = $(document.querySelectorAll('.main-table td.c-actions'))
    if (target.find('span:contains("copy:")').length > 0) return
    target.each(function () {
      const $el = $(this).parent()
      const taskId = $el.attr('data-id') || $el.find('.cell-id').find('a').text()
      const $text = $('<span>copy:</span>')
      $text.appendTo($el.find('.c-actions'))
      const $copyId = $(document.createElement('a'))
      $copyId.html('<span class="text"> 分支</span>')
      $copyId.on('click', function () {
        GM_setClipboard(`feature/${projectPrefix}-${taskId}`, { type: 'text', mimetype: 'text/plain' })
      })
      $copyId.appendTo($el.find('.c-actions'))

      // 复制标题
      const $copyTitle = $(document.createElement('a'))
      $copyTitle.html('<span class="text"> 标题</span>')
      $copyTitle.on('click', function () {
        let title = window.location.search.includes('f=bug')
          ? $($el.children()[3]).attr('title')
          : $(document).find(`tr[data-id=${taskId}]`).find('.c-name').attr('title')
        GM_setClipboard(`${projectPrefix}-${taskId} ${title}`, { type: 'text', mimetype: 'text/plain' })
      })
      $copyTitle.appendTo($el.find('.c-actions'))

      // 复制链接
      const $copyLink = $(document.createElement('a'))
      $copyLink.html('<span class="text"> 链接</span>')
      $copyLink.on('click', function () {
        GM_setClipboard(`${urlDomain}/index.php?m=task&f=view&taskID=${taskId}`, { type: 'text', mimetype: 'text/plain' })
      })
      $copyLink.appendTo($el.find('.c-actions'))
    })
  }

  function enhanceKanBan (document) {
    const target = $(document.querySelectorAll('.board-story'))
    // 已经添加过了
    if (target.find('a:contains("复制分支")').length > 0) return

    target.each(function () {
      const $el = $(this)
      const $ul = $el.find('ul')
      const storyId = $el.attr('data-id')
      const $copyIdLi = $(document.createElement('li'))
      $copyIdLi.html('<a>复制分支</a>')
      $copyIdLi.on('click', function () {
        GM_setClipboard(`feature/${projectPrefix}-${storyId}`, { type: 'text', mimetype: 'text/plain' })
      })
      $copyIdLi.appendTo($ul)

      const $copyTitle = $(document.createElement('li'))
      $copyTitle.html('<a>复制标题</a>')
      $copyTitle.on('click', function () {
        const title = $el.find('.group-title').attr('title')
        GM_setClipboard(`${projectPrefix}-${storyId} ${title}`, { type: 'text', mimetype: 'text/plain' })
      })
      $copyTitle.appendTo($ul)

      const $copyLink = $(document.createElement('li'))
      $copyLink.html('<a>复制链接</a>')
      $copyLink.on('click', function () {
        const link = `${urlDomain}/index.php?m=story&f=view&storyID=${storyId}`
        GM_setClipboard(link, { type: 'text', mimetype: 'text/plain' })
      })
      $copyLink.appendTo($ul)

      // hover 增强
      const $dropdown = $el.find('li.dropdown')
      $dropdown.on('mouseover', function () {
        $dropdown.addClass('open')
        $ul.css('margin-top', '-30px')
      }).on('mouseleave', function () {
        $dropdown.removeClass('open')
      })
    })

    // 已关闭的任务增强
    enhanceKanBanClosedTaskWithCache(document)
  }

  const kanbanDatas = {}

  function enhanceKanBanClosedTaskWithCache (document) {
    const executionID = new URL(_window.location.href).searchParams.get('executionID')
    if (kanbanDatas[executionID]) {
      enhanceKanBanClosedTask(kanbanDatas[executionID], document)
    } else {
      debouncedEnhanceKanBanClosedTask(document)
    }
  }

  const debouncedEnhanceKanBanClosedTask = debounce(queryKanbanAndEnhanceKanBanClosedTask, 100)

  function queryKanbanAndEnhanceKanBanClosedTask (document) {
    const executionID = new URL(_window.location.href).searchParams.get('executionID')
    $.get(`${urlDomain}/index.php?m=execution&f=kanban&t=json&executionID=${executionID}`, function (res) {
      const kanbanData = JSON.parse(JSON.parse(res).data)
      console.log(kanbanData)
      kanbanDatas[executionID] = kanbanData
      enhanceKanBanClosedTask(kanbanData, document)
    })
  }

  function enhanceKanBanClosedTask (kanbanData, document) {
    const kanbanTasksMap = getKanbanTasksMap(kanbanData)
    const closedTasks = [...document.querySelectorAll('a.task-assignedTo,a.bug-assignedTo')].filter(a => a.text.trim() === 'Closed')
    closedTasks.forEach(ct => {
      const u = new URL(ct.href)
      const taskID = u.searchParams.get('bugID') ? u.searchParams.get('bugID') : u.searchParams.get('taskID')
      const kanbanTask = kanbanTasksMap[taskID]
      const $span = $(ct).find('span')
      $span.text(`Closed(${kanbanData.realnames[kanbanTask.resolvedBy ? kanbanTask.resolvedBy : kanbanTask.finishedBy]})`)
      $span.css('max-width', '150px')
    })

    // 增强看板：增加角色过滤器
    enhanceRoleFilter(document)
  }

  function getKanbanTasksMap (kanbanData) {
    const kanbanTasks = Object.values(kanbanData.stories).map(a => a.tasks).filter(a => a).flatMap(a => Object.values(a)).flatMap(a => a)
      .concat(Object.values(kanbanData.stories).map(a => a.bugs).filter(a => a).flatMap(a => Object.values(a)).flatMap(a => a))
      .concat(Object.values(kanbanData.kanbanGroup).map(a => a.tasks).filter(a => a).flatMap(a => Object.values(a)).flatMap(a => a))
      .concat(Object.values(kanbanData.kanbanGroup).map(a => a.bugs).filter(a => a).flatMap(a => Object.values(a)).flatMap(a => a))
    const kanbanTasksMap = {}
    kanbanTasks.forEach(task => kanbanTasksMap[task.id] = task)
    return kanbanTasksMap
  }

  function enhanceDialog (mutationsList) {
    mutationsList.forEach(item => {
      if (item.addedNodes.length > 0) {
        const firstChild = $(item.addedNodes[0])
        if (firstChild.attr('id') === 'iframe-triggerModal') {
          // 任务详情弹窗
          firstChild.off('load').on('load', function () {
            const doc = firstChild[0].contentWindow.document
            enhanceHistoryList(doc)
            const toolbar = $(doc.querySelector('.main-actions > .btn-toolbar'))

            // 复制分支
            const $copyId = $(document.createElement('a'))
            $copyId.addClass('btn btn-link showinonlybody')
            $copyId.html('<span class="text"></span> 复制分支')
            const taskId = $(doc.querySelector('.page-title > span.label-id')).text()
            $copyId.on('click', function () {
              GM_setClipboard(`feature/${projectPrefix}-${taskId}`, { type: 'text', mimetype: 'text/plain' })
            })
            $copyId.appendTo(toolbar)

            // 复制标题
            const $copyTitle = $(document.createElement('a'))
            $copyTitle.addClass('btn btn-link showinonlybody')
            $copyTitle.html('<span class="text"></span> 复制标题')
            $copyTitle.on('click', function () {
              const title = $(doc.querySelector('.page-title > span.text')).attr('title')
              GM_setClipboard(`${projectPrefix}-${taskId} ${title}`, { type: 'text', mimetype: 'text/plain' })
            })
            $copyTitle.appendTo(toolbar)

            // 复制链接
            const $copyLink = $(document.createElement('a'))
            $copyLink.addClass('btn btn-link showinonlybody')
            $copyLink.html('<span class="text"></span> 复制链接')
            $copyLink.on('click', function () {
              GM_setClipboard(`${urlDomain}/index.php?m=task&f=view&taskID=${taskId}`, { type: 'text', mimetype: 'text/plain' })
            })
            $copyLink.appendTo(toolbar)

          })
        }
      }
    })
  }

  function hiddenBoardItemWithPrimaryBtn (doc) {
    const $btn = $(doc).find('.btn.custom-filter-btn.btn-primary')
    const checkedName = $btn.text().trim()
    const allBoardList = $(doc.querySelectorAll('.board-item'))
    allBoardList.each(function () {
      const $item = $(this)
      if (checkedName === ALL_TEXT || !checkedName) {
        $item.css('display', 'block')
      } else {
        const name = $($item.find('.task-assignedTo,.bug-assignedTo').children()[1]).text().trim()
        if (name !== checkedName) {
          $item.css('display', 'none')
        } else {
          $item.css('display', 'block')
        }
      }
    })

    // 隐藏空行
    $(doc.querySelectorAll('tr[data-id]')).each(function () {
      const $tr = $(this)
      let hasTask = false
      $tr.children().find('.board-item').each(function () {
        if ($(this).css('display') === 'block') {
          hasTask = true
        }
      })
      if (!hasTask && checkedName !== ALL_TEXT && checkedName) {
        $tr.css('display', 'none')
      } else {
        $tr.css('display', 'table-row')
      }
    })
  }

  const ALL_TEXT = '全部'

  function enhanceRoleFilter (doc) {
    if (!window.location.search.includes('kanban')) return
    if (doc.querySelectorAll('.custom-filter-btn').length) {
      hiddenBoardItemWithPrimaryBtn(doc)
      return
    }
    const btnList = []
    $(doc.querySelectorAll('.task-assignedTo,.bug-assignedTo')).each(function () {
      const name = $(this).text().trim()
      if (!btnList.includes(name)) btnList.push(name)
    })
    btnList.sort()
    btnList.unshift(ALL_TEXT)

    btnList.forEach(i => {
      const $mainMenu = $(doc.querySelector('#mainMenu'))
      const $btn = $(doc.createElement('a'))
      $btn.addClass('btn custom-filter-btn')
      $btn.css('margin-right', '10px')
      $btn.html(i)
      $btn.on('click', function () {
        let checkedName
        const isChecked = $btn.hasClass('btn-primary')
        if (!isChecked) {
          $btn.addClass('btn-primary').siblings().removeClass('btn-primary')
          checkedName = $btn.text().trim()
        } else {
          $btn.removeClass('btn-primary')
          checkedName = ''
        }
        _window.localStorage.setItem('_customerFilter_name', checkedName)
        hiddenBoardItemWithPrimaryBtn(doc)
      })
      $btn.appendTo($mainMenu)
    })
    const checkedName = _window.localStorage.getItem('_customerFilter_name')
    if (checkedName) {
      if (!btnList.includes(checkedName)) {
        _window.localStorage.setItem('_customerFilter_name', '')
        return
      }
      $(doc).find('.btn.custom-filter-btn').each((index, item) => {
        const $item = $(item)
        if ($item.text().trim() === checkedName) {
          $item.click()
        }
      })
    }
  }

  // 历史记录只展示备注
  function enhanceHistoryList (doc) {
    if (doc.querySelectorAll('.histories-custom-filter-btn').length) return
    const fn = function (type) {
      $(doc.querySelectorAll('.histories-list li')).each(function () {
        const $this = $(this)
        if (type === 'hide' && $this.text().indexOf('备注') === -1) {
          $this.hide()
        } else {
          $this.show()
        }
      })
    }
    const $titleBox = $(doc.querySelector('.histories .detail-title'))
    const $hideBtn = $(doc.createElement('a'))
    $hideBtn.addClass('btn btn-link pull-right histories-custom-filter-btn')
    $hideBtn.html('只看备注')
    $hideBtn.on('click', function () {
      if ($hideBtn.html() === '只看备注') {
        fn('hide')
        $hideBtn.html('查看全部')
      } else {
        fn('show')
        $hideBtn.html('只看备注')
      }
    })
    $hideBtn.appendTo($titleBox)
  }

  // 任务弹窗关闭后 iframe 重新 reload了，所以需要监听
  const executionIframe = document.querySelector('#appIframe-execution')
  if (executionIframe) {
    executionIframe.onload = function () {
      const doc = executionIframe.contentWindow.document
      enhanceTask(doc)
      enhanceKanBan(doc)
      enhanceRoleFilter(doc)
      enhanceHistoryList(doc)
      const observer = new MutationObserver((mutationsList) => {
        enhanceTask(doc)
        enhanceKanBan(doc)
        enhanceDialog(mutationsList)
        enhanceRoleFilter(doc)
        enhanceHistoryList(doc)
      })
      observer.observe(doc.body, {
        childList: true,
        subtree: true
      })
    }
  }
})()
