const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../db/connection');

class Contract extends Model {}

Contract.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '合同标题',
    },
    contract_number: {
      type: DataTypes.STRING(50),
      unique: true,
      comment: '合同编号',
    },
    party_a: {
      type: DataTypes.STRING(255),
      comment: '甲方',
    },
    party_b: {
      type: DataTypes.STRING(255),
      comment: '乙方',
    },
    contract_type: {
      type: DataTypes.STRING(50),
      comment: '合同类型（采购、销售、服务等）',
    },
    effective_date: {
      type: DataTypes.DATE,
      comment: '生效日期',
    },
    expiry_date: {
      type: DataTypes.DATE,
      comment: '到期日期',
    },
    current_version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '当前版本号',
    },
    status: {
      type: DataTypes.ENUM('draft', 'processing', 'reviewing', 'approved', 'rejected', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
      comment: '草稿/处理中/复核中/已通过/已拒绝/已归档',
    },
    uploader_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    reviewer_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
      comment: '当前复核人',
    },
    description: {
      type: DataTypes.TEXT,
      comment: '合同描述',
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'Contract',
    tableName: 'contracts',
    indexes: [
      { fields: ['status'] },
      { fields: ['contract_type'] },
      { fields: ['uploader_id'] },
      { fields: ['reviewer_id'] },
    ],
  }
);

module.exports = Contract;
