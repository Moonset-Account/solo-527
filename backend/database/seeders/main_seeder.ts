import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Store from '#models/store'
import User from '#models/user'
import Ingredient from '#models/ingredient'
import LossReason from '#models/loss_reason'
import SafetyStock from '#models/safety_stock'
import Inventory from '#models/inventory'
import Sale from '#models/sale'
import SaleItem from '#models/sale_item'
import ExceptionRecord from '#models/exception_record'
import ProcessRecord from '#models/process_record'
import Rectification from '#models/rectification'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'

export default class extends BaseSeeder {
  async run() {
    const store1 = await Store.create({
      name: '茶百道-中关村店',
      code: 'CBD-ZGC-001',
      address: '北京市海淀区中关村大街1号',
      phone: '010-12345678',
      managerName: '张店长',
      dailyTarget: 8000,
      isActive: true,
    })

    const store2 = await Store.create({
      name: '茶百道-国贸店',
      code: 'CBD-GM-002',
      address: '北京市朝阳区建国门外大街1号',
      phone: '010-87654321',
      managerName: '李店长',
      dailyTarget: 10000,
      isActive: true,
    })

    const admin = await User.create({
      username: 'admin',
      email: 'admin@tea.com',
      password: await hash.make('admin123'),
      fullName: '系统管理员',
      phone: '13800000001',
      role: 'admin',
      isActive: true,
    })

    const manager1 = await User.create({
      username: 'manager1',
      email: 'manager1@tea.com',
      password: await hash.make('123456'),
      fullName: '张店长',
      phone: '13800000002',
      role: 'store_manager',
      storeId: store1.id,
      isActive: true,
    })

    const manager2 = await User.create({
      username: 'manager2',
      email: 'manager2@tea.com',
      password: await hash.make('123456'),
      fullName: '李店长',
      phone: '13800000003',
      role: 'store_manager',
      storeId: store2.id,
      isActive: true,
    })

    const ingredients = [
      { name: '绿茶', code: 'TEA-G001', category: '茶底', unit: 'g', unitPrice: 0.5, specification: '500g/包' },
      { name: '红茶', code: 'TEA-R001', category: '茶底', unit: 'g', unitPrice: 0.6, specification: '500g/包' },
      { name: '乌龙茶', code: 'TEA-O001', category: '茶底', unit: 'g', unitPrice: 0.8, specification: '500g/包' },
      { name: '茉莉绿茶', code: 'TEA-J001', category: '茶底', unit: 'g', unitPrice: 0.7, specification: '500g/包' },
      { name: '牛奶', code: 'MILK-001', category: '乳制品', unit: 'ml', unitPrice: 0.01, specification: '1L/盒' },
      { name: '淡奶油', code: 'CREAM-001', category: '乳制品', unit: 'ml', unitPrice: 0.03, specification: '500ml/盒' },
      { name: '珍珠', code: 'TOPPING-001', category: '配料', unit: 'g', unitPrice: 0.02, specification: '1kg/包' },
      { name: '椰果', code: 'TOPPING-002', category: '配料', unit: 'g', unitPrice: 0.025, specification: '1kg/罐' },
      { name: '芋圆', code: 'TOPPING-003', category: '配料', unit: 'g', unitPrice: 0.03, specification: '500g/包' },
      { name: '白砂糖', code: 'SUGAR-001', category: '糖类', unit: 'g', unitPrice: 0.008, specification: '1kg/包' },
      { name: '果糖', code: 'SUGAR-002', category: '糖类', unit: 'ml', unitPrice: 0.012, specification: '2.5kg/桶' },
      { name: '柠檬', code: 'FRUIT-001', category: '水果', unit: '个', unitPrice: 2.5, specification: '5斤/箱' },
    ]

    const createdIngredients = []
    for (const ing of ingredients) {
      createdIngredients.push(await Ingredient.create(ing))
    }

    const lossReasons = [
      { name: '食材过期', code: 'LOSS-EXP', type: 'ingredient', sortOrder: 1, description: '食材超过保质期' },
      { name: '操作损耗', code: 'LOSS-OP', type: 'ingredient', sortOrder: 2, description: '制作过程中的正常损耗' },
      { name: '设备损坏', code: 'LOSS-EQ', type: 'equipment', sortOrder: 3, description: '设备故障导致的损失' },
      { name: '顾客投诉', code: 'LOSS-CS', type: 'other', sortOrder: 4, description: '顾客投诉导致的赔偿' },
      { name: '原材料质量问题', code: 'LOSS-QUAL', type: 'ingredient', sortOrder: 5, description: '原材料质量不合格' },
      { name: '库存盘点差异', code: 'LOSS-INV', type: 'ingredient', sortOrder: 6, description: '盘点时发现的差异' },
      { name: '其他', code: 'LOSS-OTHER', type: 'other', sortOrder: 99, description: '其他原因' },
    ]

    for (const reason of lossReasons) {
      await LossReason.create(reason)
    }

    for (const ing of createdIngredients.slice(0, 8)) {
      await SafetyStock.create({
        storeId: store1.id,
        ingredientId: ing.id,
        minQuantity: 500,
        maxQuantity: 5000,
        warningQuantity: 1000,
      })

      await SafetyStock.create({
        storeId: store2.id,
        ingredientId: ing.id,
        minQuantity: 600,
        maxQuantity: 6000,
        warningQuantity: 1200,
      })

      await Inventory.create({
        storeId: store1.id,
        ingredientId: ing.id,
        quantity: 2500 + Math.random() * 2000,
        avgCost: ing.unitPrice,
        totalValue: (2500 + Math.random() * 2000) * ing.unitPrice,
        lastCountAt: DateTime.now().minus({ days: Math.floor(Math.random() * 7) }),
      })

      await Inventory.create({
        storeId: store2.id,
        ingredientId: ing.id,
        quantity: 3000 + Math.random() * 2500,
        avgCost: ing.unitPrice,
        totalValue: (3000 + Math.random() * 2500) * ing.unitPrice,
        lastCountAt: DateTime.now().minus({ days: Math.floor(Math.random() * 7) }),
      })
    }

    const today = DateTime.now()
    for (let i = 0; i < 30; i++) {
      const date = today.minus({ days: i })
      const isWeekend = date.weekday > 5

      const baseAmount = isWeekend ? 9000 : 7000
      const totalAmount = baseAmount + Math.floor(Math.random() * 2000)
      const orderCount = Math.floor(totalAmount / 18)
      const costAmount = totalAmount * 0.35
      const profitAmount = totalAmount - costAmount
      const discountAmount = Math.floor(Math.random() * 200)

      const sale = await Sale.create({
        storeId: store1.id,
        saleDate: date,
        totalAmount,
        orderCount,
        costAmount,
        profitAmount,
        discountAmount,
        createdBy: manager1.id,
        remark: i === 0 ? '今日营业' : null,
      })

      const products = ['招牌奶茶', '茉莉绿茶', '杨枝甘露', '芋泥波波', '柠檬茶']
      for (let j = 0; j < 5; j++) {
        const qty = Math.floor(orderCount / 5) + Math.floor(Math.random() * 10)
        const price = [16, 14, 22, 18, 15][j]
        await SaleItem.create({
          saleId: sale.id,
          productName: products[j],
          quantity: qty,
          unitPrice: price,
          subtotal: qty * price,
          cost: qty * price * 0.35,
        })
      }

      const sale2 = await Sale.create({
        storeId: store2.id,
        saleDate: date,
        totalAmount: totalAmount * 1.2,
        orderCount: Math.floor(orderCount * 1.15),
        costAmount: costAmount * 1.2,
        profitAmount: profitAmount * 1.2,
        discountAmount: discountAmount * 1.2,
        createdBy: manager2.id,
        remark: i === 0 ? '今日营业' : null,
      })

      for (let j = 0; j < 5; j++) {
        const qty = Math.floor(orderCount * 1.15 / 5) + Math.floor(Math.random() * 10)
        const price = [16, 14, 22, 18, 15][j]
        await SaleItem.create({
          saleId: sale2.id,
          productName: products[j],
          quantity: qty,
          unitPrice: price,
          subtotal: qty * price,
          cost: qty * price * 0.35,
        })
      }
    }

    const exceptionTypes = [
      { type: 'loss', title: '绿茶过期报损', description: '清理库存时发现100g绿茶已过期' },
      { type: 'damage', title: '制冰机故障', description: '制冰机压缩机损坏，需维修' },
      { type: 'complaint', title: '顾客投诉饮品温度', description: '顾客反映热饮温度不够' },
      { type: 'loss', title: '珍珠煮多了', description: '今日珍珠煮多了，剩余200g倒掉' },
    ]

    for (let i = 0; i < 8; i++) {
      const template = exceptionTypes[i % exceptionTypes.length]
      await ExceptionRecord.create({
        storeId: i % 2 === 0 ? store1.id : store2.id,
        type: template.type as any,
        lossReasonId: template.type === 'loss' ? 1 : null,
        title: template.title + (i > 3 ? `-${i}` : ''),
        description: template.description,
        lossAmount: template.type === 'loss' ? 20 + Math.random() * 50 : template.type === 'equipment' ? 500 : 0,
        ingredientId: template.type === 'loss' ? createdIngredients[0].id : null,
        ingredientQuantity: template.type === 'loss' ? 100 : null,
        status: i < 3 ? 'resolved' : i < 5 ? 'processing' : 'pending',
        handlingResult: i < 3 ? '已处理完成' : null,
        createdBy: i % 2 === 0 ? manager1.id : manager2.id,
        handledBy: i < 5 ? (i % 2 === 0 ? manager1.id : manager2.id) : null,
        handledAt: i < 5 ? DateTime.now().minus({ days: Math.floor(Math.random() * 3) }) : null,
      })
    }

    const inspectionTitles = [
      '日常卫生检查',
      '食材有效期检查',
      '设备安全检查',
      '服务规范检查',
    ]

    for (let i = 0; i < 10; i++) {
      const title = inspectionTitles[i % inspectionTitles.length]
      await ProcessRecord.create({
        storeId: i % 2 === 0 ? store1.id : store2.id,
        type: 'inspection',
        title: title + (i > 3 ? `-${i}` : ''),
        description: '例行巡查',
        data: {
          inspectionItems: [
            { name: '操作台卫生', result: 'pass', remark: '' },
            { name: '冰箱温度', result: 'pass', remark: '4°C' },
            { name: '员工着装', result: 'pass', remark: '' },
          ],
        },
        status: 'completed',
        createdBy: i % 2 === 0 ? manager1.id : manager2.id,
        handledBy: i % 2 === 0 ? manager1.id : manager2.id,
        handledAt: DateTime.now().minus({ days: Math.floor(Math.random() * 15) }),
      })
    }

    const cashFlowTitles = [
      { title: '营业现金缴存', flowType: 'income', category: 'sales' },
      { title: '食材采购支出', flowType: 'expense', category: 'purchase' },
      { title: '水电费', flowType: 'expense', category: 'utility' },
      { title: '员工工资', flowType: 'expense', category: 'salary' },
    ]

    for (let i = 0; i < 12; i++) {
      const tpl = cashFlowTitles[i % cashFlowTitles.length]
      await ProcessRecord.create({
        storeId: i % 2 === 0 ? store1.id : store2.id,
        type: 'cash_flow',
        title: tpl.title,
        description: tpl.flowType === 'income' ? '营业收入' : '日常支出',
        amount: tpl.flowType === 'income' ? 5000 + Math.random() * 3000 : 500 + Math.random() * 2000,
        data: {
          flowType: tpl.flowType,
          category: tpl.category,
        },
        status: 'completed',
        createdBy: i % 2 === 0 ? manager1.id : manager2.id,
        handledBy: i % 2 === 0 ? manager1.id : manager2.id,
        handledAt: DateTime.now().minus({ days: Math.floor(Math.random() * 20) }),
      })
    }

    const inventoryTitles = [
      { title: '绿茶入库', logType: 'inbound' },
      { title: '日常库存盘点', logType: 'check' },
      { title: '珍珠领用', logType: 'outbound' },
      { title: '库存调整', logType: 'adjust' },
    ]

    for (let i = 0; i < 8; i++) {
      const tpl = inventoryTitles[i % inventoryTitles.length]
      const ing = createdIngredients[i % createdIngredients.length]
      await ProcessRecord.create({
        storeId: i % 2 === 0 ? store1.id : store2.id,
        type: 'inventory_log',
        title: tpl.title,
        description: '库存变动记录',
        relatedId: ing.id,
        relatedType: 'ingredient',
        data: {
          logType: tpl.logType,
          ingredientId: ing.id,
          quantity: 500 + Math.floor(Math.random() * 500),
          items: [
            {
              ingredientId: ing.id,
              ingredientName: ing.name,
              quantity: 500 + Math.floor(Math.random() * 500),
              unit: ing.unit,
              remark: '',
            },
          ],
        },
        status: 'completed',
        createdBy: i % 2 === 0 ? manager1.id : manager2.id,
        handledBy: i % 2 === 0 ? manager1.id : manager2.id,
        handledAt: DateTime.now().minus({ days: Math.floor(Math.random() * 10) }),
      })
    }

    const rectificationTitles = [
      { title: '卫生死角需清洁', level: 'medium', desc: '冰柜下方有积尘，需清理' },
      { title: '食材标签不规范', level: 'low', desc: '部分食材开封后标签日期不清晰' },
      { title: '收银台钱款核对流程缺失', level: 'high', desc: '每日营业结束未做钱款核对记录' },
      { title: '员工健康证过期提醒', level: 'critical', desc: '有员工健康证将在一周后过期' },
    ]

    for (let i = 0; i < 8; i++) {
      const tpl = rectificationTitles[i % rectificationTitles.length]
      const statuses: any = ['pending', 'in_progress', 'resolved', 'closed', 'overdue']
      const status = statuses[i % statuses.length]

      const rect = await Rectification.create({
        storeId: i % 2 === 0 ? store1.id : store2.id,
        title: tpl.title + (i > 3 ? `-${i}` : ''),
        description: tpl.desc,
        level: tpl.level as any,
        status: status,
        deadline: DateTime.now().plus({ days: 3 + Math.floor(Math.random() * 10) }),
        remark: status === 'overdue' ? '已逾期，需尽快处理' : null,
        handlingResult: status === 'closed' || status === 'resolved' ? '已完成整改' : null,
        createdBy: admin.id,
        assignedTo: i % 2 === 0 ? manager1.id : manager2.id,
        closedBy: status === 'closed' ? admin.id : null,
        closedAt: status === 'closed' ? DateTime.now().minus({ days: Math.floor(Math.random() * 3) }) : null,
        isClosedLoop: status === 'closed',
      })
    }
  }
}
