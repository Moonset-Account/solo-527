import { DataTypes, Model } from 'sequelize'
import sequelize from '../../config/database.js'

class TourSchedule extends Model {
  static associate(models) {
    TourSchedule.belongsTo(models.Tour, {
      foreignKey: 'tourId',
      as: 'tour',
    })
    TourSchedule.belongsTo(models.Driver, {
      foreignKey: 'driverId',
      as: 'driver',
    })
    TourSchedule.hasMany(models.InventoryLog, {
      foreignKey: 'scheduleId',
      as: 'inventoryLogs',
    })
  }

  get remaining() {
    return this.capacity - this.booked
  }
}

TourSchedule.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tourId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'tour_id',
      references: {
        model: 'tours',
        key: 'id',
      },
    },
    tourDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'tour_date',
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'start_time',
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'end_time',
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 20,
    },
    booked: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'scheduled',
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'driver_id',
      references: {
        model: 'drivers',
        key: 'id',
      },
    },
    vehiclePlate: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'vehicle_plate',
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'tour_schedules',
    modelName: 'TourSchedule',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['tour_id', 'tour_date'],
      },
    ],
  }
)

export default TourSchedule
