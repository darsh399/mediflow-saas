import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// React Router doesn't reset scroll position on navigation by default, so
// clicking a link while scrolled down on the previous page leaves the new
// page's content wherever the viewport already was. This resets to the top
// on every route change (but not on in-page hash navigation).
//
// Bootstrap's reboot sets `scroll-behavior: smooth` on :root, which also
// applies to *programmatic* scrollTo calls unless overridden — so a plain
// `window.scrollTo(0, 0)` here would animate over ~1s instead of jumping,
// visibly scrolling through the old page's content first. `behavior:
// "instant"` bypasses that CSS default for this specific call.
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
