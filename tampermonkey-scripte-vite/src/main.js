import {createApp} from 'vue';
import './style.css';
import App from './App.vue'
import {enhanceTask} from './enhance-task'
import {enhanceKanBan} from './enhance-kanban'
import {enhanceDialog, enhanceHistoryList} from './enhance-dialog'

createApp(App).mount(
  (() => {
    const app = document.createElement('div')
    // document.body.append(app)
    const _window = window
    const urlDomain = location.origin
    let cachedPrefix = _window.localStorage.getItem('_customFilter_projectPrefix')
    if (!cachedPrefix) {
      cachedPrefix = _window.prompt('请补全项目代号，之后可以通过 localStorage _customFilter_projectPrefix 来修改。', 'XXX')
      _window.localStorage.setItem('_customFilter_projectPrefix', cachedPrefix || 'XXX')
    }

    const projectPrefix = cachedPrefix || 'XXX'

    // 任务弹窗关闭后 iframe 重新 reload了，所以需要监听
    const executionIframe = document.querySelector('#appIframe-execution')
    if (executionIframe) {
      executionIframe.onload = function () {
        const doc = executionIframe.contentWindow.document
        enhanceTask(doc, projectPrefix, urlDomain)
        enhanceKanBan(doc, projectPrefix, urlDomain, _window)
        enhanceHistoryList(doc)
        const observer = new MutationObserver((mutationsList) => {
          enhanceTask(doc, projectPrefix, urlDomain)
          enhanceKanBan(doc, projectPrefix, urlDomain, _window)
          enhanceDialog(mutationsList, projectPrefix, urlDomain)
          enhanceHistoryList(doc)
        })
        observer.observe(doc.body, {
          childList: true,
          subtree: true
        })
      }
    }
    return app
  })(),
)
