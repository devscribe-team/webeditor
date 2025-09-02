import { useEffect, useState } from "react";

const SIDEBAR_KEY = "sidebar-state";
const DEFAULT = "expanded";

export function useSidebarState() {
  const [state, setState] = useState<"expanded" | "collapsed">(DEFAULT);
  const [mounted, setMounted] = useState(false);

  // On mount, read from localStorage
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored === "expanded" || stored === "collapsed") {
      setState(stored);
    } else {
      // Clean up any old/invalid values
      localStorage.setItem(SIDEBAR_KEY, DEFAULT);
      setState(DEFAULT);
    }
  }, []);

  // When state changes, update localStorage
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(SIDEBAR_KEY, state);
  }, [state, mounted]);

  // Toggle function
  const toggle = () => setState((prev) => (prev === "expanded" ? "collapsed" : "expanded"));

  return { state, setState, toggle };
}
