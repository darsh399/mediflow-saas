import Company from '../models/Company.js';
import companyService from '../services/companyService.js';

export const createCompany = async (req, res) => {
  try {
    const { companyName, ownerId } = req.body;
    const result = await companyService.createCompany({ companyName, ownerId });
    return res.status(201).json({ message: 'Company created', company: result });
  } catch (error) {
    console.error('Create company error:', error);
    return res.status(500).json({ message: 'Error creating company', error: error.message });
  }
};

export const getCompany = async (req, res) => {
  try {
    const companyId = req.params.id;
    const company = await companyService.getCompanyById(companyId);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    return res.status(200).json({ company });
  } catch (error) {
    console.error('Get company error:', error);
    return res.status(500).json({ message: 'Error fetching company', error: error.message });
  }
};

export default { createCompany, getCompany };
