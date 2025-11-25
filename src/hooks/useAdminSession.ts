"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

export const ADMIN_SESSION_KEY = "cabaguide-admin";

export const hasAdminSession = () => {
  if (typeof window === "undefined") {
    return false;
  }
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
};

export const persistAdminSession = () => {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
};

export const clearAdminSession = () => {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
};

export const useAdminGuard = () => {
  const router = useRouter();
  const isAuthenticated = hasAdminSession();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/admin/login");
    }
  }, [isAuthenticated, router]);

  const logout = useCallback(() => {
    clearAdminSession();
    router.replace("/admin/login");
  }, [router]);

  return { isChecking: false, isAuthenticated, logout };
};
