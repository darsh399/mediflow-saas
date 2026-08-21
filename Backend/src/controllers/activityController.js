import EmployeeActivity from '../models/EmployeeActivity.js';
import Project from '../models/Project.js';

export async function createActivity(req, res) {
  const { date, description, hoursWorked, status, notes, projectId, taskId } = req.body;
  if (!date || !description || hoursWorked === undefined) return res.status(400).json({ message: 'date, description and hoursWorked are required' });
  if (projectId) {
    const project = await Project.findOne({ _id: projectId, companyId: req.user.companyId, $or: [{ managerId: req.user.id }, { memberIds: req.user.id }] });
    if (!project) return res.status(403).json({ message: 'Project is not assigned to you' });
  }
  const activity = await EmployeeActivity.create({ companyId: req.user.companyId, employeeId: req.user.id, date, description, hoursWorked, status, notes, projectId, taskId });
  return res.status(201).json({ activity });
}

export async function listActivities(req, res) {
  const isManager = ['admin', 'company_owner', 'hr_manager', 'hr', 'manager'].includes(req.user.role);
  const query = isManager ? { companyId: req.user.companyId } : { companyId: req.user.companyId, employeeId: req.user.id };
  if (req.query.employeeId && isManager) query.employeeId = req.query.employeeId;
  const activities = await EmployeeActivity.find(query).populate('employeeId projectId taskId', 'name email title').sort({ date: -1, createdAt: -1 });
  return res.json({ activities });
}
