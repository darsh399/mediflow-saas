import Order from '../models/Order.js';
import Doctor from '../models/Doctor.js';
import Product from '../models/Product.js';
import CompanyProduct from '../models/CompanyProduct.js';
import recordAudit from '../utils/audit.js';

export async function createOrder(req, res) {
  const { doctorId, visitId, items, notes } = req.body;
  if (!doctorId || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'doctorId and items are required' });
  const doctor = await Doctor.findOne({ _id: doctorId, companyId: req.user.companyId });
  if (!doctor) return res.status(404).json({ message: 'Doctor not found in this company' });
  const productIds = [...new Set(items.map(item => String(item.productId)))];
  const products = await CompanyProduct.find({ _id: { $in: productIds }, companyId: req.user.companyId, status: 'ACTIVE' }).select('_id name productCode').lean();
  if (products.length !== productIds.length) return res.status(400).json({ message: 'One or more products are invalid' });
  const normalizedItems = items.map(item => ({ productId: item.productId, productModel: 'CompanyProduct', quantity: Number(item.quantity), unitPrice: 0 }));
  if (normalizedItems.some(item => !Number.isInteger(item.quantity) || item.quantity < 1)) return res.status(400).json({ message: 'Quantities must be positive integers' });
  const order = await Order.create({ companyId: req.user.companyId, doctorId, visitId, items: normalizedItems, notes, createdBy: req.user.id });
  await recordAudit(req, 'order_created', {}, { orderId: order._id, doctorId, itemCount: normalizedItems.length });
  return res.status(201).json({ order });
}

export async function listOrders(req, res) {
  const query = ['admin', 'company_owner', 'hr_manager', 'hr', 'manager'].includes(req.user.role) ? { companyId: req.user.companyId } : { companyId: req.user.companyId, createdBy: req.user.id };
  if (req.query.page === undefined && req.query.limit === undefined) {
    const orders = await Order.find(query).populate('doctorId createdBy', 'name email clinicName role').populate('items.productId', 'name sku productCode unitPrice').sort({ createdAt: -1 });
    return res.json({ orders });
  }
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
  const [orders, total] = await Promise.all([
    Order.find(query).populate('doctorId createdBy', 'name email clinicName role').populate('items.productId', 'name sku productCode unitPrice').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments(query),
  ]);
  return res.json({ orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export async function updateOrderStatus(req, res) {
  if (!['admin', 'company_owner', 'hr_manager', 'manager'].includes(req.user.role)) return res.status(403).json({ message: 'Insufficient permissions' });
  const { status } = req.body;
  if (!['PLACED', 'CONFIRMED', 'FULFILLED', 'CANCELLED'].includes(status)) return res.status(400).json({ message: 'Invalid order status' });
  const order = await Order.findOneAndUpdate({ _id: req.params.id, companyId: req.user.companyId }, { status }, { new: true, runValidators: true });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  await recordAudit(req, 'order_status_updated', {}, { orderId: order._id, status });
  return res.json({ order });
}
