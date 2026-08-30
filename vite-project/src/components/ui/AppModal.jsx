import { useEffect } from "react";

// Consistent modal shell built on Bootstrap's modal markup (no JS dependency
// on bootstrap.bundle). Handles: backdrop click to close, Escape to close,
// body scroll-lock, and a mobile bottom-sheet layout. Presentational shell —
// the caller owns open/close state and the form inside.
//
// size: "sm" | "md" (default) | "lg" | "xl"
// sheetOnMobile: slide up from the bottom on <=575px instead of a centred card
const SIZE_CLASS = { sm: "modal-sm", md: "", lg: "modal-lg", xl: "modal-xl" };

const AppModal = ({
  title,
  subtitle,
  onClose,
  size = "md",
  sheetOnMobile = true,
  footer = null,
  closeLabel = "Close",
  children,
}) => {
  useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("mf-drawer-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("mf-drawer-open");
    };
  }, [onClose]);

  return (
    <div
      className="modal d-block"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: "rgba(15,23,42,0.5)" }}
      onClick={onClose}
    >
      <div
        className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${SIZE_CLASS[size] || ""} ${sheetOnMobile ? "mf-modal--sheet" : ""}`.trim()}
        role="document"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-content rounded-4 border-0">
          {(title || onClose) && (
            <div className="modal-header">
              <div>
                {title && <h5 className="modal-title fw-bold mb-0">{title}</h5>}
                {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
              </div>
              {onClose && (
                <button type="button" className="btn-close" aria-label={closeLabel} onClick={onClose} />
              )}
            </div>
          )}
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
};

export default AppModal;
