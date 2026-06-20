import { DataTypes, Model } from 'sequelize'
import sequelize from '../../config/database.js'

class CleaningTask extends Model {
  static associate(models) {
    CleaningTask.belongsTo(models.User, {
      foreignKey: 'assigneeId',
      as: 'assignee',
    })
  }
}

CleaningTask.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    taskNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'task_no',
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cleaningType: {
      type: DataTypes.ENUM('daily', 'deep', 'emergency'),
      defaultValue: 'daily',
      field: 'cleaning_type',
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'pending',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
    },
    scheduledDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'scheduled_date',
    },
    scheduledTime: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'scheduled_time',
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    assigneeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'assignee_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'started_at',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'cleaning_tasks',
    modelName: 'CleaningTask',
    timestamps: true,
    underscored: true,
  }
)

export default CleaningTask
