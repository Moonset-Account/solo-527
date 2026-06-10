/**
 * Contract source: https://git.io/JemcN
 *
 * Feel free to let us know via PR, if you find something broken in this config
 * file.
 */

declare module '@ioc:Adonis/Core/Hash' {
  interface HashersList {
    bcrypt: {
      config: import('@ioc:Adonis/Core/Hash').BcryptConfig
      implementation: import('@ioc:Adonis/Core/Hash').BcryptContract
    }
    argon: {
      config: import('@ioc:Adonis/Core/Hash').ArgonConfig
      implementation: import('@ioc:Adonis/Core/Hash').ArgonContract
    }
  }
}
