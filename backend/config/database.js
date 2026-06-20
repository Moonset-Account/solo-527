import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

const sequelize = new Sequelize(
  process.env.PG_DB_NAME,
  process.env.PG_USER,
  process.env.PG_PASSWORD,
  {
    host: process.env.PG_HOST,
    port: Number(process.env.PG_PORT),
    dialect: 'postgres',
    pool: {
      min: 2,
      max: 20,
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  }
)

export default sequelize
