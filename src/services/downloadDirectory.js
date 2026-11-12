// ── Persistent directory handle — module-level, lives for the whole page session ──
// One handle is shared by all tabs/components. A lock prevents "picker already active".
let _savedDirHandle = null;

let _pickerOpen = false;

// prevents concurrent showDirectoryPicker calls
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
