declare module '@ioc:Adonis/Addons/Auth' {
  interface ProvidersList {
    user: {
      implementation: LucidProviderContract<typeof import('App/Models/User').default>
      config: LucidProviderConfig<typeof import('App/Models/User').default>
    }
  }
  interface GuardsList {
    api: {
      implementation: OATGuardContract<'user', 'api'>
      config: OATGuardConfig<'user'>
      client: OATClientContract<'user'>
    }
  }
}
