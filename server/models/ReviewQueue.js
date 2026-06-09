const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../db/connection');

class ReviewQueue extends Model {}

ReviewQueue.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    risk_annotation_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'risk_annotations',
        key: 'id',
      },
    },
    contract_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'contracts',
        key: 'id',
      },
    },
    clause_id: {
      type: DataTypes.UUID,
      references: {
        model: 'clauses',
        key: 'id',
      },
    },
    assigned_to: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
      comment: '分配给的复核人',
    },
    queue_reason: {
      type: DataTypes.ENUM('low_confidence', 'high_risk', 'ambiguous', 'human_request', 'escalation'),
      allowNull: false,
      comment: '入队原因：低置信度/高风险/歧义条款/人工请求/升级复核',
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '优先级，数字越大越优先',
    },
    status: {
      type: DataTypes.ENUM('queued', 'assigned', 'in_progress', 'completed', 'escalated'),
      allowNull: false,
      defaultValue: 'queued',
    },
    confidence_score: {
      type: DataTypes.DECIMAL(5, 4),
      comment: '入队时的置信度',
    },
    original_risk_type: {
      type: DataTypes.STRING(50),
    },
    original_risk_level: {
      type: DataTypes.STRING(20),
    },
    assigned_at: {
      type: DataTypes.DATE,
    },
    completed_at: {
      type: DataTypes.DATE,
    },
    sla_due_at: {
      type: DataTypes.DATE,
      comment: 'SLA截止时间',
    },
    review_notes: {
      type: DataTypes.TEXT,
    },
    escalation_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    created_by: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    completed_by: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'ReviewQueue',
    tableName: 'review_queues',
    indexes: [
      { fields: ['status', 'priority'] },
      { fields: ['assigned_to', 'status'] },
      { fields: ['contract_id'] },
      { fields: ['queue_reason'] },
      { fields: ['created_at'] },
    ],
  }
);

module.exports = ReviewQueue;
