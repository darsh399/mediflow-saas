import Subscription from '../models/Subscription.js';

export default async function subscriptionMiddleware(req, res, next) {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(400).json({ message: 'Company context missing' });
    const subscription = await Subscription.findOne({ companyId }).sort({ endDate: -1 });
    if (!subscription) return res.status(403).json({ message: 'Subscription not found' });
    if (subscription.status !== 'ACTIVE' || (subscription.endDate && subscription.endDate < new Date())) {
      return res.status(403).json({ message: 'Subscription expired' });
    }
    req.subscription = subscription;
    return next();
  } catch (error) {
    console.error('Subscription middleware error:', error.message);
    return res.status(500).json({ message: 'Subscription validation error' });
  }
}
