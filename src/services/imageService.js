import { postJson } from './http'

// POST a base64 image payload to the upload route (returns the raw Response)
export const uploadImageData = (payload) => postJson('/api/images/upload', payload)

// Upload a single file to Supabase Storage — returns persistent URL
export async function uploadImageToStorage(file, name) {
  const ext = file.name?.split(".").pop() || "png";
  const fileName = `${name}.${ext}`;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async(e) => {
      try {
        const res = await uploadImageData({ fileBase64: e.target.result, fileName, mimeType: file.type || "image/png" });
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
