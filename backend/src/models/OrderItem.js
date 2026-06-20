import { DataTypes } from 'sequelize'
import sequelize from '../db/index.js'

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tourId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  scheduleId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tourName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  tourDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'used', 'refunded', 'cancelled'),
    defaultValue: 'pending'
  },
  traveles: {
    type: DataTypes.ARRAY(DataTypes.JSONB),
    defaultValue: [],
    comment: '出行人信息'
  }
}, {
  tableName: 'order_items',
  timestamps: true
})

export default OrderItem
