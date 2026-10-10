"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
export interface VisitorIdentity {
  id: number;
  email: string;
  role: "USER";
}
const VisitorContext = createContext<{
  user: VisitorIdentity | null;
  loading: boolean;
  setUser: (user: VisitorIdentity | null) => void;
}>({ user: null, loading: true, setUser: () => {} });
export function VisitorSession({ children }: { children: ReactNode }) {
  const [user, updateUser] = useState<VisitorIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const revision = useRef(0);
  const setUser = useCallback((user: VisitorIdentity | null) => {
    revision.current++;
    updateUser(user);
    setLoading(false);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const initialRevision = revision.current;
    fetch("/api/auth/me", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const data = response.ok ? await response.json() : null;
        if (!controller.signal.aborted && initialRevision === revision.current)
          updateUser(data?.user ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  return (
    <VisitorContext.Provider value={{ user, loading, setUser }}>
      {children}
    </VisitorContext.Provider>
  );
}
export function useVisitor() {
  return useContext(VisitorContext);
}
