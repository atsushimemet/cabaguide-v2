"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isActive = true;
    const authed = hasAdminSession();

    Promise.resolve().then(() => {
      if (!isActive) {
        return;
      }
      setIsAuthenticated(authed);
      setIsChecking(false);
    });

    if (!authed) {
      router.replace("/admin/login");
    }

    return () => {
      isActive = false;
    };
  }, [router]);

  const logout = useCallback(async () => {
    clearAdminSession();
    await fetch("/api/admin/session", { method: "DELETE", credentials: "include" });
    router.replace("/admin/login");
  }, [router]);

  return { isChecking, isAuthenticated, logout };
};
