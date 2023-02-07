import {GM_setClipboard} from '$'
import {debounce} from './util'

const kanbanDatas = {}
const debouncedEnhanceKanBanClosedTask = debounce(queryKanbanAndEnhanceKanBanClosedTask, 100)

export function enhanceKanBan (document, projectPrefix, urlDomain, _window) {
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
  enhanceKanBanClosedTaskWithCache(document, urlDomain, _window)
}

export function enhanceKanBanClosedTaskWithCache (document, urlDomain, _window) {
  const executionID = new URL(_window.location.href).searchParams.get('executionID')
  if (kanbanDatas[executionID]) {
    enhanceKanBanClosedTask(kanbanDatas[executionID], document, _window)
  } else {
    debouncedEnhanceKanBanClosedTask(document, urlDomain, _window)
  }
}

export function queryKanbanAndEnhanceKanBanClosedTask (document, urlDomain, _window) {
  const executionID = new URL(_window.location.href).searchParams.get('executionID')
  $.get(`${urlDomain}/index.php?m=execution&f=kanban&t=json&executionID=${executionID}`, function (res) {
    const kanbanData = JSON.parse(JSON.parse(res).data)
    kanbanDatas[executionID] = kanbanData
    enhanceKanBanClosedTask(kanbanData, document, _window)
  })
}

export function enhanceKanBanClosedTask (kanbanData, document, _window) {
  const kanbanTasksMap = getKanbanTasksMap(kanbanData)
  const closedTasks = [...document.querySelectorAll('.task-assignedTo,.bug-assignedTo')].filter(a => a.textContent && a.textContent.trim() === 'Closed')
  closedTasks.forEach(ct => {
    const u = new URL(ct.parentElement.previousElementSibling.href)
    const taskID = u.searchParams.get('bugID') ? u.searchParams.get('bugID') : u.searchParams.get('taskID')
    const kanbanTask = kanbanTasksMap[taskID]
    const $span = $(ct).find('span')
    $span.text(`Closed(${kanbanData.realnames[kanbanTask.resolvedBy || kanbanTask.finishedBy || kanbanTask.canceledBy || kanbanTask.closedBy]})`)
    $span.css('max-width', '100px')
  })

  // 增强看板：增加角色过滤器
  enhanceRoleFilter(document, _window)
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

function enhanceRoleFilter (doc, _window) {
  if (!window.location.search.includes('kanban')) return
  if (doc.querySelectorAll('.custom-filter-btn').length) {
    hiddenBoardItemWithPrimaryBtn(doc)
    return
  }
  const btnList = []
  $(doc.querySelectorAll('.task-assignedTo,.bug-assignedTo')).each(function () {
    const ssignedTo = $(this).text().trim()
    const matches = ssignedTo.match(CN_REG)
    if (!matches) return
    const name = matches[0]
    if (!btnList.map(b => b.name).includes(name)) btnList.push(new Button(name, [0]))
  })
  btnList.sort()
  btnList.unshift(new Button(NOT_CLOSED, [1]))
  btnList.unshift(new Button(ALL_TEXT, [0, 1]))

  const $mainMenu = $(doc.querySelector('#mainMenu'))
  btnList.forEach(i => {
    const $btn = $(doc.createElement('a'))
    $btn.addClass('btn custom-filter-btn')
    if (i.name.includes(ALL_TEXT)) {
      $btn.addClass('all-button')
    }
    $btn.css('margin-right', '10px')
    $btn.html(i.name)
    $btn.on('click', function () {
      const isChecked = $btn.hasClass('btn-primary')
      if (isChecked) {
        $btn.removeClass('btn-primary')
      } else {
        $.makeArray($btn.addClass('btn-primary').siblings('a'))
          .filter(e => btnList.find(b => b.name === $(e).text()).exclusiveList.filter(v => i.exclusiveList.includes(v)).length > 0)
          .forEach(e => $(e).removeClass('btn-primary'))
      }
      const checkedNames = $.makeArray($(doc).find('.btn-primary.custom-filter-btn')).map(e => e.text)
      if (!checkedNames || !checkedNames.length) {
        // 如果没选中任何条件，则默认选中“全部”
        $(doc).find('.all-button').click()
      }
      _window.localStorage.setItem('_customerFilter_name', JSON.stringify(checkedNames))
      hiddenBoardItemWithPrimaryBtn(doc)
    })
    $btn.appendTo($mainMenu)
  })
  const checkedNames = JSON.parse(_window.localStorage.getItem('_customerFilter_name'))
  if (checkedNames && checkedNames.length > 0) {
    if (!checkedNames.every(c => btnList.map(b => b.name).includes(c))) {
      _window.localStorage.setItem('_customerFilter_name', '')
      return
    }
    $(doc).find('.btn.custom-filter-btn').each((index, item) => {
      const $item = $(item)
      checkedNames.forEach(c => {
        if ($item.text().trim() === c) {
          $item.click()
        }
      })
    })
  }
}

function hiddenBoardItemWithPrimaryBtn (doc) {
  const roleFilterBtnArr = $.makeArray($(doc).find('.btn.custom-filter-btn.btn-primary'))
  const allBoardList = $(doc.querySelectorAll('.board-item'))
  allBoardList.each(function () {
    const $item = $(this)
    if (isAllText(roleFilterBtnArr)) {
      $item.css('display', 'block')
    } else {
      const assignedTo = $($item.find('.task-assignedTo,.bug-assignedTo').children()[1]).text().trim()
      const isNotClosed = roleFilterBtnArr.map(e => $(e).text().trim()).includes(NOT_CLOSED)
      const roles = isNotClosed ? roleFilterBtnArr.filter(e => $(e).text().trim() !== NOT_CLOSED) : roleFilterBtnArr
      let isDisplay = roles.every(b => {
        return assignedTo.includes($(b).text().trim())
      })
      if (isDisplay && isNotClosed) {
        isDisplay = !assignedTo.includes('Closed')
      }
      if (isDisplay) {
        $item.css('display', 'block')
      } else {
        $item.css('display', 'none')
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
    if (!hasTask && roleFilterBtnArr.length && !isAllText(roleFilterBtnArr)) {
      $tr.css('display', 'none')
    } else {
      $tr.css('display', 'table-row')
    }
  })
}

function isAllText (btnArr) {
  return btnArr.some(b => {
    const trim = $(b).text().trim()
    return !trim || trim === ALL_TEXT
  })
}

const ALL_TEXT = '全部'
const NOT_CLOSED = '未关闭'
const CN_REG = /[^\x00-\xff]+/gm // 过滤中文字符的正则

class Button {
  constructor (name, exclusiveList) {
    this.name = name
    this.exclusiveList = exclusiveList
  }
}
