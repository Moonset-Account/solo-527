const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../db/connection');

class Alert extends Model {}

Alert.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    alert_type: {
      type: DataTypes.ENUM(
        'data_missing',
        'model_drift',
        'service_failure',
        'processing_timeout',
        'validation_error',
        'system_warning'
      ),
      allowNull: false,
      comment: '告警类型：数据缺失/模型漂移/服务调用失败/处理超时/验证错误/系统警告',
    },
    severity: {
      type: DataTypes.ENUM('info', 'warning', 'error', 'critical'),
      allowNull: false,
      defaultValue: 'warning',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '告警标题',
    },
    message: {
      type: DataTypes.TEXT,
      comment: '详细告警信息',
    },
    contract_id: {
      type: DataTypes.UUID,
      references: {
        model: 'contracts',
        key: 'id',
      },
    },
    entity_type: {
      type: DataTypes.STRING(50),
    },
    entity_id: {
      type: DataTypes.UUID,
    },
    service_name: {
      type: DataTypes.STRING(100),
      comment: '发生告警的服务名，如 openai、database、vector_store',
    },
    error_code: {
      type: DataTypes.STRING(50),
      comment: '错误代码',
    },
    error_stack: {
      type: DataTypes.TEXT,
      comment: '错误堆栈（如适用）',
    },
    drift_metric: {
      type: DataTypes.JSONB,
      comment: '模型漂移检测指标数据',
    },
    missing_fields: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: '缺失的字段列表（数据缺失告警）',
    },
    retry_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '重试次数',
    },
    status: {
      type: DataTypes.ENUM('active', 'acknowledged', 'resolved', 'ignored'),
      allowNull: false,
      defaultValue: 'active',
    },
    acknowledged_by: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    acknowledged_at: {
      type: DataTypes.DATE,
    },
    resolved_by: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    resolved_at: {
      type: DataTypes.DATE,
    },
    resolution_notes: {
      type: DataTypes.TEXT,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'Alert',
    tableName: 'alerts',
    indexes: [
      { fields: ['alert_type'] },
      { fields: ['severity'] },
      { fields: ['status'] },
      { fields: ['contract_id'] },
      { fields: ['created_at'] },
      { fields: ['alert_type', 'status', 'created_at'] },
    ],
  }
);

module.exports = Alert;
