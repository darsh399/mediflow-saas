
import crypto from 'crypto';
import mailService from '../services/mailService.js';
import Invite from '../models/Invite.js';
import { hasAnyRole } from '../utils/authorize.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import hashPassword from '../utils/hashPassword.js';
import { clearSessionCookies, refreshSession, issueSession } from '../services/sessionService.js';
import { requireRole } from '../utils/authorize.js';
import bcrypt from 'bcrypt';

export const sendInvite = async (req, res) => {
  try {
    const sender = req.user; 
    if (!sender) return res.status(401).json({ message: 'Authentication required' });
    const allowed = ['admin', 'hr_manager', 'hr', 'manager', 'company_owner'];
    if (!hasAnyRole(sender, allowed)) return res.status(403).json({ message: 'Insufficient permissions' });

    const { inviteeEmail, role = 'employee', profileTemplate, expiresDays = 7 } = req.body;
    if (!inviteeEmail) return res.status(400).json({ message: 'inviteeEmail is required' });
    if (!sender.companyId) return res.status(400).json({ message: 'Company context is required to invite an employee' });
    const allowedRoles = ['hr_manager', 'hr', 'manager', 'project_manager', 'employee', 'mr', ];
    if (!allowedRoles.includes(role)) return res.status(400).json({ message: 'Invalid employee invitation role' });
    const existingUser = await User.findOne({ email: inviteeEmail.toLowerCase().trim() });
    if (existingUser) return res.status(409).json({ message: 'Email already belongs to a user' });

    
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + Number(expiresDays) * 24 * 60 * 60 * 1000);

    const invite = new Invite({
      inviter: sender.id,
      companyId: sender.companyId || null,
      inviteeEmail,
      role,
      tokenHash,
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

    const tokenHash = crypto.createHash('sha256').update(token || '').digest('hex');
    const invite = await Invite.findOne({ $or: [{ tokenHash }, { token }] }).select('+tokenHash');
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
      user.name = profileData.fullName || profileData.name || invite.profileTemplate?.fullName || invite.profileTemplate?.name || user.name;
      if (invite.profileTemplate?.mobile) user.mobile = invite.profileTemplate.mobile;
      await user.save();
    } else {
      const hashedPw = await hashPassword(password);
      const nameFromEmail = invite.inviteeEmail.split('@')[0];
      user = new User({
        name: profileData.fullName || profileData.name || invite.profileTemplate?.fullName || invite.profileTemplate?.name || nameFromEmail,
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

    const tokenJwt = await issueSession(res, user);
    const userObj = user.toObject();
    delete userObj.password;
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


export const currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate(
        "companyId",
        "name website phone email address"
      );

    if (!user) {
      return res.status(401).json({
        message: "User account not found",
      });
    }

    return res.status(200).json({
      user,
    });

  } catch (error) {
    console.error("Current user error:", error);

    return res.status(500).json({
      message: "Failed to fetch current user",
      error: error.message,
    });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const session = await refreshSession(req, res);
    if (!session) {
      clearSessionCookies(res);
      return res.status(401).json({ message: 'Refresh token is invalid or expired', code: 'REFRESH_TOKEN_INVALID' });
    }
    const user = session.user.toObject();
    delete user.password;
    return res.status(200).json({ token: session.accessToken, user });
  } catch (error) {
    console.error('Token refresh error:', error.message);
    return res.status(401).json({ message: 'Unable to refresh session', code: 'REFRESH_TOKEN_INVALID' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from current password",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.passwordChangeRequired = false;

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(200).json({
      message: "Password changed successfully",
      user: userObj,
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      message: "Unable to change password",
    });
  }
};

export default { sendInvite, acceptInvite, forgotPassword, resetPassword, changePassword, currentUser, refreshAccessToken };
