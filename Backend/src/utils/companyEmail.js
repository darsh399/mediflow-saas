import User from '../models/User.js';

function normalizeDomainCandidate(value) {
  if (!value) return '';
  return String(value).toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim();
}

// Prefer an explicit company email's domain, then the company website, and
// only fall back to normalizing companyName when neither is set — never
// assume companyName itself is a valid domain.
export function deriveCompanyDomain(company) {
  if (company?.companyEmail?.includes('@')) {
    const domain = normalizeDomainCandidate(company.companyEmail.split('@')[1]);
    if (domain) return domain;
  }
  const websiteDomain = normalizeDomainCandidate(company?.companyWebsite);
  if (websiteDomain) return websiteDomain;
  const normalizedName = String(company?.companyName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${normalizedName || 'company'}.com`;
}

function normalizeNamePart(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'user';
}

// Deterministic first.last@domain, with a numeric suffix appended to the
// local part on collision (rahul.sharma1@..., rahul.sharma2@...) since
// User.email is globally unique.
export async function generateCompanyEmail({ firstName, lastName, company }) {
  const domain = deriveCompanyDomain(company);
  const local = [normalizeNamePart(firstName), normalizeNamePart(lastName)].filter(Boolean).join('.');
  let candidate = `${local}@${domain}`;
  let suffix = 1;
  while (await User.exists({ email: candidate })) {
    candidate = `${local}${suffix}@${domain}`;
    suffix += 1;
  }
  return candidate;
}

export default { deriveCompanyDomain, generateCompanyEmail };
