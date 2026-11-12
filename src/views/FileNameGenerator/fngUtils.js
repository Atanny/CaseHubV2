// Turn a computed name into a safe download filename, preserving the uploaded file's extension.
export function fngDownloadName(name, img){
  const urlExt = (img?.url||"").split("?")[0].split(".").pop().toLowerCase();
  const safeExt = ["jpg","jpeg","png","gif","webp"].includes(urlExt) ? urlExt : "png";
  return `${(name||"file").replace(/\.[^/.]+$/,"")}.${safeExt}`;
}
