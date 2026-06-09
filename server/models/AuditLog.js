const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../db/connection');

class AuditLog extends Model {}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.ENUM(
        'contract_upload',
        'contract_update',
        'contract_delete',
        'contract_approve',
        'contract_reject',
        'contract_rollback',
        'clause_create',
        'clause_update',
        'risk_create',
        'risk_update',
        'risk_delete',
        'risk_approve',
        'risk_reject',
        'risk_modify',
        'risk_to_review_queue',
        'review_start',
        'review_complete',
        'vector_index_build',
        'vector_index_activate',
        'vector_index_rollback',
        'user_login',
        'user_logout',
        'user_create',
        'user_update',
        'system_alert',
        'export_clause_list',
        'other'
      ),
      allowNull: false,
      comment: '操作类型',
    },
    entity_type: {
      type: DataTypes.ENUM(
        'contract',
        'contract_version',
        'clause',
        'risk_annotation',
        'vector_index',
        'user',
        'system'
      ),
      allowNull: false,
    },
    entity_id: {
      type: DataTypes.UUID,
      comment: '操作对象ID',
    },
    contract_id: {
      type: DataTypes.UUID,
      references: {
        model: 'contracts',
        key: 'id',
      },
      comment: '关联合同ID，便于查询',
    },
    ip_address: {
      type: DataTypes.STRING(45),
      comment: '操作IP地址',
    },
    user_agent: {
      type: DataTypes.STRING(500),
      comment: '用户代理',
    },
    old_values: {
      type: DataTypes.JSONB,
      comment: '变更前数据',
    },
    new_values: {
      type: DataTypes.JSONB,
      comment: '变更后数据',
    },
    change_summary: {
      type: DataTypes.TEXT,
      comment: '变更摘要说明',
    },
    request_id: {
      type: DataTypes.STRING(100),
      comment: '请求追踪ID',
    },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['action'] },
      { fields: ['entity_type', 'entity_id'] },
      { fields: ['contract_id'] },
      { fields: ['created_at'] },
      { fields: ['action', 'created_at'] },
    ],
  }
);

module.exports = AuditLog;
