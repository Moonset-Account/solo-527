import { ROLES } from '@/models/schemas'

const FIELD_PERMISSIONS = {
  users: {
    [ROLES.ADMIN]: ['*'],
    [ROLES.RESIDENT]: ['id', 'name', 'email', 'phone', 'avatar', 'role', 'plotIds', 'createdAt'],
    guest: ['id', 'name', 'avatar', 'role']
  },
  plots: {
    [ROLES.ADMIN]: ['*'],
    [ROLES.RESIDENT]: ['*'],
    guest: ['id', 'plotNumber', 'name', 'area', 'status', 'location', 'description']
  },
  claims: {
    [ROLES.ADMIN]: ['*'],
    [ROLES.RESIDENT]: ['id', 'plotId', 'applicantId', 'applicantName', 'plotNumber', 'reason', 'plannedCrops', 'status', 'createdAt'],
    guest: []
  },
  crops: {
    [ROLES.ADMIN]: ['*'],
    [ROLES.RESIDENT]: ['*'],
    guest: ['id', 'plotId', 'name', 'variety', 'category', 'plantedDate', 'status']
  },
  rotations: {
    [ROLES.ADMIN]: ['*'],
    [ROLES.RESIDENT]: ['id', 'date', 'type', 'description', 'startTime', 'endTime', 'assigneeId', 'assigneeName', 'plotIds', 'status'],
    guest: ['id', 'date', 'type', 'description', 'status']
  },
  tools: {
    [ROLES.ADMIN]: ['*'],
    [ROLES.RESIDENT]: ['*'],
    guest: ['id', 'name', 'category', 'status', 'availableQuantity', 'location']
  },
  toolBorrows: {
    [ROLES.ADMIN]: ['*'],
    [ROLES.RESIDENT]: ['id', 'toolId', 'toolName', 'borrowerId', 'borrowerName', 'quantity', 'borrowTime', 'expectedReturnTime', 'returnTime', 'status'],
    guest: []
  },
  announcements: {
    [ROLES.ADMIN]: ['*'],
    [ROLES.RESIDENT]: ['*'],
    guest: ['id', 'title', 'content', 'type', 'publishedByName', 'publishedAt']
  },
  harvests: {
    [ROLES.ADMIN]: ['*'],
    [ROLES.RESIDENT]: ['*'],
    guest: []
  },
  photoLogs: {
    [ROLES.ADMIN]: ['*'],
    [ROLES.RESIDENT]: ['*'],
    guest: ['id', 'title', 'description', 'photoUrl', 'plotId', 'uploadedByName', 'createdAt']
  }
}

export function filterSensitiveFields(collectionName, data, userRole) {
  if (!data) return data
  
  const permissions = FIELD_PERMISSIONS[collectionName]
  if (!permissions) return data
  
  const allowedFields = permissions[userRole] || permissions.guest || []
  
  if (allowedFields.includes('*')) {
    return data
  }
  
  if (Array.isArray(data)) {
    return data.map(item => filterObject(item, allowedFields))
  }
  
  return filterObject(data, allowedFields)
}

function filterObject(obj, allowedFields) {
  if (!obj || typeof obj !== 'object') return obj
  
  const filtered = {}
  for (const field of allowedFields) {
    if (obj.hasOwnProperty(field)) {
      filtered[field] = obj[field]
    }
  }
  return filtered
}

export function hasPermission(collectionName, action, userRole) {
  const rolePermissions = {
    [ROLES.ADMIN]: {
      plots: ['create', 'read', 'update', 'delete'],
      claims: ['create', 'read', 'update', 'delete'],
      crops: ['create', 'read', 'update', 'delete'],
      rotations: ['create', 'read', 'update', 'delete'],
      tools: ['create', 'read', 'update', 'delete'],
      toolBorrows: ['create', 'read', 'update', 'delete'],
      announcements: ['create', 'read', 'update', 'delete'],
      harvests: ['create', 'read', 'update', 'delete'],
      photoLogs: ['create', 'read', 'update', 'delete'],
      users: ['create', 'read', 'update', 'delete']
    },
    [ROLES.RESIDENT]: {
      plots: ['read', 'update'],
      claims: ['create', 'read', 'update'],
      crops: ['create', 'read', 'update'],
      rotations: ['read', 'update'],
      tools: ['read'],
      toolBorrows: ['create', 'read', 'update'],
      announcements: ['read'],
      harvests: ['create', 'read', 'update'],
      photoLogs: ['create', 'read', 'update', 'delete'],
      users: ['read', 'update']
    },
    guest: {
      plots: ['read'],
      claims: [],
      crops: ['read'],
      rotations: ['read'],
      tools: ['read'],
      toolBorrows: [],
      announcements: ['read'],
      harvests: [],
      photoLogs: ['read'],
      users: []
    }
  }
  
  const permissions = rolePermissions[userRole] || rolePermissions.guest
  return permissions[collectionName]?.includes(action) || false
}

export function canViewSensitiveData(userRole) {
  return userRole === ROLES.ADMIN
}

export function canManageUsers(userRole) {
  return userRole === ROLES.ADMIN
}

export function canApproveClaims(userRole) {
  return userRole === ROLES.ADMIN
}

export function canManageRotations(userRole) {
  return userRole === ROLES.ADMIN
}
