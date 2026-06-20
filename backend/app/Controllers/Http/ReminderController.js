import ReminderService from 'App/Services/ReminderService'

export default class ReminderController {
  async index({ request, response }) {
    try {
      const result = await ReminderService.getList(request.qs())
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

  async markRead({ params, auth, response }) {
    try {
      const result = await ReminderService.markRead(params.id, auth.user.id)
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

  async markAllRead({ auth, response }) {
    try {
      const result = await ReminderService.markAllRead(auth.user.id)
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

  async unreadCount({ auth, response }) {
    try {
      const result = await ReminderService.getUnreadCount(auth.user.id)
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

  async rules({ request, response }) {
    try {
      const result = await ReminderService.getRules(request.qs())
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

  async storeRule({ request, response }) {
    try {
      const result = await ReminderService.createRule(request.all())
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

  async updateRule({ params, request, response }) {
    try {
      const result = await ReminderService.updateRule(params.id, request.all())
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

  async deleteRule({ params, response }) {
    try {
      const result = await ReminderService.deleteRule(params.id)
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

  async toggleRule({ params, request, response }) {
    try {
      const result = await ReminderService.toggleRule(params.id, request.input('enabled'))
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
