"use client";

import { useState, useEffect, useCallback } from "react";
import { UserRole } from "@/lib/types";

interface User {
  id: number;
  username: string;
  realName: string;
  role: UserRole;
  phone?: string;
  village?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setState({ user: data.data, token, loading: false });
          } else {
            localStorage.removeItem("token");
            setState({ user: null, token: null, loading: false });
          }
        })
        .catch(() => {
          localStorage.removeItem("token");
          setState({ user: null, token: null, loading: false });
        });
    } else {
      setState({ user: null, token: null, loading: false });
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem("token", data.data.token);
      setState({
        user: data.data.user,
        token: data.data.token,
        loading: false,
      });
    }
    return data;
  }, []);

  const register = useCallback(
    async (
      username: string,
      password: string,
      realName: string,
      phone?: string,
      village?: string
    ) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, realName, phone, village }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.data.token);
        setState({
          user: data.data.user,
          token: data.data.token,
          loading: false,
        });
      }
      return data;
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setState({ user: null, token: null, loading: false });
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    isAuthenticated: !!state.user,
    isInternal: state.user?.role === UserRole.INTERNAL,
    isExternal: state.user?.role === UserRole.EXTERNAL,
  };
}
