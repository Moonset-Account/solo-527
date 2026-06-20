import { DataTypes, Model } from 'sequelize'
import sequelize from '../../config/database.js'

class ReminderRule extends Model {
  static associate(models) {
    ReminderRule.hasMany(models.Reminder, {
      foreignKey: 'ruleId',
      as: 'reminders',
    })
  }
}

ReminderRule.init(
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
    type: {
      type: DataTypes.ENUM('driver_delay', 'order_status', 'inventory_warning', 'cleaning_task', 'custom'),
      allowNull: false,
    },
    level: {
      type: DataTypes.ENUM('normal', 'imminent', 'urgent'),
      defaultValue: 'normal',
    },
    triggerCondition: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'trigger_condition',
    },
    notificationChannels: {
      type: DataTypes.JSON,
      defaultValue: ['app'],
      field: 'notification_channels',
    },
    recipientRoles: {
      type: DataTypes.JSON,
      defaultValue: ['operator'],
      field: 'recipient_roles',
    },
    templateTitle: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'template_title',
    },
    templateContent: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'template_content',
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    tableName: 'reminder_rules',
    modelName: 'ReminderRule',
    timestamps: true,
    underscored: true,
  }
)

export default ReminderRule
