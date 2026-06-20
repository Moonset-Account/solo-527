import { DataTypes, Model } from 'sequelize'
import sequelize from '../../config/database.js'

class Reminder extends Model {
  static associate(models) {
    Reminder.belongsTo(models.ReminderRule, {
      foreignKey: 'ruleId',
      as: 'rule',
    })
  }
}

Reminder.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ruleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'rule_id',
      references: {
        model: 'reminder_rules',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    level: {
      type: DataTypes.ENUM('normal', 'imminent', 'urgent'),
      defaultValue: 'normal',
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    relatedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'related_id',
    },
    relatedType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'related_type',
    },
    recipientIds: {
      type: DataTypes.JSON,
      defaultValue: [],
      field: 'recipient_ids',
    },
    readBy: {
      type: DataTypes.JSON,
      defaultValue: [],
      field: 'read_by',
    },
    status: {
      type: DataTypes.ENUM('unread', 'read', 'dismissed'),
      defaultValue: 'unread',
    },
    triggeredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'triggered_at',
    },
  },
  {
    sequelize,
    tableName: 'reminders',
    modelName: 'Reminder',
    timestamps: true,
    underscored: true,
  }
)

export default Reminder
