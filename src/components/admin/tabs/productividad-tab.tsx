"use client";

import { useEffect, useMemo, useState } from "react";
import { getAll, put } from "@/lib/indexeddb/db";
import { useAuth } from "@/lib/auth/auth-context";
import { triggerSync } from "@/lib/sync/sync-manager";
import {
  MINERAL_LABELS,
  type MineralType,
  type RevisionTurno,
  type Turno,
} from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { formatShortDateTime } from "@/hooks/use-clock";
import { formatDuration } from "@/lib/utils-shift";
import { ShieldCheck, ShieldX, FileBarChart, ClipboardCheck } from "lucide-react";
import { MineralBadge } from "@/components/shared/mineral-badge";

const MINERAL_COLORS: Record<MineralType, string> = {
  grueso: "#78716c",
  calibrado: "#3b82f6",
  comercial: "#10b981",
};

export function ProductividadTab() {
  const { user } = useAuth();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [revisiones, setRevisiones] = useState<RevisionTurno[]>([]);
  const [reviewTarget, setReviewTarget] = useState<RevisionTurno | null>(null);
  const [notaAdmin, setNotaAdmin] = useState("");
  const [decision, setDecision] = useState<"justificado" | "rechazado" | null>(null);

  const refresh = async () => {
    setTurnos(await getAll<Turno>("turnos"));
    const revs = await getAll<RevisionTurno>("revisiones_de_turnos");
    setRevisiones(revs.sort((a, b) => b.created_at.localeCompare(a.created_at)));
  };
  useEffect(() => { refresh(); }, []);

  // Last 30 days, closed shifts only
  const closedTurnos = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    return turnos
      .filter((t) => t.estado !== "activo" && new Date(t.fecha_inicio) >= cutoff)
      .sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio));
  }, [turnos]);

  // Productivity per employee
  const porEmpleado = useMemo(() => {
    const map = new Map<string, { nombre: string; toneladas: number; taras: number; turnos: number }>();
    closedTurnos.forEach((t) => {
      const cur = map.get(t.usuario_id) || { nombre: t.usuario_nombre, toneladas: 0, taras: 0, turnos: 0 };
      cur.toneladas += t.toneladas || 0;
      cur.taras += t.taras_moved || 0;
      cur.turnos += 1;
      map.set(t.usuario_id, cur);
    });
    return Array.from(map.entries())
      .map(([id, v]) => ({ id, ...v, toneladas: +v.toneladas.toFixed(2) }))
      .sort((a, b) => b.toneladas - a.toneladas);
  }, [closedTurnos]);

  // Mineral breakdown
  const porMineral = useMemo(() => {
    const m: Record<string, number> = { grueso: 0, calibrado: 0, comercial: 0 };
    closedTurnos.forEach((t) => {
      if (t.mineral_type) m[t.mineral_type] += t.toneladas || 0;
    });
    return Object.entries(m).map(([k, v]) => ({
      name: MINERAL_LABELS[k as MineralType],
      value: +v.toFixed(2),
      key: k,
    }));
  }, [closedTurnos]);

  const pendingReviews = revisiones.filter((r) => r.estado === "pendiente");
  const totalTon = closedTurnos.reduce((s, t) => s + (t.toneladas || 0), 0);
  const totalTaras = closedTurnos.reduce((s, t) => s + (t.taras_moved || 0), 0);

  async function submitReview(decision: "justificado" | "rechazado") {
    if (!user || !reviewTarget) return;
    const now = new Date().toISOString();
    const updated: RevisionTurno = {
      ...reviewTarget,
      estado: decision,
      nota_admin: notaAdmin.trim() || null,
      revisado_por: user.nombre,
      revisado_at: now,
      updated_at: now,
      synced: false,
    };
    await put("revisiones_de_turnos", updated);
    triggerSync();
    setReviewTarget(null);
    setNotaAdmin("");
    setDecision(null);
    toast.success(`Caso ${decision === "justificado" ? "justificado" : "rechazado"}`);
    refresh();
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="pastel-purple p-4">
          <p className="text-xs font-semibold uppercase text-slate-600">Turnos (30 días)</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{closedTurnos.length}</p>
        </Card>
        <Card className="pastel-emerald p-4">
          <p className="text-xs font-semibold uppercase text-slate-600">Toneladas</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{totalTon.toFixed(2)}</p>
        </Card>
        <Card className="pastel-blue p-4">
          <p className="text-xs font-semibold uppercase text-slate-600">Taras</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{totalTaras}</p>
        </Card>
        <Card className="pastel-rose p-4">
          <p className="text-xs font-semibold uppercase text-slate-600">Por revisar</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{pendingReviews.length}</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">
            <FileBarChart size={18} className="text-[#6C5CE7]" /> Productividad por empleado
          </h3>
          <p className="subtitle-underline text-xs text-slate-500">Toneladas · últimos 30 días</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={porEmpleado} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9e2f5" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis
                type="category"
                dataKey="nombre"
                tick={{ fontSize: 11, fill: "#64748b" }}
                width={100}
              />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e9e2f5", fontSize: 12 }} />
              <Bar dataKey="toneladas" fill="#6C5CE7" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="mb-1 text-base font-bold text-slate-900">Por mineral</h3>
          <p className="subtitle-underline text-xs text-slate-500">Distribución de toneladas</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={porMineral}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(e: any) => `${e.value}`}
              >
                {porMineral.map((e) => (
                  <Cell key={e.key} fill={MINERAL_COLORS[e.key as MineralType]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e9e2f5", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Shift reviews (incomplete shifts workflow) */}
      <Card className="p-5">
        <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">
          <ClipboardCheck size={18} className="text-amber-500" /> Revisión de turnos incompletos
        </h3>
        <p className="subtitle-underline text-xs text-slate-500">
          {pendingReviews.length} pendientes · {revisiones.length} total
        </p>

        <div className="mt-4 max-h-[40vh] space-y-2 overflow-y-auto scroll-thin">
          {revisiones.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">No hay revisiones registradas</p>
          )}
          {revisiones.map((r) => (
            <div
              key={r.id}
              className={`rounded-lg border p-3 ${
                r.estado === "pendiente"
                  ? "border-amber-200 bg-amber-50/50"
                  : r.estado === "justificado"
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-rose-200 bg-rose-50/50"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">{r.usuario_nombre}</p>
                  <p className="text-xs text-slate-600">{r.razon_incompleto}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatShortDateTime(r.created_at)}</p>
                  {r.nota_admin && (
                    <p className="mt-1 text-xs text-slate-700">
                      <span className="font-semibold">Nota:</span> {r.nota_admin} · {r.revisado_por}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      r.estado === "pendiente"
                        ? "bg-amber-200 text-amber-800"
                        : r.estado === "justificado"
                        ? "bg-emerald-200 text-emerald-800"
                        : "bg-rose-200 text-rose-800"
                    }`}
                  >
                    {r.estado}
                  </span>
                  {r.estado === "pendiente" && user?.role === "admin" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setReviewTarget(r); setNotaAdmin(""); setDecision(null); }}
                    >
                      Revisar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent turnos list */}
      <Card className="p-5">
        <h3 className="mb-1 text-base font-bold text-slate-900">Turnos recientes</h3>
        <p className="subtitle-underline text-xs text-slate-500">Detalle de productividad</p>

        <div className="mt-4 overflow-x-auto scroll-thin">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F0FF] text-xs uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Inicio</th>
                <th className="px-3 py-2 text-left font-semibold">Empleado</th>
                <th className="px-3 py-2 text-left font-semibold">Maquinaria</th>
                <th className="px-3 py-2 text-center font-semibold">Mineral</th>
                <th className="px-3 py-2 text-right font-semibold">Taras</th>
                <th className="px-3 py-2 text-right font-semibold">Toneladas</th>
                <th className="px-3 py-2 text-right font-semibold">Duración</th>
                <th className="px-3 py-2 text-center font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {closedTurnos.slice(0, 30).map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-700">{formatShortDateTime(t.fecha_inicio)}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">{t.usuario_nombre}</td>
                  <td className="px-3 py-2 text-slate-700">{t.maquinaria_serial}</td>
                  <td className="px-3 py-2 text-center">
                    {t.mineral_type ? <MineralBadge type={t.mineral_type} size="sm" /> : "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-700">{t.taras_moved || 0}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold text-slate-900">{(t.toneladas || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {t.duracion_minutos ? formatDuration(t.duracion_minutos) : "—"}
                  </td>
                  <td className="px-3 py-2 text-center capitalize text-slate-700">{t.estado.replace("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Review dialog */}
      <Dialog open={!!reviewTarget} onOpenChange={(v) => !v && setReviewTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revisar turno incompleto</DialogTitle>
            <DialogDescription>
              {reviewTarget?.usuario_nombre} · {reviewTarget && formatShortDateTime(reviewTarget.created_at)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              {reviewTarget?.razon_incompleto}
            </div>
            <div className="space-y-1">
              <Label>Nota del administrador</Label>
              <Textarea
                rows={3}
                value={notaAdmin}
                onChange={(e) => setNotaAdmin(e.target.value)}
                placeholder="Explique la decisión..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => submitReview("rechazado")}
              className="border-rose-300 text-rose-700 hover:bg-rose-50"
              disabled={!notaAdmin.trim()}
            >
              <ShieldX size={16} className="mr-1" /> Rechazar
            </Button>
            <Button
              onClick={() => submitReview("justificado")}
              disabled={!notaAdmin.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <ShieldCheck size={16} className="mr-1" /> Justificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
