import { ElMessage, ElMessageBox } from 'element-plus'

export function showSuccess(message: string) {
  ElMessage.success(message)
}

export function showError(message: string) {
  ElMessage.error(message)
}

export function showWarning(message: string) {
  ElMessage.warning(message)
}

export function showInfo(message: string) {
  ElMessage.info(message)
}

export async function confirmAction(message: string, title: string = '提示') {
  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    return true
  } catch {
    return false
  }
}
