import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import companyProductApi from "../../api/companyProductApi";
import { useNotify } from "../../components/NotificationProvider";
import { resolveAssetUrl } from "../../utils/resolveAssetUrl";

const MANAGER_ROLES = ["admin", "company_owner", "hr_manager"];

const Products = () => {
  const role = useSelector((state) => state.auth.user?.role);
  const canManage = MANAGER_ROLES.includes(role);
  const { notify } = useNotify();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState(canManage ? "all" : "ACTIVE");
  const [sort, setSort] = useState("newest");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await companyProductApi.listProducts();
      setProducts(response.products || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))], [products]);
  const types = useMemo(() => [...new Set(products.map((p) => p.type).filter(Boolean))], [products]);
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand).filter(Boolean))], [products]);

  const filteredProducts = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesSearch =
        !searchValue ||
        [product.name, product.productCode, product.brand, product.category, product.composition, product.targetCondition]
          .some((field) => String(field || "").toLowerCase().includes(searchValue));

      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      const matchesType = typeFilter === "all" || product.type === typeFilter;
      const matchesBrand = brandFilter === "all" || product.brand === brandFilter;
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;

      return matchesSearch && matchesCategory && matchesType && matchesBrand && matchesStatus;
    });

    const sorted = [...filtered];
    if (sort === "newest") sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sort === "oldest") sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sort === "name_asc") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "name_desc") sorted.sort((a, b) => b.name.localeCompare(a.name));
    return sorted;
  }, [products, search, categoryFilter, typeFilter, brandFilter, statusFilter, sort]);

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setTypeFilter("all");
    setBrandFilter("all");
    setStatusFilter(canManage ? "all" : "ACTIVE");
    setSort("newest");
  };

  const toggleStatus = async (product) => {
    const nextStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      setBusyId(product._id);
      await companyProductApi.updateProductStatus(product._id, nextStatus);
      setProducts((current) => current.map((item) => (item._id === product._id ? { ...item, status: nextStatus } : item)));
      notify("Status updated", `${product.name} is now ${nextStatus === "ACTIVE" ? "active" : "inactive"}.`);
    } catch (err) {
      notify("Unable to update status", err?.response?.data?.message || "Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const removeProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      setBusyId(product._id);
      await companyProductApi.deleteProduct(product._id);
      setProducts((current) => current.filter((item) => item._id !== product._id));
      notify("Product deleted", `${product.name} was removed from the catalog.`);
    } catch (err) {
      notify("Unable to delete product", err?.response?.data?.message || "Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }}></div>
            <h5 className="fw-semibold">Loading Products</h5>
            <p className="text-muted mb-0">Please wait while we fetch your company's products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
      <div className="container-fluid px-0">

        {/* HEADER */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div className="card-body p-4 p-lg-5 text-white" style={{ background: "linear-gradient(135deg, var(--mf-color-primary) 0%, var(--mf-color-accent) 100%)" }}>
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
              <div>
                <div className="d-flex align-items-center gap-3 mb-2">
                  <div className="bg-white bg-opacity-25 rounded-3 d-flex align-items-center justify-content-center" style={{ width: "55px", height: "55px" }}>
                    <i className="bi bi-capsule fs-3"></i>
                  </div>
                  <div>
                    <span className="small opacity-75">PRODUCT CATALOG</span>
                    <h2 className="fw-bold mb-0">All Products</h2>
                  </div>
                </div>
                <p className="mb-0 opacity-75">Company products for your team and MRs to reference during doctor visits.</p>
              </div>
              {canManage && (
                <Link to="/products/add" className="btn btn-light fw-semibold px-4 rounded-3">
                  <i className="bi bi-plus-lg me-2"></i>
                  Add Product
                </Link>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger border-0 shadow-sm rounded-4">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        {/* SEARCH & FILTERS */}
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4">
            <div className="row g-3 align-items-end">

              <div className="col-lg-4">
                <label className="form-label fw-semibold">Search</label>
                <div className="input-group">
                  <span className="input-group-text bg-white"><i className="bi bi-search text-primary"></i></span>
                  <input className="form-control" placeholder="Name, code, brand, composition..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>

              <div className="col-6 col-lg-2">
                <label className="form-label fw-semibold">Category</label>
                <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="all">All</option>
                  {categories.map((category) => <option value={category} key={category}>{category}</option>)}
                </select>
              </div>

              <div className="col-6 col-lg-2">
                <label className="form-label fw-semibold">Type</label>
                <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="all">All</option>
                  {types.map((type) => <option value={type} key={type}>{type}</option>)}
                </select>
              </div>

              <div className="col-6 col-lg-2">
                <label className="form-label fw-semibold">Brand</label>
                <select className="form-select" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
                  <option value="all">All</option>
                  {brands.map((brand) => <option value={brand} key={brand}>{brand}</option>)}
                </select>
              </div>

              {canManage && (
                <div className="col-6 col-lg-2">
                  <label className="form-label fw-semibold">Status</label>
                  <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              )}

              <div className="col-6 col-lg-3">
                <label className="form-label fw-semibold">Sort</label>
                <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name_asc">Name A-Z</option>
                  <option value="name_desc">Name Z-A</option>
                </select>
              </div>

              <div className="col-6 col-lg-2">
                <button className="btn btn-outline-secondary w-100" onClick={clearFilters}>
                  <i className="bi bi-x-circle me-2"></i>
                  Clear
                </button>
              </div>

            </div>
            <div className="mt-3">
              <span className="text-muted small">Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products</span>
            </div>
          </div>
        </div>

        {/* EMPTY STATE */}
        {products.length === 0 ? (
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body text-center py-5">
              <div className="rounded-circle bg-primary-subtle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "80px", height: "80px" }}>
                <i className="bi bi-capsule text-primary fs-1"></i>
              </div>
              {canManage ? (
                <>
                  <h5 className="fw-bold">No products added yet.</h5>
                  <p className="text-muted mb-4">Add your first company product to make product information easily accessible to your employees and MRs.</p>
                  <Link to="/products/add" className="btn btn-primary rounded-3 px-4">
                    <i className="bi bi-plus-lg me-2"></i>
                    Add Product
                  </Link>
                </>
              ) : (
                <>
                  <h5 className="fw-bold">No products available</h5>
                  <p className="text-muted mb-0">No products are currently available for your company.</p>
                </>
              )}
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body text-center py-5">
              <i className="bi bi-search text-muted fs-1"></i>
              <h5 className="fw-bold mt-3">No products match your filters</h5>
              <p className="text-muted mb-0">Try adjusting your search or filters.</p>
            </div>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-3 row-cols-xxl-4 g-4">
            {filteredProducts.map((product) => (
              <div className="col" key={product._id}>
                <div className="card border-0 shadow-sm rounded-4 h-100 product-card">
                  <div className="position-relative">
                    <img
                      src={resolveAssetUrl(product.mainImage?.url)}
                      alt={product.name}
                      className="card-img-top product-card-image"
                    />
                    <span className={`badge rounded-pill position-absolute top-0 end-0 m-2 ${product.status === "ACTIVE" ? "bg-success" : "bg-secondary"}`}>
                      {product.status === "ACTIVE" ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="card-body p-4 d-flex flex-column">
                    <h5 className="fw-bold mb-1 text-truncate">{product.name}</h5>
                    <p className="text-muted small mb-2">
                      {[product.brand, product.category].filter(Boolean).join(" • ") || " "}
                    </p>
                    {product.shortDescription && <p className="small text-muted mb-2" style={{ minHeight: "2.5em" }}>{product.shortDescription}</p>}
                    {product.benefits?.length > 0 && (
                      <div className="mb-3">
                        <div className="fw-semibold small mb-1">Key Benefits</div>
                        <ul className="small text-muted ps-3 mb-0">
                          {product.benefits.slice(0, 3).map((benefit, index) => <li key={index}>{benefit}</li>)}
                        </ul>
                      </div>
                    )}
                    <div className="mt-auto pt-2 border-top small text-muted">
                      <div>Added by: {product.createdBy?.name || "Unknown"}</div>
                      <div>Added: {formatDate(product.createdAt)}</div>
                    </div>
                    <div className="d-flex flex-wrap gap-2 mt-3">
                      <Link to={`/products/${product._id}`} className="btn btn-primary btn-sm rounded-3 flex-grow-1">
                        View Details
                      </Link>
                      {canManage && (
                        <>
                          <Link to={`/products/${product._id}/edit`} className="btn btn-outline-secondary btn-sm rounded-3">
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button type="button" className="btn btn-outline-warning btn-sm rounded-3" disabled={busyId === product._id} onClick={() => toggleStatus(product)} title={product.status === "ACTIVE" ? "Deactivate" : "Activate"}>
                            <i className={`bi ${product.status === "ACTIVE" ? "bi-eye-slash" : "bi-eye"}`}></i>
                          </button>
                          <button type="button" className="btn btn-outline-danger btn-sm rounded-3" disabled={busyId === product._id} onClick={() => removeProduct(product)} title="Delete">
                            <i className="bi bi-trash"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <style>
        {`
          .product-card-image {
            width: 100%;
            aspect-ratio: 4 / 3;
            object-fit: cover;
            background-color: #f1f3f5;
          }
          .product-card {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .product-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 28px rgba(0,0,0,0.08) !important;
          }
        `}
      </style>
    </div>
  );
};

export default Products;
