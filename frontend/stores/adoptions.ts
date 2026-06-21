import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type AdoptionStatus = 'pending' | 'approved' | 'rejected' | 'supplement'

export interface ApplicantInfo {
  id: string
  name: string
  phone: string
  email?: string
  age?: number
  gender?: 'male' | 'female'
  occupation?: string
  avatar?: string
  idCard?: string
  address?: string
}

export interface PetInfo {
  id: string
  name: string
  breed: string
  age: string
  gender: 'male' | 'female'
  species: 'dog' | 'cat' | 'other'
  avatar?: string
  description?: string
  healthStatus?: string
  vaccinated?: boolean
}

export interface LivingEnvironment {
  housingType: 'apartment' | 'house' | 'villa' | 'other'
  housingArea?: string
  hasYard: boolean
  hasBalcony: boolean
  isOwned: boolean
  householdCount: number
  hasChildren: boolean
  hasElderly: boolean
  hasOtherPets: boolean
  otherPetsDesc?: string
}

export interface PetExperience {
  hasExperience: boolean
  yearsOfExperience?: number
  petTypes?: string[]
  currentPets?: string
  surrenderedPets?: string
  reasonForSurrender?: string
}

export interface AdoptionApplication {
  id: string
  applicant: ApplicantInfo
  pet: PetInfo
  status: AdoptionStatus
  applyTime: string
  reviewTime?: string
  reviewer?: string
  reviewRemark?: string
  livingEnvironment: LivingEnvironment
  petExperience: PetExperience
  reason: string
  dailyCarePlan?: string
  emergencyContact?: string
  emergencyPhone?: string
  agreeTerms: boolean
}

export const useAdoptionsStore = defineStore('adoptions', () => {
  const applications = ref<AdoptionApplication[]>([
    {
      id: 'AD20240601001',
      applicant: {
        id: 'U001',
        name: '李小美',
        phone: '138****1234',
        email: 'lixiaomei@example.com',
        age: 28,
        gender: 'female',
        occupation: '设计师',
        address: '北京市朝阳区望京街道SOHO T1',
      },
      pet: {
        id: 'P001',
        name: '奶茶',
        breed: '英短银渐层',
        age: '1岁2个月',
        gender: 'female',
        species: 'cat',
        healthStatus: '健康',
        vaccinated: true,
      },
      status: 'pending',
      applyTime: '2024-06-20 14:30:00',
      reason: '一直很喜欢猫咪，家里条件也很适合养，希望能给奶茶一个温暖的家。',
      dailyCarePlan: '每天喂食2次，定期梳毛，每周洗澡一次，每年按时接种疫苗。',
      emergencyContact: '李妈妈',
      emergencyPhone: '139****5678',
      agreeTerms: true,
      livingEnvironment: {
        housingType: 'apartment',
        housingArea: '85㎡',
        hasYard: false,
        hasBalcony: true,
        isOwned: true,
        householdCount: 2,
        hasChildren: false,
        hasElderly: false,
        hasOtherPets: false,
      },
      petExperience: {
        hasExperience: true,
        yearsOfExperience: 3,
        petTypes: ['猫'],
        currentPets: '无（之前的猫自然老去）',
        surrenderedPets: '无',
      },
    },
    {
      id: 'AD20240601002',
      applicant: {
        id: 'U002',
        name: '王大伟',
        phone: '139****5678',
        email: 'wangdawei@example.com',
        age: 35,
        gender: 'male',
        occupation: '程序员',
        address: '北京市海淀区中关村大街1号',
      },
      pet: {
        id: 'P002',
        name: '豆豆',
        breed: '金毛犬',
        age: '2岁',
        gender: 'male',
        species: 'dog',
        healthStatus: '健康',
        vaccinated: true,
      },
      status: 'pending',
      applyTime: '2024-06-20 10:15:00',
      reason: '从小就喜欢狗狗，现在工作稳定，有时间照顾，想领养豆豆陪伴。',
      dailyCarePlan: '早晚各遛一次，按时喂食，定期美容，有时间就陪它玩耍。',
      emergencyContact: '妻子',
      emergencyPhone: '137****9012',
      agreeTerms: true,
      livingEnvironment: {
        housingType: 'house',
        housingArea: '150㎡',
        hasYard: true,
        hasBalcony: true,
        isOwned: true,
        householdCount: 3,
        hasChildren: true,
        hasElderly: false,
        hasOtherPets: false,
      },
      petExperience: {
        hasExperience: true,
        yearsOfExperience: 5,
        petTypes: ['狗'],
        currentPets: '无',
        surrenderedPets: '无',
      },
    },
    {
      id: 'AD20240601003',
      applicant: {
        id: 'U003',
        name: '张雅婷',
        phone: '137****9012',
        email: 'zhangyating@example.com',
        age: 26,
        gender: 'female',
        occupation: '教师',
        address: '上海市浦东新区张江高科技园区',
      },
      pet: {
        id: 'P003',
        name: '橘子',
        breed: '中华田园猫',
        age: '6个月',
        gender: 'male',
        species: 'cat',
        healthStatus: '健康',
        vaccinated: true,
      },
      status: 'approved',
      applyTime: '2024-06-18 09:00:00',
      reviewTime: '2024-06-19 11:30:00',
      reviewer: '张小明',
      reviewRemark: '申请人条件优秀，居住环境良好，有养猫经验，审批通过。',
      reason: '非常喜欢小动物，想给流浪猫一个家。',
      agreeTerms: true,
      livingEnvironment: {
        housingType: 'apartment',
        housingArea: '70㎡',
        hasYard: false,
        hasBalcony: true,
        isOwned: true,
        householdCount: 1,
        hasChildren: false,
        hasElderly: false,
        hasOtherPets: false,
      },
      petExperience: {
        hasExperience: true,
        yearsOfExperience: 2,
        petTypes: ['猫'],
        currentPets: '一只3岁英短',
        surrenderedPets: '无',
      },
    },
    {
      id: 'AD20240601004',
      applicant: {
        id: 'U004',
        name: '陈建国',
        phone: '136****3456',
        age: 42,
        gender: 'male',
        occupation: '自由职业',
        address: '广州市天河区珠江新城',
      },
      pet: {
        id: 'P004',
        name: '旺财',
        breed: '拉布拉多',
        age: '3岁',
        gender: 'male',
        species: 'dog',
        healthStatus: '健康',
        vaccinated: true,
      },
      status: 'rejected',
      applyTime: '2024-06-17 16:45:00',
      reviewTime: '2024-06-18 09:20:00',
      reviewer: '张小明',
      reviewRemark: '居住环境不适合养大型犬，经常出差无人照顾。',
      reason: '朋友推荐，觉得狗狗很可爱。',
      agreeTerms: true,
      livingEnvironment: {
        housingType: 'apartment',
        housingArea: '55㎡',
        hasYard: false,
        hasBalcony: false,
        isOwned: false,
        householdCount: 1,
        hasChildren: false,
        hasElderly: false,
        hasOtherPets: false,
      },
      petExperience: {
        hasExperience: false,
        petTypes: [],
      },
    },
    {
      id: 'AD20240601005',
      applicant: {
        id: 'U005',
        name: '刘思琪',
        phone: '135****7890',
        email: 'liusq@example.com',
        age: 31,
        gender: 'female',
        occupation: '医生',
        address: '深圳市南山区科技园',
      },
      pet: {
        id: 'P005',
        name: '雪球',
        breed: '比熊',
        age: '1岁',
        gender: 'female',
        species: 'dog',
        healthStatus: '健康',
        vaccinated: true,
      },
      status: 'supplement',
      applyTime: '2024-06-19 11:20:00',
      reviewTime: '2024-06-20 08:45:00',
      reviewer: '张小明',
      reviewRemark: '请补充居住证明和养宠计划的详细说明。',
      reason: '想要一个毛茸茸的小伙伴陪伴。',
      agreeTerms: true,
      livingEnvironment: {
        housingType: 'apartment',
        hasYard: false,
        hasBalcony: true,
        isOwned: true,
        householdCount: 2,
        hasChildren: false,
        hasElderly: false,
        hasOtherPets: false,
      },
      petExperience: {
        hasExperience: false,
        petTypes: [],
      },
    },
  ])

  const currentApplication = ref<AdoptionApplication | null>(null)

  const pendingApplications = computed(() =>
    applications.value.filter((a) => a.status === 'pending' || a.status === 'supplement')
  )

  const approvedApplications = computed(() =>
    applications.value.filter((a) => a.status === 'approved')
  )

  const rejectedApplications = computed(() =>
    applications.value.filter((a) => a.status === 'rejected')
  )

  const stats = computed(() => ({
    pending: pendingApplications.value.length,
    approved: approvedApplications.value.length,
    rejected: rejectedApplications.value.length,
    total: applications.value.length,
  }))

  function getApplicationById(id: string) {
    return applications.value.find((a) => a.id === id) || null
  }

  function setCurrentApplication(id: string) {
    currentApplication.value = getApplicationById(id)
  }

  function reviewApplication(id: string, status: Exclude<AdoptionStatus, 'pending'>, remark: string) {
    const app = applications.value.find((a) => a.id === id)
    if (app) {
      app.status = status
      app.reviewRemark = remark
      app.reviewTime = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).replace(/\//g, '-')
      app.reviewer = '当前用户'
    }
  }

  return {
    applications,
    currentApplication,
    pendingApplications,
    approvedApplications,
    rejectedApplications,
    stats,
    getApplicationById,
    setCurrentApplication,
    reviewApplication,
  }
})
