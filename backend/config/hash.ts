import env from '#start/env'
import { defineConfig, drivers } from '@adonisjs/core/hash'

const hashConfig = defineConfig({
  default: env.get('HASH_DRIVER', 'scrypt'),

  list: {
    scrypt: drivers.scrypt({
      cost: 16384,
      blockSize: 8,
      parallelization: 1,
      maxMemory: 33554432,
    }),

    bcrypt: drivers.bcrypt({
      rounds: 10,
    }),

    argon2: drivers.argon2({
      variant: 'id',
      iterations: 3,
      memory: 4096,
      parallelism: 1,
      saltSize: 16,
    }),
  },
})

export default hashConfig
