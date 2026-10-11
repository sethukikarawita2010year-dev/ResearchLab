import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  deleteAccount as apiDeleteAccount,
  login as apiLogin,
  logout as apiLogout,
  me as apiMe,
  signup as apiSignup,
} from "../lib/authApi";
import { clearSessions, hydrateSessions } from "../lib/sessionStore";
import { clearFolders, hydrateFolders } from "../lib/folderStore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiMe()
      .then((current) => {
        if (active) setUser(current);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      hydrateSessions();
      hydrateFolders();
    } else {
      clearSessions();
      clearFolders();
    }
  }, [user]);

  const signIn = useCallback(async (credentials) => {
    const data = await apiLogin(credentials);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await apiSignup(payload);
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const deleteAccount = useCallback(async () => {
    await apiDeleteAccount();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, register, signOut, updateUser, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
