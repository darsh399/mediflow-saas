import Task from '../models/Task.js';
import User from '../models/User.js';
import { canActOn } from '../utils/authorize.js';
import Notification from '../models/Notification.js';
import recordAudit from '../utils/audit.js';

const managerRoles = ['admin', 'company_owner', 'hr_manager', 'hr', 'manager'];

export async function createTask(req, res) {
  const { title, description, assignedTo, dueDate } = req.body;
  if (!title || !assignedTo) return res.status(400).json({ message: 'title and assignedTo are required' });
  const target = await User.findOne({ _id: assignedTo, companyId: req.user.companyId });
  if (!target) return res.status(404).json({ message: 'Assigned user not found in this company' });
  if (!canActOn(req.user, target.role)) return res.status(403).json({ message: 'You cannot assign tasks to this role' });
  const task = await Task.create({ companyId: req.user.companyId, title, description, assignedTo, dueDate, createdBy: req.user.id });
  await Notification.create({ companyId: req.user.companyId, recipientId: assignedTo, type: 'TASK_ASSIGNED', title: 'New task assigned', message: title });
  await recordAudit(req, 'task_created', {}, { taskId: task._id, assignedTo });
  return res.status(201).json({ task });
}

export async function listTasks(req, res) {
  const query = managerRoles.includes(req.user.role) ? { companyId: req.user.companyId } : { companyId: req.user.companyId, assignedTo: req.user.id };
  const tasks = await Task.find(query).populate('assignedTo createdBy', 'name email role').sort({ createdAt: -1 });
  return res.json({ tasks });
}

export async function updateTask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, companyId: req.user.companyId }).populate('assignedTo', 'role');
  if (!task) return res.status(404).json({ message: 'Task not found' });
  const canManage = managerRoles.includes(req.user.role) && canActOn(req.user, task.assignedTo.role);
  if (String(task.assignedTo._id) !== String(req.user.id) && !canManage) return res.status(403).json({ message: 'You cannot update this task' });
  if (req.body.status && !['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid task status' });
  if (req.body.status) task.status = req.body.status;
  if (req.body.description !== undefined) task.description = req.body.description;
  if (task.status === 'COMPLETED') task.completedAt = new Date();
  await task.save();
  await recordAudit(req, 'task_updated', {}, { taskId: task._id, status: task.status });
  return res.json({ task });
}
