import Subscription from '../models/Subscription.js';

export async function createSubscription({ companyId, plan, startDate, endDate, autoRenew = false }) {
  const sub = new Subscription({ companyId, plan, startDate, endDate, status: 'ACTIVE', autoRenew });
  await sub.save();
  return sub;
}

export async function getLatestSubscription(companyId) {
  return Subscription.findOne({ companyId }).sort({ endDate: -1 });
}

export default { createSubscription, getLatestSubscription };
