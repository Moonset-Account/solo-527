const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../db/connection');

class VectorIndexVersion extends Model {}

VectorIndexVersion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    contract_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'contracts',
        key: 'id',
      },
    },
    contract_version_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'contract_versions',
        key: 'id',
      },
    },
    index_version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '向量索引版本号',
    },
    index_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '向量索引名称/命名空间',
    },
    embedding_model: {
      type: DataTypes.STRING(100),
      comment: '使用的嵌入模型',
    },
    embedding_dimension: {
      type: DataTypes.INTEGER,
      comment: '嵌入向量维度',
    },
    total_vectors: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '索引中的向量总数',
    },
    status: {
      type: DataTypes.ENUM('building', 'ready', 'failed', 'archived'),
      allowNull: false,
      defaultValue: 'building',
      comment: '构建中/就绪/失败/已归档',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否为当前活跃索引',
    },
    build_started_at: {
      type: DataTypes.DATE,
    },
    build_completed_at: {
      type: DataTypes.DATE,
    },
    build_duration_ms: {
      type: DataTypes.BIGINT,
      comment: '构建耗时（毫秒）',
    },
    error_message: {
      type: DataTypes.TEXT,
      comment: '构建失败时的错误信息',
    },
    created_by: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: '额外元数据',
    },
  },
  {
    sequelize,
    modelName: 'VectorIndexVersion',
    tableName: 'vector_index_versions',
    indexes: [
      { fields: ['contract_id', 'index_version'], unique: true },
      { fields: ['contract_id', 'is_active'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = VectorIndexVersion;
