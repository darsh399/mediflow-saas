import fs from 'fs/promises';
import path from 'path';
import CompanyProduct from '../models/CompanyProduct.js';

const uploadsRoot = path.resolve(process.cwd(), 'uploads', 'company-products');

function toImageRecord(file) {
  return {
    url: `/uploads/company-products/${file.filename}`,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  };
}

// Frontend sends list-style fields (benefits, indications) as a JSON-encoded
// array so a single multipart field can carry multiple values; fall back to
// splitting on newlines/commas for a plain string so the API stays forgiving.
function parseListField(value) {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
  } catch {
    // not JSON — fall through to plain-text splitting
  }
  return String(value).split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
}

async function removeImageFiles(images) {
  await Promise.all((images || []).filter(Boolean).map(async (image) => {
    if (!image?.url) return;
    const filePath = path.join(uploadsRoot, path.basename(image.url));
    await fs.unlink(filePath).catch(() => undefined);
  }));
}

const TEXT_FIELDS = ['name', 'productCode', 'category', 'type', 'brand', 'shortDescription', 'description', 'composition', 'dosage', 'precautions', 'sideEffects', 'storageInstructions', 'targetCondition', 'targetAudience'];
const LIST_FIELDS = ['benefits', 'indications'];

export async function createProduct(req, res) {
  try {
    const companyId = req.user.companyId;
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Product name is required' });

    const mainImageFile = req.files?.mainImage?.[0];
    if (!mainImageFile) return res.status(400).json({ message: 'A main product image is required' });

    const data = { companyId, createdBy: req.user.id, createdByRole: req.user.role };
    for (const field of TEXT_FIELDS) {
      if (req.body?.[field] !== undefined) data[field] = String(req.body[field]).trim() || undefined;
    }
    for (const field of LIST_FIELDS) {
      data[field] = parseListField(req.body?.[field]);
    }
    if (req.body?.status) data.status = String(req.body.status).toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    data.mainImage = toImageRecord(mainImageFile);
    data.images = (req.files?.images || []).map(toImageRecord);

    const product = await CompanyProduct.create(data);
    return res.status(201).json({ message: 'Product created', product });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A product with this product code already exists' });
    console.error('Create company product error:', error);
    return res.status(500).json({ message: 'Error creating product', error: error.message });
  }
}

export async function listProducts(req, res) {
  try {
    const filter = { companyId: req.user.companyId };
    if (req.query.status) filter.status = String(req.query.status).toUpperCase();
    if (req.query.category) filter.category = req.query.category;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.brand) filter.brand = req.query.brand;
    if (req.query.search) {
      const pattern = { $regex: String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      filter.$or = ['name', 'productCode', 'brand', 'category', 'composition', 'targetCondition'].map((field) => ({ [field]: pattern }));
    }

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 },
    };
    const sort = sortMap[req.query.sort] || sortMap.newest;

    const products = await CompanyProduct.find(filter).populate('createdBy', 'name email role').sort(sort).lean();
    return res.status(200).json({ products });
  } catch (error) {
    console.error('List company products error:', error);
    return res.status(500).json({ message: 'Error listing products', error: error.message });
  }
}

export async function getProduct(req, res) {
  try {
    // Company scoping happens right in the query — a product ID that exists
    // but belongs to a different company simply won't match, so this always
    // returns 404 rather than leaking whether the ID exists elsewhere.
    const product = await CompanyProduct.findOne({ _id: req.params.id, companyId: req.user.companyId }).populate('createdBy', 'name email role');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    return res.status(200).json({ product });
  } catch (error) {
    return res.status(400).json({ message: 'Invalid product id' });
  }
}

export async function updateProduct(req, res) {
  try {
    const product = await CompanyProduct.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    for (const field of TEXT_FIELDS) {
      if (req.body?.[field] !== undefined) product[field] = String(req.body[field]).trim() || undefined;
    }
    for (const field of LIST_FIELDS) {
      if (req.body?.[field] !== undefined) product[field] = parseListField(req.body[field]);
    }
    if (req.body?.status) product.status = String(req.body.status).toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const newMainImage = req.files?.mainImage?.[0];
    if (newMainImage) {
      await removeImageFiles([product.mainImage]);
      product.mainImage = toImageRecord(newMainImage);
    }

    const removeImageIds = parseListField(req.body?.removeImageIds);
    if (removeImageIds.length) {
      const toRemove = product.images.filter((image) => removeImageIds.includes(String(image._id)));
      await removeImageFiles(toRemove);
      product.images = product.images.filter((image) => !removeImageIds.includes(String(image._id)));
    }

    const newImages = (req.files?.images || []).map(toImageRecord);
    if (newImages.length) product.images.push(...newImages);

    await product.save();
    return res.status(200).json({ message: 'Product updated', product });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A product with this product code already exists' });
    console.error('Update company product error:', error);
    return res.status(500).json({ message: 'Error updating product', error: error.message });
  }
}

export async function updateProductStatus(req, res) {
  const status = String(req.body?.status || '').toUpperCase();
  if (!['ACTIVE', 'INACTIVE'].includes(status)) return res.status(400).json({ message: 'status must be ACTIVE or INACTIVE' });
  const product = await CompanyProduct.findOneAndUpdate({ _id: req.params.id, companyId: req.user.companyId }, { status }, { new: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  return res.status(200).json({ message: 'Product status updated', product });
}

export async function deleteProduct(req, res) {
  const product = await CompanyProduct.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  await removeImageFiles([product.mainImage, ...(product.images || [])]);
  return res.status(200).json({ message: 'Product deleted' });
}

export default { createProduct, listProducts, getProduct, updateProduct, updateProductStatus, deleteProduct };
