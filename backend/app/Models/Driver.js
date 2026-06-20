import { DataTypes, Model } from 'sequelize'
import sequelize from '../../config/database.js'

class Driver extends Model {
  static associate(models) {
    Driver.hasMany(models.TourSchedule, {
      foreignKey: 'driverId',
      as: 'tourSchedules',
    })
  }
}

Driver.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    licenseNo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: 'license_no',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'on_leave'),
      defaultValue: 'active',
    },
    delayCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'delay_count',
    },
    delayMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'delay_minutes',
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'drivers',
    modelName: 'Driver',
    timestamps: true,
    underscored: true,
  }
)

export default Driver
