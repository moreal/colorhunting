import { resetToNoColor, validateAppState, type AppState } from "./appState";

const DATABASE_VERSION = 1;

export const APP_STATE_DATABASE_NAME = "colorhunting";
export const APP_STATE_STORE_NAME = "app-state";
export const APP_STATE_STORAGE_KEY = "current";

export type AppStatePersistence = {
  delete(): Promise<void>;
  read(): Promise<unknown>;
  write(state: AppState): Promise<void>;
};

export type AppStateStorage = {
  clearAppState(): Promise<void>;
  loadAppState(): Promise<AppState>;
  saveAppState(state: AppState): Promise<void>;
};

export type IndexedDbPersistenceOptions = {
  databaseName?: string;
  indexedDB?: IDBFactory | null;
  storeName?: string;
};

export function createAppStateStorage(
  persistence: AppStatePersistence = createIndexedDbPersistence(),
): AppStateStorage {
  return {
    clearAppState: () => clearPersistedAppState(persistence),
    loadAppState: () => loadPersistedAppState(persistence),
    saveAppState: (state) => savePersistedAppState(persistence, state),
  };
}

export function createIndexedDbPersistence(
  options: IndexedDbPersistenceOptions = {},
): AppStatePersistence {
  return {
    delete: () => deleteStoredValue(options),
    read: () => readStoredValue(options),
    write: (state) => writeStoredValue(state, options),
  };
}

export async function loadAppState(): Promise<AppState> {
  return await createAppStateStorage().loadAppState();
}

export async function saveAppState(state: AppState): Promise<void> {
  await createAppStateStorage().saveAppState(state);
}

export async function clearAppState(): Promise<void> {
  await createAppStateStorage().clearAppState();
}

async function loadPersistedAppState(persistence: AppStatePersistence): Promise<AppState> {
  const storedState = await persistence.read();

  return validateAppState(storedState) ?? resetToNoColor();
}

async function savePersistedAppState(
  persistence: AppStatePersistence,
  state: AppState,
): Promise<void> {
  const validState = validateAppState(state);

  if (validState === null) {
    throw new Error("Cannot save invalid app state.");
  }

  await persistence.write(validState);
}

async function clearPersistedAppState(persistence: AppStatePersistence): Promise<void> {
  await persistence.delete();
}

async function readStoredValue(options: IndexedDbPersistenceOptions): Promise<unknown> {
  return await withObjectStore(options, "readonly", (store) =>
    requestToPromise(store.get(APP_STATE_STORAGE_KEY)),
  );
}

async function writeStoredValue(
  state: AppState,
  options: IndexedDbPersistenceOptions,
): Promise<void> {
  await withObjectStore(options, "readwrite", async (store, transaction) => {
    store.put(state, APP_STATE_STORAGE_KEY);

    await transactionToPromise(transaction);
  });
}

async function deleteStoredValue(options: IndexedDbPersistenceOptions): Promise<void> {
  await withObjectStore(options, "readwrite", async (store, transaction) => {
    store.delete(APP_STATE_STORAGE_KEY);

    await transactionToPromise(transaction);
  });
}

async function withObjectStore<T>(
  options: IndexedDbPersistenceOptions,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore, transaction: IDBTransaction) => Promise<T>,
): Promise<T> {
  const indexedDB = getIndexedDBFactory(options.indexedDB);
  const database = await openDatabase(indexedDB, options);

  try {
    const transaction = database.transaction(getStoreName(options), mode);
    const store = transaction.objectStore(getStoreName(options));

    return await operation(store, transaction);
  } finally {
    database.close();
  }
}

function openDatabase(
  indexedDB: IDBFactory,
  options: IndexedDbPersistenceOptions,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const storeName = getStoreName(options);
    const request = indexedDB.open(getDatabaseName(options), DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open app state database."));
    request.onblocked = () => reject(new Error("App state database upgrade was blocked."));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
  });
}

function getDatabaseName(options: IndexedDbPersistenceOptions): string {
  return options.databaseName ?? APP_STATE_DATABASE_NAME;
}

function getStoreName(options: IndexedDbPersistenceOptions): string {
  return options.storeName ?? APP_STATE_STORE_NAME;
}

function getIndexedDBFactory(indexedDB: IDBFactory | null | undefined): IDBFactory {
  if (indexedDB !== undefined) {
    if (indexedDB === null) {
      throw new Error("IndexedDB is unavailable.");
    }

    return indexedDB;
  }

  if (typeof globalThis.indexedDB === "undefined") {
    throw new Error("IndexedDB is unavailable.");
  }

  return globalThis.indexedDB;
}
