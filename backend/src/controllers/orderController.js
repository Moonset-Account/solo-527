import {
  getOrders,
  getOrderById,
  createOrder,
  confirmOrder,
  refundOrder,
  cancelOrder
} from '../services/orderService.js'

export const listOrders = async (req, res) => {
  try {
    const result = await getOrders(req.query)
    res.json({
      code: 0,
      message: 'success',
      data: result
    })
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: error.message
    })
  }
}

export const getOrder = async (req, res) => {
  try {
    const order = await getOrderById(req.params.id)
    if (!order) {
      return res.status(404).json({ code: 1, message: '订单不存在' })
    }
    res.json({
      code: 0,
      message: 'success',
      data: order
    })
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: error.message
    })
  }
}

export const createOrderController = async (req, res) => {
  try {
    const order = await createOrder(req.body)
    res.status(201).json({
      code: 0,
      message: '创建成功',
      data: order
    })
  } catch (error) {
    res.status(400).json({
      code: 1,
      message: error.message
    })
  }
}

export const confirmOrderController = async (req, res) => {
  try {
    const order = await confirmOrder(req.params.id, req.user.id)
    res.json({
      code: 0,
      message: '确认成功',
      data: order
    })
  } catch (error) {
    res.status(400).json({
      code: 1,
      message: error.message
    })
  }
}

export const refundOrderController = async (req, res) => {
  try {
    const { reason } = req.body
    const order = await refundOrder(req.params.id, reason, req.user.id)
    res.json({
      code: 0,
      message: '退款成功',
      data: order
    })
  } catch (error) {
    res.status(400).json({
      code: 1,
      message: error.message
    })
  }
}

export const cancelOrderController = async (req, res) => {
  try {
    const { reason } = req.body
    const order = await cancelOrder(req.params.id, reason, req.user.id)
    res.json({
      code: 0,
      message: '取消成功',
      data: order
    })
  } catch (error) {
    res.status(400).json({
      code: 1,
      message: error.message
    })
  }
}
