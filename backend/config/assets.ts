import type { AssetsManagerConfig } from '@ioc:Adonis/Core/AssetsManager'

const assetsConfig: AssetsManagerConfig = {
  driver: 'vite',
  publicPath: 'public',
  scripts: { enabled: false },
  styles: { enabled: false },
  buildDirectory: 'public/assets'
}

export default assetsConfig
