const AUTH_KEY = 'fwc_auth_v1';

export const setAuth = (data) => {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
  } catch {}
};

export const getAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getToken = () => getAuth()?.token || '';
export const getUser = () => getAuth()?.user || null;
export const getRole = () => getUser()?.role || 'VIEWER';
export const getSupplierId = () => getUser()?.supplierId || null;

export const clearAuth = () => {
  localStorage.removeItem(AUTH_KEY);
};

export const ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  WAREHOUSE_MANAGER: 'WAREHOUSE_MANAGER',
  PURCHASE_STAFF: 'PURCHASE_STAFF',
  QC_STAFF: 'QC_STAFF',
  SUPPLIER: 'SUPPLIER',
  VIEWER: 'VIEWER',
};

export const ROLE_LABELS = {
  SUPER_ADMIN: '超级管理员',
  WAREHOUSE_MANAGER: '仓库主管',
  PURCHASE_STAFF: '采购员',
  QC_STAFF: '质检员',
  SUPPLIER: '供应商',
  VIEWER: '只读用户',
};

const roleRank = {
  SUPER_ADMIN: 100,
  WAREHOUSE_MANAGER: 90,
  PURCHASE_STAFF: 80,
  QC_STAFF: 80,
  SUPPLIER: 50,
  VIEWER: 10,
};

export const hasRole = (...roles) => roles.includes(getRole());
export const isInternal = () => hasRole(ROLE.SUPER_ADMIN, ROLE.WAREHOUSE_MANAGER, ROLE.PURCHASE_STAFF, ROLE.QC_STAFF);
export const canWrite = () => isInternal();
export const roleAtLeast = (r) => (roleRank[getRole()] || 0) >= (roleRank[r] || 0);
