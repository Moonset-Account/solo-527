export default {
  default: 'bcrypt',

  list: {
    bcrypt: {
      driver: 'bcrypt',
      rounds: Number(process.env.BCRYPT_ROUNDS || 10),
    },
  },
}
