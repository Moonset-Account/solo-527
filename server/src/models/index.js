const User = require('./User');
const Tool = require('./Tool');
const Borrow = require('./Borrow');
const Maintenance = require('./Maintenance');
const AuditLog = require('./AuditLog');
const Notification = require('./Notification');

User.hasMany(Borrow, { foreignKey: 'userId' });
Borrow.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Tool.hasMany(Borrow, { foreignKey: 'toolId' });
Borrow.belongsTo(Tool, { foreignKey: 'toolId', as: 'tool' });

User.hasMany(Borrow, { foreignKey: 'approvedBy', as: 'approvedBorrows' });
Borrow.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

Tool.hasMany(Maintenance, { foreignKey: 'toolId' });
Maintenance.belongsTo(Tool, { foreignKey: 'toolId', as: 'tool' });

User.hasMany(Maintenance, { foreignKey: 'reporterId', as: 'reportedMaintenances' });
Maintenance.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });

User.hasMany(AuditLog, { foreignKey: 'userId' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  User,
  Tool,
  Borrow,
  Maintenance,
  AuditLog,
  Notification
};
