const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../db/connection');

class ContractVersion extends Model {}

ContractVersion.init(
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
    version_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '版本号',
    },
    original_filename: {
      type: DataTypes.STRING(255),
      comment: '原始文件名',
    },
    storage_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '文件存储路径',
    },
    file_size: {
      type: DataTypes.BIGINT,
      comment: '文件大小（字节）',
    },
    file_hash: {
      type: DataTypes.STRING(64),
      comment: '文件SHA256哈希',
    },
    content_text: {
      type: DataTypes.TEXT,
      comment: '提取的合同纯文本内容',
    },
    vector_index_version: {
      type: DataTypes.INTEGER,
      comment: '对应的向量索引版本号',
    },
    change_summary: {
      type: DataTypes.TEXT,
      comment: '版本变更说明',
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否为当前活跃版本',
    },
    rollback_from_version: {
      type: DataTypes.INTEGER,
      comment: '回滚来源版本号',
    },
  },
  {
    sequelize,
    modelName: 'ContractVersion',
    tableName: 'contract_versions',
    indexes: [
      { fields: ['contract_id', 'version_number'], unique: true },
      { fields: ['contract_id', 'is_active'] },
      { fields: ['file_hash'] },
    ],
  }
);

module.exports = ContractVersion;
