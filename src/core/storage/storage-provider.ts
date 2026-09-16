import "server-only";

/**
 * Local filesystem is the only implementation today, but application code
 * should depend on this interface so S3/GCS/Azure can be added later
 * without touching call sites.
 */
export interface StorageProvider {
  /** Persists a file under the given key (namespaced per user) and returns the key it was stored at. */
  save(key: string, data: Buffer): Promise<string>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
