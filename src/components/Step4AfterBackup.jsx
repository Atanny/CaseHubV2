import { useState } from 'react';
import Icon from './Icon';
import ImageUploadZone from './ImageUploadZone';
import { copyToClipboard } from '../utils/clipboard';

function NameCopyRow({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 bg-white border border-ch-border rounded-ch px-5 py-3.5">
      <p className="font-body text-body text-ch-main truncate">{value}</p>
      <button
        onClick={() => {
          copyToClipboard(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          });
        }}
        className="shrink-0 px-4 py-1.5 rounded-ch bg-ch-main text-white text-badge font-label font-bold uppercase"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

export default function Step4AfterBackup({ afterScreenshotName, backupScreenshotName, images, onImages, onBack, onNext }) {
  return (
    <div className="bg-white rounded-ch shadow-ch p-6 flex flex-col gap-5 w-full">
      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-ch-secondary text-ch-main text-[12px] font-bold shrink-0">4</span>
        <div>
          <p className="font-heading font-bold text-h6 text-ch-main">After Screenshot Name</p>
          <p className="font-body text-body text-ch-main opacity-60">Save Your After Screenshot Backup Of The Site</p>
        </div>
      </div>
      <NameCopyRow value={afterScreenshotName} />

      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-ch-secondary text-ch-main text-[12px] font-bold shrink-0">5</span>
        <div>
          <p className="font-heading font-bold text-h6 text-ch-main">Before/After Backup Screenshot</p>
          <p className="font-body text-body text-ch-main opacity-60">Upload Or Paste Your Before And After Screenshot - Image Auto Rename Once Downloaded</p>
        </div>
      </div>
      <NameCopyRow value={backupScreenshotName} />
      <ImageUploadZone baseName={backupScreenshotName} multiple images={images} onImages={onImages} isActive />

      <div className="flex justify-end gap-2.5">
        <button onClick={onBack} className="flex items-center justify-center w-11 h-11 rounded-ch bg-white border border-ch-border text-ch-main">
          <Icon name="back" size={18} color="#40513B" />
        </button>
        <button onClick={onNext} className="flex items-center justify-center w-11 h-11 rounded-ch bg-ch-main text-white">
          <Icon name="login" size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}
