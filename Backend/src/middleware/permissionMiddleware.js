import { hasPermission } from '../config/permissions.js'

export default function authorize(permission) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' })
    if (!hasPermission(req.user, permission)) return res.status(403).json({ message: 'Insufficient permissions' })
    return next()
  }
}
