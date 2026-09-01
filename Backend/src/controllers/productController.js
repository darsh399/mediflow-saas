import Product from '../models/Product.js';

export const listProducts = async (req, res) => {
  const query = { companyId: req.user.companyId };
  if (req.query.page === undefined && req.query.limit === undefined) {
    const products = await Product.find(query).sort({ name: 1 });
    return res.json({ products });
  }
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
  const [products, total] = await Promise.all([
    Product.find(query).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(query),
  ]);
  return res.json({ products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
};

export const createProduct = async (req, res) => {
  const { name, sku, description, unitPrice } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required' });
  const product = await Product.create({ companyId: req.user.companyId, name, sku, description, unitPrice, createdBy: req.user.id });
  return res.status(201).json({ product });
};

const UPDATABLE_PRODUCT_FIELDS = ['name', 'sku', 'description', 'unitPrice', 'active'];

export const updateProduct = async (req, res) => {
  const update = Object.fromEntries(UPDATABLE_PRODUCT_FIELDS.filter((field) => req.body?.[field] !== undefined).map((field) => [field, req.body[field]]));
  const product = await Product.findOneAndUpdate({ _id: req.params.id, companyId: req.user.companyId }, update, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  return res.json({ product });
};

export default { listProducts, createProduct, updateProduct };
