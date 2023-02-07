import {GM_setClipboard} from '$'

export function enhanceDialog (mutationsList, projectPrefix, urlDomain) {
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

// 历史记录只展示备注
export function enhanceHistoryList (doc) {
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


