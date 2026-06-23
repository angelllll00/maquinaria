"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { LoginScreen } from "@/components/auth/login-screen";
import { EmployeeDashboard } from "@/components/employee/employee-dashboard";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default function Home() {
  const { user, loading } = useAuth();

  // Register service worker for PWA
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F5F0FF]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#6C5CE7] border-t-transparent" />
          <p className="text-sm text-slate-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (user.role === "empleado") {
    return <EmployeeDashboard />;
  }

  return <AdminDashboard />;
}
