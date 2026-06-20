import { DataTypes, Model } from 'sequelize'
import sequelize from '../../config/database.js'

class OrderItem extends Model {
  static associate(models) {
    OrderItem.belongsTo(models.Order, {
      foreignKey: 'orderId',
      as: 'order',
    })
    OrderItem.belongsTo(models.Tour, {
      foreignKey: 'tourId',
      as: 'tour',
    })
    OrderItem.belongsTo(models.TourSchedule, {
      foreignKey: 'scheduleId',
      as: 'schedule',
    })
  }
}

OrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'order_id',
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    tourId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'tour_id',
      references: {
        model: 'tours',
        key: 'id',
      },
    },
    scheduleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'schedule_id',
      references: {
        model: 'tour_schedules',
        key: 'id',
      },
    },
    tourName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'tour_name',
    },
    tourDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'tour_date',
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'start_time',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'unit_price',
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'cancelled', 'refunded'),
      defaultValue: 'active',
    },
    travelers: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    sequelize,
    tableName: 'order_items',
    modelName: 'OrderItem',
    timestamps: true,
    underscored: true,
  }
)

export default OrderItem
