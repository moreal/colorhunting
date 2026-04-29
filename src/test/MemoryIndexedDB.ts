type MemoryDatabaseData = {
  stores: Map<string, Map<IDBValidKey, unknown>>;
};

export class MemoryIndexedDB {
  #databases = new Map<string, MemoryDatabaseData>();
  #shouldBlockNextOpen = false;

  readonly factory = {
    open: (name: string) => this.#open(name),
  } as IDBFactory;

  blockNextOpen(): void {
    this.#shouldBlockNextOpen = true;
  }

  putRaw(databaseName: string, storeName: string, key: IDBValidKey, value: unknown): void {
    const database = this.#getOrCreateDatabase(databaseName);
    this.#getOrCreateStore(database, storeName).set(key, cloneValue(value));
  }

  #open(name: string): IDBOpenDBRequest {
    const request = new MemoryOpenRequest();

    queueMicrotask(() => {
      if (this.#shouldBlockNextOpen) {
        this.#shouldBlockNextOpen = false;
        request.onblocked?.(new Event("blocked"));
        return;
      }

      const isNewDatabase = !this.#databases.has(name);
      const databaseData = this.#getOrCreateDatabase(name);
      const database = new MemoryDatabase(databaseData);

      request.result = database as unknown as IDBDatabase;

      if (isNewDatabase) {
        request.onupgradeneeded?.(new Event("upgradeneeded") as IDBVersionChangeEvent);
      }

      request.onsuccess?.(new Event("success"));
    });

    return request as unknown as IDBOpenDBRequest;
  }

  #getOrCreateDatabase(name: string): MemoryDatabaseData {
    const existingDatabase = this.#databases.get(name);

    if (existingDatabase !== undefined) {
      return existingDatabase;
    }

    const database = { stores: new Map<string, Map<IDBValidKey, unknown>>() };
    this.#databases.set(name, database);

    return database;
  }

  #getOrCreateStore(database: MemoryDatabaseData, storeName: string): Map<IDBValidKey, unknown> {
    const existingStore = database.stores.get(storeName);

    if (existingStore !== undefined) {
      return existingStore;
    }

    const store = new Map<IDBValidKey, unknown>();
    database.stores.set(storeName, store);

    return store;
  }
}

class MemoryOpenRequest {
  error: DOMException | null = null;
  onblocked: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onsuccess: ((event: Event) => void) | null = null;
  onupgradeneeded: ((event: IDBVersionChangeEvent) => void) | null = null;
  result: IDBDatabase | null = null;
}

class MemoryRequest<T> {
  error: DOMException | null = null;
  onsuccess: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  result: T | undefined;

  succeed(result: T): void {
    this.result = result;
    this.onsuccess?.(new Event("success"));
  }
}

class MemoryDatabase {
  constructor(private readonly database: MemoryDatabaseData) {}

  get objectStoreNames() {
    return {
      contains: (storeName: string) => this.database.stores.has(storeName),
    };
  }

  createObjectStore(storeName: string): void {
    if (!this.database.stores.has(storeName)) {
      this.database.stores.set(storeName, new Map<IDBValidKey, unknown>());
    }
  }

  transaction(storeName: string, mode: IDBTransactionMode): IDBTransaction {
    const store = this.database.stores.get(storeName);

    if (store === undefined) {
      throw new Error(`Missing object store: ${storeName}`);
    }

    return new MemoryTransaction(storeName, store, mode) as unknown as IDBTransaction;
  }

  close(): void {}
}

class MemoryTransaction {
  error: DOMException | null = null;
  onabort: ((event: Event) => void) | null = null;
  oncomplete: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(
    private readonly storeName: string,
    private readonly store: Map<IDBValidKey, unknown>,
    readonly mode: IDBTransactionMode,
  ) {}

  objectStore(storeName: string): IDBObjectStore {
    if (storeName !== this.storeName) {
      throw new Error(`Transaction cannot access object store: ${storeName}`);
    }

    return new MemoryObjectStore(this.store, this) as unknown as IDBObjectStore;
  }

  complete(): void {
    queueMicrotask(() => this.oncomplete?.(new Event("complete")));
  }
}

class MemoryObjectStore {
  constructor(
    private readonly store: Map<IDBValidKey, unknown>,
    private readonly transaction: MemoryTransaction,
  ) {}

  get(key: IDBValidKey): IDBRequest<unknown> {
    const request = new MemoryRequest<unknown>();

    queueMicrotask(() => request.succeed(cloneValue(this.store.get(key))));

    return request as unknown as IDBRequest<unknown>;
  }

  put(value: unknown, key: IDBValidKey): IDBRequest<IDBValidKey> {
    this.assertWritable();

    const request = new MemoryRequest<IDBValidKey>();

    queueMicrotask(() => {
      this.store.set(key, cloneValue(value));
      request.succeed(key);
      this.transaction.complete();
    });

    return request as unknown as IDBRequest<IDBValidKey>;
  }

  delete(key: IDBValidKey): IDBRequest<undefined> {
    this.assertWritable();

    const request = new MemoryRequest<undefined>();

    queueMicrotask(() => {
      this.store.delete(key);
      request.succeed(undefined);
      this.transaction.complete();
    });

    return request as unknown as IDBRequest<undefined>;
  }

  private assertWritable(): void {
    if (this.transaction.mode !== "readwrite") {
      throw new DOMException("Transaction is readonly.", "ReadOnlyError");
    }
  }
}

function cloneValue<T>(value: T): T {
  if (value === undefined) {
    return value;
  }

  return structuredClone(value);
}
