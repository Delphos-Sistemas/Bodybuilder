-- Dados sincronizados: um registro por código de sincronização (guardado só como hash SHA-256).
CREATE TABLE IF NOT EXISTS sync_data (
  key_hash TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
