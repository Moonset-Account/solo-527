import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class RegisterValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    username: schema.string({}, [
      rules.unique({ table: 'users', column: 'username' }),
      rules.minLength(3),
      rules.maxLength(50),
    ]),
    email: schema.string({}, [
      rules.email(),
      rules.unique({ table: 'users', column: 'email' }),
    ]),
    password: schema.string({}, [
      rules.minLength(6),
      rules.maxLength(50),
      rules.confirmed(),
    ]),
    realName: schema.string({}, [
      rules.minLength(2),
      rules.maxLength(50),
    ]),
    phone: schema.string.optional({}, [
      rules.mobile({ locale: ['zh-CN'] }),
    ]),
    department: schema.string.optional({}, [
      rules.maxLength(100),
    ]),
  })

  public messages = {
    'username.required': '用户名不能为空',
    'username.unique': '用户名已存在',
    'username.minLength': '用户名至少3位',
    'email.required': '邮箱不能为空',
    'email.email': '邮箱格式不正确',
    'email.unique': '邮箱已被注册',
    'password.required': '密码不能为空',
    'password.minLength': '密码至少6位',
    'password.confirmed': '两次输入的密码不一致',
    'realName.required': '真实姓名不能为空',
    'phone.mobile': '手机号格式不正确',
  }
}
