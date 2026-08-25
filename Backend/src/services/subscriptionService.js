import Subscription from '../models/Subscription.js';
import SubscriptionHistory from '../models/SubscriptionHistory.js';
import Company from '../models/Company.js';
import { normalizeModules } from '../config/modules.js';

export const PLAN_DEFAULTS = {
  FREE: { price: 0, durationMonths: 1, employeeLimit: 5, storageLimit: 1 },
  TRIAL: { price: 0, durationMonths: 14 / 30, employeeLimit: 10, storageLimit: 1 },
  BASIC: { price: 29, durationMonths: 1, employeeLimit: 25, storageLimit: 5 },
  PROFESSIONAL: { price: 99, durationMonths: 1, employeeLimit: 100, storageLimit: 10 },
  ENTERPRISE: { price: 0, durationMonths: 12, employeeLimit: 1000, storageLimit: 100 },
  '6_MONTHS': { price: 0, durationMonths: 6, employeeLimit: 100, storageLimit: 10 },
  '1_YEAR': { price: 0, durationMonths: 12, employeeLimit: 100, storageLimit: 10 },
};

function dateAfterMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function effectiveStatus(subscription, now = new Date()) {
  if (subscription.status === 'CANCELLED') return 'CANCELLED';
  if (subscription.endDate >= now) return subscription.plan === 'TRIAL' ? 'TRIAL' : 'ACTIVE';
  const graceEnd = new Date(subscription.endDate);
  graceEnd.setDate(graceEnd.getDate() + (subscription.gracePeriodDays || 0));
  return graceEnd >= now ? 'GRACE' : 'EXPIRED';
}

export async function createSubscription({ companyId, plan = 'TRIAL', startDate = new Date(), endDate, autoRenew = false, price, durationMonths, employeeLimit, storageLimit, enabledModules, gracePeriodDays = 0, changedBy, action = 'CREATED' }) {
  const defaults = PLAN_DEFAULTS[plan];
  if (!defaults) throw new Error('Unsupported subscription plan');
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : dateAfterMonths(start, defaults.durationMonths);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) throw new Error('Invalid subscription dates');
  const sub = new Subscription({
    companyId,
    plan,
    startDate: start,
    endDate: end,
    status: plan === 'TRIAL' ? 'TRIAL' : 'ACTIVE',
    autoRenew,
    price: price ?? defaults.price,
    durationMonths: durationMonths ?? defaults.durationMonths,
    employeeLimit: employeeLimit ?? defaults.employeeLimit,
    storageLimit: storageLimit ?? defaults.storageLimit,
    enabledModules: normalizeModules(enabledModules),
    gracePeriodDays,
  });
  await sub.save();
  await Company.findByIdAndUpdate(companyId, {
    employeeLimit: sub.employeeLimit,
    storageLimit: sub.storageLimit,
    enabledModules: sub.enabledModules,
  });
  await SubscriptionHistory.create({ companyId, subscriptionId: sub._id, action, plan: sub.plan, startDate: sub.startDate, endDate: sub.endDate, price: sub.price, changedBy });
  return sub;
}

export async function getLatestSubscription(companyId) {
  const subscription = await Subscription.findOne({ companyId }).sort({ endDate: -1 });
  if (!subscription) return null;
  const status = effectiveStatus(subscription);
  if (subscription.status !== status) {
    subscription.status = status;
    await subscription.save();
  }
  return subscription;
}

export { effectiveStatus };
export default { createSubscription, getLatestSubscription, effectiveStatus, PLAN_DEFAULTS };
