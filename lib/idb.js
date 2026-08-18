export const IDB_NAME = 'ch_pending_images';

export const IDB_STORE = 'blobs';

export const IDB_DIR_STORE = 'dirhandles';

export const IDB_VERSION = 2;

export function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(IDB_DIR_STORE)) {
        db.createObjectStore(IDB_DIR_STORE, { keyPath: 'id' });
      }
    };
  });
}

export async function idbSaveDirHandle(handle) {
  try {
    const db = await idbOpen();
    return new Promise((res, rej) => {
      const tx = db.transaction(IDB_DIR_STORE, 'readwrite');
      tx.objectStore(IDB_DIR_STORE).put({ id: 'savedDir', handle });
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  } catch(e) { /* IDB unavailable — non-fatal */ }
}

export async function idbLoadDirHandle() {
  try {
    const db = await idbOpen();
    return new Promise((res) => {
      const tx = db.transaction(IDB_DIR_STORE, 'readonly');
      const req = tx.objectStore(IDB_DIR_STORE).get('savedDir');
      req.onsuccess = () => res(req.result?.handle || null);
      req.onerror = () => res(null);
    });
  } catch(e) { return null; }
}

export async function idbClearDirHandle() {
  try {
    const db = await idbOpen();
    return new Promise((res) => {
      const tx = db.transaction(IDB_DIR_STORE, 'readwrite');
      tx.objectStore(IDB_DIR_STORE).delete('savedDir');
      tx.oncomplete = res; tx.onerror = res;
    });
  } catch(e) { /* non-fatal */ }
}

export async function idbPutImage(id, file, meta = {}) {
  // 1. Read file FIRST (outside any IDB transaction)
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  // 2. Then open transaction and write
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const req = store.put({ id, data, name: file.name, type: file.type, meta });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbGetImages(storeKey) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result || [];
      resolve(all.filter(item => item.meta.storeKey === storeKey));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function idbDeleteImage(id) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbClearImages(storeKey) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    // Use cursor to delete inside the same transaction safely
    const req = store.openCursor();
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        if (!storeKey || cursor.value.meta?.storeKey === storeKey) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

export let _savedDirHandle = null;

export let _pickerOpen = false;

export function resetSessionDir() { _savedDirHandle = null; }

export async function getOrPickDir() {
  // Already have a valid handle — return immediately, no picker needed
  if (_savedDirHandle) return _savedDirHandle;
  // Another call already opened the picker — wait for it to finish
  if (_pickerOpen) {
    await new Promise(res => {
      const interval = setInterval(() => {
        if (!_pickerOpen) { clearInterval(interval); res(); }
      }, 100);
    });
    if (_savedDirHandle) return _savedDirHandle;
  }
  // Open the picker exactly once
  _pickerOpen = true;
  try {
    _savedDirHandle = await window.showDirectoryPicker({ mode: "readwrite", startIn: "downloads" });
    return _savedDirHandle;
  } finally {
    _pickerOpen = false;
  }
}

export async function uploadImageToStorage(file, name) {
  const ext = file.name?.split(".").pop() || "png";
  const fileName = `${name}.${ext}`;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async(e) => {
      try {
        const res = await fetch("/api/images/upload", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ fileBase64: e.target.result, fileName, mimeType: file.type || "image/png" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        resolve({ url: data.url, path: data.path, name, id: data.path, _inDB: true });
      } catch(err) {
        console.warn("Storage upload failed:", err.message);
        resolve(null); // caller handles failure
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export async function uploadPendingImages(images) {
  return Promise.all((images || []).map(async(img) => {
    if (img._inDB || !img._file) return img; // already in DB or no file to upload
    const uploaded = await uploadImageToStorage(img._file, img.name);
    return uploaded || img; // fallback to original if upload fails
  }));
}

