import { getDashboardStats, getAnomalies } from '../services/dashboardService.js'

export const dashboardStats = async (req, res) => {
  try {
    const stats = await getDashboardStats()
    res.json({
      code: 0,
      message: 'success',
      data: stats
    })
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: error.message
    })
  }
}

export const anomalies = async (req, res) => {
  try {
    const result = await getAnomalies()
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
