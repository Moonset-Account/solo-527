const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../db/connection');

class ClauseList extends Model {}

ClauseList.init(
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
    vector_index_version: {
      type: DataTypes.INTEGER,
      comment: '生成清单时对应的向量索引版本号，与ContractVersion.vector_index_version绑定',
    },
    generation_basis: {
      type: DataTypes.JSONB,
      comment: '生成清单时的合规快照（合同状态、版本、风险复核情况等）',
    },
    version_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '清单版本号',
    },
    title: {
      type: DataTypes.STRING(255),
      comment: '清单标题',
    },
    status: {
      type: DataTypes.ENUM('draft', 'finalized', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    },
    clause_items: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: '条款清单项JSON数组',
    },
    risk_summary: {
      type: DataTypes.JSONB,
      comment: '风险汇总统计',
    },
    generated_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      comment: '生成人（必须是已复核通过的法务）',
    },
    approved_by: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approved_at: {
      type: DataTypes.DATE,
    },
    exported_at: {
      type: DataTypes.DATE,
    },
    export_format: {
      type: DataTypes.STRING(20),
      comment: '导出格式：pdf, docx, excel',
    },
    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize,
    modelName: 'ClauseList',
    tableName: 'clause_lists',
    indexes: [
      { fields: ['contract_id'] },
      { fields: ['status'] },
      { fields: ['generated_by'] },
      { fields: ['contract_id', 'version_number'], unique: true },
    ],
  }
);

module.exports = ClauseList;
