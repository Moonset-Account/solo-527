import { DataTypes } from 'sequelize'
import sequelize from '../db/index.js'

const Driver = sequelize.define('Driver', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  licenseNumber: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  vehiclePlate: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('on_duty', 'off_duty', 'rest'),
    defaultValue: 'off_duty'
  },
  delayCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'drivers',
  timestamps: true
})

export default Driver
