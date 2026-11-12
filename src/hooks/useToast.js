import { useState } from 'react'

export function useToast() {
  const [toast,setToast] = useState({});
  const show = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast({}),2800); };
  return [toast, show];
}
