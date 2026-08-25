import subscriptionService from '../services/subscriptionService.js';

export default async function subscriptionMiddleware(req, res, next) {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(400).json({ message: 'Company context missing' });
    const subscription = await subscriptionService.getLatestSubscription(companyId);
    if (!subscription) return res.status(403).json({ message: 'Subscription not found' });
    if (!['ACTIVE', 'TRIAL', 'GRACE'].includes(subscription.status)) {
      return res.status(403).json({ message: 'Subscription expired' });
    }
    req.subscription = subscription;
    return next();
  } catch (error) {
    console.error('Subscription middleware error:', error.message);
    return res.status(500).json({ message: 'Subscription validation error' });
  }
}
