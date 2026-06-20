import AuthService from 'App/Services/AuthService'

export default class AuthController {
  async login({ request, response }) {
    try {
      const { username, password } = request.all()
      const result = await AuthService.login(username, password)
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
