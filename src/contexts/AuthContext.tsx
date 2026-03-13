import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "vendedor" | "taller" | "admin";
type UserStatus = "pendiente" | "activo" | "rechazado";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  status: UserStatus | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  status: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserMeta = async (userId: string) => {
    // Fetch role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (roleData) setRole(roleData.role as UserRole);

    // Fetch status
    const { data: userData } = await supabase
      .from("usuarios")
      .select("estado")
      .eq("user_id", userId)
      .maybeSingle();

    if (userData) setStatus(userData.estado as UserStatus);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => fetchUserMeta(session.user.id), 0);
        } else {
          setRole(null);
          setStatus(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserMeta(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setStatus(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, status, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
