"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useClock } from "@/hooks/use-clock";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  LogOut,
  LayoutDashboard,
  PackagePlus,
  PackageMinus,
  Truck,
  Users,
  FileText,
  BarChart3,
  Wifi,
  WifiOff,
  User as UserIcon,
} from "lucide-react";
import { KpiTab } from "./tabs/kpi-tab";
import { EntradaTab } from "./tabs/entrada-tab";
import { SalidaTab } from "./tabs/salida-tab";
import { MaquinariaTab } from "./tabs/maquinaria-tab";
import { UsuariosTab } from "./tabs/usuarios-tab";
import { ReportesTab } from "./tabs/reportes-tab";
import { ProductividadTab } from "./tabs/productividad-tab";

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const now = useClock();
  const online = useOnlineStatus();
  const [tab, setTab] = useState("kpi");

  const isAdmin = user?.role === "admin";
  const isGerente = user?.role === "gerente";

  return (
    <div className="min-h-screen bg-[#F5F0FF]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-purple-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-xl"
              style={{ background: "#6C5CE7" }}
            >
              <Truck className="text-white" size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Control de Maquinaria</p>
              <p className="text-xs text-slate-500">Panel de administración</p>
            </div>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <div className="text-right">
              <p className="font-mono text-sm font-bold tabular-nums text-slate-900">
                {now.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </p>
              <p className="text-xs capitalize text-slate-500">
                {now.toLocaleDateString("es-VE", { weekday: "long", day: "2-digit", month: "short" })}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
              <UserIcon size={14} className="text-slate-500" />
              <div className="text-xs">
                <p className="font-semibold text-slate-900">{user?.nombre}</p>
                <p className="capitalize text-slate-500">{user?.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1">
              <span className={cn("h-2 w-2 rounded-full", online ? "bg-emerald-500" : "bg-rose-500")} />
              {online ? <Wifi size={12} className="text-slate-500" /> : <WifiOff size={12} className="text-slate-500" />}
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={logout} className="text-rose-600 hover:bg-rose-50">
            <LogOut size={16} className="mr-1" /> Salir
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 flex h-auto w-full flex-wrap gap-1 rounded-xl bg-white p-1.5 shadow-sm">
            {isAdmin && (
              <TabsTrigger value="kpi" className="data-[state=active]:bg-[#6C5CE7] data-[state=active]:text-white">
                <LayoutDashboard size={14} className="mr-1.5" /> KPIs
              </TabsTrigger>
            )}
            {(isAdmin || isGerente) && (
              <TabsTrigger value="entrada" className="data-[state=active]:bg-[#6C5CE7] data-[state=active]:text-white">
                <PackagePlus size={14} className="mr-1.5" /> Entrada
              </TabsTrigger>
            )}
            {(isAdmin || isGerente) && (
              <TabsTrigger value="salida" className="data-[state=active]:bg-[#6C5CE7] data-[state=active]:text-white">
                <PackageMinus size={14} className="mr-1.5" /> Salida
              </TabsTrigger>
            )}
            {(isAdmin || isGerente) && (
              <TabsTrigger value="maquinaria" className="data-[state=active]:bg-[#6C5CE7] data-[state=active]:text-white">
                <Truck size={14} className="mr-1.5" /> Maquinaria
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="usuarios" className="data-[state=active]:bg-[#6C5CE7] data-[state=active]:text-white">
                <Users size={14} className="mr-1.5" /> Usuarios
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="reportes" className="data-[state=active]:bg-[#6C5CE7] data-[state=active]:text-white">
                <FileText size={14} className="mr-1.5" /> Reportes
              </TabsTrigger>
            )}
            {(isAdmin || isGerente) && (
              <TabsTrigger value="productividad" className="data-[state=active]:bg-[#6C5CE7] data-[state=active]:text-white">
                <BarChart3 size={14} className="mr-1.5" /> Productividad
              </TabsTrigger>
            )}
          </TabsList>

          {isAdmin && <TabsContent value="kpi"><KpiTab /></TabsContent>}
          {(isAdmin || isGerente) && <TabsContent value="entrada"><EntradaTab /></TabsContent>}
          {(isAdmin || isGerente) && <TabsContent value="salida"><SalidaTab /></TabsContent>}
          {(isAdmin || isGerente) && <TabsContent value="maquinaria"><MaquinariaTab /></TabsContent>}
          {isAdmin && <TabsContent value="usuarios"><UsuariosTab /></TabsContent>}
          {isAdmin && <TabsContent value="reportes"><ReportesTab /></TabsContent>}
          {(isAdmin || isGerente) && <TabsContent value="productividad"><ProductividadTab /></TabsContent>}
        </Tabs>
      </main>
    </div>
  );
}
