export default {
  guard: 'jwt',

  guards: {
    jwt: {
      driver: 'jwt',
      publicKey: process.env.JWT_PUBLIC_KEY || '',
      privateKey: process.env.JWT_PRIVATE_KEY || '',
      persistJwtRefreshToken: true,
      token: {
        name: 'jwt_refresh_token',
        expiresIn: 31536000,
      },
      refreshToken: {
        name: 'jwt_refresh_token',
        expiresIn: 1209600,
      },
      jwtOptions: {
        expiresIn: 86400,
        algorithm: 'HS256',
        secret: process.env.JWT_SECRET,
      },
      provider: {
        driver: 'lucid',
        identifierKey: 'id',
        uids: ['email'],
        model: () => import('../app/Models/User.js'),
      },
    },
  },
}
