"use client";

/** Fotos de progresso: ficam só no IndexedDB deste navegador e não entram no backup em JSON. */
export type ProgressPhoto = {
  id: string;
  date: string;
  blob: Blob;
  addedAt: number;
};

const DB = "bodybuilder-fotos";
const STORE = "fotos";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listPhotos(): Promise<ProgressPhoto[]> {
  try {
    const all = await tx<ProgressPhoto[]>("readonly", (s) => s.getAll() as IDBRequest<ProgressPhoto[]>);
    return all.sort((a, b) => a.date.localeCompare(b.date) || a.addedAt - b.addedAt);
  } catch {
    return [];
  }
}

export async function addPhoto(p: ProgressPhoto): Promise<void> {
  await tx("readwrite", (s) => s.put(p));
}

export async function removePhoto(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
}

/** Reduz a foto para no máximo 1080 px no maior lado, em JPEG, para não ocupar muito espaço. */
export async function shrinkImage(file: File, max = 1080): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b ?? file), "image/jpeg", 0.85));
  } catch {
    return file;
  }
}
