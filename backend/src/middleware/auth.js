const athletes = require('../data/mockData').athletes;
const coaches = require('../data/mockData').coaches;

class AuthMiddleware {
  constructor() {
    this.userStore = new Map();
  }

  extractUser(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return this.decodeToken(token);
    }

    const mockUserId = req.headers['x-mock-user-id'];
    const mockUserRole = req.headers['x-mock-user-role'];

    if (mockUserId && mockUserRole) {
      return { id: mockUserId, role: mockUserRole };
    }

    return null;
  }

  decodeToken(token) {
    if (!token || !token.startsWith('mock-jwt-token-')) {
      return null;
    }

    const prefix = 'mock-jwt-token-';
    const userData = token.substring(prefix.length);
    try {
      return JSON.parse(Buffer.from(userData, 'base64').toString() || '{}');
    } catch {
      return null;
    }
  }

  requireAuth(req, res, next) {
    const user = this.extractUser(req);
    if (!user) {
      return res.status(401).json({ error: '未授权，请先登录' });
    }
    req.user = user;
    next();
  }

  requireCoach(req, res, next) {
    const user = this.extractUser(req);
    if (!user) {
      return res.status(401).json({ error: '未授权' });
    }
    if (user.role !== 'coach' && user.role !== 'rehab' && user.role !== 'head') {
      return res.status(403).json({ error: '需要教练权限' });
    }
    req.user = user;
    next();
  }

  enforceDataPermission(req, res, next) {
    const user = this.extractUser(req);
    if (!user) {
      return res.status(401).json({ error: '未授权' });
    }

    req.user = user;

    const isCoach = user.role === 'coach' || user.role === 'rehab' || user.role === 'head';

    if (isCoach) {
      req.dataScope = { type: 'all' };
      return next();
    }

    const athleteId = user.id;
    const validAthlete = athletes.find(a => a.id === athleteId);
    if (!validAthlete) {
      return res.status(403).json({ error: '无效的队员身份' });
    }

    req.dataScope = {
      type: 'self',
      athleteId: athleteId
    };

    const requestedAthleteId = req.query.athleteId || req.body?.athleteId;
    if (requestedAthleteId && requestedAthleteId !== athleteId) {
      return res.status(403).json({
        error: '权限不足：队员只能查看自己的数据',
        allowedAthleteId: athleteId
      });
    }

    if (req.query.athleteIds) {
      const ids = Array.isArray(req.query.athleteIds)
        ? req.query.athleteIds
        : [req.query.athleteIds];
      if (ids.some(id => id !== athleteId)) {
        return res.status(403).json({
          error: '权限不足：队员只能查看自己的数据',
          allowedAthleteId: athleteId
        });
      }
    }

    next();
  }

  filterInjuryData(records, userRole) {
    if (userRole === 'coach' || userRole === 'rehab' || userRole === 'head') {
      return records;
    }
    return records.map(({ internalNotes, ...rest }) => rest);
  }

  canViewInternalNotes(userRole) {
    return userRole === 'coach' || userRole === 'rehab' || userRole === 'head';
  }
}

module.exports = new AuthMiddleware();
