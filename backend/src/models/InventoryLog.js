import { DataTypes } from 'sequelize'
import sequelize from '../db/index.js'

const InventoryLog = sequelize.define('InventoryLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  scheduleId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  orderItemId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  changeType: {
    type: DataTypes.ENUM('order', 'cancel', 'refund', 'adjust', 'system'),
    allowNull: false
  },
  quantityChange: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '正数增加，负数减少'
  },
  beforeQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  afterQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  operatorId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'inventory_logs',
  timestamps: true
})

export default InventoryLog
