// client/src/components/ScrollToTop/ScrollToTop.jsx
import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}