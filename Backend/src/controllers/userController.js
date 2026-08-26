import User from '../models/User.js';
import Visit from '../models/Visit.js'
import hashPassword from '../utils/hashPassword.js';
import bcrypt from 'bcrypt';
import { validateProfile } from '../validators/userValidator.js';
import { canActOn, isPrivilegedRole } from '../utils/authorize.js';
import Company from '../models/Company.js';
import Invite from '../models/Invite.js';
import EmployeeProfile from '../models/EmployeeProfile.js';
import Attendance from '../models/Attendance.js';
import Notification from '../models/Notification.js';
import { hasPermission } from '../config/permissions.js';
import recordAudit from '../utils/audit.js';
import { issueSession, revokeRefreshToken, clearSessionCookies } from '../services/sessionService.js';
import mailService from '../services/mailService.js';
import { promotionTemplate, employeeOnboardingTemplate } from '../services/emailTemplateService.js';
import { generateTempPassword } from '../utils/generatePassword.js';
import { generateCompanyEmail } from '../utils/companyEmail.js';



// Helper: fetch a user by id from various request locations and send response
async function fetchAndSendUser(req, res, successMessage = 'User retrieved successfully') {
    try {
        const userId = req.params.id || req.query.id || req.body.userId || (req.user && req.user.id);
        if (!userId) return res.status(400).json({ message: 'User id is required' });
        const companyId = req.user?.companyId;
        const findQuery = companyId ? { _id: userId, companyId } : { _id: userId };
        // Populate the company reference so company managers can view the
        // employee's organisation name on the employee detail page.
        const user = await User.findOne(findQuery)
            .select('-password')
            .populate('companyId', 'name companyName');
        if (!user) return res.status(404).json({ message: 'User not found' });
        // A colleague's full record (profile, employment fields, attendance) is
        // only visible to the account itself or someone privileged enough to act
        // on that role — same rule already used for update/delete/promote below.
        if (String(req.user.id) !== String(user._id) && !canActOn(req.user, user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions to view this user' });
        }
        const employeeProfile = await EmployeeProfile.findOne({
            userId: user._id,
            ...(companyId ? { companyId } : {})
        }).select('profileData experienceType status');
        const userData = user.toObject();
        userData.onboardingProfile = employeeProfile?.profileData || {};
        if (user.companyId && (String(req.user.id) === String(user._id) || hasPermission(req.user, 'attendance.view'))) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const attendance = await Attendance.findOne({ companyId: user.companyId, employeeId: user._id, date: { $gte: today, $lt: tomorrow } }).lean();
            const sessions = attendance?.sessions?.length ? attendance.sessions : attendance?.checkIn ? [{ checkIn: attendance.checkIn, checkOut: attendance.checkOut, breaks: attendance.breaks || [] }] : [];
            const activeSession = sessions.find(session => !session.checkOut) || null;
            userData.attendanceSummary = {
                status: activeSession ? 'WORKING' : attendance ? 'OFFLINE' : 'NOT_STARTED',
                checkedIn: Boolean(activeSession),
                totalWorkingHours: attendance?.totalWorkingHours || 0,
                sessions,
                lastActivityAt: activeSession?.checkIn || sessions.at(-1)?.checkOut || null,
            };
        }
        return res.status(200).json({ message: successMessage, user: userData });
    } catch (error) {
        console.error('Error retrieving user:', error);
        return res.status(500).json({ message: 'Error retrieving user', error: error.message });
    }
}

// Helper: merge profile data (including completedSteps) and save user
async function mergeAndSaveProfile(userId, data, companyId) {
    const findQuery = companyId ? { _id: userId, companyId } : { _id: userId };
    const user = await User.findOne(findQuery);
    if (!user) throw new Error('User not found');
    user.profile = { ...(user.profile || {}), ...(data || {}) };
    if (Array.isArray(data?.completedSteps)) {
        const existing = Array.isArray(user.profile.completedSteps) ? user.profile.completedSteps : [];
        user.profile.completedSteps = Array.from(new Set([...existing, ...data.completedSteps]));
    }
    await user.save();
    return user;
}

// Employee creation only — always called by an authenticated admin/hr/manager
// (see userRoutes.js), never publicly. Public self-registration was removed.
export const createUser = async (req, res) => {
   try{
    const {name, email, password, mobile, role, employeeId, firstName, lastName, joiningDate, departmentId, designationId, reportingManagerId, branchId, employmentType, probationStatus, employeeStatus, personalEmail} = req.body;

        const companyId = req.user.companyId;
        const managedRoles = ['employee', 'mr', 'manager', 'hr', 'hr_manager'];
        if (!managedRoles.includes(role || 'employee')) {
            return res.status(403).json({ message: 'Invalid role for employee creation' });
        }
        if (!companyId) {
            return res.status(400).json({ message: 'Company context missing' });
        }
        if (!canActOn(req.user, role || 'employee')) {
            return res.status(403).json({ message: 'Insufficient permissions to create this role' });
        }

        const finalName = name || [firstName, lastName].filter(Boolean).join(' ').trim();
        if (!finalName) return res.status(400).json({ message: 'name is required' });

        // Can omit email/password — the system then auto-generates a company
        // login email and a secure temp password, and emails the credentials
        // to the employee's personal mailbox.
        const company = await Company.findById(companyId).select('companyName companyEmail companyWebsite').lean();

        let finalEmail = email;
        if (!finalEmail) {
            if (!firstName || !lastName) return res.status(400).json({ message: 'firstName and lastName are required to auto-generate a company email' });
            if (!personalEmail) return res.status(400).json({ message: 'personalEmail is required to deliver onboarding credentials for an auto-generated login' });
            finalEmail = await generateCompanyEmail({ firstName, lastName, company });
        }

        let finalPassword = password;
        let temporaryPassword = null;
        if (!finalPassword) {
            temporaryPassword = generateTempPassword();
            finalPassword = temporaryPassword;
        }
        const autoProvisioned = Boolean(temporaryPassword);

        const existingEmail = await User.findOne({ email: finalEmail });
        if (existingEmail) return res.status(409).json({ message: 'Email already exists' });
        if (mobile) {
            const existingMobile = await User.findOne({ mobile });
            if (existingMobile) return res.status(409).json({ message: 'Mobile number already exists' });
        }

        const hashedPw = await hashPassword(finalPassword);
        const employeeFields = { employeeId, firstName, lastName, joiningDate, departmentId, designationId, reportingManagerId, branchId, employmentType, probationStatus, employeeStatus, personalEmail };
        const newUser = new User({ name: finalName, email: finalEmail, password: hashedPw, mobile, companyId, role: role || 'employee', passwordChangeRequired: autoProvisioned, createdBy: req.user.id, ...employeeFields });

        const savedUser = await newUser.save();

        let emailSent = false;
        if (autoProvisioned) {
            const deliveryEmail = personalEmail || finalEmail;
            try {
                const template = employeeOnboardingTemplate({ employeeName: finalName, companyName: company?.companyName || 'MediFlow', companyEmail: finalEmail, temporaryPassword, senderName: req.user?.email || 'The Team' });
                await mailService.sendMail({ to: deliveryEmail, ...template });
                emailSent = true;
            } catch (mailError) {
                console.error('Onboarding email failed:', mailError.message);
            }
        }

        const userObj = savedUser.toObject();
        delete userObj.password;
        return res.status(201).json({
            message: 'User created successfully',
            user: userObj,
            ...(autoProvisioned ? { generatedCredentials: { companyEmail: finalEmail, emailSent } } : {}),
        });
    }catch(error){
        console.error("Error creating user:", error);
        return res.status(500).json({ message: 'Error creating user', error: error.message });
    }
}

export const loginUser = async (req, res) => {
    try{
        const {email, password} = req.body;
        const userExists = await User.findOne({ email });
        if (!userExists) return res.status(404).json({ message: 'User not found' });

        let ownedCompany = await Company.findOne({ ownerId: userExists._id }).select('_id status isActive');
        if (!ownedCompany) {
            const acceptedOwnerInvite = await Invite.findOne({ inviteeEmail: userExists.email, role: 'company_owner', status: 'accepted' }).sort({ acceptedAt: -1 });
            if (acceptedOwnerInvite?.companyId) {
                ownedCompany = await Company.findByIdAndUpdate(acceptedOwnerInvite.companyId, { ownerId: userExists._id }, { new: true }).select('_id status isActive');
            }
        }
        if (ownedCompany && (String(userExists.companyId || '') !== String(ownedCompany._id) || userExists.role !== 'company_owner')) {
            userExists.companyId = ownedCompany._id;
            userExists.role = 'company_owner';
            await userExists.save();
        }

        const isMatch = await bcrypt.compare(password, userExists.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        if (userExists.role === 'super_admin') {
            return res.status(403).json({ message: 'Super admins must log in through the super admin portal' });
        }

        if (userExists.blocked || userExists.active === false) {
            return res.status(403).json({ message: 'Account is disabled or blocked' });
        }
        if (userExists.companyId && userExists.role !== 'super_admin') {
            const company = ownedCompany || await Company.findById(userExists.companyId).select('status isActive');
            if (!company || !company.isActive || company.status !== 'ACTIVE') {
                return res.status(403).json({ message: `Company account is ${company?.status || 'inactive'}` });
            }
        }

        const token = await issueSession(res, userExists);
        const userObj = userExists.toObject();
        delete userObj.password;
        // Set HTTP-only cookie with JWT for client to send on subsequent requests
        res.status(200).json({ message: 'Login successful', user: userObj, token });
    }catch(error){
        console.error("Error retrieving user:", error);
        res.status(500).json({ message: 'Error retrieving user', error: error.message });
    }
}

export const logoutUser = async (req, res) => {
    try {
        await revokeRefreshToken(req)
        clearSessionCookies(res)
        return res.status(200).json({ message: 'Logged out' })
    } catch (err) {
        console.error('Logout error:', err)
        return res.status(500).json({ message: 'Error logging out', error: err.message })
    }
}


export const getUserById = async (req, res) => {
    return fetchAndSendUser(req, res);
}


export const updateUser = async (req, res) => {
    try{
        const userId = req.params.id;
        const updateData = req.body;
        const companyId = req.user?.companyId;
        const findQuery = companyId ? { _id: userId, companyId } : { _id: userId };
        const existingUser = await User.findOne(findQuery);
        if (!existingUser) return res.status(404).json({ message: 'User not found' });

        // Only allow self-update or users with higher privileges
        if (String(req.user.id) !== String(userId) && !canActOn(req.user, existingUser.role)) {
            return res.status(403).json({ message: 'Insufficient permissions to update this user' });
        }

        // Disallow changing role unless requester is privileged
        if (updateData && Object.prototype.hasOwnProperty.call(updateData, 'role')) {
            if (!isPrivilegedRole(req.user.role)) {
                return res.status(403).json({ message: 'Insufficient permissions to change role' });
            }
            // audit role change
            const oldRole = existingUser.role;
            const newRole = updateData.role;
            existingUser.role = newRole;
            await recordAudit(req, 'role_change', { targetUserId: existingUser._id, targetUserRole: oldRole, companyId: existingUser.companyId, entityId: existingUser._id, module: 'employees', oldValue: { role: oldRole }, newValue: { role: newRole } });
            // remove role from updateData to avoid double-assign
            delete updateData.role;
        }

        const editableFields = ['name', 'email', 'personalEmail', 'mobile', 'employeeId', 'firstName', 'lastName', 'joiningDate', 'departmentId', 'designationId', 'reportingManagerId', 'branchId', 'employmentType', 'probationStatus', 'employeeStatus', 'active', 'blocked'];
        for (const field of editableFields) {
            if (Object.prototype.hasOwnProperty.call(updateData, field)) existingUser[field] = updateData[field];
        }
        const saved = await existingUser.save();
        const userObj = saved.toObject(); delete userObj.password;
        res.status(200).json({ message: 'User updated successfully', user: userObj });
    }catch(error){
        console.error("Error updating user:", error);
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
}

export const deleteUser = async (req, res) => {
    try{
        const userId = req.params.id;
        const companyId = req.user?.companyId;
        const findQuery = companyId ? { _id: userId, companyId } : { _id: userId };
        const targetUser = await User.findOne(findQuery);
        if (!targetUser) return res.status(404).json({ message: 'User not found' });

        // Only allow deletion if requester has sufficient privilege over the target
        if (!canActOn(req.user, targetUser.role)) {
            return res.status(403).json({ message: 'Insufficient permissions to delete this user' });
        }

        const deletedUser = await User.findByIdAndDelete(targetUser._id).select('-password');
        // audit
        await recordAudit(req, 'delete_user', { targetUserId: deletedUser._id, targetUserRole: deletedUser.role, companyId: deletedUser.companyId, entityId: deletedUser._id, module: 'employees' });
        res.status(200).json({ message: 'User deleted successfully', user: deletedUser });
    }catch(error){
        console.error("Error deleting user:", error);
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }   
}

export const promoteEmployee = async (req, res) => {
    try {
        const userId = req.params.id;
        const { designation, department, note, effectiveDate } = req.body || {};
        if (!designation || !String(designation).trim()) {
            return res.status(400).json({ message: 'New designation/title is required' });
        }

        const companyId = req.user?.companyId;
        const findQuery = companyId ? { _id: userId, companyId } : { _id: userId };
        const targetUser = await User.findOne(findQuery);
        if (!targetUser) return res.status(404).json({ message: 'User not found' });

        if (!canActOn(req.user, targetUser.role)) {
            return res.status(403).json({ message: 'Insufficient permissions to promote this user' });
        }

        const previousDesignation = targetUser.profile?.jobDetails?.designation || '';
        const previousDepartment = targetUser.profile?.jobDetails?.department || '';
        const newDesignation = String(designation).trim();

        targetUser.profile = targetUser.profile || {};
        targetUser.profile.jobDetails = { ...(targetUser.profile.jobDetails || {}), designation: newDesignation };
        if (department !== undefined) targetUser.profile.jobDetails.department = String(department).trim();
        targetUser.markModified('profile');
        await targetUser.save();

        await recordAudit(req, 'employee_promoted', {
            targetUserId: targetUser._id,
            targetUserRole: targetUser.role,
            companyId: targetUser.companyId,
            entityId: targetUser._id,
            module: 'employees',
            oldValue: { designation: previousDesignation, department: previousDepartment },
            newValue: { designation: newDesignation, department: targetUser.profile.jobDetails.department || previousDepartment },
        }, { note, effectiveDate });

        const actorName = req.user?.name || req.user?.email || 'Management';
        await Notification.create({
            companyId: targetUser.companyId,
            recipientId: targetUser._id,
            type: 'EMPLOYEE_PROMOTED',
            title: 'You have been promoted',
            message: `Congratulations! You have been promoted to ${newDesignation} by ${actorName}.${note ? ` ${note}` : ''}`,
        });

        let emailSent = false;
        if (targetUser.email) {
            try {
                const template = promotionTemplate({
                    employeeName: targetUser.name,
                    previousDesignation: previousDesignation || 'your previous role',
                    designation: newDesignation,
                    note: note ? String(note).trim() : '',
                    effectiveDate: effectiveDate ? new Date(effectiveDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
                    senderName: actorName,
                });
                await mailService.sendMail({ to: targetUser.email, ...template });
                emailSent = true;
            } catch (mailError) {
                console.error('Promotion email failed:', mailError.message);
            }
        }

        const userObj = targetUser.toObject(); delete userObj.password;
        return res.status(200).json({ message: 'Employee promoted successfully', user: userObj, emailSent });
    } catch (error) {
        console.error('Error promoting employee:', error);
        return res.status(500).json({ message: 'Error promoting employee', error: error.message });
    }
}

export const changeUserStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const { action } = req.body; // 'disable' | 'enable' | 'block' | 'unblock'
        if (!['disable','enable','block','unblock'].includes(action)) return res.status(400).json({ message: 'Invalid action' });

        const companyId = req.user?.companyId;
        const findQuery = companyId ? { _id: userId, companyId } : { _id: userId };
        const targetUser = await User.findOne(findQuery);
        if (!targetUser) return res.status(404).json({ message: 'User not found' });

        if (!canActOn(req.user, targetUser.role)) {
            return res.status(403).json({ message: 'Insufficient permissions to change status of this user' });
        }

        if (action === 'disable') targetUser.active = false;
        if (action === 'enable') targetUser.active = true;
        if (action === 'block') targetUser.blocked = true;
        if (action === 'unblock') targetUser.blocked = false;

        await targetUser.save();
        // audit
        await recordAudit(req, `status_${action}`, { targetUserId: targetUser._id, targetUserRole: targetUser.role, companyId: targetUser.companyId, entityId: targetUser._id, module: 'employees', newValue: { active: targetUser.active, blocked: targetUser.blocked } }, { action });
        const userObj = targetUser.toObject(); delete userObj.password;
        return res.status(200).json({ message: 'User status updated', user: userObj });
    } catch (error) {
        console.error('Error changing user status:', error);
        return res.status(500).json({ message: 'Error changing user status', error: error.message });
    }
}


// Minimal, PII-free colleague list (id + name + role only) for populating
// pickers such as task assignee / project manager / message recipient. Any
// authenticated company member can call this — it deliberately excludes
// email, mobile, and employment data, which stay behind the full listUsers
// endpoint restricted to admin/company_owner/hr_manager/hr.
export const listColleagues = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ message: 'Company context missing' });
        const users = await User.find({ companyId, active: true }).select('name role');
        res.status(200).json({ users });
    } catch (error) {
        console.error('Error retrieving colleagues:', error);
        res.status(500).json({ message: 'Error retrieving colleagues', error: error.message });
    }
}

export const listUsers = async (req, res) => {
    try{
        const companyId = req.user?.companyId;
        const query = companyId ? { companyId } : {};
        const users = await User.find(query).select('-password');
        res.status(200).json({ message: 'Users retrieved successfully', users });
    }catch(error){
        console.error("Error retrieving users:", error);
        res.status(500).json({ message: 'Error retrieving users', error: error.message });
    }
}


export const searchUsers = async (req, res) => {
    try{
        const { name, email, mobile, role } = req.query;
        const companyId = req.user?.companyId;
        const query = companyId ? { companyId } : {};
        if (name) query.name = { $regex: name, $options: 'i' };
        if (email) query.email = { $regex: email, $options: 'i' };
        if (mobile) query.mobile = { $regex: mobile, $options: 'i' };
        if (role) query.role = role;
        const users = await User.find(query).select('-password');
        res.status(200).json({ message: 'Users retrieved successfully', users });
    }catch(error){
        console.error("Error searching users:", error);
        res.status(500).json({ message: 'Error searching users', error: error.message });
    }
}


export const profileComplete = async (req, res) => {
    try {
        const userId = req.params.id || req.body.userId || (req.user && req.user.id);
        if (!userId) return res.status(400).json({ message: 'User id is required' });

        // Only update completedSteps (keeps compatibility with older endpoint)
        const { completedSteps } = req.body;
        if (!Array.isArray(completedSteps)) return res.status(400).json({ message: 'completedSteps must be an array' });

        const companyId = req.user?.companyId;
        if (String(req.user.id) !== String(userId)) {
            const target = await User.findOne(companyId ? { _id: userId, companyId } : { _id: userId });
            if (!target || !canActOn(req.user, target.role)) return res.status(403).json({ message: 'Insufficient permissions' });
        }
        const user = await mergeAndSaveProfile(userId, { completedSteps }, companyId);
        const userObj = user.toObject();
        delete userObj.password;
        return res.status(200).json({ message: 'User profile updated successfully', user: userObj });
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ message: 'Error updating user profile', error: error.message });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const userId = req.params.id || req.body.userId || (req.user && req.user.id);
        if (!userId) return res.status(400).json({ message: 'User id is required' });

        const { ok, data, errors } = validateProfile(req.body);
        if (!ok) return res.status(400).json({ message: 'Validation failed', errors });

        const companyId = req.user?.companyId;
        if (String(req.user.id) !== String(userId)) {
            const target = await User.findOne(companyId ? { _id: userId, companyId } : { _id: userId });
            if (!target || !canActOn(req.user, target.role)) return res.status(403).json({ message: 'Insufficient permissions' });
        }
        const user = await mergeAndSaveProfile(userId, data, companyId);
        const userObj = user.toObject();
        delete userObj.password;
        return res.status(200).json({ message: 'Profile updated', user: userObj });
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};


export const getAllMyVisits = async (req, res) => {
    try {
        const employeeId = req.user?.id;
        const companyId = req.user?.companyId;

        if (!employeeId) {
            return res.status(401).json({
                message: 'User authentication required'
            });
        }

        if (!companyId) {
            return res.status(400).json({
                message: 'Company context missing'
            });
        }

        const visits = await Visit.find({
            companyId,
            employeeId
        })
            .populate('doctorId')
            .populate('medicalId')
            .populate('assignedBy', 'name email role')
            .sort({ visitedAt: -1 });

        return res.status(200).json({
            message: 'Your visits retrieved successfully',
            visits
        });

    } catch (error) {
        console.error('Error retrieving my visits:', error);

        return res.status(500).json({
            message: 'Error retrieving visits',
            error: error.message
        });
    }
};
