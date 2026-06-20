import TourService from 'App/Services/TourService'

export default class TourController {
  async index({ request, response }) {
    try {
      const result = await TourService.getList(request.qs())
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
      const result = await TourService.getDetail(params.id)
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
      const result = await TourService.create(request.all(), auth.user.id)
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
      const result = await TourService.update(params.id, request.all())
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

  async archive({ params, response }) {
    try {
      const result = await TourService.archive(params.id)
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

  async publish({ params, response }) {
    try {
      const result = await TourService.publish(params.id)
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

  async schedules({ request, response }) {
    try {
      const result = await TourService.getSchedules(request.qs())
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

  async storeSchedule({ request, response }) {
    try {
      const result = await TourService.createSchedule(request.all())
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

  async updateSchedule({ params, request, response }) {
    try {
      const result = await TourService.updateSchedule(params.id, request.all())
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

  async versions({ params, request, response }) {
    try {
      const result = await TourService.getVersions(params.id, request.qs())
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

  async storeVersion({ params, request, auth, response }) {
    try {
      const result = await TourService.createVersion(params.id, request.all(), auth.user.id)
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

  async approveVersion({ params, auth, response }) {
    try {
      const result = await TourService.approveVersion(params.id, auth.user.id)
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

  async rejectVersion({ params, auth, response }) {
    try {
      const result = await TourService.rejectVersion(params.id, auth.user.id)
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
