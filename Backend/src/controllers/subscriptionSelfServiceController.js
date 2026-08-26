import Subscription from '../models/Subscription.js';
import Company from '../models/Company.js';

// Read-only self-service view of the caller's own company subscription —
// distinct from subscriptionController.js, which is the super_admin-only
// create/manage endpoint used to provision subscriptions for any company.
// company_owner can see their plan/status/expiry here but cannot change it
// (upgrading/renewing a plan is a billing/payments decision out of scope).
export async function getMySubscription(req, res) {
  const companyId = req.user.companyId;
  const [company, subscription] = await Promise.all([
    Company.findById(companyId).select('companyName status isActive employeeLimit storageLimit').lean(),
    Subscription.findOne({ companyId }).sort({ endDate: -1 }).lean(),
  ]);
  if (!company) return res.status(404).json({ message: 'Company not found' });
  return res.status(200).json({ company, subscription: subscription || null });
}

export default { getMySubscription };
