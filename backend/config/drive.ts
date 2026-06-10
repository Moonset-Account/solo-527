/**
 * Config source: https://git.io/JBt3o
 *
 * Feel free to let us know via PR, if you find something broken in this config
 * file.
 */

import Env from '@ioc:Adonis/Core/Env'
import Application from '@ioc:Adonis/Core/Application'

const driveConfig = {
  disk: Env.get('DRIVE_DISK'),

  disks: {
    local: {
      driver: 'local' as const,
      visibility: 'private' as const,
      root: Application.tmpPath('uploads'),
      serveFiles: true,
      basePath: '/uploads',
    },
  },
}

export default driveConfig
