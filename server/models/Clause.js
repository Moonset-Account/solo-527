const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../db/connection');

class Clause extends Model {}

Clause.init(
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
    clause_number: {
      type: DataTypes.STRING(20),
      comment: '条款编号，如 3.1、第五条',
    },
    clause_title: {
      type: DataTypes.STRING(255),
      comment: '条款标题',
    },
    clause_type: {
      type: DataTypes.ENUM(
        'payment',
        'breach',
        'confidentiality',
        'auto_renewal',
        'definition',
        'obligation',
        'termination',
        'liability',
        'ip',
        'dispute',
        'force_majeure',
        'other'
      ),
      allowNull: false,
      defaultValue: 'other',
      comment: '条款类型：付款/违约/保密/自动续约/定义/义务/终止/责任/知识产权/争议/不可抗力/其他',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '条款原文内容',
    },
    start_position: {
      type: DataTypes.INTEGER,
      comment: '在合同文本中的起始位置',
    },
    end_position: {
      type: DataTypes.INTEGER,
      comment: '在合同文本中的结束位置',
    },
    page_number: {
      type: DataTypes.INTEGER,
      comment: '页码',
    },
    is_amended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否为修改条款',
    },
    historical_notes: {
      type: DataTypes.TEXT,
      comment: '历史修改意见汇总',
    },
    embedding_id: {
      type: DataTypes.STRING(100),
      comment: '向量数据库中的嵌入ID',
    },
  },
  {
    sequelize,
    modelName: 'Clause',
    tableName: 'clauses',
    indexes: [
      { fields: ['contract_id'] },
      { fields: ['contract_version_id'] },
      { fields: ['clause_type'] },
    ],
  }
);

module.exports = Clause;
