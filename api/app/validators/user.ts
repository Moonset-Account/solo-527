import vine from '@vinejs/vine'

const username = () => vine.string().minLength(3).maxLength(50).unique({ table: 'users', column: 'username' })
const password = () => vine.string().minLength(8).maxLength(32)

export const signupValidator = vine.create({
  username: username(),
  displayName: vine.string().maxLength(100).optional(),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

export const loginValidator = vine.create({
  username: vine.string(),
  password: vine.string(),
})
