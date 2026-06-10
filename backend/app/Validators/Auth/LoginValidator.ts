import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class LoginValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    email: schema.string({}, [
      rules.email(),
      rules.exists({ table: 'users', column: 'email' }),
    ]),
    password: schema.string({}, [
      rules.minLength(6),
    ]),
  })

  public messages = {
    'email.required': '邮箱不能为空',
    'email.email': '邮箱格式不正确',
    'email.exists': '账号不存在',
    'password.required': '密码不能为空',
    'password.minLength': '密码至少6位',
  }
}
