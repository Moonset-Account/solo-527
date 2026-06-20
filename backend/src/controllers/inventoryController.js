import {
  getInventorySummary,
  getInventoryDetail,
  getInventoryLogs,
  adjustInventory
} from '../services/inventoryService.js'

export const inventorySummary = async (req, res) => {
  try {
    const result = await getInventorySummary(req.query)
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

export const inventoryDetail = async (req, res) => {
  try {
    const result = await getInventoryDetail(req.params.id)
    res.json({
      code: 0,
      message: 'success',
      data: result
    })
  } catch (error) {
    res.status(404).json({
      code: 1,
      message: error.message
    })
  }
}

export const inventoryLogs = async (req, res) => {
  try {
    const result = await getInventoryLogs(req.query)
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

export const adjustInventoryController = async (req, res) => {
  try {
    const { quantity, remark } = req.body
    const result = await adjustInventory(req.params.id, quantity, remark, req.user.id)
    res.json({
      code: 0,
      message: '调整成功',
      data: result
    })
  } catch (error) {
    res.status(400).json({
      code: 1,
      message: error.message
    })
  }
}
