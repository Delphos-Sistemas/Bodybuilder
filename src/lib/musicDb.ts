"use client";

/** Faixas locais escolhidas pelo usuário, guardadas no IndexedDB do próprio navegador. */
export type MusicStyle = "metal" | "rock" | "hiphop";
export type LocalTrack = {
  id: string;
  style: MusicStyle;
  name: string;
  blob: Blob;
  addedAt: number;
};

const DB = "bodybuilder-musica";
const STORE = "faixas";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listTracks(): Promise<LocalTrack[]> {
  try {
    const all = await tx<LocalTrack[]>("readonly", (s) => s.getAll() as IDBRequest<LocalTrack[]>);
    return all.sort((a, b) => a.addedAt - b.addedAt);
  } catch {
    return [];
  }
}

export async function addTrack(track: LocalTrack): Promise<void> {
  await tx("readwrite", (s) => s.put(track));
}

export async function removeTrack(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
}
