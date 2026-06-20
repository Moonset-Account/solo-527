import { Op } from 'sequelize'
import { Driver } from '../db/models.js'

export const listDrivers = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, status } = req.query

    const where = {}

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${keyword}%` } },
        { phone: { [Op.iLike]: `%${keyword}%` } },
        { vehiclePlate: { [Op.iLike]: `%${keyword}%` } }
      ]
    }

    if (status) {
      where.status = status
    }

    const { count, rows } = await Driver.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    })

    res.json({
      code: 0,
      message: 'success',
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    })
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: error.message
    })
  }
}

export const getDriver = async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id)
    if (!driver) {
      return res.status(404).json({ code: 1, message: '司机不存在' })
    }
    res.json({
      code: 0,
      message: 'success',
      data: driver
    })
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: error.message
    })
  }
}

export const createDriver = async (req, res) => {
  try {
    const driver = await Driver.create(req.body)
    res.status(201).json({
      code: 0,
      message: '创建成功',
      data: driver
    })
  } catch (error) {
    res.status(400).json({
      code: 1,
      message: error.message
    })
  }
}

export const updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id)
    if (!driver) {
      return res.status(404).json({ code: 1, message: '司机不存在' })
    }

    await driver.update(req.body)
    res.json({
      code: 0,
      message: '更新成功',
      data: driver
    })
  } catch (error) {
    res.status(400).json({
      code: 1,
      message: error.message
    })
  }
}

export const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id)
    if (!driver) {
      return res.status(404).json({ code: 1, message: '司机不存在' })
    }

    await driver.destroy()
    res.json({
      code: 0,
      message: '删除成功'
    })
  } catch (error) {
    res.status(400).json({
      code: 1,
      message: error.message
    })
  }
}
