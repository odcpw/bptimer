// Lightweight IndexedDB helper used by app managers
export function openDB(name = 'MeditationTimerDB', version = 3) {
  return new Promise((resolve) => {
    const request = indexedDB.open(name, version);
    request.onerror = () => resolve(null);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sessions')) {
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        sessionStore.createIndex('date', 'date', { unique: false });
        sessionStore.createIndex('practice', 'practice', { unique: false });
        sessionStore.createIndex('dateRange', ['date'], { unique: false });
      }
      if (!db.objectStoreNames.contains('smas')) {
        const smaStore = db.createObjectStore('smas', { keyPath: 'id' });
        smaStore.createIndex('frequency', 'frequency', { unique: false });
        smaStore.createIndex('notificationsEnabled', 'notificationsEnabled', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

export function getAll(db, storeName) {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    } catch (e) { reject(e); }
  });
}

export function put(db, storeName, value) {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction([storeName], 'readwrite');
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    } catch (e) { reject(e); }
  });
}

export function add(db, storeName, value) {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction([storeName], 'readwrite');
      tx.objectStore(storeName).add(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    } catch (e) { reject(e); }
  });
}

export function del(db, storeName, key) {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction([storeName], 'readwrite');
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    } catch (e) { reject(e); }
  });
}

export function clear(db, storeName) {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction([storeName], 'readwrite');
      tx.objectStore(storeName).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    } catch (e) { reject(e); }
  });
}
