import mongoose from 'mongoose'
import Sale from '../models/Sale.js'
import Doctor from '../models/Doctor.js'
import Product from '../models/Product.js'
import Project from '../models/Project.js'
import recordAudit from '../utils/audit.js'
import { seesWholeCompany, scopedEmployeeIds, canAccessEmployee } from '../utils/teamScope.js'

const oid = (value) => new mongoose.Types.ObjectId(value)

export async function createSale(req, res) {
  try {
    const companyId = req.user.companyId
    const { doctorId, productId, projectId, amount, quantity, saleDate, notes } = req.body || {}

    const value = Number(amount)
    if (!(value >= 0) || !Number.isFinite(value)) return res.status(400).json({ message: 'A valid sale amount is required' })
    const when = saleDate ? new Date(saleDate) : new Date()
    if (Number.isNaN(when.getTime())) return res.status(400).json({ message: 'A valid sale date is required' })

    // A rep only ever logs their own sales. A manager may log on behalf of a
    // team member by passing employeeId.
    let employeeId = req.user.id
    if (req.body?.employeeId && String(req.body.employeeId) !== String(req.user.id)) {
      if (!(await canAccessEmployee(req.user, req.body.employeeId))) {
        return res.status(403).json({ message: 'You can only record sales for your own team' })
      }
      employeeId = req.body.employeeId
    }

    if (doctorId) {
      const doctor = await Doctor.findOne({ _id: doctorId, companyId }).select('_id').lean()
      if (!doctor) return res.status(400).json({ message: 'That doctor is not in your company' })
    }
    if (productId) {
      const product = await Product.findOne({ _id: productId, companyId }).select('_id').lean()
      if (!product) return res.status(400).json({ message: 'That product is not in your company' })
    }
    if (projectId) {
      const project = await Project.findOne({ _id: projectId, companyId }).select('_id').lean()
      if (!project) return res.status(400).json({ message: 'That project is not in your company' })
    }

    const sale = await Sale.create({
      companyId,
      employeeId,
      doctorId: doctorId || undefined,
      productId: productId || undefined,
      projectId: projectId || undefined,
      amount: value,
      quantity: Number(quantity) > 0 ? Number(quantity) : 1,
      saleDate: when,
      notes: notes?.trim() || undefined,
      createdBy: req.user.id,
    })
    await recordAudit(req, 'sale_recorded', { companyId, entityId: sale._id, module: 'sales', newValue: { employeeId, amount: value } })
    return res.status(201).json({ message: 'Sale recorded', sale })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function listSales(req, res) {
  try {
    const companyId = req.user.companyId
    const filter = { companyId }

    const allowedIds = await scopedEmployeeIds(req.user)
    if (allowedIds) filter.employeeId = { $in: allowedIds.map(oid) }

    if (req.query.employeeId) {
      if (!(await canAccessEmployee(req.user, req.query.employeeId))) return res.status(403).json({ message: 'Not allowed to view that employee' })
      filter.employeeId = oid(req.query.employeeId)
    }
    if (req.query.doctorId) filter.doctorId = oid(req.query.doctorId)
    if (req.query.projectId) filter.projectId = oid(req.query.projectId)

    if (req.query.month && req.query.year) {
      const month = Number(req.query.month)
      const year = Number(req.query.year)
      filter.saleDate = { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) }
    } else if (req.query.from || req.query.to) {
      filter.saleDate = {}
      if (req.query.from) filter.saleDate.$gte = new Date(req.query.from)
      if (req.query.to) {
        const to = new Date(req.query.to)
        to.setDate(to.getDate() + 1)
        filter.saleDate.$lt = to
      }
    }

    const sales = await Sale.find(filter)
      .populate('employeeId', 'name role')
      .populate('doctorId', 'name clinicName')
      .populate('productId', 'name')
      .populate('projectId', 'name')
      .sort({ saleDate: -1 })
      .lean()

    const total = sales.reduce((sum, sale) => sum + (sale.amount || 0), 0)
    return res.status(200).json({ sales, total, count: sales.length })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function getSale(req, res) {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, companyId: req.user.companyId })
      .populate('employeeId', 'name role')
      .populate('doctorId', 'name clinicName')
      .populate('productId', 'name')
      .populate('projectId', 'name')
      .lean()
    if (!sale) return res.status(404).json({ message: 'Sale not found' })
    if (!(await canAccessEmployee(req.user, sale.employeeId._id))) return res.status(403).json({ message: 'Not allowed to view this sale' })
    return res.status(200).json({ sale })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

export async function deleteSale(req, res) {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, companyId: req.user.companyId })
    if (!sale) return res.status(404).json({ message: 'Sale not found' })
    // The rep who logged it, or a manager over that rep, may remove it.
    const isOwner = String(sale.employeeId) === String(req.user.id)
    if (!isOwner && !seesWholeCompany(req.user) && !(await canAccessEmployee(req.user, sale.employeeId))) {
      return res.status(403).json({ message: 'Not allowed to remove this sale' })
    }
    await sale.deleteOne()
    await recordAudit(req, 'sale_deleted', { companyId: req.user.companyId, entityId: sale._id, module: 'sales' })
    return res.status(200).json({ message: 'Sale removed' })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export default { createSale, listSales, getSale, deleteSale }
