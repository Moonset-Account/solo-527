import { DataTypes, Model } from 'sequelize'
import sequelize from '../../config/database.js'

class InventoryLog extends Model {
  static associate(models) {
    InventoryLog.belongsTo(models.TourSchedule, {
      foreignKey: 'scheduleId',
      as: 'schedule',
    })
    InventoryLog.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order',
    })
    InventoryLog.belongsTo(models.OrderItem, {
      foreignKey: 'orderItemId',
      as: 'orderItem',
    })
    InventoryLog.belongsTo(models.User, {
      foreignKey: 'operatorId',
      as: 'operator',
    })
  }
}

InventoryLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    scheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'schedule_id',
      references: {
        model: 'tour_schedules',
        key: 'id',
      },
    },
    changeType: {
      type: DataTypes.ENUM('order', 'cancel', 'refund', 'manual', 'system'),
      allowNull: false,
      field: 'change_type',
    },
    changeQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'change_quantity',
    },
    beforeQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'before_quantity',
    },
    afterQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'after_quantity',
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'order_id',
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    orderItemId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'order_item_id',
      references: {
        model: 'order_items',
        key: 'id',
      },
    },
    operatorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'operator_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    changeReason: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'change_reason',
    },
  },
  {
    sequelize,
    tableName: 'inventory_logs',
    modelName: 'InventoryLog',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['schedule_id'],
      },
      {
        fields: ['change_type'],
      },
      {
        fields: ['order_id'],
      },
    ],
  }
)

export default InventoryLog
