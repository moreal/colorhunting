import { describe, expect, it } from "vitest";
import {
  addImage,
  createColor,
  createEmptyBoard,
  selectColor,
  type AppState,
  type Image,
} from "./domain/appState";
import {
  APP_STATE_DATABASE_NAME,
  APP_STATE_STORAGE_KEY,
  APP_STATE_STORE_NAME,
  createAppStateStorage,
  createIndexedDbPersistence,
  type AppStatePersistence,
} from "./appStorage";
import { MemoryIndexedDB } from "./test/MemoryIndexedDB";

const testImage: Image = {
  id: "image-1",
  name: "sample.png",
  mimeType: "image/png",
  dataUrl: "data:image/png;base64,abc123",
  altText: "Sample image",
};

describe("appStorage", () => {
  it("저장된 상태가 없으면 색상 미선택 상태를 반환한다", async () => {
    const storage = createAppStateStorage(new MemoryAppStatePersistence());

    await expect(storage.loadAppState()).resolves.toEqual({
      state: "NO_COLOR",
    });
  });

  it("이미지가 들어 있는 앱 상태를 다시 불러올 수 있다", async () => {
    const storage = createAppStateStorage(new MemoryAppStatePersistence());
    const state = addImage(selectColor(createColor("#ABC")!), 4, testImage);
    const expectedImages = createEmptyBoard();
    expectedImages[4] = testImage;

    await storage.saveAppState(state);

    await expect(storage.loadAppState()).resolves.toEqual({
      state: "COLOR_DETERMINED",
      color: { hex: "#aabbcc" },
      images: expectedImages,
    });
  });

  it("저장된 앱 상태를 지우면 다음 로드는 시작 상태로 돌아간다", async () => {
    const storage = createAppStateStorage(new MemoryAppStatePersistence());

    await storage.saveAppState(selectColor(createColor("#ff0000")!));
    await storage.clearAppState();

    await expect(storage.loadAppState()).resolves.toEqual({
      state: "NO_COLOR",
    });
  });

  it("손상된 저장 데이터는 시작 상태로 대체한다", async () => {
    const persistence = new MemoryAppStatePersistence();
    const storage = createAppStateStorage(persistence);

    persistence.setRaw("corrupt");

    await expect(storage.loadAppState()).resolves.toEqual({
      state: "NO_COLOR",
    });
  });

  it("호환되지 않는 저장 데이터는 시작 상태로 대체한다", async () => {
    const persistence = new MemoryAppStatePersistence();
    const storage = createAppStateStorage(persistence);

    persistence.setRaw({
      state: "COLOR_DETERMINED",
      color: { hex: "#00ff00" },
      images: [null],
    });

    await expect(storage.loadAppState()).resolves.toEqual({
      state: "NO_COLOR",
    });
  });

  it("유효하지 않은 앱 상태 저장에 실패해도 이전 상태를 오염시키지 않는다", async () => {
    const storage = createAppStateStorage(new MemoryAppStatePersistence());
    const originalState = selectColor(createColor("#123456")!);
    const invalidState = {
      state: "COLOR_DETERMINED",
      color: { hex: "#123456" },
      images: [null],
    } as unknown as AppState;

    await storage.saveAppState(originalState);
    await expect(storage.saveAppState(invalidState)).rejects.toThrow(
      "Cannot save invalid app state.",
    );

    await expect(storage.loadAppState()).resolves.toEqual(originalState);
  });

  it("저장소 읽기 실패는 빈 상태로 숨기지 않는다", async () => {
    const storage = createAppStateStorage({
      delete: async () => {},
      read: async () => {
        throw new Error("read failed");
      },
      write: async () => {},
    });

    await expect(storage.loadAppState()).rejects.toThrow("read failed");
  });

  it("IndexedDB 어댑터는 값을 저장하고 읽고 삭제한다", async () => {
    const indexedDB = new MemoryIndexedDB();
    const persistence = createIndexedDbPersistence({ indexedDB: indexedDB.factory });
    const state = selectColor(createColor("#00ff00")!);

    await persistence.write(state);
    await expect(persistence.read()).resolves.toEqual(state);

    await persistence.delete();
    await expect(persistence.read()).resolves.toBeUndefined();
  });

  it("IndexedDB 열기가 막히면 저장소 오류로 전달한다", async () => {
    const indexedDB = new MemoryIndexedDB();
    const storage = createAppStateStorage(
      createIndexedDbPersistence({ indexedDB: indexedDB.factory }),
    );

    indexedDB.blockNextOpen();

    await expect(storage.loadAppState()).rejects.toThrow("App state database upgrade was blocked.");
  });

  it("IndexedDB 어댑터는 손상된 저장 데이터를 시작 상태로 정규화한다", async () => {
    const indexedDB = new MemoryIndexedDB();
    const storage = createAppStateStorage(
      createIndexedDbPersistence({ indexedDB: indexedDB.factory }),
    );

    indexedDB.putRaw(
      APP_STATE_DATABASE_NAME,
      APP_STATE_STORE_NAME,
      APP_STATE_STORAGE_KEY,
      "corrupt",
    );

    await expect(storage.loadAppState()).resolves.toEqual({
      state: "NO_COLOR",
    });
  });
});

class MemoryAppStatePersistence implements AppStatePersistence {
  #storedValue: unknown;

  async delete(): Promise<void> {
    this.#storedValue = undefined;
  }

  async read(): Promise<unknown> {
    return cloneValue(this.#storedValue);
  }

  setRaw(value: unknown): void {
    this.#storedValue = cloneValue(value);
  }

  async write(state: AppState): Promise<void> {
    this.#storedValue = cloneValue(state);
  }
}

function cloneValue<T>(value: T): T {
  if (value === undefined) {
    return value;
  }

  return structuredClone(value);
}
