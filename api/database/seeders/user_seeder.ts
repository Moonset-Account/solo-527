import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

export default class UserSeeder extends BaseSeeder {
  public async run() {
    await User.createMany([
      {
        email: 'admin@nailsalon.com',
        password: 'admin123',
        fullName: '系统管理员',
        role: 'admin',
        phone: '13800000001',
        isActive: true,
      },
      {
        email: 'consultant1@nailsalon.com',
        password: 'consultant123',
        fullName: '张美甲师',
        role: 'consultant',
        phone: '13800000002',
        isActive: true,
      },
      {
        email: 'consultant2@nailsalon.com',
        password: 'consultant123',
        fullName: '李美甲师',
        role: 'consultant',
        phone: '13800000003',
        isActive: true,
      },
      {
        email: 'staff1@nailsalon.com',
        password: 'staff123',
        fullName: '王仓管',
        role: 'staff',
        phone: '13800000004',
        isActive: true,
      },
    ])
  }
}
