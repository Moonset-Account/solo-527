import DashboardService from 'App/Services/DashboardService'

export default class DashboardController {
  async stats({ response }) {
    try {
      const result = await DashboardService.getStats()
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

  async exceptions({ response }) {
    try {
      const result = await DashboardService.getExceptions()
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
