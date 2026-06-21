import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type PetSpecies = 'dog' | 'cat' | 'rabbit' | 'bird' | 'other'
export type PetGender = 'male' | 'female'
export type PetHealthStatus = 'healthy' | 'attention' | 'sick'

export interface PetOwner {
  id: string
  name: string
  phone: string
}

export interface HealthRecord {
  id: string
  type: 'vaccine' | 'deworm' | 'checkup' | 'treatment' | 'surgery'
  title: string
  date: string
  description: string
  doctor?: string
  nextDate?: string
}

export interface PetPhoto {
  id: string
  url: string
  uploadedAt: string
  serviceType?: string
  description?: string
}

export interface ServiceRecord {
  id: string
  orderNo: string
  type: string
  date: string
  status: 'completed' | 'cancelled' | 'processing'
  price: number
  staff?: string
  remark?: string
}

export interface Pet {
  id: string
  name: string
  species: PetSpecies
  breed: string
  gender: PetGender
  age: number
  ageUnit: 'year' | 'month'
  weight?: number
  avatar: string
  owner: PetOwner
  healthStatus: PetHealthStatus
  description?: string
  birthday?: string
  sterilized?: boolean
  healthRecords: HealthRecord[]
  photos: PetPhoto[]
  serviceRecords: ServiceRecord[]
}

export const usePetsStore = defineStore('pets', () => {
  const pets = ref<Pet[]>([
    {
      id: 'p1',
      name: '奶茶',
      species: 'cat',
      breed: '英国短毛猫',
      gender: 'female',
      age: 2,
      ageUnit: 'year',
      weight: 4.5,
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20british%20shorthair%20cat%20portrait%20face%20closeup&image_size=square',
      owner: { id: 'o1', name: '李女士', phone: '138****8888' },
      healthStatus: 'healthy',
      description: '性格温顺，喜欢睡觉',
      birthday: '2022-03-15',
      sterilized: true,
      healthRecords: [
        { id: 'h1', type: 'vaccine', title: '狂犬疫苗接种', date: '2024-05-10', description: '年度狂犬疫苗，接种正常', doctor: '王医生', nextDate: '2025-05-10' },
        { id: 'h2', type: 'deworm', title: '体内外驱虫', date: '2024-04-20', description: '常规驱虫，无不良反应' },
        { id: 'h3', type: 'checkup', title: '年度体检', date: '2024-03-15', description: '各项指标正常，体重略偏胖', doctor: '张医生' },
        { id: 'h4', type: 'vaccine', title: '猫三联疫苗', date: '2024-02-01', description: '基础免疫加强针', doctor: '王医生', nextDate: '2025-02-01' },
      ],
      photos: [
        { id: 'ph1', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cat%20after%20grooming%20fluffy&image_size=square_hd', uploadedAt: '2024-06-15', serviceType: '洗护SPA', description: '刚做完洗护，毛发蓬松' },
        { id: 'ph2', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cat%20lying%20on%20sofa%20sleeping%20cozy&image_size=square_hd', uploadedAt: '2024-06-10', serviceType: '日常寄养', description: '寄养期间的休息照' },
        { id: 'ph3', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cat%20beautiful%20portrait%20professional&image_size=square_hd', uploadedAt: '2024-05-20', serviceType: '美容造型', description: '狮子造型完成后' },
      ],
      serviceRecords: [
        { id: 'sr1', orderNo: '20240615001', type: '洗护SPA', date: '2024-06-15', status: 'completed', price: 188, staff: '李小红', remark: '客户非常满意' },
        { id: 'sr2', orderNo: '20240610003', type: '短期寄养(3天)', date: '2024-06-10', status: 'completed', price: 240, staff: '王小刚' },
        { id: 'sr3', orderNo: '20240520002', type: '美容造型', date: '2024-05-20', status: 'completed', price: 328, staff: '张小明', remark: '狮子造型' },
        { id: 'sr4', orderNo: '20240415005', type: '基础体检', date: '2024-04-15', status: 'completed', price: 268, staff: '张医生' },
      ],
    },
    {
      id: 'p2',
      name: '豆豆',
      species: 'dog',
      breed: '金毛犬',
      gender: 'male',
      age: 4,
      ageUnit: 'year',
      weight: 28,
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=golden%20retriever%20dog%20portrait%20happy&image_size=square',
      owner: { id: 'o2', name: '陈先生', phone: '139****6666' },
      healthStatus: 'attention',
      description: '活泼好动，食欲最近有所下降',
      birthday: '2020-08-20',
      sterilized: false,
      healthRecords: [
        { id: 'h5', type: 'checkup', title: '健康检查', date: '2024-06-18', description: '食欲下降，建议观察，做了血检', doctor: '张医生' },
        { id: 'h6', type: 'vaccine', title: '八联疫苗', date: '2024-05-20', description: '年度免疫，状态良好', doctor: '王医生', nextDate: '2025-05-20' },
        { id: 'h7', type: 'deworm', title: '体外驱虫', date: '2024-06-01', description: '夏季驱虫' },
      ],
      photos: [
        { id: 'ph4', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=golden%20retriever%20dog%20after%20bath%20fluffy&image_size=square_hd', uploadedAt: '2024-06-12', serviceType: '深度洗护', description: '洗完澡超开心' },
        { id: 'ph5', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=golden%20retriever%20playing%20with%20ball%20park&image_size=square_hd', uploadedAt: '2024-05-28', description: '玩耍时抓拍' },
      ],
      serviceRecords: [
        { id: 'sr5', orderNo: '20240612002', type: '深度洗护', date: '2024-06-12', status: 'completed', price: 268, staff: '张小明' },
        { id: 'sr6', orderNo: '20240528001', type: '遛狗服务(2小时)', date: '2024-05-28', status: 'completed', price: 80, staff: '王小刚' },
      ],
    },
    {
      id: 'p3',
      name: '小白',
      species: 'rabbit',
      breed: '荷兰垂耳兔',
      gender: 'female',
      age: 1,
      ageUnit: 'year',
      weight: 1.8,
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20holland%20lop%20rabbit%20white%20fluffy&image_size=square',
      owner: { id: 'o3', name: '赵同学', phone: '137****3333' },
      healthStatus: 'healthy',
      description: '很亲人，喜欢被摸头',
      birthday: '2023-05-10',
      sterilized: true,
      healthRecords: [
        { id: 'h8', type: 'checkup', title: '常规体检', date: '2024-05-10', description: '一周岁体检，一切正常', doctor: '王医生' },
        { id: 'h9', type: 'vaccine', title: '兔瘟疫苗', date: '2024-04-01', description: '年度接种', doctor: '张医生', nextDate: '2025-04-01' },
      ],
      photos: [
        { id: 'ph6', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20white%20rabbit%20fluffy%20portrait&image_size=square_hd', uploadedAt: '2024-06-08', description: '兔兔的可爱日常' },
      ],
      serviceRecords: [
        { id: 'sr7', orderNo: '20240608001', type: '兔兔美容', date: '2024-06-08', status: 'completed', price: 128, staff: '李小红' },
      ],
    },
    {
      id: 'p4',
      name: '旺财',
      species: 'dog',
      breed: '柯基',
      gender: 'male',
      age: 3,
      ageUnit: 'year',
      weight: 12,
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=welsh%20corgi%20dog%20happy%20smile&image_size=square',
      owner: { id: 'o4', name: '孙女士', phone: '136****2222' },
      healthStatus: 'sick',
      description: '小短腿，最近皮肤过敏正在治疗',
      birthday: '2021-01-08',
      sterilized: true,
      healthRecords: [
        { id: 'h10', type: 'treatment', title: '皮肤过敏治疗', date: '2024-06-20', description: '过敏性皮炎，开药治疗中', doctor: '张医生', nextDate: '2024-06-27' },
        { id: 'h11', type: 'checkup', title: '皮肤检查', date: '2024-06-18', description: '发现皮肤红斑', doctor: '王医生' },
        { id: 'h12', type: 'vaccine', title: '狂犬疫苗', date: '2024-03-15', description: '年度接种', doctor: '张医生', nextDate: '2025-03-15' },
      ],
      photos: [
        { id: 'ph7', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=corgi%20dog%20cute%20butt%20standing&image_size=square_hd', uploadedAt: '2024-06-01', description: '标志性的小短腿和蜜桃臀' },
        { id: 'ph8', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=corgi%20dog%20wearing%20scarf%20cute&image_size=square_hd', uploadedAt: '2024-05-15', serviceType: '造型美容', description: '佩戴围巾超可爱' },
      ],
      serviceRecords: [
        { id: 'sr8', orderNo: '20240601004', type: '药浴SPA', date: '2024-06-01', status: 'completed', price: 198, staff: '李小红', remark: '配合皮肤治疗' },
        { id: 'sr9', orderNo: '20240515002', type: '造型美容', date: '2024-05-15', status: 'completed', price: 258, staff: '张小明' },
      ],
    },
    {
      id: 'p5',
      name: '咪咪',
      species: 'cat',
      breed: '布偶猫',
      gender: 'female',
      age: 1,
      ageUnit: 'year',
      weight: 3.2,
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ragdoll%20cat%20beautiful%20blue%20eyes%20fluffy&image_size=square',
      owner: { id: 'o5', name: '周小姐', phone: '135****1111' },
      healthStatus: 'healthy',
      description: '仙女猫，超级粘人',
      birthday: '2023-04-20',
      sterilized: false,
      healthRecords: [
        { id: 'h13', type: 'checkup', title: '健康检查', date: '2024-06-01', description: '各项指标优秀', doctor: '王医生' },
        { id: 'h14', type: 'vaccine', title: '猫三联', date: '2024-05-10', description: '基础免疫', doctor: '张医生', nextDate: '2025-05-10' },
      ],
      photos: [
        { id: 'ph9', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ragdoll%20cat%20beautiful%20portrait%20fluffy%20white&image_size=square_hd', uploadedAt: '2024-06-18', serviceType: '高端洗护', description: '洗护后毛发超级顺滑' },
        { id: 'ph10', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ragdoll%20cat%20sleeping%20peaceful&image_size=square_hd', uploadedAt: '2024-06-10', description: '睡得香香的' },
        { id: 'ph11', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ragdoll%20cat%20playing%20with%20toy&image_size=square_hd', uploadedAt: '2024-06-05', description: '玩耍中' },
      ],
      serviceRecords: [
        { id: 'sr10', orderNo: '20240618003', type: '高端洗护SPA', date: '2024-06-18', status: 'completed', price: 388, staff: '张小明', remark: '长毛猫专业护理' },
      ],
    },
    {
      id: 'p6',
      name: '啾啾',
      species: 'bird',
      breed: '虎皮鹦鹉',
      gender: 'male',
      age: 8,
      ageUnit: 'month',
      avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=budgerigar%20parakeet%20colorful%20cute&image_size=square',
      owner: { id: 'o6', name: '吴先生', phone: '134****4444' },
      healthStatus: 'healthy',
      description: '会说你好，活泼好动',
      birthday: '2023-10-15',
      healthRecords: [
        { id: 'h15', type: 'checkup', title: '常规检查', date: '2024-05-15', description: '羽毛亮丽，精神状态好', doctor: '王医生' },
      ],
      photos: [],
      serviceRecords: [
        { id: 'sr11', orderNo: '20240515003', type: '鸟类体检', date: '2024-05-15', status: 'completed', price: 158, staff: '王医生' },
      ],
    },
  ])

  const searchKeyword = ref('')
  const filterSpecies = ref<PetSpecies | ''>('')
  const filterGender = ref<PetGender | ''>('')
  const currentPetId = ref<string | null>(null)

  const speciesOptions = [
    { label: '全部物种', value: '' },
    { label: '狗狗', value: 'dog' },
    { label: '猫咪', value: 'cat' },
    { label: '兔子', value: 'rabbit' },
    { label: '鸟类', value: 'bird' },
    { label: '其他', value: 'other' },
  ]

  const genderOptions = [
    { label: '全部性别', value: '' },
    { label: '公', value: 'male' },
    { label: '母', value: 'female' },
  ]

  const filteredPets = computed(() => {
    return pets.value.filter((pet) => {
      const matchKeyword = !searchKeyword.value ||
        pet.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
        pet.breed.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
        pet.owner.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
      const matchSpecies = !filterSpecies.value || pet.species === filterSpecies.value
      const matchGender = !filterGender.value || pet.gender === filterGender.value
      return matchKeyword && matchSpecies && matchGender
    })
  })

  const currentPet = computed(() => {
    if (!currentPetId.value) return null
    return pets.value.find((p) => p.id === currentPetId.value) || null
  })

  function getPetById(id: string) {
    return pets.value.find((p) => p.id === id) || null
  }

  function setCurrentPetId(id: string | null) {
    currentPetId.value = id
  }

  function setSearchKeyword(keyword: string) {
    searchKeyword.value = keyword
  }

  function setFilterSpecies(species: PetSpecies | '') {
    filterSpecies.value = species
  }

  function setFilterGender(gender: PetGender | '') {
    filterGender.value = gender
  }

  function addPhoto(petId: string, photo: PetPhoto) {
    const pet = pets.value.find((p) => p.id === petId)
    if (pet) {
      pet.photos.unshift(photo)
    }
  }

  function addHealthRecord(petId: string, record: HealthRecord) {
    const pet = pets.value.find((p) => p.id === petId)
    if (pet) {
      pet.healthRecords.unshift(record)
    }
  }

  function getSpeciesLabel(species: PetSpecies) {
    const map: Record<PetSpecies, string> = {
      dog: '狗狗',
      cat: '猫咪',
      rabbit: '兔子',
      bird: '鸟类',
      other: '其他',
    }
    return map[species]
  }

  function getGenderLabel(gender: PetGender) {
    return gender === 'male' ? '公' : '母'
  }

  function getHealthStatusLabel(status: PetHealthStatus) {
    const map: Record<PetHealthStatus, string> = {
      healthy: '健康',
      attention: '需关注',
      sick: '治疗中',
    }
    return map[status]
  }

  function getHealthStatusType(status: PetHealthStatus) {
    const map: Record<PetHealthStatus, 'success' | 'warning' | 'error'> = {
      healthy: 'success',
      attention: 'warning',
      sick: 'error',
    }
    return map[status]
  }

  function getHealthRecordTypeLabel(type: HealthRecord['type']) {
    const map: Record<HealthRecord['type'], string> = {
      vaccine: '疫苗接种',
      deworm: '驱虫',
      checkup: '体检',
      treatment: '治疗',
      surgery: '手术',
    }
    return map[type]
  }

  function getServiceStatusLabel(status: ServiceRecord['status']) {
    const map: Record<ServiceRecord['status'], string> = {
      completed: '已完成',
      cancelled: '已取消',
      processing: '进行中',
    }
    return map[status]
  }

  function getServiceStatusType(status: ServiceRecord['status']) {
    const map: Record<ServiceRecord['status'], 'success' | 'default' | 'info'> = {
      completed: 'success',
      cancelled: 'default',
      processing: 'info',
    }
    return map[status]
  }

  return {
    pets,
    searchKeyword,
    filterSpecies,
    filterGender,
    currentPetId,
    currentPet,
    speciesOptions,
    genderOptions,
    filteredPets,
    getPetById,
    setCurrentPetId,
    setSearchKeyword,
    setFilterSpecies,
    setFilterGender,
    addPhoto,
    addHealthRecord,
    getSpeciesLabel,
    getGenderLabel,
    getHealthStatusLabel,
    getHealthStatusType,
    getHealthRecordTypeLabel,
    getServiceStatusLabel,
    getServiceStatusType,
  }
})
