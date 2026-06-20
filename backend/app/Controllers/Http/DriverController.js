import DriverService from 'App/Services/DriverService'

export default class DriverController {
  async index({ request, response }) {
    try {
      const result = await DriverService.getList(request.qs())
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

  async store({ request, response }) {
    try {
      const result = await DriverService.create(request.all())
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

  async update({ params, request, response }) {
    try {
      const result = await DriverService.update(params.id, request.all())
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

  async destroy({ params, response }) {
    try {
      const result = await DriverService.delete(params.id)
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

  async recordDelay({ params, request, auth, response }) {
    try {
      const result = await DriverService.recordDelay(
        params.id,
        request.input('minutes'),
        request.input('reason'),
        auth.user.id
      )
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
