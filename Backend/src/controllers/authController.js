
import crypto from 'crypto';
import mailService from '../services/mailService.js';
import Invite from '../models/Invite.js';
import { hasAnyRole } from '../utils/authorize.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import hashPassword from '../utils/hashPassword.js';
import createToken from '../utils/createToken.js';
import getCookieOptions from '../utils/getCookieOptions.js'
import { requireRole } from '../utils/authorize.js';

export const sendInvite = async (req, res) => {
  try {
    const sender = req.user; 
    if (!sender) return res.status(401).json({ message: 'Authentication required' });
    const allowed = ['admin', 'hr', 'manager'];
    if (!hasAnyRole(sender, allowed)) return res.status(403).json({ message: 'Insufficient permissions' });

    const { inviteeEmail, role = 'employee', profileTemplate, expiresDays = 7 } = req.body;
    if (!inviteeEmail) return res.status(400).json({ message: 'inviteeEmail is required' });

    
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + Number(expiresDays) * 24 * 60 * 60 * 1000);

    const invite = new Invite({
      inviter: sender.id,
      companyId: sender.companyId || null,
      inviteeEmail,
      role,
      token,
      expiresAt,
      profileTemplate
    });

    await invite.save();

   
    const base = process.env.FRONTEND_INVITE_URL || process.env.CLIENT_URL || 'http://localhost:3000';
    const inviteLink = `${base.replace(/\/$/, '')}/activate-account?token=${token}`;

    try {
      await mailService.sendMail({
        to: inviteeEmail,
        subject: process.env.INVITE_EMAIL_SUBJECT || 'You are invited to join',
        text: `You have been invited. Accept here: ${inviteLink}`,
        html: `<p>You have been invited to join.</p><p><a href="${inviteLink}">Click to accept invite</a></p>`
      })
      console.log('Invite email attempted via mailService for', inviteeEmail)
    } catch (err) {
      console.error('Failed to send invite email via mailService:', err && err.message ? err.message : err)
      console.log(`Invite created for ${inviteeEmail}: ${inviteLink}`)
    }

    return res.status(201).json({ message: 'Invite created', invite: { id: invite._id, inviteeEmail, inviteLink, expiresAt } });
  } catch (error) {
    console.error('Error creating invite:', error);
    return res.status(500).json({ message: 'Error creating invite', error: error.message });
  }
};

// Accept an invite token and create/update the user, applying profileTemplate and provided profile data.
export const acceptInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, ...profileData } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    const invite = await Invite.findOne({ token });
    if (!invite) return res.status(404).json({ message: 'Invite not found' });
    if (invite.status !== 'pending') return res.status(400).json({ message: 'Invite is not pending' });
    if (invite.expiresAt && invite.expiresAt < new Date()) return res.status(400).json({ message: 'Invite has expired' });

    if (!password) return res.status(400).json({ message: 'Password is required to accept invite' });

    // Check if user exists
    let user = await User.findOne({ email: invite.inviteeEmail });
    if (user) {
      // Update profile if provided
      user.profile = { ...(user.profile || {}), ...(invite.profileTemplate || {}), ...profileData };
      // update password
      user.password = await hashPassword(password);
      // ensure user is associated with the inviting company
      if (invite.companyId) user.companyId = invite.companyId;
      if (invite.role) user.role = invite.role;
      if (invite.profileTemplate?.mobile) user.mobile = invite.profileTemplate.mobile;
      await user.save();
    } else {
      const hashedPw = await hashPassword(password);
      const nameFromEmail = invite.inviteeEmail.split('@')[0];
      user = new User({
        name: profileData.name || nameFromEmail,
        email: invite.inviteeEmail,
        password: hashedPw,
        role: invite.role || 'employee',
        profile: { ...(invite.profileTemplate || {}), ...profileData },
        mobile: profileData.mobile || invite.profileTemplate?.mobile,
        companyId: invite.companyId || null
      });
      await user.save();
    }

    invite.status = 'accepted';
    invite.acceptedAt = new Date();
    await invite.save();

    if (invite.companyId && user.role === 'company_owner') {
      await Company.findByIdAndUpdate(invite.companyId, { ownerId: user._id });
    }

    const tokenJwt = createToken({ id: user._id, email: user.email, role: user.role, companyId: user.companyId });
    const userObj = user.toObject();
    delete userObj.password;
    // set HTTP-only cookie so clients receive the token for subsequent requests
    res.cookie('token', tokenJwt, getCookieOptions())
    return res.status(200).json({ message: 'Invite accepted', user: userObj, token: tokenJwt });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return res.status(500).json({ message: 'Error accepting invite', error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'email is required' });
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    const base = process.env.FRONTEND_INVITE_URL || process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${base.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
    await mailService.sendMail({
      to: user.email,
      subject: 'Reset your password',
      text: `Reset your password using this link: ${resetLink}`,
      html: `<p>Reset your password using this link:</p><p><a href="${resetLink}">Reset password</a></p>`
    });
  }
  return res.json({ message: 'If the account exists, a password reset link has been sent' });
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password || password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
  const tokenHash = crypto.createHash('sha256').update(token || '').digest('hex');
  const user = await User.findOne({ resetPasswordTokenHash: tokenHash, resetPasswordExpiresAt: { $gt: new Date() } }).select('+resetPasswordTokenHash +resetPasswordExpiresAt');
  if (!user) return res.status(400).json({ message: 'Reset token is invalid or expired' });
  user.password = await hashPassword(password);
  user.passwordChangeRequired = false;
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();
  return res.json({ message: 'Password reset successfully' });
};

export const changePassword = async (req, res) => {
  const { currentPassword, password } = req.body;
  if (!currentPassword || !password || password.length < 8) return res.status(400).json({ message: 'Current password and a new password of at least 8 characters are required' });
  const user = await User.findById(req.user.id);
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) return res.status(401).json({ message: 'Current password is incorrect' });
  user.password = await hashPassword(password);
  user.passwordChangeRequired = false;
  await user.save();
  return res.json({ message: 'Password changed successfully' });
};

export const currentUser = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(401).json({ message: 'User account not found' });
  return res.json({ user });
};

export default { sendInvite, acceptInvite, forgotPassword, resetPassword, changePassword, currentUser };
