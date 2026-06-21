import request from './request'

export const getMemberList = (params) => {
  return new Promise((resolve) => {
    const mockData = [
      {
        id: 1,
        name: '张美丽',
        phone: '13800138001',
        level: '金牌会员',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
        balance: 5680,
        totalConsumption: 28600,
        registerDate: '2023-03-15',
        birthday: '1990-05-20',
        address: '北京市朝阳区xxx路xxx号',
        remark: '老客户，性格温和',
      },
      {
        id: 2,
        name: '李雅琪',
        phone: '13800138002',
        level: '钻石会员',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
        balance: 12800,
        totalConsumption: 68900,
        registerDate: '2022-08-10',
        birthday: '1988-11-15',
        address: '北京市海淀区xxx路xxx号',
        remark: 'VIP客户，消费能力强',
      },
      {
        id: 3,
        name: '王晓丽',
        phone: '13800138003',
        level: '普通会员',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
        balance: 320,
        totalConsumption: 3200,
        registerDate: '2024-01-20',
        birthday: '1995-03-08',
        address: '北京市丰台区xxx路xxx号',
        remark: '新客户',
      },
      {
        id: 4,
        name: '陈梦婷',
        phone: '13800138004',
        level: '银牌会员',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
        balance: 2100,
        totalConsumption: 12800,
        registerDate: '2023-09-05',
        birthday: '1992-07-22',
        address: '北京市西城区xxx路xxx号',
        remark: '定期来做护理',
      },
      {
        id: 5,
        name: '刘思雨',
        phone: '13800138005',
        level: '金牌会员',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
        balance: 4500,
        totalConsumption: 32000,
        registerDate: '2023-06-18',
        birthday: '1991-12-30',
        address: '北京市东城区xxx路xxx号',
        remark: '推荐过朋友来',
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

export const getMemberDetail = (id) => {
  return new Promise((resolve) => {
    const mockData = {
      id,
      name: '张美丽',
      phone: '13800138001',
      level: '金牌会员',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
      balance: 5680,
      totalConsumption: 28600,
      registerDate: '2023-03-15',
      birthday: '1990-05-20',
      address: '北京市朝阳区xxx路xxx号',
      remark: '老客户，性格温和',
      treatments: [
        {
          id: 1,
          name: '水光针护理',
          image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200',
          totalCount: 10,
          remainingCount: 3,
          validUntil: '2025-12-31',
          purchaseDate: '2024-01-15',
        },
        {
          id: 2,
          name: '面部清洁套餐',
          image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=200',
          totalCount: 5,
          remainingCount: 5,
          validUntil: '2025-06-30',
          purchaseDate: '2024-06-01',
        },
      ],
      appointments: [
        {
          id: 1,
          treatmentName: '水光针护理',
          date: '2024-12-20',
          time: '14:00',
          status: '已完成',
          advisor: '李顾问',
        },
        {
          id: 2,
          treatmentName: '面部清洁套餐',
          date: '2024-12-25',
          time: '10:00',
          status: '待确认',
          advisor: '王顾问',
        },
      ],
      consumptionRecords: [
        {
          id: 1,
          date: '2024-12-20',
          type: '消费',
          amount: -680,
          description: '水光针护理（第7次）',
        },
        {
          id: 2,
          date: '2024-12-01',
          type: '充值',
          amount: 2000,
          description: '会员充值',
        },
        {
          id: 3,
          date: '2024-11-15',
          type: '消费',
          amount: -1280,
          description: '水光针护理（第6次）',
        },
      ],
      works: [
        {
          id: 1,
          title: '水光针护理效果',
          image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300',
          date: '2024-12-20',
        },
        {
          id: 2,
          title: '面部护理后',
          image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=300',
          date: '2024-11-15',
        },
      ],
    }
    setTimeout(() => {
      resolve({
        code: 0,
        data: mockData,
      })
    }, 300)
  })
}

export const searchMembers = (keyword) => {
  return new Promise((resolve) => {
    const mockData = [
      {
        id: 1,
        name: '张美丽',
        phone: '13800138001',
        level: '金牌会员',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
      },
      {
        id: 2,
        name: '李雅琪',
        phone: '13800138002',
        level: '钻石会员',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
      },
    ]
    setTimeout(() => {
      resolve({
        code: 0,
        data: mockData,
      })
    }, 200)
  })
}

export const addMember = (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 0,
        data: { id: Date.now(), ...data },
        message: '添加成功',
      })
    }, 300)
  })
}

export const updateMember = (id, data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 0,
        data: { id, ...data },
        message: '更新成功',
      })
    }, 300)
  })
}
