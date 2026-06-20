import { login, getCurrentUser } from '../services/authService.js'

export const loginController = async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' })
    }

    const result = await login(username, password)

    res.json({
      code: 0,
      message: 'success',
      data: result
    })
  } catch (error) {
    res.status(401).json({
      code: 1,
      message: error.message
    })
  }
}

export const profileController = async (req, res) => {
  try {
    const user = await getCurrentUser(req.user.id)

    res.json({
      code: 0,
      message: 'success',
      data: user
    })
  } catch (error) {
    res.status(500).json({
      code: 1,
      message: error.message
    })
  }
}

export const logoutController = async (req, res) => {
  res.json({
    code: 0,
    message: '退出成功'
  })
}
