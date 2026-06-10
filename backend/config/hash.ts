/**
 * Config source: https://git.io/JfefW
 */

import Env from '@ioc:Adonis/Core/Env'
import type { HashConfig } from '@ioc:Adonis/Core/Hash'

const hashConfig: HashConfig = {
  default: Env.get('HASH_DRIVER', 'bcrypt'),

  list: {
    bcrypt: {
      driver: 'bcrypt',
      rounds: 10,
    },

    argon: {
      driver: 'argon2',
      variant: 'id',
      iterations: 3,
      memory: 4096,
      parallelism: 1,
      saltSize: 16,
    },
  },
}

export default hashConfig
