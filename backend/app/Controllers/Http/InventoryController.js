import InventoryService from 'App/Services/InventoryService'

export default class InventoryController {
  async index({ request, response }) {
    try {
      const result = await InventoryService.getSummary(request.qs())
      return response.json({
        code: 0,
        message: 'success',
        data: result,
      })
    } catch (error) {
      return response.json({
        code: 1,
        message: error.message,
      })
    }
  }

  async show({ params, response }) {
    try {
      const result = await InventoryService.getDetail(params.id)
      return response.json({
        code: 0,
        message: 'success',
        data: result,
      })
    } catch (error) {
      return response.json({
        code: 1,
        message: error.message,
      })
    }
  }

  async logs({ params, request, response }) {
    try {
      const result = await InventoryService.getLogs(params.id, request.qs())
      return response.json({
        code: 0,
        message: 'success',
        data: result,
      })
    } catch (error) {
      return response.json({
        code: 1,
        message: error.message,
      })
    }
  }

  async adjust({ params, request, auth, response }) {
    try {
      const result = await InventoryService.adjustInventory(params.id, request.all(), auth.user.id)
      return response.json({
        code: 0,
        message: 'success',
        data: result,
      })
    } catch (error) {
      return response.json({
        code: 1,
        message: error.message,
      })
    }
  }
}
