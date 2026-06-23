import { useSyncExternalStore } from "react";

function subscribe(callback: () => void): () => void {
  const goOnline = () => callback();
  const goOffline = () => callback();
  window.addEventListener("online", goOnline);
  window.addEventListener("offline", goOffline);
  return () => {
    window.removeEventListener("online", goOnline);
    window.removeEventListener("offline", goOffline);
  };
}

function getSnapshot(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function getServerSnapshot(): boolean {
  return true;
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
