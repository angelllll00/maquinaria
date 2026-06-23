"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/lib/auth/auth-context";
import { put, getOne } from "@/lib/indexeddb/db";
import { triggerSync } from "@/lib/sync/sync-manager";
import { uuid, validateShift, formatDuration } from "@/lib/utils-shift";
import {
  TARAS_POR_TONELADA,
  type MineralType,
  type Turno,
} from "@/lib/types";
import { toast } from "sonner";
import { StopCircle, AlertTriangle } from "lucide-react";
import { MineralBadge } from "@/components/shared/mineral-badge";

export function EndShiftModal({
  open,
  onOpenChange,
  turno,
  onEnded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  turno: Turno | null;
  onEnded?: (t: Turno, reviewId?: string) => void;
}) {
  const { user } = useAuth();
  const [mineral, setMineral] = useState<MineralType>("grueso");
  const [taras, setTaras] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMineral(turno?.mineral_type || "grueso");
      setTaras(turno?.taras_moved || 0);
    }
  }, [open, turno]);

  const toneladas = useMemo(() => {
    const t = Number(taras) || 0;
    return +(t / TARAS_POR_TONELADA).toFixed(3);
  }, [taras]);

  // Preview validation against expected duration
  const preview = useMemo(() => {
    if (!turno) return null;
    const now = new Date().toISOString();
    return validateShift(turno.fecha_inicio, now, turno.jornada);
  }, [turno]);

  async function handleEnd() {
    if (!user || !turno) return;
    setSaving(true);
    const now = new Date().toISOString();
    const v = validateShift(turno.fecha_inicio, now, turno.jornada);
    const ended: Turno = {
      ...turno,
      fecha_fin: now,
      mineral_type: mineral,
      taras_moved: Number(taras) || 0,
      toneladas,
      estado: v.status,
      duracion_minutos: v.duracion_minutos,
      razon_incompleto: v.razon || null,
      updated_at: now,
      synced: false,
    };
    await put("turnos", ended);

    // If incomplete → create shift review case
    let reviewId: string | undefined;
    if (v.status === "incompleto") {
      reviewId = uuid();
      await put("revisiones_de_turnos", {
        id: reviewId,
        turno_id: ended.id,
        usuario_id: user.id,
        usuario_nombre: user.nombre,
        estado: "pendiente",
        razon_incompleto: v.razon || "Turno incompleto",
        nota_admin: null,
        revisado_por: null,
        revisado_at: null,
        created_at: now,
        updated_at: now,
        synced: false,
      });
    }

    triggerSync();
    setSaving(false);
    onOpenChange(false);
    toast.success(
      v.status === "completo"
        ? `Turno completo · ${formatDuration(v.duracion_minutos)}`
        : v.status === "con_horas_extra"
        ? `Turno con horas extra · ${formatDuration(v.duracion_minutos)}`
        : `Turno incompleto · caso enviado a revisión`
    );
    onEnded?.(ended, reviewId);
  }

  if (!turno) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StopCircle className="text-rose-600" size={20} /> Terminar turno
          </DialogTitle>
          <DialogDescription>
            Registre el mineral y la cantidad de taras movidas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <div className="flex justify-between"><span>Maquinaria:</span><span className="font-semibold">{turno.maquinaria_serial}</span></div>
            <div className="flex justify-between"><span>Localidad:</span><span className="font-semibold">{turno.localidad_nombre}</span></div>
            <div className="flex justify-between"><span>Jornada:</span><span className="font-semibold capitalize">{turno.jornada} ({turno.duracion_esperada_minutos / 60}h)</span></div>
          </div>

          <div className="space-y-2">
            <Label>Tipo de mineral</Label>
            <RadioGroup
              value={mineral}
              onValueChange={(v) => setMineral(v as MineralType)}
              className="grid grid-cols-3 gap-2"
            >
              {(["grueso", "calibrado", "comercial"] as MineralType[]).map((m) => (
                <Label
                  key={m}
                  htmlFor={`m-${m}`}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-slate-200 p-3 has-[:checked]:border-[#6C5CE7] has-[:checked]:bg-[#F5F0FF]"
                >
                  <RadioGroupItem id={`m-${m}`} value={m} />
                  <MineralBadge type={m} size="sm" />
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taras">Cantidad de taras</Label>
            <Input
              id="taras"
              type="number"
              min={0}
              value={taras}
              onChange={(e) => setTaras(Number(e.target.value))}
            />
            <p className="text-xs text-slate-500">
              4 taras = 1 tonelada · Equivalente:{" "}
              <span className="font-semibold text-[#6C5CE7]">{toneladas} ton</span>
            </p>
          </div>

          {preview && (
            <div
              className={`rounded-xl border p-3 text-xs ${
                preview.status === "completo"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : preview.status === "con_horas_extra"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {preview.status !== "completo" && <AlertTriangle size={14} />}
                Estado: {preview.status.replace("_", " ")} · {formatDuration(preview.duracion_minutos)}
              </div>
              {preview.razon && <p className="mt-1">{preview.razon}</p>}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleEnd}
            disabled={saving}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {saving ? "Cerrando..." : "Terminar turno"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
