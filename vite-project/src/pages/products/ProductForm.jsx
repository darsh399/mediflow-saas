import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import companyProductApi from "../../api/companyProductApi";
import { useNotify } from "../../components/NotificationProvider";
import { resolveAssetUrl } from "../../utils/resolveAssetUrl";

const emptyForm = {
  name: "",
  productCode: "",
  category: "",
  type: "",
  brand: "",
  shortDescription: "",
  description: "",
  composition: "",
  benefits: "",
  indications: "",
  dosage: "",
  precautions: "",
  sideEffects: "",
  storageInstructions: "",
  targetCondition: "",
  targetAudience: "",
  status: "ACTIVE",
};

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_GALLERY_IMAGES = 8;

// Shared by AddProduct and EditProduct so the (large) form only lives in one
// place. In edit mode, pass `productId` and this loads the existing product.
const ProductForm = ({ mode = "create", productId }) => {
  const navigate = useNavigate();
  const { notify } = useNotify();
  const isEdit = mode === "edit";

  const [form, setForm] = useState(emptyForm);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState("");
  const [existingMainImageUrl, setExistingMainImageUrl] = useState("");

  const [newGalleryFiles, setNewGalleryFiles] = useState([]); // [{ file, previewUrl }]
  const [existingGalleryImages, setExistingGalleryImages] = useState([]); // [{ _id, url }]
  const [removedImageIds, setRemovedImageIds] = useState([]);

  const mainImageInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    if (!isEdit || !productId) return;

    let cancelled = false;
    (async () => {
      try {
        setLoadingProduct(true);
        const response = await companyProductApi.getProduct(productId);
        const product = response.product;
        if (cancelled || !product) return;

        setForm({
          name: product.name || "",
          productCode: product.productCode || "",
          category: product.category || "",
          type: product.type || "",
          brand: product.brand || "",
          shortDescription: product.shortDescription || "",
          description: product.description || "",
          composition: product.composition || "",
          benefits: (product.benefits || []).join("\n"),
          indications: (product.indications || []).join("\n"),
          dosage: product.dosage || "",
          precautions: product.precautions || "",
          sideEffects: product.sideEffects || "",
          storageInstructions: product.storageInstructions || "",
          targetCondition: product.targetCondition || "",
          targetAudience: product.targetAudience || "",
          status: product.status || "ACTIVE",
        });
        setExistingMainImageUrl(resolveAssetUrl(product.mainImage?.url));
        setExistingGalleryImages(product.images || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load product");
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isEdit, productId]);

  // Revoke object URLs on unmount / when replaced, to avoid leaking memory.
  useEffect(() => () => {
    if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
    newGalleryFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const validateImageFile = (file) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return `${file.name}: only JPG, PNG, or WEBP images are allowed`;
    if (file.size > MAX_IMAGE_SIZE) return `${file.name}: image must be under 5 MB`;
    return null;
  };

  const handleMainImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) { setError(validationError); return; }
    setError("");
    if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
    setMainImageFile(file);
    setMainImagePreview(URL.createObjectURL(file));
  };

  const removeMainImage = () => {
    if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
    setMainImageFile(null);
    setMainImagePreview("");
    if (mainImageInputRef.current) mainImageInputRef.current.value = "";
  };

  const handleGalleryChange = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    const remainingSlots = MAX_GALLERY_IMAGES - (existingGalleryImages.length + newGalleryFiles.length);
    if (remainingSlots <= 0) { setError(`You can attach up to ${MAX_GALLERY_IMAGES} gallery images.`); return; }

    const accepted = [];
    for (const file of files.slice(0, remainingSlots)) {
      const validationError = validateImageFile(file);
      if (validationError) { setError(validationError); continue; }
      accepted.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    if (accepted.length) {
      setError("");
      setNewGalleryFiles((current) => [...current, ...accepted]);
    }
  };

  const removeNewGalleryImage = (previewUrl) => {
    setNewGalleryFiles((current) => {
      const target = current.find((item) => item.previewUrl === previewUrl);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.previewUrl !== previewUrl);
    });
  };

  const removeExistingGalleryImage = (imageId) => {
    setExistingGalleryImages((current) => current.filter((image) => image._id !== imageId));
    setRemovedImageIds((current) => [...current, imageId]);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) { setError("Product name is required."); return; }
    if (!isEdit && !mainImageFile) { setError("A main product image is required."); return; }

    try {
      setSaving(true);

      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "benefits" || key === "indications") {
          payload.append(key, JSON.stringify(value.split("\n").map((line) => line.trim()).filter(Boolean)));
        } else if (value !== undefined && value !== null) {
          payload.append(key, value);
        }
      });
      if (mainImageFile) payload.append("mainImage", mainImageFile);
      newGalleryFiles.forEach((item) => payload.append("images", item.file));
      if (isEdit && removedImageIds.length) payload.append("removeImageIds", JSON.stringify(removedImageIds));

      if (isEdit) {
        await companyProductApi.updateProduct(productId, payload);
        notify("Product updated", `${form.name} was updated successfully.`);
      } else {
        await companyProductApi.createProduct(payload);
        notify("Product added", `${form.name} was added to your company catalog.`);
      }

      navigate("/products");
    } catch (err) {
      setError(err?.response?.data?.message || `Unable to ${isEdit ? "update" : "add"} product`);
    } finally {
      setSaving(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3"></div>
            <h6 className="text-muted mb-0">Loading product...</h6>
          </div>
        </div>
      </div>
    );
  }

  const usedGallerySlots = existingGalleryImages.length + newGalleryFiles.length;

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
      <div className="container-fluid px-0">

        {/* HEADER */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div className="card-body p-4 p-lg-5 text-white" style={{ background: "linear-gradient(135deg, #0d6efd 0%, #6610f2 100%)" }}>
            <div className="d-flex align-items-center gap-3">
              <div className="bg-white bg-opacity-25 rounded-3 d-flex align-items-center justify-content-center" style={{ width: "55px", height: "55px" }}>
                <i className="bi bi-capsule fs-3"></i>
              </div>
              <div>
                <span className="small opacity-75">PRODUCT CATALOG</span>
                <h2 className="fw-bold mb-0">{isEdit ? "Edit Product" : "Add Product"}</h2>
              </div>
            </div>
            <p className="mb-0 opacity-75 mt-3">
              {isEdit ? "Update this product's information for your team." : "Add a company product so your team and MRs can quickly reference it during doctor visits."}
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger border-0 shadow-sm rounded-4 d-flex align-items-center gap-3">
            <i className="bi bi-exclamation-triangle-fill fs-4"></i>
            <div className="small">{error}</div>
          </div>
        )}

        <form onSubmit={submit}>

          {/* BASIC INFORMATION */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-0 p-4">
              <h5 className="fw-bold mb-1">Basic Information</h5>
              <p className="text-muted small mb-0">Core details that identify this product.</p>
            </div>
            <div className="card-body p-4">
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Product Name <span className="text-danger">*</span></label>
                  <input className="form-control" value={form.name} onChange={(e) => setField("name", e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Product Code / SKU</label>
                  <input className="form-control" value={form.productCode} onChange={(e) => setField("productCode", e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Category</label>
                  <input className="form-control" placeholder="e.g. Antibiotic" value={form.category} onChange={(e) => setField("category", e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Product Type</label>
                  <input className="form-control" placeholder="e.g. Tablet, Syrup" value={form.type} onChange={(e) => setField("type", e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Brand Name</label>
                  <input className="form-control" value={form.brand} onChange={(e) => setField("brand", e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Product Status</label>
                  <select className="form-select" value={form.status} onChange={(e) => setField("status", e.target.value)}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Short Description</label>
                  <input className="form-control" maxLength={300} placeholder="One-line summary shown on the product card" value={form.shortDescription} onChange={(e) => setField("shortDescription", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* CLINICAL / USAGE DETAILS */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-0 p-4">
              <h5 className="fw-bold mb-1">Description &amp; Usage Details</h5>
              <p className="text-muted small mb-0">Help MRs understand what this product is for and how to present it.</p>
            </div>
            <div className="card-body p-4">
              <div className="row g-4">
                <div className="col-12">
                  <label className="form-label fw-semibold">Detailed Description</label>
                  <textarea className="form-control" rows="3" value={form.description} onChange={(e) => setField("description", e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Composition / Ingredients</label>
                  <textarea className="form-control" rows="3" value={form.composition} onChange={(e) => setField("composition", e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Target Condition / Problem</label>
                  <textarea className="form-control" rows="3" placeholder="What doctor's requirement/patient problem this solves" value={form.targetCondition} onChange={(e) => setField("targetCondition", e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Key Benefits <span className="text-muted fw-normal">(one per line)</span></label>
                  <textarea className="form-control" rows="4" placeholder={"Fast acting\nLong lasting relief"} value={form.benefits} onChange={(e) => setField("benefits", e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Uses / Indications <span className="text-muted fw-normal">(one per line)</span></label>
                  <textarea className="form-control" rows="4" value={form.indications} onChange={(e) => setField("indications", e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Dosage / Usage Instructions</label>
                  <textarea className="form-control" rows="3" value={form.dosage} onChange={(e) => setField("dosage", e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Target Audience</label>
                  <input className="form-control" placeholder="e.g. Adults, Pediatric" value={form.targetAudience} onChange={(e) => setField("targetAudience", e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Precautions</label>
                  <textarea className="form-control" rows="3" value={form.precautions} onChange={(e) => setField("precautions", e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Side Effects</label>
                  <textarea className="form-control" rows="3" value={form.sideEffects} onChange={(e) => setField("sideEffects", e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Storage Instructions</label>
                  <textarea className="form-control" rows="3" value={form.storageInstructions} onChange={(e) => setField("storageInstructions", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* IMAGES */}
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-0 p-4">
              <h5 className="fw-bold mb-1">Product Images</h5>
              <p className="text-muted small mb-0">The main image appears on the product card; gallery images show in product details.</p>
            </div>
            <div className="card-body p-4">

              <label className="form-label fw-semibold">Main Product Image {!isEdit && <span className="text-danger">*</span>}</label>
              <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
                {(mainImagePreview || existingMainImageUrl) && (
                  <div className="position-relative">
                    <img
                      src={mainImagePreview || existingMainImageUrl}
                      alt="Main product"
                      className="rounded-3 border"
                      style={{ width: "120px", height: "120px", objectFit: "cover" }}
                    />
                    <span className="badge bg-primary position-absolute top-0 start-0 m-1">Main</span>
                    {mainImagePreview && (
                      <button type="button" className="btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0 m-1 p-0" style={{ width: "22px", height: "22px" }} onClick={removeMainImage} aria-label="Remove selected main image">
                        <i className="bi bi-x small"></i>
                      </button>
                    )}
                  </div>
                )}
                <div>
                  <input ref={mainImageInputRef} type="file" className="form-control" accept="image/jpeg,image/png,image/webp" onChange={handleMainImageChange} />
                  <div className="form-text">JPG, PNG, or WEBP, up to 5 MB.</div>
                </div>
              </div>

              <label className="form-label fw-semibold">Additional Product Images <span className="text-muted fw-normal">(optional, up to {MAX_GALLERY_IMAGES})</span></label>
              <div className="mb-3">
                <input ref={galleryInputRef} type="file" multiple className="form-control" accept="image/jpeg,image/png,image/webp" disabled={usedGallerySlots >= MAX_GALLERY_IMAGES} onChange={handleGalleryChange} />
                <div className="form-text">Select multiple images at once. {usedGallerySlots}/{MAX_GALLERY_IMAGES} used.</div>
              </div>

              {(existingGalleryImages.length > 0 || newGalleryFiles.length > 0) && (
                <div className="d-flex flex-wrap gap-3">
                  {existingGalleryImages.map((image) => (
                    <div className="position-relative" key={image._id}>
                      <img src={resolveAssetUrl(image.url)} alt="Product" className="rounded-3 border" style={{ width: "90px", height: "90px", objectFit: "cover" }} />
                      <button type="button" className="btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0 m-1 p-0" style={{ width: "20px", height: "20px" }} onClick={() => removeExistingGalleryImage(image._id)} aria-label="Remove image">
                        <i className="bi bi-x small"></i>
                      </button>
                    </div>
                  ))}
                  {newGalleryFiles.map((item) => (
                    <div className="position-relative" key={item.previewUrl}>
                      <img src={item.previewUrl} alt="New upload" className="rounded-3 border" style={{ width: "90px", height: "90px", objectFit: "cover" }} />
                      <button type="button" className="btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0 m-1 p-0" style={{ width: "20px", height: "20px" }} onClick={() => removeNewGalleryImage(item.previewUrl)} aria-label="Remove image">
                        <i className="bi bi-x small"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="d-flex gap-2 mb-5">
            <button type="submit" className="btn btn-primary px-4 py-2 rounded-3" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  {isEdit ? "Saving..." : "Adding..."}
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle me-2"></i>
                  {isEdit ? "Save Changes" : "Add Product"}
                </>
              )}
            </button>
            <button type="button" className="btn btn-outline-secondary px-4 py-2 rounded-3" onClick={() => navigate("/products")}>
              Cancel
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default ProductForm;
