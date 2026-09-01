import Company from '../models/Company.js';

export default async function companyMiddleware(req, res, next) {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(400).json({ message: 'Company context missing' });
    const company = req.company || await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    if (!company.isActive || company.status !== 'ACTIVE') {
      return res.status(403).json({ message: `Company account is ${company.status || 'inactive'}` });
    }
    req.company = company;
    req.companyId = companyId;
    return next();
  } catch (error) {
    console.error('Company middleware error:', error.message);
    return res.status(500).json({ message: 'Company validation error' });
  }
}
