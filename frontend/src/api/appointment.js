import request from './request'

export const getAppointmentList = (params) => {
  return new Promise((resolve) => {
    const mockData = [
      {
        id: 1,
        memberName: '张美丽',
        memberPhone: '13800138001',
        treatmentName: '水光针护理',
        date: '2024-12-20',
        time: '14:00-15:00',
        status: '已完成',
        advisor: '李顾问',
        room: 'VIP1室',
        remark: '老客户，手法要轻柔',
      },
      {
        id: 2,
        memberName: '李雅琪',
        memberPhone: '13800138002',
        treatmentName: '热玛吉抗衰',
        date: '2024-12-21',
        time: '10:00-11:30',
        status: '待确认',
        advisor: '王顾问',
        room: 'VIP2室',
        remark: 'VIP客户，提前准备好房间',
      },
      {
        id: 3,
        memberName: '王晓丽',
        memberPhone: '13800138003',
        treatmentName: '面部清洁套餐',
        date: '2024-12-21',
        time: '14:30-15:15',
        status: '已确认',
        advisor: '张顾问',
        room: '普通室1',
        remark: '',
      },
      {
        id: 4,
        memberName: '陈梦婷',
        memberPhone: '13800138004',
        treatmentName: '精油SPA',
        date: '2024-12-22',
        time: '15:00-16:30',
        status: '进行中',
        advisor: '李顾问',
        room: 'SPA室',
        remark: '喜欢薰衣草精油',
      },
      {
        id: 5,
        memberName: '刘思雨',
        memberPhone: '13800138005',
        treatmentName: '光子嫩肤',
        date: '2024-12-23',
        time: '09:30-10:10',
        status: '已取消',
        advisor: '王顾问',
        room: '光电室',
        remark: '客户临时有事取消',
      },
      {
        id: 6,
        memberName: '张美丽',
        memberPhone: '13800138001',
        treatmentName: '背部刮痧',
        date: '2024-12-25',
        time: '16:00-16:50',
        status: '待确认',
        advisor: '张顾问',
        room: '理疗室',
        remark: '',
      },
    ]
    setTimeout(() => {
      resolve({
        code: 0,
        data: {
          list: mockData,
          total: mockData.length,
        },
      })
    }, 300)
  })
}

export const getCalendarAppointments = (date) => {
  return new Promise((resolve) => {
    const mockData = [
      { id: 1, time: '09:00', title: '张美丽 - 水光针护理', status: '已确认' },
      { id: 2, time: '10:30', title: '李雅琪 - 热玛吉抗衰', status: '待确认' },
      { id: 3, time: '14:00', title: '王晓丽 - 面部清洁', status: '已确认' },
      { id: 4, time: '15:30', title: '陈梦婷 - 精油SPA', status: '进行中' },
    ]
    setTimeout(() => {
      resolve({
        code: 0,
        data: mockData,
      })
    }, 200)
  })
}

export const confirmAppointment = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 0,
        message: '预约已确认',
      })
    }, 300)
  })
}

export const completeAppointment = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 0,
        message: '预约已完成',
      })
    }, 300)
  })
}

export const cancelAppointment = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 0,
        message: '预约已取消',
      })
    }, 300)
  })
}

export const createAppointment = (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 0,
        data: { id: Date.now(), ...data },
        message: '预约创建成功',
      })
    }, 300)
  })
}

export const getAdvisors = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 0,
        data: [
          { id: 1, name: '李顾问', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=a1' },
          { id: 2, name: '王顾问', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=a2' },
          { id: 3, name: '张顾问', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=a3' },
        ],
      })
    }, 200)
  })
}
