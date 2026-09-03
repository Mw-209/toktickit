import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { RequesterUser, fetchActiveRequesters } from "../api.js";

interface RequesterContextType {
  selectedRequester: RequesterUser | null;
  requesters: RequesterUser[];
  isLoading: boolean;
  error: string | null;
  selectRequester: (requester: RequesterUser) => void;
  clearRequester: () => void;
}

const RequesterContext = createContext<RequesterContextType | null>(null);

const SESSION_KEY = "toktickit_dev_requester";

export function RequesterProvider({ children }: { children: ReactNode }) {
  const [selectedRequester, setSelectedRequester] = useState<RequesterUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [requesters, setRequesters] = useState<RequesterUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetchActiveRequesters()
      .then(setRequesters)
      .catch(() => setError("Failed to load development requesters. Please ensure the server is running."))
      .finally(() => setIsLoading(false));
  }, []);

  const selectRequester = (requester: RequesterUser) => {
    setSelectedRequester(requester);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(requester));
  };

  const clearRequester = () => {
    setSelectedRequester(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  return (
    <RequesterContext.Provider value={{ selectedRequester, requesters, isLoading, error, selectRequester, clearRequester }}>
      {children}
    </RequesterContext.Provider>
  );
}

export function useRequester(): RequesterContextType {
  const ctx = useContext(RequesterContext);
  if (!ctx) throw new Error("useRequester must be used within RequesterProvider");
  return ctx;
}
