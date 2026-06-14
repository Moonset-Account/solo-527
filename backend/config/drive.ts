import Env from '@ioc:Adonis/Core/Env'
import { DriveConfig } from '@ioc:Adonis/Core/Drive'
import Application from '@ioc:Adonis/Core/Application'

const driveConfig: DriveConfig = {
  disk: Env.get('DRIVE_DISK', 'local'),
  disks: {
    local: {
      driver: 'local',
      visibility: 'private',
      root: Application.tmpPath('uploads'),
      serveFiles: true,
      routesBase: '/uploads',
    },
  },
}

export default driveConfig
