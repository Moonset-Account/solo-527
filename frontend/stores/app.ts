import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    collapsed: false,
    loading: false,
    currentPage: '首页',
    breadcrumb: [{ label: '首页', key: '/dashboard' }] as Array<{ label: string; key: string }>,
  }),
  actions: {
    toggleCollapsed() {
      this.collapsed = !this.collapsed
    },
    setLoading(val: boolean) {
      this.loading = val
    },
    setPage(title: string, path: string) {
      this.currentPage = title
      if (path === '/dashboard') {
        this.breadcrumb = [{ label: '首页', key: '/dashboard' }]
      } else {
        const keys = path.split('/').filter(Boolean)
        const names: Record<string, string> = {
          dashboard: '首页',
          schedules: '排课消课台',
          consumptions: '消课记录',
          calendar: '课程日历',
          feedbacks: '家校反馈',
          classes: '班级管理',
          students: '学生档案',
          questions: '题库版本',
          notifications: '通知回执',
          reports: '报表中心',
          reminders: '提醒中心',
          operations: '运营管理',
        }
        let fullPath = ''
        this.breadcrumb = [{ label: '首页', key: '/dashboard' }]
        for (const k of keys) {
          fullPath += '/' + k
          if (names[k]) {
            this.breadcrumb.push({ label: names[k], key: fullPath })
          }
        }
      }
    },
  },
  persist: {
    paths: ['collapsed'],
  },
})
