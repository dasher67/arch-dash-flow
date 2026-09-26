import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { me } from "./api.functions";

export type Staff = { id: string; name: string; role: "admin" | "staff" | "viewer" };
type Ctx = {
  ready: boolean;
  token: string | null;
  staff: Staff | null;
  signIn: (token: string, staff: Staff) => void;
  signOut: () => void;
};
const SessionContext = createContext<Ctx | null>(null);
const KEY = "arch-session";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (!saved) {
      setReady(true);
      return;
    }
    const { token: tk, staff: st } = JSON.parse(saved);
    setToken(tk);
    setStaff(st);
    me({ data: { token: tk } })
      .then((fresh) => {
        if (fresh) {
          setStaff(fresh);
          localStorage.setItem(KEY, JSON.stringify({ token: tk, staff: fresh }));
        } else {
          localStorage.removeItem(KEY);
          setToken(null);
          setStaff(null);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const signIn = (tk: string, st: Staff) => {
    localStorage.setItem(KEY, JSON.stringify({ token: tk, staff: st }));
    setToken(tk);
    setStaff(st);
  };
  const signOut = () => {
    localStorage.removeItem(KEY);
    setToken(null);
    setStaff(null);
  };

  return (
    <SessionContext.Provider value={{ ready, token, staff, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const c = useContext(SessionContext);
  if (!c) throw new Error("useSession outside provider");
  return c;
}

/** For pages inside the signed-in layout: token and staff are guaranteed. */
export function useAuthed() {
  const s = useSession();
  return { token: s.token!, staff: s.staff!, signOut: s.signOut };
}
