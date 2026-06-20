import {
  getCleaningTasks,
  getCleaningTaskById,
  createCleaningTask,
  updateCleaningTask,
  deleteCleaningTask
} from '../services/cleaningTaskService.js'

export const listCleaningTasks = async (req, res) => {
  try {
    const result = await getCleaningTasks(req.query)
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

export const getCleaningTask = async (req, res) => {
  try {
    const task = await getCleaningTaskById(req.params.id)
    if (!task) {
      return res.status(404).json({ code: 1, message: '清洁任务不存在' })
    }
    res.json({
      code: 0,
      message: 'success',
      data: task
    })
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: error.message
    })
  }
}

export const createCleaningTaskController = async (req, res) => {
  try {
    const task = await createCleaningTask(req.body)
    res.status(201).json({
      code: 0,
      message: '创建成功',
      data: task
    })
  } catch (error) {
    res.status(400).json({
      code: 1,
      message: error.message
    })
  }
}

export const updateCleaningTaskController = async (req, res) => {
  try {
    const task = await updateCleaningTask(req.params.id, req.body)
    res.json({
      code: 0,
      message: '更新成功',
      data: task
    })
  } catch (error) {
    res.status(400).json({
      code: 1,
      message: error.message
    })
  }
}

export const deleteCleaningTaskController = async (req, res) => {
  try {
    await deleteCleaningTask(req.params.id)
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
