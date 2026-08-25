import Company from '../models/Company.js'
import { MODULES, normalizeModules } from '../config/modules.js'

export default function requireModule(module) {
  return async (req, res, next) => {
    try {
      if (req.user?.role === 'super_admin') return next()
      const companyId = req.user?.companyId
      if (!companyId) return res.status(400).json({ message: 'Company context missing' })
      const company = req.company || await Company.findById(companyId).select('enabledModules')
      if (!company) return res.status(404).json({ message: 'Company not found' })
      const enabledModules = normalizeModules(company.enabledModules)
      if (!MODULES.includes(module) || !enabledModules.includes(module)) {
        return res.status(403).json({ message: 'This module is disabled for your company' })
      }
      req.company = company
      return next()
    } catch (error) {
      return next(error)
    }
  }
}
