import {
  getTours,
  getTourById,
  createTour,
  updateTour,
  deleteTour,
  getTourSchedules,
  createSchedule,
  updateSchedule
} from '../services/tourService.js'

export const listTours = async (req, res) => {
  try {
    const result = await getTours(req.query)
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

export const getTour = async (req, res) => {
  try {
    const tour = await getTourById(req.params.id)
    if (!tour) {
      return res.status(404).json({ code: 1, message: '导览路线不存在' })
    }
    res.json({
      code: 0,
      message: 'success',
      data: tour
    })
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: error.message
    })
  }
}

export const createTourController = async (req, res) => {
  try {
    const tour = await createTour(req.body, req.user.id)
    res.status(201).json({
      code: 0,
      message: '创建成功',
      data: tour
    })
  } catch (error) {
    res.status(400).json({
      code: 1,
      message: error.message
    })
  }
}

export const updateTourController = async (req, res) => {
  try {
    const tour = await updateTour(req.params.id, req.body, req.user.id)
    res.json({
      code: 0,
      message: '更新成功',
      data: tour
    })
  } catch (error) {
    res.status(400).json({
      code: 1,
      message: error.message
    })
  }
}

export const deleteTourController = async (req, res) => {
  try {
    await deleteTour(req.params.id)
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

export const listSchedules = async (req, res) => {
  try {
    const result = await getTourSchedules(req.query)
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

export const createScheduleController = async (req, res) => {
  try {
    const schedule = await createSchedule(req.body)
    res.status(201).json({
      code: 0,
      message: '创建成功',
      data: schedule
    })
  } catch (error) {
    res.status(400).json({
      code: 1,
      message: error.message
    })
  }
}

export const updateScheduleController = async (req, res) => {
  try {
    const schedule = await updateSchedule(req.params.id, req.body)
    res.json({
      code: 0,
      message: '更新成功',
      data: schedule
    })
  } catch (error) {
    res.status(400).json({
      code: 1,
      message: error.message
    })
  }
}
