import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Company from '../models/Company.js';
import Invite from '../models/Invite.js';

export default async function authMiddleware(req, res, next) {
  try {
    // Prefer Authorization header, fallback to cookie named 'token'
    const header = req.headers.authorization || req.headers.Authorization;
    let token = null;
    if (header && header.startsWith('Bearer ')) {
      token = header.split(' ')[1];
    } else if (req.headers.cookie) {
      // parse cookies from header
      const raw = req.headers.cookie.split(';').map(c=>c.trim());
      for (const pair of raw) {
        const [k,v] = pair.split('=');
        if (k === 'token') { token = decodeURIComponent(v); break }
      }
    }
    if (!token) return res.status(401).json({ message: 'Authorization token missing' });
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: 'JWT_SECRET not configured' });
    const payload = jwt.verify(token, secret);
    if (!payload.id) return res.status(401).json({ message: 'Invalid token subject' });
    const user = await User.findById(payload.id).select('_id email role companyId active blocked');
    if (!user) return res.status(401).json({ message: 'User account not found' });
    if (user.blocked || user.active === false) return res.status(403).json({ message: 'Account is disabled or blocked' });
    let company = null;
    let ownedCompany = await Company.findOne({ ownerId: user._id }).select('_id status isActive');
    if (!ownedCompany) {
      const acceptedOwnerInvite = await Invite.findOne({ inviteeEmail: user.email, role: 'company_owner', status: 'accepted' }).sort({ acceptedAt: -1 });
      if (acceptedOwnerInvite?.companyId) {
        ownedCompany = await Company.findByIdAndUpdate(acceptedOwnerInvite.companyId, { ownerId: user._id }, { new: true }).select('_id status isActive');
      }
    }
    if (ownedCompany) {
      if (String(user.companyId || '') !== String(ownedCompany._id) || user.role !== 'company_owner') {
        user.companyId = ownedCompany._id;
        user.role = 'company_owner';
        await user.save();
      }
      company = ownedCompany;
    } else if (user.companyId && user.role !== 'super_admin') {
      company = await Company.findById(user.companyId).select('status isActive');
    }
    if (company && user.role !== 'super_admin') {
      if (!company || !company.isActive || company.status !== 'ACTIVE') return res.status(403).json({ message: `Company account is ${company?.status || 'inactive'}` });
    }
    req.user = {
      id: user._id,
      email: user.email,
      companyId: user.companyId || null,
      role: user.role
    };
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
