import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { env } from "@/src/lib/config/env";
import type { StorageProvider } from "./storage-provider";

export class LocalStorageProvider implements StorageProvider {
  private readonly root: string;

  constructor(root: string = env.LOCAL_STORAGE_PATH) {
    // Storage root is a configured local directory, not a project asset —
    // opt out of Turbopack's output file tracing for this dynamic path.
    this.root = path.resolve(/* turbopackIgnore: true */ process.cwd(), root);
  }

  /** Resolves a storage key to an absolute path, rejecting any attempt to escape the storage root. */
  private resolvePath(key: string): string {
    const resolved = path.resolve(this.root, key);
    if (resolved !== this.root && !resolved.startsWith(this.root + path.sep)) {
      throw new Error(`Invalid storage key: ${key}`);
    }
    return resolved;
  }

  async save(key: string, data: Buffer): Promise<string> {
    const filePath = this.resolvePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
    return key;
  }

  async read(key: string): Promise<Buffer> {
    return fs.readFile(this.resolvePath(key));
  }

  async delete(key: string): Promise<void> {
    await fs.rm(this.resolvePath(key), { force: true });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolvePath(key));
      return true;
    } catch {
      return false;
    }
  }
}

let instance: LocalStorageProvider | undefined;

export function getStorageProvider(): StorageProvider {
  if (!instance) {
    instance = new LocalStorageProvider();
  }
  return instance;
}
