// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 🔥 restore session
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get("/user/me");
        setUser(res.data.data);
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    fetchMe();
  }, []);

  // 🔥 LOGIN
  const login = async ({ email, password }) => {
    try {
      await api.post("/auth/login", { email, password });

      // ambil user dari cookie
      const me = await api.get("/user/me");

      setUser(me.data.data);
      return me.data.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  };

  // 🔥 REGISTER
  const register = async ({ name, email, password }) => {
    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      return res.data.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  };

  // 🔥 UPDATE PROFILE (API BASED)
  const updateProfile = async (partial) => {
    try {
      const res = await api.put("/user", partial);

      setUser(res.data.data);
      return res.data.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  };

  // 🔥 LOGOUT
  const logout = async () => {
    try {
      await api.post("/auth/logout");
      setUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const value = useMemo(
    () => ({
      user,
      authLoading,
      isAuthenticated: !!user,
      login,
      register,
      updateProfile,
      logout,
    }),
    [user, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}