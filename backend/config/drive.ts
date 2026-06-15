import Env from '@ioc:Adonis/Core/Env'
import { DriveConfig } from '@ioc:Adonis/Core/Drive'
const path = require('path')

const driveConfig: DriveConfig = {
  disk: Env.get('DRIVE_DISK', 'local'),
  disks: {
    local: {
      driver: 'local',
      visibility: 'private',
      root: path.join(process.cwd(), 'tmp', 'uploads'),
      basePath: path.join(process.cwd(), 'tmp', 'uploads'),
      serveFiles: true,
      routesBase: '/uploads',
    },
  },
}

export default driveConfig
