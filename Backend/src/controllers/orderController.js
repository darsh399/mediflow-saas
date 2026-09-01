import Order from '../models/Order.js';
import Doctor from '../models/Doctor.js';
import Product from '../models/Product.js';
import CompanyProduct from '../models/CompanyProduct.js';
import OrderFulfillmentEvent from '../models/OrderFulfillmentEvent.js';
import recordAudit from '../utils/audit.js';

export async function createOrder(req, res) {
  const { doctorId, visitId, items, notes } = req.body;
  if (!doctorId || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'doctorId and items are required' });
  const doctor = await Doctor.findOne({ _id: doctorId, companyId: req.user.companyId });
  if (!doctor) return res.status(404).json({ message: 'Doctor not found in this company' });
  const submittedProductIds = items.map(item => item.productId).filter(Boolean).map(String);
  const productIds = [...new Set(submittedProductIds)];
  if (submittedProductIds.length !== items.length || !productIds.length) return res.status(400).json({ message: 'One or more products are invalid' });
  const [companyProducts, legacyProducts] = await Promise.all([
    CompanyProduct.find({ _id: { $in: productIds }, companyId: req.user.companyId, status: { $ne: 'INACTIVE' } }).select('_id').lean(),
    Product.find({ _id: { $in: productIds }, companyId: req.user.companyId, active: true }).select('_id unitPrice').lean(),
  ]);
  const companyProductIds = new Set(companyProducts.map(product => String(product._id)));
  const legacyProductMap = new Map(legacyProducts.map(product => [String(product._id), product]));
  const invalidProduct = productIds.some(id => !companyProductIds.has(id) && !legacyProductMap.has(id));
  if (invalidProduct) return res.status(400).json({ message: 'One or more products are invalid' });
  const normalizedItems = items.map(item => {
    const id = String(item.productId);
    const legacyProduct = legacyProductMap.get(id);
    return {
      productId: item.productId,
      productModel: legacyProduct && !companyProductIds.has(id) ? 'Product' : 'CompanyProduct',
      quantity: Number(item.quantity),
      unitPrice: legacyProduct?.unitPrice || 0,
    };
  });
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

export async function updateFulfillmentStatus(req, res) {
  if (!['admin', 'company_owner', 'hr_manager', 'manager'].includes(req.user.role)) return res.status(403).json({ message: 'Insufficient permissions' });
  const fulfillmentStatus = String(req.body?.fulfillmentStatus || '').toUpperCase();
  if (!['PENDING', 'DISPATCHED', 'DELIVERED', 'RETURNED'].includes(fulfillmentStatus)) return res.status(400).json({ message: 'Invalid fulfillment status' });
  const order = await Order.findOneAndUpdate({ _id: req.params.id, companyId: req.user.companyId }, { fulfillmentStatus }, { new: true, runValidators: true });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  await OrderFulfillmentEvent.create({ companyId: req.user.companyId, orderId: order._id, status: fulfillmentStatus, note: req.body?.note, createdBy: req.user.id });
  await recordAudit(req, 'order_fulfillment_updated', {}, { orderId: order._id, fulfillmentStatus });
  return res.json({ order });
}

export async function listFulfillmentEvents(req, res) {
  const order = await Order.findOne({ _id: req.params.id, companyId: req.user.companyId }).select('_id');
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const events = await OrderFulfillmentEvent.find({ orderId: order._id, companyId: req.user.companyId }).populate('createdBy', 'name email role').sort({ createdAt: -1 }).lean();
  return res.json({ events });
}
