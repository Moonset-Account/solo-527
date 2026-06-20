import { DataTypes, Model } from 'sequelize'
import sequelize from '../../config/database.js'

class Order extends Model {
  static associate(models) {
    Order.hasMany(models.OrderItem, {
      foreignKey: 'orderId',
      as: 'items',
    })
    Order.belongsTo(models.User, {
      foreignKey: 'confirmedBy',
      as: 'confirmer',
    })
    Order.belongsTo(models.User, {
      foreignKey: 'cancelledBy',
      as: 'canceller',
    })
    Order.belongsTo(models.User, {
      foreignKey: 'refundedBy',
      as: 'refunder',
    })
  }
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'order_no',
    },
    customerName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'customer_name',
    },
    customerPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'customer_phone',
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'total_amount',
    },
    paidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'paid_amount',
    },
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'refund_amount',
    },
    status: {
      type: DataTypes.ENUM(
        'pending_confirmation',
        'confirmed',
        'completed',
        'cancelled',
        'refund_pending',
        'refunded',
        'partially_refunded'
      ),
      defaultValue: 'pending_confirmation',
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'alipay', 'wechat', 'bank_transfer', 'other'),
      allowNull: true,
      field: 'payment_method',
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'paid_at',
    },
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'confirmed_at',
    },
    confirmedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'confirmed_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'cancelled_at',
    },
    cancelledBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'cancelled_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'cancel_reason',
    },
    refundReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'refund_reason',
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'refunded_at',
    },
    refundedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'refunded_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    source: {
      type: DataTypes.ENUM('online', 'offline', 'partner'),
      defaultValue: 'online',
    },
  },
  {
    sequelize,
    tableName: 'orders',
    modelName: 'Order',
    timestamps: true,
    underscored: true,
  }
)

export default Order
