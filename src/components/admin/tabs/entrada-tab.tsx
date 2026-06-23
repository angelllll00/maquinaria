"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { getAll, put } from "@/lib/indexeddb/db";
import { triggerSync } from "@/lib/sync/sync-manager";
import { uuid } from "@/lib/utils-shift";
import type { Entrada, Maquinaria } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { PackagePlus, History } from "lucide-react";
import { formatShortDateTime } from "@/hooks/use-clock";

export function EntradaTab() {
  const { user } = useAuth();
  const [razon, setRazon] = useState("");
  const [serial, setSerial] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [modelo, setModelo] = useState("");
  const [marca, setMarca] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [saving, setSaving] = useState(false);
  const [entradas, setEntradas] = useState<Entrada[]>([]);

  const refresh = async () => {
    const all = await getAll<Entrada>("entradas");
    setEntradas(all.sort((a, b) => b.fecha.localeCompare(a.fecha)));
  };
  useEffect(() => { refresh(); }, []);

  async function handleSave() {
    if (!user) return;
    if (!serial.trim() || !razon.trim()) {
      toast.error("Razón y serial son obligatorios");
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const entrada: Entrada = {
      id: uuid(),
      razon: razon.trim(),
      serial: serial.trim(),
      descripcion: descripcion.trim(),
      modelo: modelo.trim(),
      marca: marca.trim(),
      cantidad: Number(cantidad) || 1,
      fecha: today,
      created_at: now,
      updated_at: now,
      synced: false,
    };
    await put("entradas", entrada);

    // Also create a maquinaria record so the machine shows up in operations
    const machine: Maquinaria = {
      id: uuid(),
      serial: serial.trim(),
      descripcion: descripcion.trim(),
      modelo: modelo.trim(),
      marca: marca.trim(),
      cantidad: Number(cantidad) || 1,
      horas_uso: 0,
      estado: "operativa",
      localidad_id: null,
      fecha_entrada: today,
      fecha_salida: null,
      created_at: now,
      updated_at: now,
      synced: false,
    };
    await put("maquinaria", machine);

    triggerSync();
    setSaving(false);
    setRazon(""); setSerial(""); setDescripcion(""); setModelo(""); setMarca(""); setCantidad(1);
    toast.success("Entrada registrada");
    refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Form */}
      <Card className="p-5 lg:col-span-2">
        <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">
          <PackagePlus size={18} className="text-[#6C5CE7]" /> Nueva entrada de maquinaria
        </h3>
        <p className="subtitle-underline text-xs text-slate-500">La fecha se registra automáticamente</p>

        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <Label>Razón *</Label>
            <Input value={razon} onChange={(e) => setRazon(e.target.value)} placeholder="Ej: Compra, devolución..." />
          </div>
          <div className="space-y-1">
            <Label>Serial *</Label>
            <Input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="Ej: MQ-001" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Marca</Label>
              <Input value={marca} onChange={(e) => setMarca(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Modelo</Label>
              <Input value={modelo} onChange={(e) => setModelo(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Cantidad</Label>
            <Input type="number" min={1} value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label>Descripción</Label>
            <Textarea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div className="rounded-lg bg-slate-50 p-2 text-xs text-slate-500">
            Fecha: <span className="font-semibold">{new Date().toLocaleDateString("es-VE")}</span>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full" style={{ background: "#6C5CE7" }}>
            {saving ? "Guardando..." : "Registrar entrada"}
          </Button>
        </div>
      </Card>

      {/* History */}
      <Card className="p-5 lg:col-span-3">
        <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">
          <History size={18} className="text-[#6C5CE7]" /> Entradas registradas
        </h3>
        <p className="subtitle-underline text-xs text-slate-500">{entradas.length} movimientos</p>

        <div className="mt-4 max-h-[60vh] overflow-y-auto scroll-thin">
          {entradas.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No hay entradas registradas</p>
          ) : (
            <div className="space-y-2">
              {entradas.map((e) => (
                <div key={e.id} className="rounded-lg border border-slate-200 p-3 hover:border-[#6C5CE7]/40">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900">{e.serial}</p>
                      <p className="text-xs text-slate-500">{e.marca} {e.modelo} · {e.cantidad} unidad(es)</p>
                      <p className="mt-1 text-xs text-slate-600">{e.razon}</p>
                      {e.descripcion && <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{e.descripcion}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">{formatShortDateTime(e.fecha)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
