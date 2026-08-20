import Company from '../models/Company.js';

export async function createCompany({ companyName, ownerId, status = 'PENDING', companyEmail, companyMobile, companyAddress, companyWebsite }) {
  const company = new Company({ companyName, ownerId, status, isActive: status === 'ACTIVE', companyEmail, companyMobile, companyAddress, companyWebsite });
  await company.save();
  return company;
}

export async function getCompanyById(id) {
  return Company.findById(id);
}

export default { createCompany, getCompanyById };
