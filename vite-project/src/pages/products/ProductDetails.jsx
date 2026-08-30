import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { PageContainer, Breadcrumbs, SkeletonTable } from "../../components/ui";
import companyProductApi from "../../api/companyProductApi";
import { useNotify } from "../../components/NotificationProvider";
import { resolveAssetUrl } from "../../utils/resolveAssetUrl";

const MANAGER_ROLES = ["admin", "company_owner", "hr_manager"];

const FIELD_SECTIONS = [
  { label: "Composition / Ingredients", key: "composition" },
  { label: "Dosage / Usage Instructions", key: "dosage" },
  { label: "Precautions", key: "precautions" },
  { label: "Side Effects", key: "sideEffects" },
  { label: "Storage Instructions", key: "storageInstructions" },
  { label: "Target Condition / Problem", key: "targetCondition" },
  { label: "Target Audience", key: "targetAudience" },
];

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = useSelector((state) => state.auth.user?.role);
  const canManage = MANAGER_ROLES.includes(role);
  const { notify } = useNotify();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageUrl, setActiveImageUrl] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const response = await companyProductApi.getProduct(id);
        if (cancelled) return;
        setProduct(response.product);
        setActiveImageUrl(resolveAssetUrl(response.product?.mainImage?.url));
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Unable to load product");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatRole = (value) => {
    if (!value) return "N/A";
    return value.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const toggleStatus = async () => {
    const nextStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      setBusy(true);
      await companyProductApi.updateProductStatus(product._id, nextStatus);
      setProduct((current) => ({ ...current, status: nextStatus }));
      notify("Status updated", `${product.name} is now ${nextStatus === "ACTIVE" ? "active" : "inactive"}.`);
    } catch (err) {
      notify("Unable to update status", err?.response?.data?.message || "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const removeProduct = async () => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      setBusy(true);
      await companyProductApi.deleteProduct(product._id);
      notify("Product deleted", `${product.name} was removed from the catalog.`);
      navigate("/products");
    } catch (err) {
      notify("Unable to delete product", err?.response?.data?.message || "Please try again.");
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Breadcrumbs items={[{ label: "Products", to: "/products" }, { label: "Product" }]} />
        <SkeletonTable rows={5} columns={2} />
      </PageContainer>
    );
  }

  if (error || !product) {
    return (
      <PageContainer width="narrow">
        <button className="btn btn-ghost rounded-3" onClick={() => navigate(-1)}><i className="bi bi-arrow-left me-2"></i>Back</button>
        <div className="alert alert-danger border-0 shadow-sm mb-0">{error || "Product not found"}</div>
      </PageContainer>
    );
  }

  const gallery = [product.mainImage, ...(product.images || [])].filter(Boolean);

  return (
    <PageContainer>
      <Breadcrumbs items={[{ label: "Products", to: "/products" }, { label: product.name || "Product" }]} />

      <div className="container-fluid px-0">

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-2"></i>Back
          </button>
          {canManage && (
            <div className="d-flex flex-wrap gap-2">
              <Link to={`/products/${product._id}/edit`} className="btn btn-outline-primary rounded-3">
                <i className="bi bi-pencil me-2"></i>Edit
              </Link>
              <button type="button" className="btn btn-outline-warning rounded-3" disabled={busy} onClick={toggleStatus}>
                <i className={`bi ${product.status === "ACTIVE" ? "bi-eye-slash" : "bi-eye"} me-2`}></i>
                {product.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </button>
              <button type="button" className="btn btn-outline-danger rounded-3" disabled={busy} onClick={removeProduct}>
                <i className="bi bi-trash me-2"></i>Delete
              </button>
            </div>
          )}
        </div>

        <div className="row g-4">

          {/* IMAGES */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-3">
              <img
                src={activeImageUrl}
                alt={product.name}
                className="w-100"
                role="button"
                style={{ aspectRatio: "4 / 3", objectFit: "cover", cursor: "zoom-in" }}
                onClick={() => setLightboxOpen(true)}
              />
            </div>
            {gallery.length > 1 && (
              <div className="d-flex flex-wrap gap-2">
                {gallery.map((image) => {
                  const resolvedUrl = resolveAssetUrl(image.url);
                  return (
                    <img
                      key={image._id || image.url}
                      src={resolvedUrl}
                      alt={product.name}
                      role="button"
                      className={`rounded-3 border ${activeImageUrl === resolvedUrl ? "border-primary border-2" : ""}`}
                      style={{ width: "70px", height: "70px", objectFit: "cover" }}
                      onClick={() => setActiveImageUrl(resolvedUrl)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* INFO */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                  <h2 className="fw-bold mb-0">{product.name}</h2>
                  <span className={`badge rounded-pill px-3 py-2 ${product.status === "ACTIVE" ? "bg-success-subtle text-success" : "bg-secondary-subtle text-secondary"}`}>
                    {product.status === "ACTIVE" ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-muted mb-3">
                  {[product.brand, product.category, product.type].filter(Boolean).join(" • ")}
                  {product.productCode && <span className="ms-2 badge bg-light text-dark border">Code: {product.productCode}</span>}
                </p>
                {product.shortDescription && <p className="fw-semibold">{product.shortDescription}</p>}
                {product.description && <p className="text-muted">{product.description}</p>}

                {product.benefits?.length > 0 && (
                  <div className="mb-3">
                    <h6 className="fw-bold">Key Benefits</h6>
                    <ul className="mb-0">{product.benefits.map((item, index) => <li key={index}>{item}</li>)}</ul>
                  </div>
                )}

                {product.indications?.length > 0 && (
                  <div className="mb-3">
                    <h6 className="fw-bold">Uses / Indications</h6>
                    <ul className="mb-0">{product.indications.map((item, index) => <li key={index}>{item}</li>)}</ul>
                  </div>
                )}
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-header bg-white border-0 p-4">
                <h5 className="fw-bold mb-0">Additional Details</h5>
              </div>
              <div className="card-body p-4">
                <div className="row g-4">
                  {FIELD_SECTIONS.filter((section) => product[section.key]).map((section) => (
                    <div className="col-md-6" key={section.key}>
                      <div className="text-muted small fw-semibold text-uppercase mb-1">{section.label}</div>
                      <div>{product[section.key]}</div>
                    </div>
                  ))}
                  {!FIELD_SECTIONS.some((section) => product[section.key]) && (
                    <div className="col-12 text-muted">No additional details were added for this product.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <h6 className="fw-bold mb-3">Creator Information</h6>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <div className="text-muted small">Added By</div>
                    <div className="fw-semibold">{product.createdBy?.name || "Unknown"}</div>
                  </div>
                  <div className="col-sm-6">
                    <div className="text-muted small">Role</div>
                    <div className="fw-semibold">{formatRole(product.createdByRole || product.createdBy?.role)}</div>
                  </div>
                  <div className="col-sm-6">
                    <div className="text-muted small">Added On</div>
                    <div className="fw-semibold">{formatDate(product.createdAt)}</div>
                  </div>
                  <div className="col-sm-6">
                    <div className="text-muted small">Last Updated</div>
                    <div className="fw-semibold">{formatDate(product.updatedAt)}</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {lightboxOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0,0,0,0.85)", zIndex: 2000 }}
          role="button"
          onClick={() => setLightboxOpen(false)}
        >
          <button type="button" className="btn btn-light rounded-circle position-absolute" style={{ top: "20px", right: "20px", width: "40px", height: "40px" }} onClick={() => setLightboxOpen(false)} aria-label="Close">
            <i className="bi bi-x-lg"></i>
          </button>
          <img src={activeImageUrl} alt={product.name} style={{ maxWidth: "92vw", maxHeight: "88vh", objectFit: "contain" }} onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </PageContainer>
  );
};

export default ProductDetails;
