import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import User from 'App/Models/User'
import Service from 'App/Models/Service'
import Staff from 'App/Models/Staff'
import Customer from 'App/Models/Customer'

export default class extends BaseSeeder {
  public async run() {
    await User.createMany([
      {
        username: 'admin',
        password: 'admin123',
        realName: '系统管理员',
        role: 'admin',
        isActive: true,
      },
      {
        username: 'frontdesk',
        password: 'frontdesk123',
        realName: '前台小王',
        role: 'staff',
        isActive: true,
      },
    ])

    await Service.createMany([
      {
        name: '超声波洁牙（基础）',
        code: 'SCALING_01',
        description: '基础超声波洁牙服务，含口腔检查',
        durationMinutes: 30,
        price: 280.00,
        capacity: 1,
        isActive: true,
      },
      {
        name: '深度洁牙套餐',
        code: 'SCALING_02',
        description: '深度清洁、喷砂抛光、牙周护理',
        durationMinutes: 60,
        price: 680.00,
        capacity: 1,
        isActive: true,
      },
      {
        name: '儿童洁牙',
        code: 'SCALING_03',
        description: '专为儿童设计的温和洁牙',
        durationMinutes: 30,
        price: 220.00,
        capacity: 1,
        isActive: true,
      },
      {
        name: '牙周治疗',
        code: 'PERIO_01',
        description: '牙周炎深度治疗',
        durationMinutes: 90,
        price: 1280.00,
        capacity: 1,
        isActive: true,
      },
    ])

    await Staff.createMany([
      {
        name: '李医生',
        title: '主任医师',
        type: 'doctor',
        phone: '13800138001',
        specialties: '口腔种植、牙周病',
        isActive: true,
      },
      {
        name: '王医生',
        title: '副主任医师',
        type: 'doctor',
        phone: '13800138002',
        specialties: '正畸、儿童牙科',
        isActive: true,
      },
      {
        name: '张医生',
        title: '主治医师',
        type: 'doctor',
        phone: '13800138003',
        specialties: '修复、美白',
        isActive: true,
      },
      {
        name: '陈技师',
        title: '高级洁牙师',
        type: 'technician',
        phone: '13800138004',
        specialties: '洁牙、牙周护理',
        isActive: true,
      },
      {
        name: '刘技师',
        title: '洁牙师',
        type: 'technician',
        phone: '13800138005',
        specialties: '儿童洁牙、预防保健',
        isActive: true,
      },
    ])

    await Customer.createMany([
      {
        name: '张伟',
        phone: '13900139001',
        gender: '男',
        age: 35,
        medicalHistory: '高血压，服用降压药',
        noShowCount: 1,
        totalBookings: 8,
        noShowRate: 0.125,
      },
      {
        name: '李娜',
        phone: '13900139002',
        gender: '女',
        age: 28,
        medicalHistory: '无',
        noShowCount: 3,
        totalBookings: 10,
        noShowRate: 0.3,
      },
      {
        name: '王芳',
        phone: '13900139003',
        gender: '女',
        age: 45,
        medicalHistory: '糖尿病',
        noShowCount: 0,
        totalBookings: 5,
        noShowRate: 0,
      },
      {
        name: '刘强',
        phone: '13900139004',
        gender: '男',
        age: 52,
        medicalHistory: '心脏病',
        noShowCount: 2,
        totalBookings: 6,
        noShowRate: 0.333,
      },
      {
        name: '陈小美',
        phone: '13900139005',
        gender: '女',
        age: 22,
        medicalHistory: '无',
        noShowCount: 0,
        totalBookings: 3,
        noShowRate: 0,
      },
    ])
  }
}
