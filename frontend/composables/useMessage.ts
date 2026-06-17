import { ref } from 'vue'
import { useMessage, useDialog, useNotification } from 'naive-ui'

export function useMessageUtil() {
  const message = useMessage()

  function success(content: string) {
    message.success(content)
  }

  function error(content: string) {
    message.error(content)
  }

  function warning(content: string) {
    message.warning(content)
  }

  function info(content: string) {
    message.info(content)
  }

  return { success, error, warning, info }
}

export function useDialogUtil() {
  const dialog = useDialog()

  function confirm(title: string, content: string, onPositive: () => void) {
    dialog.warning({
      title,
      content,
      positiveText: '确定',
      negativeText: '取消',
      onPositive,
    })
  }

  return { confirm }
}
