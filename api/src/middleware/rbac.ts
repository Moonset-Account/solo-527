export function rbac(...allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' })
    }

    if (allowedRoles.length === 0) {
      return next()
    }

    const userRole = req.user.role
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: '权限不足' })
    }

    next()
  }
}
