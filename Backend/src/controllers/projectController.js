import Project from '../models/Project.js';
import User from '../models/User.js';
import { canActOn } from '../utils/authorize.js';

const managers = ['admin', 'company_owner', 'hr_manager', 'manager'];

export async function createProject(req, res) {
  const { name, description, managerId, memberIds = [] } = req.body;
  if (!name) return res.status(400).json({ message: 'Project name is required' });
  if (!managers.includes(req.user.role)) return res.status(403).json({ message: 'Insufficient permissions' });
  const members = await User.find({ _id: { $in: [managerId, ...memberIds].filter(Boolean) }, companyId: req.user.companyId }).select('_id role');
  if (members.length !== [managerId, ...memberIds].filter(Boolean).length) return res.status(400).json({ message: 'Project users must belong to this company' });
  if (managerId) {
    const manager = members.find(member => String(member._id) === String(managerId));
    if (!manager || !canActOn(req.user, manager.role)) return res.status(403).json({ message: 'Invalid project manager' });
  }
  const project = await Project.create({ companyId: req.user.companyId, name, description, managerId, memberIds, createdBy: req.user.id });
  return res.status(201).json({ project });
}

export async function listProjects(req, res) {
  const query = managers.includes(req.user.role) ? { companyId: req.user.companyId } : { companyId: req.user.companyId, $or: [{ managerId: req.user.id }, { memberIds: req.user.id }] };
  const projects = await Project.find(query).populate('managerId memberIds', 'name email role').sort({ createdAt: -1 });
  return res.json({ projects });
}

export async function updateProject(req, res) {
  const project = await Project.findOne({ _id: req.params.id, companyId: req.user.companyId });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (!managers.includes(req.user.role) || !canActOn(req.user, 'manager')) return res.status(403).json({ message: 'Insufficient permissions' });
  const allowed = ['name', 'description', 'managerId', 'memberIds', 'status'];
  allowed.forEach(field => { if (req.body[field] !== undefined) project[field] = req.body[field]; });
  await project.save();
  return res.json({ project });
}
