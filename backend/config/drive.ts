import Application from '@ioc:Adonis/Core/Application'
import Env from '@ioc:Adonis/Core/Env'

const driveConfig = {
  disk: Env.get('DRIVE_DISK', 'local'),

  disks: {
    local: {
      driver: 'local' as const,
      visibility: 'private' as const,
      root: Application.tmpPath('uploads'),
      serveFiles: true,
      routesBasePath: '/uploads/',
    },
  },
}

export default driveConfig
