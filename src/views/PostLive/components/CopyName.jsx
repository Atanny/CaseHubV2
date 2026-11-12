import { useState } from 'react'
import { cls } from '@/utils/classNames'
import { copyToClipboard } from '@/utils/clipboard'

export function CopyName({ name, onCopy }) {
  const [c,setC] = useState(false);
  return (
    <div className="copy-name">
      <span className="copy-name-text">{name}</span>
      <button className={cls("copy-btn",c&&"green")}
        onClick={()=>copyToClipboard(name).then(()=>{setC(true);onCopy&&onCopy();setTimeout(()=>setC(false),1800);})}>
        {c?"Copied!":"Copy"}
      </button>
    </div>
  );
}
