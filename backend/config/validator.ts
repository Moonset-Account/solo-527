import { defineConfig } from '@adonisjs/validator'
import { vine } from '@vinejs/vine'

const validatorConfig = defineConfig({
  validator: vine,
})

export default validatorConfig
