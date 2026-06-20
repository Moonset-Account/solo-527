import OrderService from 'App/Services/OrderService'

export default class OrderController {
  async index({ request, response }) {
    try {
      const result = await OrderService.getList(request.qs())
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
      const result = await OrderService.getDetail(params.id)
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
      const result = await OrderService.createOrder(request.all(), auth.user?.id)
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

  async confirm({ params, auth, response }) {
    try {
      const result = await OrderService.confirmOrder(params.id, auth.user.id)
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

  async refund({ params, request, auth, response }) {
    try {
      const result = await OrderService.refundOrder(params.id, request.all(), auth.user.id)
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
      const result = await OrderService.cancelOrder(params.id, request.all(), auth.user.id)
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
