import subscriptionService from '../services/subscriptionService.js';

export const createSubscription = async (req, res) => {
  try {
    const { companyId, plan, startDate, endDate, autoRenew } = req.body;
    const sub = await subscriptionService.createSubscription({ companyId, plan, startDate, endDate, autoRenew });
    return res.status(201).json({ message: 'Subscription created', subscription: sub });
  } catch (error) {
    console.error('Create subscription error:', error);
    return res.status(500).json({ message: 'Error creating subscription', error: error.message });
  }
};

export const getSubscription = async (req, res) => {
  try {
    const companyId = req.params.companyId || req.user?.companyId;
    const sub = await subscriptionService.getLatestSubscription(companyId);
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    return res.status(200).json({ subscription: sub });
  } catch (error) {
    console.error('Get subscription error:', error);
    return res.status(500).json({ message: 'Error fetching subscription', error: error.message });
  }
};

export default { createSubscription, getSubscription };
