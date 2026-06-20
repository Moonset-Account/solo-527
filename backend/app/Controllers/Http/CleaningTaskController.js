import CleaningTaskService from 'App/Services/CleaningTaskService'

export default class CleaningTaskController {
  async index({ request, response }) {
    try {
      const result = await CleaningTaskService.getList(request.qs())
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
      const result = await CleaningTaskService.getDetail(params.id)
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

  async store({ request, auth, response }) {
    try {
      const result = await CleaningTaskService.create(request.all(), auth.user.id)
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
      const result = await CleaningTaskService.update(params.id, request.all())
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

  async start({ params, auth, response }) {
    try {
      const result = await CleaningTaskService.startTask(params.id, auth.user.id)
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

  async complete({ params, auth, response }) {
    try {
      const result = await CleaningTaskService.completeTask(params.id, auth.user.id)
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

  async cancel({ params, request, auth, response }) {
    try {
      const result = await CleaningTaskService.cancelTask(params.id, request.all(), auth.user.id)
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
