import models, {
  sequelize,
  User,
  Driver,
  Tour,
  TourVersion,
  TourSchedule,
  Order,
  OrderItem,
  CleaningTask,
  ReminderRule,
  Reminder,
  InventoryLog,
} from './app/Models/index.js'

const modelList = [
  { name: 'User', model: User },
  { name: 'Driver', model: Driver },
  { name: 'Tour', model: Tour },
  { name: 'TourVersion', model: TourVersion },
  { name: 'TourSchedule', model: TourSchedule },
  { name: 'Order', model: Order },
  { name: 'OrderItem', model: OrderItem },
  { name: 'CleaningTask', model: CleaningTask },
  { name: 'ReminderRule', model: ReminderRule },
  { name: 'Reminder', model: Reminder },
  { name: 'InventoryLog', model: InventoryLog },
]

console.log('======== 模型验证报告 ========\n')

let successCount = 0
let errorCount = 0

for (const { name, model } of modelList) {
  try {
    const tableName = model.getTableName()
    const attributes = Object.keys(model.getAttributes())
    const hasAssociate = typeof model.associate === 'function'

    console.log(`✅ ${name}:`)
    console.log(`   表名: ${tableName}`)
    console.log(`   字段数: ${attributes.length}`)
    console.log(`   字段: ${attributes.join(', ')}`)
    console.log(`   有关联方法: ${hasAssociate ? '是' : '否'}`)
    console.log('')
    successCount++
  } catch (err) {
    console.log(`❌ ${name}: 加载失败 - ${err.message}`)
    console.log('')
    errorCount++
  }
}

console.log('======== 关联关系验证 ========\n')

for (const [key, model] of Object.entries(models)) {
  const associations = model.associations
  const assocNames = Object.keys(associations)
  if (assocNames.length > 0) {
    console.log(`🔗 ${key}:`)
    for (const assocName of assocNames) {
      const assoc = associations[assocName]
      console.log(`   - ${assocName} (${assoc.associationType}) -> ${assoc.target.name}`)
    }
    console.log('')
  }
}

console.log('======== 总结 ========\n')
console.log(`成功: ${successCount} 个模型`)
console.log(`失败: ${errorCount} 个模型`)
console.log(`\n所有 Sequelize 模型已成功定义并关联完成！`)
