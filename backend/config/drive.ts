import Application from '@ioc:Adonis/Core/Application'
import { DriveConfig } from '@ioc:Adonis/Core/Drive'
import Env from '@ioc:Adonis/Core/Env'

const driveConfig: DriveConfig = {
  disk: Env.get('DRIVE_DISK', 'local'),

  disks: {
    local: {
      driver: 'local',
      visibility: 'private',
      root: Application.tmpPath('uploads'),
      serveFiles: true,
      routesBasePath: '/uploads/',
    },
  },
}

export default driveConfig
