declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  $message?: import('naive-ui').MessageApi
  $dialog?: import('naive-ui').DialogApi
  $notification?: import('naive-ui').NotificationApi
}
