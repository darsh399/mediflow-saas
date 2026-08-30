import Company from '../models/Company.js'
import { MODULES, isModuleEnabled } from '../config/modules.js'

// Gate a route on a company-level feature entitlement.
// authMiddleware / companyMiddleware run first and establish req.user + req.company.
export default function requireModule(moduleKey) {
  return async (req, res, next) => {
    try {
      if (req.user?.role === 'super_admin') return next()
      const companyId = req.user?.companyId
      if (!companyId) return res.status(400).json({ message: 'Company context missing' })
      const company = req.company || await Company.findById(companyId).select('enabledModules')
      if (!company) return res.status(404).json({ message: 'Company not found' })
      req.company = company

      if (!MODULES.includes(moduleKey)) {
        return res.status(500).json({ message: `Unknown feature "${moduleKey}"` })
      }
      if (!isModuleEnabled(company, moduleKey)) {
        return res.status(403).json({ message: 'Feature not enabled for this company', feature: moduleKey })
      }
      return next()
    } catch (error) {
      return next(error)
    }
  }
}

export { requireModule }
