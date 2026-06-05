const { AuditLog } = require('../models');

const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
};

const createAuditLog = async (userId, action, entityType, entityId, details, ipAddress) => {
  await AuditLog.create({
    userId,
    action,
    entityType,
    entityId,
    details,
    ipAddress
  });
};

const sanitizeUser = (user, role) => {
  const userData = user.toJSON ? user.toJSON() : { ...user };
  
  if (role !== 'admin') {
    delete userData.password;
    delete userData.idCard;
    delete userData.balance;
  }
  
  if (role === 'resident') {
    delete userData.phone;
  }
  
  return userData;
};

const sanitizeBorrow = (borrow, role) => {
  const borrowData = borrow.toJSON ? borrow.toJSON() : { ...borrow };
  
  if (role === 'resident' && borrowData.user) {
    delete borrowData.user.phone;
    delete borrowData.user.idCard;
  }
  
  return borrowData;
};

module.exports = {
  roleMiddleware,
  createAuditLog,
  sanitizeUser,
  sanitizeBorrow
};
