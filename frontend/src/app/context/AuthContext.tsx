import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authService, type AuthUser, type RegisterPayload } from "../services/authService";

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  verifyEmail: (email: string, code: string) => Promise<boolean>;
  resendVerificationCode: (email: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED !== "false";

function loadUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem("voyara_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistAuth(user: AuthUser, token?: string) {
  sessionStorage.setItem("voyara_user", JSON.stringify(user));
  if (token) sessionStorage.setItem("voyara_token", token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (!AUTH_ENABLED) {
      setLoading(false);
      return;
    }

    const token = sessionStorage.getItem("voyara_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const currentUser = await authService.me();
      setUser(currentUser);
      persistAuth(currentUser);
    } catch {
      sessionStorage.removeItem("voyara_user");
      sessionStorage.removeItem("voyara_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    const clearExpiredAuth = () => setUser(null);
    window.addEventListener("voyara:auth-expired", clearExpiredAuth);
    return () => window.removeEventListener("voyara:auth-expired", clearExpiredAuth);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      persistAuth(response.user, response.token);
      return true;
    } catch {
      return false;
    }
  };

  const register = async (payload: RegisterPayload): Promise<boolean> => {
    try {
      await authService.register(payload);
      return true;
    } catch {
      return false;
    }
  };

  const signup = (name: string, email: string, password: string): Promise<boolean> =>
    register({ fullName: name, email, password });

  const verifyEmail = async (email: string, code: string): Promise<boolean> => {
    try {
      const response = await authService.verifyEmail(email, code);
      setUser(response.user);
      persistAuth(response.user, response.token);
      return true;
    } catch {
      return false;
    }
  };

  const resendVerificationCode = async (email: string): Promise<boolean> => {
    try {
      await authService.resendVerificationCode(email);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("voyara_user");
    sessionStorage.removeItem("voyara_token");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, loading, user, login, register, signup, verifyEmail, resendVerificationCode, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
