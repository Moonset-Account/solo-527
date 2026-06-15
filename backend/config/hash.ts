import { HashConfig } from '@ioc:Adonis/Core/Hash'

const hashConfig: HashConfig = {
  default: 'argon2',
  list: {
    argon2: {
      driver: 'argon2',
      variant: 'id',
      iterations: 3,
      memory: 65536,
      parallelism: 4,
      saltSize: 16,
    },
  },
}

export default hashConfig
