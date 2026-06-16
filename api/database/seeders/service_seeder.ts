import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Service from '#models/service'
import ServiceConsumable from '#models/service_consumable'

export default class ServiceSeeder extends BaseSeeder {
  public async run() {
    const manicure = await Service.create({
      name: '经典美甲',
      category: '美甲',
      price: 128,
      durationMinutes: 60,
      description: '经典单色美甲服务',
      isActive: true,
    })

    const gelNail = await Service.create({
      name: '光疗美甲',
      category: '美甲',
      price: 268,
      durationMinutes: 90,
      description: '光疗延长美甲服务',
      isActive: true,
    })

    const nailArt = await Service.create({
      name: '手绘美甲',
      category: '美甲',
      price: 358,
      durationMinutes: 120,
      description: '手工绘制图案美甲',
      isActive: true,
    })

    const pedicure = await Service.create({
      name: '足部护理',
      category: '足护',
      price: 198,
      durationMinutes: 60,
      description: '足部修护与美甲',
      isActive: true,
    })

    const removal = await Service.create({
      name: '卸甲服务',
      category: '卸甲',
      price: 58,
      durationMinutes: 30,
      description: '专业卸甲服务',
      isActive: true,
    })

    await ServiceConsumable.createMany([
      { serviceId: manicure.id, productId: 1, quantity: 1, unit: '瓶' },
      { serviceId: manicure.id, productId: 5, quantity: 1, unit: '瓶' },
      { serviceId: manicure.id, productId: 6, quantity: 1, unit: '瓶' },
      { serviceId: gelNail.id, productId: 2, quantity: 1, unit: '瓶' },
      { serviceId: gelNail.id, productId: 3, quantity: 1, unit: '盒' },
      { serviceId: gelNail.id, productId: 5, quantity: 1, unit: '瓶' },
      { serviceId: gelNail.id, productId: 6, quantity: 1, unit: '瓶' },
      { serviceId: nailArt.id, productId: 1, quantity: 2, unit: '瓶' },
      { serviceId: nailArt.id, productId: 5, quantity: 1, unit: '瓶' },
      { serviceId: nailArt.id, productId: 6, quantity: 1, unit: '瓶' },
      { serviceId: pedicure.id, productId: 1, quantity: 1, unit: '瓶' },
      { serviceId: pedicure.id, productId: 5, quantity: 1, unit: '瓶' },
      { serviceId: pedicure.id, productId: 6, quantity: 1, unit: '瓶' },
      { serviceId: removal.id, productId: 4, quantity: 1, unit: '瓶' },
    ])
  }
}
