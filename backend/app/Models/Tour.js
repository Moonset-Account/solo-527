import { DataTypes, Model } from 'sequelize'
import sequelize from '../../config/database.js'

class Tour extends Model {
  static associate(models) {
    Tour.belongsTo(models.User, {
      foreignKey: 'operatorId',
      as: 'operator',
    })
    Tour.hasMany(models.TourVersion, {
      foreignKey: 'tourId',
      as: 'versions',
    })
    Tour.hasMany(models.TourSchedule, {
      foreignKey: 'tourId',
      as: 'schedules',
    })
  }
}

Tour.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    destination: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    highlights: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    meetingPoint: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'meeting_point',
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      defaultValue: 'draft',
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
  },
  {
    sequelize,
    tableName: 'tours',
    modelName: 'Tour',
    timestamps: true,
    underscored: true,
  }
)

export default Tour
