import { findUserByEmail, verifyPassword, generateToken, findUserById } from '../services/AuthService.js'

export class AuthController {
  async login(req: any, res: any) {
    try {
      const { email, password } = req.body
      if (!email || !password) {
        return res.status(400).json({ error: '邮箱和密码不能为空' })
      }

      const user = await findUserByEmail(email)
      if (!user) {
        return res.status(401).json({ error: '邮箱或密码错误' })
      }

      const isValid = await verifyPassword(password, user.password_hash)
      if (!isValid) {
        return res.status(401).json({ error: '邮箱或密码错误' })
      }

      const token = generateToken(user)
      const { password_hash, ...userWithoutPassword } = user

      return res.json({ token, user: userWithoutPassword })
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  async me(req: any, res: any) {
    try {
      const user = await findUserById(req.user.id)
      if (!user) {
        return res.status(404).json({ error: '用户不存在' })
      }
      const { password_hash, ...userWithoutPassword } = user
      return res.json(userWithoutPassword)
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }
}
