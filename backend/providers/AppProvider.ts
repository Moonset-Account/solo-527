import type { ApplicationContract } from '@ioc:Adonis/Core/Application'

export default class AppProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {}

  public async boot() {
    const Auth = this.app.container.use('Adonis/Addons/Auth')
    Auth.verifier('app', () => {
      return {
        verifyTokens: async (_tokens) => true,
      }
    })
  }

  public async ready() {}

  public async shutdown() {}
}
