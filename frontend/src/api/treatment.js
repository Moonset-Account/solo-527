import request from './request'

export const getTreatmentList = (params) => {
  return new Promise((resolve) => {
    const mockData = [
      {
        id: 1,
        name: '水光针护理',
        category: '面部护理',
        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400',
        price: 680,
        originalPrice: 980,
        totalCount: 10,
        duration: 60,
        validPeriod: 12,
        description: '深层补水，改善肌肤干燥暗沉，让肌肤水润透亮',
        features: ['深层补水', '改善暗沉', '收缩毛孔'],
      },
      {
        id: 2,
        name: '面部清洁套餐',
        category: '面部护理',
        image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400',
        price: 320,
        originalPrice: 480,
        totalCount: 5,
        duration: 45,
        validPeriod: 6,
        description: '深度清洁毛孔，去除黑头粉刺，让肌肤清爽呼吸',
        features: ['深层清洁', '去黑头', '控油'],
      },
      {
        id: 3,
        name: '热玛吉抗衰',
        category: '抗衰项目',
        image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400',
        price: 3980,
        originalPrice: 5800,
        totalCount: 1,
        duration: 90,
        validPeriod: 24,
        description: '紧致提升，淡化细纹，重塑年轻轮廓',
        features: ['紧致提升', '淡化皱纹', '轮廓塑形'],
      },
      {
        id: 4,
        name: '光子嫩肤',
        category: '面部护理',
        image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=400',
        price: 1280,
        originalPrice: 1800,
        totalCount: 3,
        duration: 40,
        validPeriod: 12,
        description: '改善肤色不均，淡化色斑，提亮肤色',
        features: ['提亮肤色', '淡化色斑', '改善红血丝'],
      },
      {
        id: 5,
        name: '背部刮痧',
        category: '身体护理',
        image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
        price: 268,
        originalPrice: 380,
        totalCount: 6,
        duration: 50,
        validPeriod: 6,
        description: '疏通经络，排毒养颜，缓解肩颈酸痛',
        features: ['疏通经络', '排毒养颜', '缓解疲劳'],
      },
      {
        id: 6,
        name: '精油SPA',
        category: '身体护理',
        image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400',
        price: 580,
        originalPrice: 780,
        totalCount: 5,
        duration: 90,
        validPeriod: 12,
        description: '全身放松，舒缓压力，改善睡眠质量',
        features: ['全身放松', '舒缓压力', '改善睡眠'],
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

export const getTreatmentDetail = (id) => {
  return new Promise((resolve) => {
    const mockData = {
      id,
      name: '水光针护理',
      category: '面部护理',
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600',
      price: 680,
      originalPrice: 980,
      totalCount: 10,
      duration: 60,
      validPeriod: 12,
      description: '深层补水，改善肌肤干燥暗沉，让肌肤水润透亮。采用高端玻尿酸原液，配合专业导入技术，让养分直达肌肤深层。',
      features: ['深层补水', '改善暗沉', '收缩毛孔', '提亮肤色'],
      suitablePeople: ['肌肤干燥缺水', '肤色暗沉无光', '毛孔粗大', '初老肌肤'],
      taboo: ['孕妇', '皮肤有破损', '过敏体质', '近期暴晒者'],
    }
    setTimeout(() => {
      resolve({
        code: 0,
        data: mockData,
      })
    }, 300)
  })
}

export const getTreatmentCategories = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 0,
        data: [
          { id: 1, name: '全部' },
          { id: 2, name: '面部护理' },
          { id: 3, name: '身体护理' },
          { id: 4, name: '抗衰项目' },
          { id: 5, name: '光电项目' },
        ],
      })
    }, 200)
  })
}
