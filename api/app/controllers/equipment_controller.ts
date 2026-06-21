import Equipment from '#models/equipment'
import EquipmentAlert from '#models/equipment_alert'
import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'

export default class EquipmentController {
  async utilization({ response }: HttpContext) {
    const equipment = await Equipment.query().preload('owner')

    const data = equipment.map((e) => ({
      id: e.id,
      name: e.name,
      code: e.code,
      status: e.status,
      owner: e.owner?.displayName || null,
      utilizationRate: Number(e.utilizationRate),
      lastMaintenance: e.lastMaintenance,
      nextMaintenance: e.nextMaintenance,
    }))

    return response.ok(data)
  }

  async alerts({ request, response }: HttpContext) {
    const status = request.input('status')

    const query = EquipmentAlert.query().preload('equipment')

    if (status) {
      query.where('status', status)
    }

    const alerts = await query.orderBy('created_at', 'desc')
    return response.ok(alerts)
  }

  async confirmAdmin({ params, response }: HttpContext) {
    const alert = await EquipmentAlert.findOrFail(params.id)

    alert.confirmedByAdmin = true
    alert.adminConfirmedAt = DateTime.now()

    if (alert.confirmedByOwner) {
      alert.status = 'resolved'
    } else {
      alert.status = 'confirmed_by_admin'
    }

    await alert.save()
    await alert.load('equipment')

    return response.ok(alert)
  }

  async confirmOwner({ params, response }: HttpContext) {
    const alert = await EquipmentAlert.findOrFail(params.id)

    alert.confirmedByOwner = true
    alert.ownerConfirmedAt = DateTime.now()

    if (alert.confirmedByAdmin) {
      alert.status = 'resolved'
    } else {
      alert.status = 'confirmed_by_owner'
    }

    await alert.save()
    await alert.load('equipment')

    return response.ok(alert)
  }
}
