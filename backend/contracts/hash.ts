/**
 * Contract source: https://git.io/Jfefs
 */

declare module '@ioc:Adonis/Core/Hash' {
  interface HashersList {
    argon: {
      config: ArgonConfig
      implementation: ArgonContract
    }
  }
}
