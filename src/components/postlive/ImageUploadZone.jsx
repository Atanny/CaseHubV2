import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../icons/Icon';
import { cls } from '../../utils/cls';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload zone for screenshots — click, drag-drop, or paste. Uploads straight
 * to storage via /api/images/upload as soon as a file is added (the legacy
 * app instead staged files in IndexedDB until the case was saved, so they'd
 * survive an accidental refresh before upload — that staging layer is
 * dropped here for a simpler, more predictable flow; images are safely in
 * storage the moment they're added, not just on save).
 *
 * `multiple` = a growing list (backup screenshots). `!multiple` = a single
 * slot that gets replaced (before/after shots).
 */
export default function ImageUploadZone({ baseName, multiple, images, onImages, isActive = false }) {
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const addFiles = useCallback(
    async (files) => {
      setUploading(true);
      try {
        const list = Array.from(files);
        const uploaded = [];
        for (let i = 0; i < list.length; i++) {
          const f = list[i];
          const name = multiple ? `${baseName}-${(images?.length || 0) + i + 1}` : baseName;
          const base64 = await fileToBase64(f);
          const res = await fetch('/api/images/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileBase64: base64, fileName: name, mimeType: f.type || 'image/png' }),
          });
          const data = await res.json();
          if (res.ok) uploaded.push(data);
        }
        const next = multiple ? [...(images || []), ...uploaded] : uploaded.slice(0, 1);
        onImages(next);
      } finally {
        setUploading(false);
      }
    },
    [baseName, multiple, images, onImages]
  );

  useEffect(() => {
    if (!isActive) return;
    function handlePaste(e) {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      const items = Array.from(e.clipboardData?.items || []).filter((i) => i.kind === 'file');
      if (items.length) {
        e.preventDefault();
        addFiles(items.map((i) => i.getAsFile()));
      }
    }
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addFiles, isActive]);

  function remove(id) {
    onImages((images || []).filter((i) => i.id !== id));
  }

  function download(img) {
    const a = document.createElement('a');
    a.href = img.url;
    a.download = img.name || 'screenshot';
    a.target = '_blank';
    a.click();
  }

  return (
    <div>
      <div
        className={cls(
          'flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-ch-lg p-6 text-center cursor-pointer transition-colors',
          drag ? 'border-ch-main bg-ch-secondary' : 'border-ch-border bg-ch-secondary/40'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple={multiple} className="hidden" onChange={(e) => e.target.files.length && addFiles(e.target.files)} />
        <Icon name={uploading ? 'loading' : 'edit'} size={26} color="#40513B" />
        <p className="font-body text-body text-ch-main">
          {uploading ? 'Uploading…' : (
            <>
              Click, drag-drop, or <kbd className="bg-white px-1.5 py-0.5 rounded text-[10px]">Ctrl+V</kbd> to paste
            </>
          )}
        </p>
        <p className="font-body text-body text-ch-main opacity-50 text-[11px]">
          Saved as: <span className="text-ch-main font-bold">{baseName}</span>
        </p>
      </div>

      {(images || []).length > 0 && (
        <div className="flex gap-2 flex-wrap mt-3">
          {images.map((img) => (
            <div key={img.id} className="flex flex-col items-center gap-1">
              <div className="relative w-20 h-20 rounded-ch overflow-hidden bg-white">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <button onClick={() => remove(img.id)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center">
                  ✕
                </button>
              </div>
              <button onClick={() => download(img)} className="text-[10px] text-ch-main opacity-60 underline">
                Save
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
