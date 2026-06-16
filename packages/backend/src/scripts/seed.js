require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');

const User = require('../models/User');
const Pet = require('../models/Pet');
const AdoptionApplication = require('../models/AdoptionApplication');
const TrainingRecord = require('../models/TrainingRecord');
const VisitRecord = require('../models/VisitRecord');
const SafetyReminder = require('../models/SafetyReminder');
const FlowRecord = require('../models/FlowRecord');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Pet.deleteMany({});
    await AdoptionApplication.deleteMany({});
    await TrainingRecord.deleteMany({});
    await VisitRecord.deleteMany({});
    await SafetyReminder.deleteMany({});
    await FlowRecord.deleteMany({});

    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('123456', 10);

    const admin = await User.create({
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      role: 'admin',
      phone: '13800000000',
      email: 'admin@example.com'
    });

    const trainers = await User.create([
      {
        username: 'trainer1',
        password: hashedPassword,
        name: '李训练',
        role: 'trainer',
        phone: '13800000001',
        email: 'trainer1@example.com'
      },
      {
        username: 'trainer2',
        password: hashedPassword,
        name: '王教练',
        role: 'trainer',
        phone: '13800000002',
        email: 'trainer2@example.com'
      }
    ]);

    const reviewer = await User.create({
      username: 'reviewer',
      password: hashedPassword,
      name: '张审核',
      role: 'reviewer',
      phone: '13800000003',
      email: 'reviewer@example.com'
    });

    console.log('Creating pets...');
    const pets = await Pet.create([
      {
        petNo: 'PET202401001',
        name: '大黄',
        species: 'dog',
        breed: '金毛寻回犬',
        gender: 'male',
        birthday: new Date('2022-03-15'),
        weight: 28.5,
        color: '金色',
        chipNo: '900123456789001',
        vaccineStatus: {
          rabies: true,
          distemper: true,
          parvovirus: true
        },
        sterilized: true,
        healthStatus: 'healthy',
        temperament: '温顺、亲人、活泼',
        dietaryNotes: '每日两餐，每餐200g狗粮，禁鸡骨头',
        medicalNotes: '无重大疾病史，定期驱虫',
        trainerId: trainers[0]._id,
        status: 'fostering',
        fosterStartTime: new Date('2024-01-10'),
        createdBy: admin._id,
        updatedBy: admin._id
      },
      {
        petNo: 'PET202401002',
        name: '小黑',
        species: 'dog',
        breed: '拉布拉多',
        gender: 'female',
        birthday: new Date('2023-06-20'),
        weight: 25.0,
        color: '黑色',
        chipNo: '900123456789002',
        vaccineStatus: {
          rabies: true,
          distemper: true,
          parvovirus: true
        },
        sterilized: false,
        healthStatus: 'healthy',
        temperament: '聪明、活泼、好动',
        dietaryNotes: '每日两餐，食量较大，注意控制体重',
        medicalNotes: '皮肤敏感，潮湿天气易发痒',
        trainerId: trainers[0]._id,
        status: 'fostering',
        fosterStartTime: new Date('2024-02-01'),
        createdBy: admin._id,
        updatedBy: admin._id
      },
      {
        petNo: 'PET202401003',
        name: '花花',
        species: 'cat',
        breed: '英国短毛猫',
        gender: 'female',
        birthday: new Date('2023-09-10'),
        weight: 4.2,
        color: '三花',
        chipNo: '900123456789003',
        vaccineStatus: {
          rabies: true,
          catPlague: true
        },
        sterilized: true,
        healthStatus: 'healthy',
        temperament: '高冷、独立、安静',
        dietaryNotes: '猫粮为主，偶尔零食，需充足饮水',
        medicalNotes: '泌尿系统健康，定期体检',
        trainerId: trainers[1]._id,
        status: 'pending',
        createdBy: admin._id,
        updatedBy: admin._id
      },
      {
        petNo: 'PET202401004',
        name: '豆豆',
        species: 'cat',
        breed: '橘猫',
        gender: 'male',
        birthday: new Date('2022-12-01'),
        weight: 5.8,
        color: '橘色',
        chipNo: '900123456789004',
        vaccineStatus: {
          rabies: true,
          catPlague: true
        },
        sterilized: true,
        healthStatus: 'recovering',
        temperament: '黏人、贪吃、爱玩',
        dietaryNotes: '控制饮食，体重超标，减肥粮',
        medicalNotes: '轻度肥胖，正在减肥中',
        trainerId: trainers[1]._id,
        status: 'fostering',
        fosterStartTime: new Date('2024-03-05'),
        createdBy: admin._id,
        updatedBy: admin._id
      },
      {
        petNo: 'PET202401005',
        name: '小白',
        species: 'dog',
        breed: '比熊',
        gender: 'male',
        birthday: new Date('2024-01-01'),
        weight: 3.5,
        color: '白色',
        chipNo: '',
        vaccineStatus: {
          rabies: false,
          distemper: false,
          parvovirus: false
        },
        sterilized: false,
        healthStatus: 'healthy',
        temperament: '活泼、好动、黏人',
        dietaryNotes: '幼犬粮，每日三餐，少量多次',
        medicalNotes: '幼犬，需完成疫苗接种',
        trainerId: trainers[0]._id,
        status: 'pending',
        createdBy: admin._id,
        updatedBy: admin._id
      }
    ]);

    console.log('Creating adoption applications...');
    const applications = await AdoptionApplication.create([
      {
        applicationNo: 'ADP202401001',
        petId: pets[0]._id,
        petNo: pets[0].petNo,
        petName: pets[0].name,
        applicantName: '陈小明',
        applicantPhone: '13912345678',
        applicantIdCard: '110101199001011234',
        applicantEmail: 'chenxm@example.com',
        applicantAddress: '北京市朝阳区望京街道某小区1号楼101室',
        housingType: 'apartment',
        hasPetExperience: true,
        currentPets: '之前养过一只金毛，已经10岁去世了',
        familyMembers: 3,
        hasChildren: true,
        workSchedule: '朝九晚五，周末双休',
        monthlyBudget: 1000,
        adoptionReason: '孩子喜欢狗狗，家里有足够空间',
        emergencyContact: {
          name: '陈先生',
          phone: '13888888888',
          relationship: '父亲'
        },
        veterinaryInfo: '望京宠物医院',
        missingFields: [],
        trainerId: trainers[0]._id,
        trainerName: trainers[0].name,
        status: 'approved',
        reviewComments: '申请人条件良好，有养宠经验，家庭环境适合养狗',
        submittedAt: new Date('2024-02-10'),
        reviewedAt: new Date('2024-02-15'),
        reviewerId: reviewer._id,
        reviewerName: reviewer.name,
        createdBy: trainers[0]._id,
        updatedBy: reviewer._id
      },
      {
        applicationNo: 'ADP202401002',
        petId: pets[1]._id,
        petNo: pets[1].petNo,
        petName: pets[1].name,
        applicantName: '刘小红',
        applicantPhone: '13698765432',
        applicantIdCard: '',
        applicantEmail: '',
        applicantAddress: '北京市海淀区中关村大街',
        housingType: 'apartment',
        hasPetExperience: false,
        currentPets: '',
        familyMembers: 2,
        hasChildren: false,
        workSchedule: '',
        monthlyBudget: 800,
        adoptionReason: '喜欢狗狗，想有个伴',
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        veterinaryInfo: '',
        missingFields: ['applicantIdCard', 'applicantEmail', 'workSchedule', 'emergencyContact.name', 'emergencyContact.phone'],
        trainerId: trainers[0]._id,
        trainerName: trainers[0].name,
        status: 'draft',
        createdBy: trainers[0]._id,
        updatedBy: trainers[0]._id
      },
      {
        applicationNo: 'ADP202401003',
        petId: pets[2]._id,
        petNo: pets[2].petNo,
        petName: pets[2].name,
        applicantName: '张小华',
        applicantPhone: '13511112222',
        applicantIdCard: '310101199505054321',
        applicantEmail: 'zhanghua@example.com',
        applicantAddress: '上海市浦东新区陆家嘴环路',
        housingType: 'apartment',
        hasPetExperience: true,
        currentPets: '现在有一只英短，想再养一只作伴',
        familyMembers: 2,
        hasChildren: false,
        workSchedule: '自由职业，在家时间多',
        monthlyBudget: 500,
        adoptionReason: '喜欢猫咪，有养猫经验',
        emergencyContact: {
          name: '张女士',
          phone: '13666666666',
          relationship: '姐姐'
        },
        veterinaryInfo: '浦东宠物诊所',
        missingFields: [],
        trainerId: trainers[1]._id,
        trainerName: trainers[1].name,
        status: 'under_review',
        submittedAt: new Date('2024-03-01'),
        createdBy: trainers[1]._id,
        updatedBy: reviewer._id
      },
      {
        applicationNo: 'ADP202401004',
        petId: pets[3]._id,
        petNo: pets[3].petNo,
        petName: pets[3].name,
        applicantName: '王大山',
        applicantPhone: '13733334444',
        applicantIdCard: '440101198808085678',
        applicantEmail: 'wangds@example.com',
        applicantAddress: '广州市天河区体育西路',
        housingType: 'house',
        hasPetExperience: true,
        currentPets: '两只土猫',
        familyMembers: 4,
        hasChildren: true,
        workSchedule: '企业高管，家中有保姆',
        monthlyBudget: 2000,
        adoptionReason: '孩子喜欢橘猫，家里条件好',
        emergencyContact: {
          name: '王夫人',
          phone: '13777777777',
          relationship: '配偶'
        },
        veterinaryInfo: '天河宠物医院',
        missingFields: [],
        trainerId: trainers[1]._id,
        trainerName: trainers[1].name,
        status: 'submitted',
        submittedAt: new Date('2024-03-10'),
        createdBy: trainers[1]._id,
        updatedBy: trainers[1]._id
      },
      {
        applicationNo: 'ADP202401005',
        petId: pets[0]._id,
        petNo: pets[0].petNo,
        petName: pets[0].name,
        applicantName: '李大爷',
        applicantPhone: '13855556666',
        applicantIdCard: '',
        applicantEmail: '',
        applicantAddress: '成都市锦江区春熙路',
        housingType: 'apartment',
        hasPetExperience: false,
        currentPets: '',
        familyMembers: 1,
        hasChildren: false,
        workSchedule: '退休',
        monthlyBudget: 600,
        adoptionReason: '退休在家孤单，想养只狗作伴',
        emergencyContact: {
          name: '李阿姨',
          phone: '13899999999',
          relationship: '老伴'
        },
        veterinaryInfo: '',
        missingFields: ['applicantIdCard', 'applicantEmail', 'veterinaryInfo'],
        trainerId: trainers[0]._id,
        trainerName: trainers[0].name,
        status: 'rejected',
        reviewComments: '年龄较大，建议考虑小型犬',
        rejectionReason: '申请人年龄偏大，金毛体型较大，日常遛狗可能有困难。建议考虑体型较小的犬种。',
        submittedAt: new Date('2024-01-20'),
        reviewedAt: new Date('2024-01-25'),
        reviewerId: reviewer._id,
        reviewerName: reviewer.name,
        createdBy: trainers[0]._id,
        updatedBy: reviewer._id
      }
    ]);

    console.log('Creating training records...');
    const trainingRecords = await TrainingRecord.create([
      {
        recordNo: 'TRN202401001',
        petId: pets[0]._id,
        petNo: pets[0].petNo,
        petName: pets[0].name,
        trainerId: trainers[0]._id,
        trainerName: trainers[0].name,
        trainingDate: new Date('2024-01-15'),
        trainingType: 'basic_commands',
        trainingContent: '坐下、握手、趴下、等待基础指令训练',
        duration: 60,
        performance: 'excellent',
        notes: '学习能力强，注意力集中',
        beforeBehavior: '对指令反应一般，有时不听指挥',
        afterBehavior: '能快速响应基础指令，服从性明显提升',
        nextPlan: '进阶训练：衔取、召回',
        createdBy: trainers[0]._id,
        updatedBy: trainers[0]._id
      },
      {
        recordNo: 'TRN202401002',
        petId: pets[0]._id,
        petNo: pets[0].petNo,
        petName: pets[0].name,
        trainerId: trainers[0]._id,
        trainerName: trainers[0].name,
        trainingDate: new Date('2024-01-22'),
        trainingType: 'socialization',
        trainingContent: '社会化训练，接触陌生人和其他狗狗',
        duration: 90,
        performance: 'good',
        notes: '对陌生人友好，与其他狗狗相处融洽',
        beforeBehavior: '对陌生狗狗有时会吠叫',
        afterBehavior: '能友好地与其他狗狗互动',
        nextPlan: '继续社会化，增加复杂环境适应',
        createdBy: trainers[0]._id,
        updatedBy: trainers[0]._id
      },
      {
        recordNo: 'TRN202401003',
        petId: pets[1]._id,
        petNo: pets[1].petNo,
        petName: pets[1].name,
        trainerId: trainers[0]._id,
        trainerName: trainers[0].name,
        trainingDate: new Date('2024-02-05'),
        trainingType: 'obedience',
        trainingContent: '服从性训练，随行、停止、召回',
        duration: 75,
        performance: 'good',
        notes: '精力充沛，需要更多运动',
        beforeBehavior: '外出时容易兴奋，拉拽牵引绳',
        afterBehavior: '随行表现改善，能保持在主人身边',
        nextPlan: '加强召回训练，增加干扰环境练习',
        createdBy: trainers[0]._id,
        updatedBy: trainers[0]._id
      },
      {
        recordNo: 'TRN202401004',
        petId: pets[2]._id,
        petNo: pets[2].petNo,
        petName: pets[2].name,
        trainerId: trainers[1]._id,
        trainerName: trainers[1].name,
        trainingDate: new Date('2024-01-20'),
        trainingType: 'behavior_correction',
        trainingContent: '行为纠正，改善对陌生人的攻击性',
        duration: 45,
        performance: 'average',
        notes: '需要更多时间和耐心',
        beforeBehavior: '对陌生人哈气、炸毛',
        afterBehavior: '在有食物诱导下能接受陌生人靠近',
        nextPlan: '继续脱敏训练，逐步增加接触时间',
        createdBy: trainers[1]._id,
        updatedBy: trainers[1]._id
      },
      {
        recordNo: 'TRN202401005',
        petId: pets[3]._id,
        petNo: pets[3].petNo,
        petName: pets[3].name,
        trainerId: trainers[1]._id,
        trainerName: trainers[1].name,
        trainingDate: new Date('2024-03-08'),
        trainingType: 'other',
        trainingContent: '减肥计划：运动训练加饮食控制',
        duration: 30,
        performance: 'good',
        notes: '配合度不错，需要坚持',
        beforeBehavior: '不爱动，容易累',
        afterBehavior: '能完成基本的逗猫棒互动15分钟',
        nextPlan: '逐渐增加运动时间，配合减肥粮',
        createdBy: trainers[1]._id,
        updatedBy: trainers[1]._id
      }
    ]);

    console.log('Creating visit records...');
    const visitRecords = await VisitRecord.create([
      {
        recordNo: 'VST202401001',
        applicationId: applications[0]._id,
        applicationNo: applications[0].applicationNo,
        petId: pets[0]._id,
        petName: pets[0].name,
        applicantName: applications[0].applicantName,
        visitType: 'first_week',
        visitDate: new Date('2024-02-25'),
        visitMethod: 'home_visit',
        visitorId: trainers[0]._id,
        visitorName: trainers[0].name,
        petCondition: {
          health: 'excellent',
          mood: 'excellent',
          weight: 29.0,
          diet: '饮食规律，食欲好',
          exercise: '每天遛狗两次，每次约1小时'
        },
        livingEnvironment: '小区环境好，有电梯，家里空间充足',
        problems: '无明显问题',
        suggestions: '继续保持，定期体检',
        overallStatus: 'excellent',
        followUpRequired: false,
        createdBy: trainers[0]._id
      },
      {
        recordNo: 'VST202401002',
        applicationId: applications[0]._id,
        applicationNo: applications[0].applicationNo,
        petId: pets[0]._id,
        petName: pets[0].name,
        applicantName: applications[0].applicantName,
        visitType: 'first_month',
        visitDate: new Date('2024-03-20'),
        visitMethod: 'video_call',
        visitorId: trainers[0]._id,
        visitorName: trainers[0].name,
        petCondition: {
          health: 'good',
          mood: 'good',
          weight: 29.5,
          diet: '正常',
          exercise: '每天户外活动2小时左右'
        },
        livingEnvironment: '适应良好',
        problems: '偶尔会翻垃圾桶',
        suggestions: '建议加强行为训练，垃圾桶加盖',
        overallStatus: 'good',
        followUpRequired: true,
        followUpDate: new Date('2024-04-20'),
        createdBy: trainers[0]._id
      },
      {
        recordNo: 'VST202401003',
        applicationId: applications[2]._id,
        applicationNo: applications[2].applicationNo,
        petId: pets[2]._id,
        petName: pets[2].name,
        applicantName: applications[2].applicantName,
        visitType: 'first_week',
        visitDate: new Date('2024-03-15'),
        visitMethod: 'home_visit',
        visitorId: trainers[1]._id,
        visitorName: trainers[1].name,
        petCondition: {
          health: 'good',
          mood: 'average',
          weight: 4.0,
          diet: '正常进食',
          exercise: '比较安静，大部分时间在睡觉'
        },
        livingEnvironment: '环境整洁，有猫爬架和猫砂盆',
        problems: '新环境适应中，有点胆小',
        suggestions: '给猫咪一些时间适应，不要强行互动',
        overallStatus: 'good',
        followUpRequired: true,
        followUpDate: new Date('2024-03-25'),
        createdBy: trainers[1]._id
      }
    ]);

    console.log('Creating safety reminders...');
    await SafetyReminder.create([
      {
        title: '夏季宠物防暑小贴士',
        content: '夏季气温高，宠物容易中暑。请确保宠物有充足的饮水，避免在中午高温时段外出遛狗。切勿将宠物单独留在车内，即使短时间也可能造成严重后果。如出现呼吸急促、口吐白沫等症状，请立即就医。',
        category: 'health',
        level: 'warning',
        targetAudience: 'all',
        isActive: true,
        isPinned: true,
        sortOrder: 1
      },
      {
        title: '新领养宠物适应指南',
        content: '新领养的宠物需要时间适应新环境。建议准备好舒适的窝、食盆、水盆和玩具。开始几天给宠物足够的空间，不要强行抱撸。保持饮食规律，逐渐建立信任关系。如有任何健康问题，请及时联系兽医。',
        category: 'safety',
        level: 'info',
        targetAudience: 'adopter',
        isActive: true,
        isPinned: true,
        sortOrder: 2
      },
      {
        title: '这些食物宠物不能吃',
        content: '巧克力、葡萄、葡萄干、洋葱、大蒜、牛油果、酒精、咖啡因等食物对宠物有毒性，可能导致严重健康问题甚至危及生命。请将这些食物放在宠物够不到的地方。如不慎误食，请立即就医。',
        category: 'feeding',
        level: 'danger',
        targetAudience: 'all',
        isActive: true,
        isPinned: false,
        sortOrder: 3
      },
      {
        title: '定期疫苗和驱虫的重要性',
        content: '定期接种疫苗和驱虫是保障宠物健康的基础。犬只需接种狂犬疫苗、犬瘟热、细小病毒等疫苗。猫咪需接种狂犬疫苗、猫瘟等疫苗。体内外驱虫建议每月一次。请建立完整的健康档案，按时接种。',
        category: 'health',
        level: 'warning',
        targetAudience: 'all',
        isActive: true,
        isPinned: false,
        sortOrder: 4
      },
      {
        title: '领养后回访须知',
        content: '领养成功后，我们会进行定期回访，包括首周回访、首月回访和季度回访。回访方式包括上门家访、视频通话和电话回访。请配合回访工作，如实反馈宠物状况。如有任何问题，可随时联系对接的训练师。',
        category: 'other',
        level: 'info',
        targetAudience: 'adopter',
        isActive: true,
        isPinned: false,
        sortOrder: 5
      }
    ]);

    console.log('Creating flow records...');
    await FlowRecord.create([
      {
        recordType: 'pet_profile',
        relatedId: pets[0]._id,
        relatedNo: pets[0].petNo,
        action: 'create',
        actionLabel: '创建档案',
        afterData: { name: '大黄', species: 'dog', breed: '金毛寻回犬', status: 'pending' },
        changedFields: [],
        description: '创建宠物档案：大黄',
        operatorId: admin._id,
        operatorName: admin.name,
        operatorRole: 'admin'
      },
      {
        recordType: 'pet_profile',
        relatedId: pets[0]._id,
        relatedNo: pets[0].petNo,
        action: 'status_change',
        actionLabel: '状态变更',
        beforeData: { status: 'pending' },
        afterData: { status: 'fostering' },
        changedFields: ['status'],
        description: '宠物状态从 pending 变更为 fostering',
        operatorId: trainers[0]._id,
        operatorName: trainers[0].name,
        operatorRole: 'trainer'
      },
      {
        recordType: 'adoption_application',
        relatedId: applications[0]._id,
        relatedNo: applications[0].applicationNo,
        action: 'create',
        actionLabel: '创建申请',
        description: '创建领养申请：陈小明 - 大黄',
        operatorId: trainers[0]._id,
        operatorName: trainers[0].name,
        operatorRole: 'trainer'
      },
      {
        recordType: 'adoption_application',
        relatedId: applications[0]._id,
        relatedNo: applications[0].applicationNo,
        action: 'submit',
        actionLabel: '提交审核',
        description: '提交领养申请，等待审核',
        operatorId: trainers[0]._id,
        operatorName: trainers[0].name,
        operatorRole: 'trainer'
      },
      {
        recordType: 'adoption_application',
        relatedId: applications[0]._id,
        relatedNo: applications[0].applicationNo,
        action: 'review',
        actionLabel: '审核',
        description: '审核结果：审核通过',
        operatorId: reviewer._id,
        operatorName: reviewer.name,
        operatorRole: 'reviewer'
      },
      {
        recordType: 'training_record',
        relatedId: trainingRecords[0]._id,
        relatedNo: trainingRecords[0].recordNo,
        action: 'create',
        actionLabel: '创建记录',
        description: '创建训练记录：大黄 - 基础指令',
        operatorId: trainers[0]._id,
        operatorName: trainers[0].name,
        operatorRole: 'trainer'
      },
      {
        recordType: 'visit_record',
        relatedId: visitRecords[0]._id,
        relatedNo: visitRecords[0].recordNo,
        action: 'create',
        actionLabel: '创建回访',
        description: '创建回访记录：陈小明 - 首周回访',
        operatorId: trainers[0]._id,
        operatorName: trainers[0].name,
        operatorRole: 'trainer'
      }
    ]);

    console.log('Seed data created successfully!');
    console.log('========================================');
    console.log('Admin account: admin / 123456');
    console.log('Trainer1 account: trainer1 / 123456');
    console.log('Trainer2 account: trainer2 / 123456');
    console.log('Reviewer account: reviewer / 123456');
    console.log('========================================');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
