"use client";

import { useEffect, useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-context";
import { getAll, put } from "@/lib/indexeddb/db";
import { triggerSync } from "@/lib/sync/sync-manager";
import { uuid, compressImage } from "@/lib/utils-shift";
import {
  OBSERVATION_LABELS,
  type Maquinaria,
  type ObservationCategory,
  type Observacion,
} from "@/lib/types";
import { toast } from "sonner";
import { Camera, X, ImagePlus, FileImage } from "lucide-react";

export function ObservationsForm({
  open,
  onOpenChange,
  turnoId,
  defaultMaquinariaId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  turnoId?: string | null;
  defaultMaquinariaId?: string | null;
  onSaved?: () => void;
}) {
  const { user } = useAuth();
  const [maquinarias, setMaquinarias] = useState<Maquinaria[]>([]);
  const [maquinariaId, setMaquinariaId] = useState<string>(defaultMaquinariaId || "");
  const [categoria, setCategoria] = useState<ObservationCategory>("mecanica");
  const [texto, setTexto] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load machinery list when opening
  useEffect(() => {
    getAll<Maquinaria>("maquinaria").then((m) => setMaquinarias(m));
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const remaining = 3 - fotos.length;
    const toProcess = Array.from(files).slice(0, remaining);
    const compressed: string[] = [];
    for (const f of toProcess) {
      try {
        const c = await compressImage(f, 1024, 0.7);
        compressed.push(c);
      } catch (e) {
        toast.error(`Error al procesar ${f.name}`);
      }
    }
    setFotos((prev) => [...prev, ...compressed].slice(0, 3));
  }

  async function handleSave() {
    if (!user) return;
    if (!texto.trim()) {
      toast.error("Escriba la observación");
      return;
    }
    const machine = maquinarias.find((m) => m.id === maquinariaId);
    setSaving(true);
    const now = new Date().toISOString();
    const obs: Observacion = {
      id: uuid(),
      turno_id: turnoId || null,
      maquinaria_id: maquinariaId || null,
      maquinaria_serial: machine?.serial,
      usuario_id: user.id,
      usuario_nombre: user.nombre,
      categoria,
      texto: texto.trim(),
      fotos,
      created_at: now,
      updated_at: now,
      synced: false,
    };
    await put("observaciones", obs);
    triggerSync();
    setSaving(false);
    onOpenChange(false);
    setTexto("");
    setFotos([]);
    toast.success("Observación registrada");
    onSaved?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="text-[#6C5CE7]" size={20} /> Observación de maquinaria
          </DialogTitle>
          <DialogDescription>
            Registre una observación técnica. Puede adjuntar hasta 3 fotos (máx 1024×1024, JPEG 70%).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto scroll-thin pr-1">
          <div className="space-y-2">
            <Label>Maquinaria</Label>
            <Select value={maquinariaId} onValueChange={setMaquinariaId}>
              <SelectTrigger><SelectValue placeholder="Seleccione (opcional)" /></SelectTrigger>
              <SelectContent>
                {maquinarias.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.serial} · {m.marca} {m.modelo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as ObservationCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(OBSERVATION_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="obs-text">Descripción</Label>
            <Textarea
              id="obs-text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Describa la observación..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Fotos ({fotos.length}/3)</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="grid grid-cols-3 gap-2">
              {fotos.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                  <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFotos((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {fotos.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-[#6C5CE7] hover:text-[#6C5CE7]"
                >
                  <ImagePlus size={22} />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <FileImage size={12} /> Se comprimen automáticamente a 1024×1024 JPEG 70%.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} style={{ background: "#6C5CE7" }}>
            {saving ? "Guardando..." : "Guardar observación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
