import { DataTypes, Model } from 'sequelize'
import sequelize from '../../config/database.js'

class TourVersion extends Model {
  static associate(models) {
    TourVersion.belongsTo(models.Tour, {
      foreignKey: 'tourId',
      as: 'tour',
    })
    TourVersion.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
    })
    TourVersion.belongsTo(models.User, {
      foreignKey: 'approvedBy',
      as: 'approver',
    })
  }
}

TourVersion.init(
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
    version: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    changeLog: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'change_log',
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'approved_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'tour_versions',
    modelName: 'TourVersion',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['tour_id', 'version'],
      },
    ],
  }
)

export default TourVersion
