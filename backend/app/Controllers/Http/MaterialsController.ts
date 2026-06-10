import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Material from 'App/Models/Material'
import WorkOrderMaterial from 'App/Models/WorkOrderMaterial'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class MaterialsController {
  public async index({ request, response }: HttpContextContract) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const keyword = request.input('keyword', '')
    const lowStock = request.input('lowStock', false)

    const query = Material.query()
      .if(keyword, (q) => {
        q.where((subQ) => {
          subQ.where('material_code', 'like', `%${keyword}%`)
            .orWhere('material_name', 'like', `%${keyword}%`)
            .orWhere('specification', 'like', `%${keyword}%`)
        })
      })
      .if(lowStock, (q) => {
        q.whereRaw('stock_quantity <= safety_stock')
      })
      .orderBy('id', 'desc')

    const materials = await query.paginate(page, perPage)

    return response.ok({
      data: materials.serialize(),
    })
  }

  public async show({ params, response }: HttpContextContract) {
    try {
      const material = await Material.findOrFail(params.id)
      return response.ok({
        data: material.serialize(),
      })
    } catch (error) {
      return response.notFound({ message: '物料不存在' })
    }
  }

  public async store({ request, response }: HttpContextContract) {
    const materialSchema = schema.create({
      materialCode: schema.string({}, [
        rules.unique({ table: 'materials', column: 'material_code' }),
        rules.maxLength(50),
      ]),
      materialName: schema.string({}, [
        rules.maxLength(200),
      ]),
      specification: schema.string.optional({}, [
        rules.maxLength(200),
      ]),
      unit: schema.string.optional({}, [
        rules.maxLength(20),
      ]),
      stockQuantity: schema.number([
        rules.unsigned(),
      ]),
      safetyStock: schema.number.optional([
        rules.unsigned(),
      ]),
      supplier: schema.string.optional({}, [
        rules.maxLength(200),
      ]),
      unitPrice: schema.number.optional([
        rules.unsigned(),
      ]),
      remarks: schema.string.optional(),
    })

    const data = await request.validate({ schema: materialSchema })

    const material = new Material()
    material.materialCode = data.materialCode
    material.materialName = data.materialName
    material.specification = data.specification || null
    material.unit = data.unit || null
    material.stockQuantity = data.stockQuantity
    material.safetyStock = data.safetyStock || 0
    material.supplier = data.supplier || null
    material.unitPrice = data.unitPrice || null
    material.remarks = data.remarks || null

    await material.save()

    return response.created({
      message: '物料创建成功',
      data: material.serialize(),
    })
  }

  public async update({ params, request, response }: HttpContextContract) {
    try {
      const material = await Material.findOrFail(params.id)

      const materialSchema = schema.create({
        materialCode: schema.string({}, [
          rules.unique({ table: 'materials', column: 'material_code', whereNot: { id: params.id } }),
          rules.maxLength(50),
        ]),
        materialName: schema.string({}, [
          rules.maxLength(200),
        ]),
        specification: schema.string.optional({}, [
          rules.maxLength(200),
        ]),
        unit: schema.string.optional({}, [
          rules.maxLength(20),
        ]),
        stockQuantity: schema.number([
          rules.unsigned(),
        ]),
        safetyStock: schema.number.optional([
          rules.unsigned(),
        ]),
        supplier: schema.string.optional({}, [
          rules.maxLength(200),
        ]),
        unitPrice: schema.number.optional([
          rules.unsigned(),
        ]),
        remarks: schema.string.optional(),
      })

      const data = await request.validate({ schema: materialSchema })

      material.materialCode = data.materialCode
      material.materialName = data.materialName
      material.specification = data.specification || null
      material.unit = data.unit || null
      material.stockQuantity = data.stockQuantity
      material.safetyStock = data.safetyStock || 0
      material.supplier = data.supplier || null
      material.unitPrice = data.unitPrice || null
      material.remarks = data.remarks || null

      await material.save()

      return response.ok({
        message: '物料更新成功',
        data: material.serialize(),
      })
    } catch (error) {
      const err = error as any
      if (err.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: '物料不存在' })
      }
      throw error
    }
  }

  public async destroy({ params, response }: HttpContextContract) {
    try {
      const material = await Material.findOrFail(params.id)
      await material.delete()

      return response.ok({
        message: '物料删除成功',
      })
    } catch (error) {
      return response.notFound({ message: '物料不存在' })
    }
  }

  public async checkWorkOrderReadiness({ params, response }: HttpContextContract) {
    try {
      const workOrderMaterials = await WorkOrderMaterial.query()
        .where('work_order_id', params.id)
        .preload('material')

      const totalItems = workOrderMaterials.length
      const readyItems = workOrderMaterials.filter((m) => m.isReady).length
      const isAllReady = totalItems > 0 && readyItems === totalItems

      const shortageItems = workOrderMaterials.filter((m) => {
        return m.material.stockQuantity < m.requiredQuantity
      })

      return response.ok({
        workOrderId: params.id,
        isAllReady,
        readyItems,
        totalItems,
        readinessRate: totalItems > 0 ? Math.round((readyItems / totalItems) * 100) : 0,
        shortageItems: shortageItems.map((item) => ({
          id: item.id,
          materialId: item.materialId,
          materialCode: item.material.materialCode,
          materialName: item.material.materialName,
          required: item.requiredQuantity,
          stock: item.material.stockQuantity,
          shortage: item.requiredQuantity - item.material.stockQuantity,
        })),
      })
    } catch (error) {
      return response.notFound({ message: '工单不存在' })
    }
  }

  public async updateWorkOrderMaterial({ params, request, response }: HttpContextContract) {
    try {
      const materialSchema = schema.create({
        materialId: schema.number([
          rules.exists({ table: 'materials', column: 'id' }),
        ]),
        requiredQuantity: schema.number([
          rules.unsigned(),
        ]),
        allocatedQuantity: schema.number.optional([
          rules.unsigned(),
        ]),
        isReady: schema.boolean.optional(),
        remarks: schema.string.optional(),
      })

      const data = await request.validate({ schema: materialSchema })

      let workOrderMaterial = await WorkOrderMaterial.query()
        .where('work_order_id', params.id)
        .where('material_id', data.materialId)
        .first()

      if (!workOrderMaterial) {
        workOrderMaterial = new WorkOrderMaterial()
        workOrderMaterial.workOrderId = Number(params.id)
        workOrderMaterial.materialId = data.materialId
      }

      workOrderMaterial.requiredQuantity = data.requiredQuantity
      workOrderMaterial.allocatedQuantity = data.allocatedQuantity || 0
      if (data.isReady !== undefined) {
        workOrderMaterial.isReady = data.isReady
      }
      workOrderMaterial.remarks = data.remarks || null

      await workOrderMaterial.save()
      await workOrderMaterial.load('material')

      return response.ok({
        message: '工单物料更新成功',
        data: workOrderMaterial.serialize(),
      })
    } catch (error) {
      return response.notFound({ message: '操作失败' })
    }
  }
}
