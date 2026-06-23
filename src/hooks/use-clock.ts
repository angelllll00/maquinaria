"use client";

import { useEffect, useState } from "react";

export function useClock(intervalMs = 1000): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

const DATE_FMT = new Intl.DateTimeFormat("es-VE", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const TIME_FMT = new Intl.DateTimeFormat("es-VE", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

export function formatDate(iso: string | Date): string {
  return DATE_FMT.format(new Date(iso));
}

export function formatTime(iso: string | Date): string {
  return TIME_FMT.format(new Date(iso));
}

export function formatDateTime(iso: string | Date): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export function formatShortDateTime(iso: string | Date): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}
