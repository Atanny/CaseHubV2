import { useState } from 'react';
import { cls } from '../../lib/helpers';

export default function Toast({ msg, type }) {
  if(!msg) return null;
  return <div className={cls("toast", type||"success")}>{msg}</div>;
}

export function useToast() {
  const [toast,setToast] = useState({});
  const show = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast({}),2800); };
  return [toast, show];
}
