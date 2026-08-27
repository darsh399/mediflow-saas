import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import doctorApi from "../api/doctorApi";
import medicalApi from "../api/medicalApi";
import userApi from "../api/userApi";
import companyProductApi from "../api/companyProductApi";

const FIELD_ROLES = {
  doctors: ["admin", "company_owner", "hr_manager", "hr", "manager", "project_manager", "mr"],
  medicals: ["admin", "company_owner", "hr_manager", "hr", "manager", "project_manager", "mr"],
  employees: ["admin", "company_owner", "hr_manager", "hr", "mr"],
  products: ["admin", "company_owner", "hr_manager", "hr", "manager", "project_manager", "employee", "mr"],
};

const GROUP_META = {
  doctors: { label: "Doctors", icon: "bi-heart-pulse" },
  medicals: { label: "Medicals", icon: "bi-hospital" },
  employees: { label: "Employees", icon: "bi-people" },
  products: { label: "Products", icon: "bi-capsule" },
};

const MAX_PER_GROUP = 5;

const norm = (value) => String(value || "").toLowerCase();

const GlobalSearch = () => {
  const navigate = useNavigate();
  const role = useSelector((state) => state.auth.user?.role);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [datasets, setDatasets] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const loadedRef = useRef(false);

  const allowed = useMemo(
    () => Object.fromEntries(Object.entries(FIELD_ROLES).map(([key, roles]) => [key, roles.includes(role)])),
    [role]
  );

  const loadDatasets = async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    setLoading(true);

    const [doctorsResult, medicalsResult, employeesResult, productsResult] = await Promise.allSettled([
      allowed.doctors ? doctorApi.listDoctors() : Promise.resolve(null),
      allowed.medicals ? medicalApi.listMedicals() : Promise.resolve(null),
      allowed.employees ? userApi.listUsers() : Promise.resolve(null),
      allowed.products ? companyProductApi.listProducts() : Promise.resolve(null),
    ]);

    const pick = (result, key) =>
      result.status === "fulfilled" && result.value && Array.isArray(result.value[key]) ? result.value[key] : [];

    setDatasets({
      doctors: pick(doctorsResult, "doctors"),
      medicals: pick(medicalsResult, "medicals"),
      employees: pick(employeesResult, "users"),
      products: pick(productsResult, "products"),
    });
    setLoading(false);
  };

  useEffect(() => {
    const handleOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const results = useMemo(() => {
    const term = norm(query).trim();
    if (!term || !datasets) return [];

    const matches = [];

    const push = (group, items, toEntry) => {
      const hits = items.filter(toEntry.test).slice(0, MAX_PER_GROUP).map(toEntry.map);
      if (hits.length) matches.push({ group, hits });
    };

    push("doctors", datasets.doctors, {
      test: (d) => [d.name, d.clinicName, d.city, d.specialty, d.phone, d.email].some((f) => norm(f).includes(term)),
      map: (d) => ({
        id: d._id,
        primary: d.name,
        secondary: [d.clinicName, d.city].filter(Boolean).join(" · "),
        to: `/doctors/${d._id}`,
      }),
    });

    push("medicals", datasets.medicals, {
      test: (m) => [m.name, m.contactPerson, m.city, m.area, m.mobile, m.email].some((f) => norm(f).includes(term)),
      map: (m) => ({
        id: m._id,
        primary: m.name,
        secondary: [m.area, m.city].filter(Boolean).join(" · "),
        to: `/medicals/${m._id}`,
      }),
    });

    push("employees", datasets.employees, {
      test: (u) => [u.name, u.email, u.role, u.employeeId, u.mobile].some((f) => norm(f).includes(term)),
      map: (u) => ({
        id: u._id,
        primary: u.name,
        secondary: [String(u.role || "").replace(/_/g, " "), u.email].filter(Boolean).join(" · "),
        // Everyone can open the org chart; the full admin profile is role-gated,
        // so route through the chart's person view instead.
        to: `/organization?focus=${u._id}`,
      }),
    });

    push("products", datasets.products, {
      test: (p) =>
        [p.name, p.productCode, p.brand, p.category, p.composition, p.targetCondition].some((f) => norm(f).includes(term)),
      map: (p) => ({
        id: p._id,
        primary: p.name,
        secondary: [p.brand, p.category].filter(Boolean).join(" · "),
        to: `/products/${p._id}`,
      }),
    });

    return matches;
  }, [query, datasets]);

  const flat = useMemo(() => results.flatMap((section) => section.hits.map((hit) => hit.to)), [results]);

  const go = (to) => {
    setOpen(false);
    setQuery("");
    navigate(to);
  };

  const handleKeyDown = (event) => {
    if (!open || !flat.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % flat.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? flat.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      go(flat[activeIndex]);
    }
  };

  const noGroups = Object.values(allowed).every((value) => !value);
  if (noGroups) return null;

  const hasQuery = query.trim().length > 0;

  return (
    <div className="global-search position-relative" ref={containerRef}>
      <div className="input-group input-group-sm">
        <span className="input-group-text bg-white border-end-0">
          <i className="bi bi-search text-muted"></i>
        </span>
        <input
          type="text"
          className="form-control border-start-0"
          placeholder="Search doctors, medicals, people…"
          value={query}
          onFocus={() => {
            setOpen(true);
            loadDatasets();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          aria-label="Global search"
        />
      </div>

      {open && hasQuery && (
        <div className="global-search-panel shadow-lg rounded-4 border bg-white">
          {loading && !datasets ? (
            <div className="text-center text-muted py-4">
              <span className="spinner-border spinner-border-sm me-2"></span>Loading…
            </div>
          ) : results.length === 0 ? (
            <div className="text-center text-muted py-4">
              <i className="bi bi-search d-block fs-4 mb-2"></i>
              No matches for “{query.trim()}”
            </div>
          ) : (
            results.map((section) => {
              const meta = GROUP_META[section.group];
              return (
                <div className="global-search-group" key={section.group}>
                  <div className="global-search-group-label">
                    <i className={`bi ${meta.icon} me-1`}></i>
                    {meta.label}
                  </div>
                  {section.hits.map((hit) => {
                    const index = flat.indexOf(hit.to);
                    return (
                      <button
                        type="button"
                        key={hit.id}
                        className={`global-search-item ${activeIndex === index ? "is-active" : ""}`}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => go(hit.to)}
                      >
                        <span className="global-search-primary">{hit.primary}</span>
                        {hit.secondary && <span className="global-search-secondary">{hit.secondary}</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}

      <style>
        {`
          .global-search { width: 260px; max-width: 46vw; }
          .global-search-panel {
            position: absolute; top: 42px; left: 0; right: 0;
            z-index: 9999; padding: 8px; max-height: 60vh; overflow-y: auto;
            animation: gsDrop .16s ease-out;
          }
          .global-search-group + .global-search-group { border-top: 1px solid #f1f3f5; margin-top: 4px; padding-top: 4px; }
          .global-search-group-label {
            font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
            color: #868e96; padding: 6px 10px 2px;
          }
          .global-search-item {
            display: flex; flex-direction: column; gap: 1px; width: 100%;
            border: 0; background: transparent; text-align: left;
            padding: 7px 10px; border-radius: 8px;
          }
          .global-search-item:hover, .global-search-item.is-active { background: #f3f7ff; }
          .global-search-primary { font-size: 13.5px; font-weight: 600; color: #212529; }
          .global-search-secondary { font-size: 12px; color: #868e96; text-transform: capitalize; }
          @keyframes gsDrop { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
          @media (max-width: 575.98px) {
            .global-search { width: 190px; }
            .global-search-panel { position: fixed; left: 8px; right: 8px; top: 64px; }
          }
          body.dark-mode .global-search-panel { background: #1f2937; border-color: #374151; }
          body.dark-mode .global-search-primary { color: #e5e7eb; }
          body.dark-mode .global-search-item:hover, body.dark-mode .global-search-item.is-active { background: #374151; }
        `}
      </style>
    </div>
  );
};

export default GlobalSearch;
