"use client";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { VisitorIdentity } from "@/lib/types";
const VisitorContext = createContext<{
  user: VisitorIdentity | null;
  setUser: (user: VisitorIdentity | null) => void;
}>({ user: null, setUser: () => {} });
export function VisitorSession({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: VisitorIdentity | null;
}) {
  const [user, updateUser] = useState(initialUser);
  const setUser = useCallback(
    (user: VisitorIdentity | null) => updateUser(user),
    [],
  );
  return (
    <VisitorContext.Provider value={{ user, setUser }}>
      {children}
    </VisitorContext.Provider>
  );
}
export function useVisitor() {
  return useContext(VisitorContext);
}
