import { DataTypes } from 'sequelize'
import sequelize from '../db/index.js'

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  customerName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  customerPhone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM(
      'pending_payment',
      'pending_confirmation',
      'confirmed',
      'in_progress',
      'completed',
      'refund_pending',
      'refunded',
      'cancelled'
    ),
    defaultValue: 'pending_payment'
  },
  paymentMethod: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  confirmedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelledBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  cancelReason: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  refundReason: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  refundedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refundedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  source: {
    type: DataTypes.STRING(20),
    defaultValue: 'direct'
  }
}, {
  tableName: 'orders',
  timestamps: true
})

export default Order
