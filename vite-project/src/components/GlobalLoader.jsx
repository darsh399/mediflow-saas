import { useEffect, useState } from "react";

const LOADING_EVENT = "mediflow:api-loading";

export const notifyApiLoading = (isLoading) => {
  window.dispatchEvent(new CustomEvent(LOADING_EVENT, { detail: { isLoading } }));
};

const GlobalLoader = () => {
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    const updateLoading = ({ detail }) => {
      setRequestCount((count) => Math.max(0, count + (detail.isLoading ? 1 : -1)));
    };

    window.addEventListener(LOADING_EVENT, updateLoading);
    return () => window.removeEventListener(LOADING_EVENT, updateLoading);
  }, []);

  if (!requestCount) return null;

  return (
    <div className="global-loader" role="status" aria-live="polite" aria-label="Loading">
      <div className="global-loader__spinner spinner-border text-primary" />
      <span>Loading…</span>
    </div>
  );
};

export default GlobalLoader;
