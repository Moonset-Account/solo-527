const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../db/connection');

class RiskAnnotation extends Model {}

RiskAnnotation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    clause_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'clauses',
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
    risk_type: {
      type: DataTypes.ENUM('payment', 'breach', 'confidentiality', 'auto_renewal'),
      allowNull: false,
      comment: '风险类型：付款风险/违约风险/保密风险/自动续约风险',
    },
    risk_level: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium',
      comment: '风险等级：低/中/高/严重',
    },
    confidence_score: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      comment: '模型置信度 0-1',
    },
    is_low_confidence: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否为低置信度，进入二审队列',
    },
    ai_summary: {
      type: DataTypes.TEXT,
      comment: 'AI生成的风险提示说明（不能替代法律意见）',
    },
    ai_quoted_text: {
      type: DataTypes.TEXT,
      comment: 'AI引用的原文片段',
    },
    evidence_clause_ids: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
      comment: '检索到的证据条款ID列表',
    },
    historical_context_ids: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
      comment: '作为历史上下文使用的风险标注ID列表（来源：已通过/改标）',
    },
    ai_context_snapshot: {
      type: DataTypes.JSONB,
      comment: 'AI风险分析时的上下文快照：包含clause_type、historical_notes、相似条款引用、历史复核摘要',
    },
    source: {
      type: DataTypes.ENUM('ai', 'human', 'hybrid'),
      allowNull: false,
      defaultValue: 'ai',
      comment: '标注来源：AI/人工/混合',
    },
    status: {
      type: DataTypes.ENUM(
        'pending_review',
        'review_queue',
        'human_reviewed',
        'approved',
        'rejected',
        'modified'
      ),
      allowNull: false,
      defaultValue: 'pending_review',
      comment: '待复核/二审队列/已人工复核/已通过/已拒绝/已修改',
    },
    review_status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
      allowNull: false,
      defaultValue: 'not_started',
      comment: '复核状态',
    },
    human_notes: {
      type: DataTypes.TEXT,
      comment: '人工复核备注',
    },
    human_risk_level: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      comment: '人工调整后的风险等级',
    },
    human_risk_type: {
      type: DataTypes.ENUM('payment', 'breach', 'confidentiality', 'auto_renewal'),
      comment: '人工调整后的风险类型',
    },
    is_overruled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '人工是否推翻了AI判断',
    },
    created_by: {
      type: DataTypes.UUID,
      comment: '创建人ID（AI系统为null或系统用户）',
    },
    reviewed_by: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
      comment: '复核人ID',
    },
    reviewed_at: {
      type: DataTypes.DATE,
      comment: '复核时间',
    },
    queue_priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '二审队列优先级',
    },
    model_version: {
      type: DataTypes.STRING(50),
      comment: '检测时使用的模型版本',
    },
  },
  {
    sequelize,
    modelName: 'RiskAnnotation',
    tableName: 'risk_annotations',
    indexes: [
      { fields: ['clause_id'] },
      { fields: ['contract_id'] },
      { fields: ['risk_type'] },
      { fields: ['risk_level'] },
      { fields: ['status'] },
      { fields: ['is_low_confidence'] },
      { fields: ['review_status'] },
      { fields: ['reviewed_by', 'status'] },
    ],
  }
);

module.exports = RiskAnnotation;
