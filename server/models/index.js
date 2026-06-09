const User = require('./User');
const Contract = require('./Contract');
const ContractVersion = require('./ContractVersion');
const Clause = require('./Clause');
const RiskAnnotation = require('./RiskAnnotation');
const VectorIndexVersion = require('./VectorIndexVersion');
const AuditLog = require('./AuditLog');
const Alert = require('./Alert');
const ReviewQueue = require('./ReviewQueue');
const ClauseList = require('./ClauseList');

Contract.belongsTo(User, { as: 'uploader', foreignKey: 'uploader_id' });
Contract.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewer_id' });
Contract.hasMany(ContractVersion, { foreignKey: 'contract_id', as: 'versions' });
Contract.hasMany(Clause, { foreignKey: 'contract_id', as: 'clauses' });
Contract.hasMany(RiskAnnotation, { foreignKey: 'contract_id', as: 'riskAnnotations' });
Contract.hasMany(VectorIndexVersion, { foreignKey: 'contract_id', as: 'vectorIndexes' });
Contract.hasMany(ReviewQueue, { foreignKey: 'contract_id', as: 'reviewQueues' });
Contract.hasMany(ClauseList, { foreignKey: 'contract_id', as: 'clauseLists' });

ContractVersion.belongsTo(Contract, { foreignKey: 'contract_id' });
ContractVersion.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
ContractVersion.hasMany(Clause, { foreignKey: 'contract_version_id', as: 'clauses' });
ContractVersion.hasOne(VectorIndexVersion, { foreignKey: 'contract_version_id', as: 'vectorIndex' });
ContractVersion.hasMany(ClauseList, { foreignKey: 'contract_version_id', as: 'clauseLists' });

Clause.belongsTo(Contract, { foreignKey: 'contract_id' });
Clause.belongsTo(ContractVersion, { foreignKey: 'contract_version_id' });
Clause.hasMany(RiskAnnotation, { foreignKey: 'clause_id', as: 'riskAnnotations' });

RiskAnnotation.belongsTo(Contract, { foreignKey: 'contract_id' });
RiskAnnotation.belongsTo(Clause, { foreignKey: 'clause_id' });
RiskAnnotation.belongsTo(User, { as: 'reviewerUser', foreignKey: 'reviewed_by' });
RiskAnnotation.hasOne(ReviewQueue, { foreignKey: 'risk_annotation_id', as: 'reviewQueueItem' });

VectorIndexVersion.belongsTo(Contract, { foreignKey: 'contract_id' });
VectorIndexVersion.belongsTo(ContractVersion, { foreignKey: 'contract_version_id' });
VectorIndexVersion.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });

ReviewQueue.belongsTo(Contract, { foreignKey: 'contract_id' });
ReviewQueue.belongsTo(Clause, { foreignKey: 'clause_id' });
ReviewQueue.belongsTo(RiskAnnotation, { foreignKey: 'risk_annotation_id' });
ReviewQueue.belongsTo(User, { as: 'assignee', foreignKey: 'assigned_to' });
ReviewQueue.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
ReviewQueue.belongsTo(User, { as: 'completer', foreignKey: 'completed_by' });

ClauseList.belongsTo(Contract, { foreignKey: 'contract_id' });
ClauseList.belongsTo(ContractVersion, { foreignKey: 'contract_version_id' });
ClauseList.belongsTo(User, { as: 'generator', foreignKey: 'generated_by' });
ClauseList.belongsTo(User, { as: 'approver', foreignKey: 'approved_by' });

AuditLog.belongsTo(User, { foreignKey: 'user_id' });
AuditLog.belongsTo(Contract, { foreignKey: 'contract_id' });

Alert.belongsTo(Contract, { foreignKey: 'contract_id' });
Alert.belongsTo(User, { as: 'acknowledger', foreignKey: 'acknowledged_by' });
Alert.belongsTo(User, { as: 'resolver', foreignKey: 'resolved_by' });

module.exports = {
  User,
  Contract,
  ContractVersion,
  Clause,
  RiskAnnotation,
  VectorIndexVersion,
  AuditLog,
  Alert,
  ReviewQueue,
  ClauseList,
};
