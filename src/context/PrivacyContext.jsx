import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from "react";
import { setHideSensitiveBalances } from "../utils/money";

const STORAGE_KEY = "hideSensitiveBalances";
const PrivacyContext = createContext({
  hidden: false,
  toggle: () => {},
});

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function PrivacyProvider({ children }) {
  const [hidden, setHidden] = useState(readStored);

  useLayoutEffect(() => {
    setHideSensitiveBalances(hidden);
    try {
      localStorage.setItem(STORAGE_KEY, hidden ? "true" : "false");
    } catch {
      /* ignore */
    }
  }, [hidden]);

  const toggle = useCallback(() => setHidden((current) => !current), []);
  const value = useMemo(() => ({ hidden, toggle }), [hidden, toggle]);

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}

export function PrivacyGate({ children }) {
  usePrivacy();
  return children;
}
