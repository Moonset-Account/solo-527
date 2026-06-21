import request from './request'

export const getReminderList = (params) => {
  return new Promise((resolve) => {
    const mockData = [
      {
        id: 1,
        type: 'urgent',
        title: '预约即将到期',
        content: '张美丽的水光针护理预约将在30分钟后开始',
        time: '10分钟前',
        status: 'unread',
        relatedId: 1,
        relatedType: 'appointment',
      },
      {
        id: 2,
        type: 'urgent',
        title: '疗程即将过期',
        content: '李雅琪的面部清洁套餐还有7天过期，剩余5次',
        time: '1小时前',
        status: 'unread',
        relatedId: 2,
        relatedType: 'treatment',
      },
      {
        id: 3,
        type: 'normal',
        title: '今日生日会员',
        content: '今天是王晓丽的生日，别忘了送上祝福',
        time: '2小时前',
        status: 'unread',
        relatedId: 3,
        relatedType: 'member',
      },
      {
        id: 4,
        type: 'normal',
        title: '新会员注册',
        content: '陈梦婷 注册成为普通会员',
        time: '3小时前',
        status: 'read',
        relatedId: 4,
        relatedType: 'member',
      },
      {
        id: 5,
        type: 'normal',
        title: '预约待确认',
        content: '刘思雨 预约了背部刮痧，待确认',
        time: '5小时前',
        status: 'read',
        relatedId: 5,
        relatedType: 'appointment',
      },
      {
        id: 6,
        type: 'low',
        title: '库存预警',
        content: '玻尿酸原液库存不足，请及时补货',
        time: '昨天',
        status: 'read',
        relatedId: 6,
        relatedType: 'stock',
      },
      {
        id: 7,
        type: 'low',
        title: '月度报表',
        content: '11月份业绩报表已生成，请查看',
        time: '2天前',
        status: 'read',
        relatedId: 7,
        relatedType: 'report',
      },
    ]
    setTimeout(() => {
      resolve({
        code: 0,
        data: {
          list: mockData,
          total: mockData.length,
          stats: {
            urgent: 2,
            normal: 3,
            low: 2,
            total: 7,
            unread: 3,
          },
        },
      })
    }, 300)
  })
}

export const markReminderRead = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 0,
        message: '已标记为已处理',
      })
    }, 200)
  })
}

export const markAllRead = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 0,
        message: '全部标记为已处理',
      })
    }, 200)
  })
}
