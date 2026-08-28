import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import HeaderQuickActions from '../components/HeaderQuickActions';
import Divider from '../components/Divider';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Toast, { useToast } from '../components/Toast';
import Icon from '../components/Icon';

const san = (s) =>
  (s || '')
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

const nn = (i) => String(i + 1).padStart(2, '0');

const NAME_TYPES = [
  ['hero', 'Hero'],
  ['heroSlider', 'Hero Slider'],
  ['gallery', 'Gallery'],
  ['gallerySeparate', 'Gallery - Separate Page'],
  ['content', 'Content'],
  ['beforeAfter', 'Before/After'],
];

const DEFAULT_FORMATS = {
  hero: '{page}-Hero-{business}',
  heroSlider: 'Hero-Slider-{page}-{nn}-{business}',
  gallery: 'Gallery-{nn}-{business}',
  gallerySeparate: '{page}-Gallery-{nn}-{business}',
  content: '{page}-Content-{nn}-{business}',
  before: '{item}-Before-{nn}',
  after: '{item}-After-{nn}',
};

function emptyEntry() {
  return { id: String(Date.now() + Math.random()), pageName: '', images: [], before: null, after: null };
}

function fileEntry(file) {
  return { id: String(Date.now() + Math.random()), file, url: URL.createObjectURL(file) };
}

/** Click / drag-drop / paste zone for one or more images. */
function UploadZone({ multiple, onFiles }) {
  const [drag, setDrag] = useState(false);
  const inputId = `up-${Math.random().toString(36).slice(2)}`;

  return (
    <label
      htmlFor={inputId}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (e.dataTransfer.files.length) onFiles(Array.from(e.dataTransfer.files));
      }}
      onPaste={(e) => {
        const items = Array.from(e.clipboardData?.items || []).filter((i) => i.kind === 'file');
        if (items.length) onFiles(items.map((i) => i.getAsFile()).filter(Boolean));
      }}
      tabIndex={0}
      className={`flex flex-col items-center justify-center gap-1.5 w-full h-[90px] border-2 border-dashed rounded-ch cursor-pointer transition-colors ${
        drag ? 'border-ch-main bg-white' : 'border-ch-border bg-white'
      }`}
    >
      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files.length) onFiles(Array.from(e.target.files));
          e.target.value = '';
        }}
      />
      <Icon name="edit" size={20} color="#40513B" />
      <p className="font-body text-body text-ch-main opacity-70 text-center">Paste Or Upload Your Screenshot Here</p>
    </label>
  );
}

export default function FileNameGeneratorPage() {
  const [caseInfo, setCaseInfo] = useState({ businessName: '', entityDesignation: '', accountNumber: '' });
  const [nameType, setNameType] = useState('hero');
  const [entries, setEntries] = useState([emptyEntry()]);
  const [galleryImages, setGalleryImages] = useState([]); // flat, only for 'gallery' type
  const [selected, setSelected] = useState({}); // { generatedName: true }
  const [formats, setFormats] = useState(DEFAULT_FORMATS);
  const [draftFormats, setDraftFormats] = useState(DEFAULT_FORMATS);
  const [editingFormat, setEditingFormat] = useState(false);
  const [toast, showToast] = useToast();

  const business = san(caseInfo.businessName);

  function updateEntry(id, patch) {
    setEntries((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function addEntry() {
    setEntries((list) => [...list, emptyEntry()]);
  }
  function removeEntry(id) {
    setEntries((list) => (list.length > 1 ? list.filter((e) => e.id !== id) : list));
  }
  function addImages(entryId, files) {
    setEntries((list) => list.map((e) => (e.id === entryId ? { ...e, images: [...e.images, ...files.map(fileEntry)] } : e)));
  }

  // ---- Build the list of generated cards { key, page, name, url } for the current name type ----
  function buildCards() {
    if (!business) return [];
    const cards = [];

    if (nameType === 'hero') {
      entries.forEach((e) => {
        if (!e.pageName || e.images.length === 0) return;
        const page = san(e.pageName);
        const img = e.images[0];
        cards.push({ key: `${e.id}-cust`, page: e.pageName, name: `${formats.hero.replace('{page}', page).replace('{business}', business)}-Cust`, url: img.url, file: img.file });
        cards.push({ key: `${e.id}-plain`, page: e.pageName, name: formats.hero.replace('{page}', page).replace('{business}', business), url: img.url, file: img.file });
      });
    } else if (nameType === 'heroSlider') {
      entries.forEach((e) => {
        if (!e.pageName) return;
        const page = san(e.pageName);
        e.images.forEach((img, i) => {
          const name = formats.heroSlider.replace('{page}', page).replace('{nn}', nn(i)).replace('{business}', business);
          cards.push({ key: img.id, page: e.pageName, name, url: img.url, file: img.file });
        });
      });
    } else if (nameType === 'gallery') {
      galleryImages.forEach((img, i) => {
        const name = formats.gallery.replace('{nn}', nn(i)).replace('{business}', business);
        cards.push({ key: img.id, page: 'Gallery Page', name, url: img.url, file: img.file });
      });
    } else if (nameType === 'gallerySeparate') {
      entries.forEach((e) => {
        if (!e.pageName) return;
        const page = san(e.pageName);
        e.images.forEach((img, i) => {
          const name = formats.gallerySeparate.replace('{page}', page).replace('{nn}', nn(i)).replace('{business}', business);
          cards.push({ key: img.id, page: e.pageName, name, url: img.url, file: img.file });
        });
      });
    } else if (nameType === 'content') {
      entries.forEach((e) => {
        if (!e.pageName) return;
        const page = san(e.pageName);
        e.images.forEach((img, i) => {
          const name = formats.content.replace('{page}', page).replace('{nn}', nn(i)).replace('{business}', business);
          cards.push({ key: img.id, page: e.pageName, name, url: img.url, file: img.file });
        });
      });
    } else if (nameType === 'beforeAfter') {
      entries.forEach((e) => {
        if (!e.pageName) return;
        const item = san(e.pageName);
        if (e.before) cards.push({ key: `${e.id}-before`, page: e.pageName, name: formats.before.replace('{item}', item).replace('{nn}', '01'), url: e.before.url, file: e.before.file });
        if (e.after) cards.push({ key: `${e.id}-after`, page: e.pageName, name: formats.after.replace('{item}', item).replace('{nn}', '01'), url: e.after.url, file: e.after.file });
      });
    }
    return cards;
  }

  const cards = buildCards();
  const grouped = cards.reduce((acc, c) => {
    (acc[c.page] = acc[c.page] || []).push(c);
    return acc;
  }, {});
  const selectedCount = cards.filter((c) => selected[c.key]).length;
  const allSelected = cards.length > 0 && selectedCount === cards.length;

  function toggleSelected(key) {
    setSelected((s) => ({ ...s, [key]: !s[key] }));
  }
  function toggleSelectAll() {
    if (allSelected) {
      setSelected({});
    } else {
      setSelected(Object.fromEntries(cards.map((c) => [c.key, true])));
    }
  }

  async function downloadSelected() {
    const toDownload = cards.filter((c) => selected[c.key]);
    if (toDownload.length === 0) {
      showToast('Select at least one image first', 'error');
      return;
    }
    for (const c of toDownload) {
      const ext = c.file.name.split('.').pop() || 'png';
      const a = document.createElement('a');
      a.href = c.url;
      a.download = `${c.name}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 250)); // let the browser register each download separately
    }
    showToast(`Downloaded ${toDownload.length} image${toDownload.length !== 1 ? 's' : ''}`);
  }

  const rightTitle = NAME_TYPES.find(([v]) => v === nameType)?.[1] + ' Upload';
  const isBeforeAfter = nameType === 'beforeAfter';
  const isFlatGallery = nameType === 'gallery';
  const isSinglePerPage = nameType === 'hero';

  return (
    <AppLayout>
      <PageHeader title="File Name Generator" subtitle="Manage Your File Names" actions={<HeaderQuickActions />} />
      <Divider className="mb-1" />

      <div className="flex gap-2.5 items-start w-full flex-wrap">
        {/* Left column */}
        <div className="flex flex-col gap-3 bg-ch-secondary rounded-ch-lg shadow-ch p-5 w-full max-w-[400px]">
          <p className="font-heading font-bold text-h6 text-ch-main">Case Information</p>
          <Divider tone="secondary" />

          <div>
            <p className="text-[10px] font-label font-bold uppercase text-ch-main mb-1.5">Business Name (Auto-Fill)*</p>
            <Input value={caseInfo.businessName} onChange={(e) => setCaseInfo((c) => ({ ...c, businessName: e.target.value }))} placeholder="Purify Drinking Water" />
          </div>
          <div>
            <p className="text-[10px] font-label font-bold uppercase text-ch-main mb-1.5">Entity Designations (Auto-Fill)*</p>
            <Input value={caseInfo.entityDesignation} onChange={(e) => setCaseInfo((c) => ({ ...c, entityDesignation: e.target.value }))} placeholder="Inc" />
          </div>
          <div>
            <p className="text-[10px] font-label font-bold uppercase text-ch-main mb-1.5">Account Number (Auto-Fill)*</p>
            <Input value={caseInfo.accountNumber} onChange={(e) => setCaseInfo((c) => ({ ...c, accountNumber: e.target.value }))} />
          </div>

          <Divider tone="secondary" />

          <div>
            <p className="text-[10px] font-label font-bold uppercase text-ch-main mb-1.5">Name Type</p>
            <div className="relative">
              <select
                value={nameType}
                onChange={(e) => {
                  setNameType(e.target.value);
                  setSelected({});
                }}
                className="w-full h-[52px] px-4 bg-white border border-ch-border rounded-ch-lg outline-none font-body text-body text-ch-main appearance-none"
              >
                {NAME_TYPES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              <Icon name="chevron" size={16} color="#40513B" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {isFlatGallery ? (
            <div className="bg-white rounded-ch p-4 flex flex-col gap-2">
              <p className="text-[10px] font-label font-bold uppercase text-ch-main">Upload Images</p>
              <UploadZone multiple onFiles={(files) => setGalleryImages((imgs) => [...imgs, ...files.map(fileEntry)])} />
              {galleryImages.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {galleryImages.map((img) => (
                    <img key={img.id} src={img.url} alt="" className="w-12 h-12 rounded-ch object-cover" />
                  ))}
                </div>
              )}
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-ch p-4 flex flex-col gap-2 relative">
                <button onClick={() => removeEntry(entry.id)} className="absolute top-3 right-3 opacity-50 hover:opacity-100">
                  <Icon name="close" size={12} color="#40513B" />
                </button>
                <p className="text-[10px] font-label font-bold uppercase text-ch-main">{isBeforeAfter ? 'Item Name' : 'Page Name'}</p>
                <div className="relative">
                  <input
                    className="w-full h-11 pl-4 pr-9 bg-ch-secondary rounded-ch outline-none font-body text-body text-ch-main"
                    value={entry.pageName}
                    onChange={(e) => updateEntry(entry.id, { pageName: e.target.value })}
                    placeholder={isBeforeAfter ? 'e.g. Water Trek Refilling' : 'e.g. Home'}
                  />
                  {entry.pageName && (
                    <button onClick={() => updateEntry(entry.id, { pageName: '' })} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Icon name="close" size={12} color="#C54446" />
                    </button>
                  )}
                </div>

                {isBeforeAfter ? (
                  <>
                    <p className="text-[10px] font-label font-bold uppercase text-ch-main">Before Image</p>
                    {entry.before ? (
                      <img src={entry.before.url} alt="" className="w-16 h-16 rounded-ch object-cover" />
                    ) : (
                      <UploadZone onFiles={(files) => updateEntry(entry.id, { before: fileEntry(files[0]) })} />
                    )}
                    <p className="text-[10px] font-label font-bold uppercase text-ch-main">After Image</p>
                    {entry.after ? (
                      <img src={entry.after.url} alt="" className="w-16 h-16 rounded-ch object-cover" />
                    ) : (
                      <UploadZone onFiles={(files) => updateEntry(entry.id, { after: fileEntry(files[0]) })} />
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-[10px] font-label font-bold uppercase text-ch-main">Upload Image{isSinglePerPage ? '' : 's'}</p>
                    <UploadZone
                      multiple={!isSinglePerPage}
                      onFiles={(files) => addImages(entry.id, isSinglePerPage ? files.slice(0, 1) : files)}
                    />
                    {entry.images.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {entry.images.map((img) => (
                          <img key={img.id} src={img.url} alt="" className="w-12 h-12 rounded-ch object-cover" />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}

          {!isFlatGallery && (
            <button onClick={addEntry} className="self-center font-body text-body text-ch-main opacity-70 flex items-center gap-1.5">
              Add More Page
              <Icon name="plus" size={11} color="#40513B" />
            </button>
          )}

          <div className="flex gap-2.5">
            <Button
              variant="danger"
              uppercase={false}
              className="!bg-white !text-ch-red flex-1"
              icon={<Icon name="close" size={13} color="#C54446" />}
              onClick={() => {
                setEntries([emptyEntry()]);
                setGalleryImages([]);
                setSelected({});
              }}
            >
              Remove Fill
            </Button>
            <Button
              variant="primary"
              uppercase={false}
              className="flex-1"
              icon={<Icon name="edit" size={13} color="#fff" />}
              onClick={() => {
                setDraftFormats(formats);
                setEditingFormat(true);
              }}
            >
              Edit File Name Format
            </Button>
          </div>
        </div>

        {/* Right column */}
        <div className="flex-1 min-w-[320px] bg-white rounded-ch-lg shadow-ch p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-heading font-bold text-h6 text-ch-main uppercase">{rightTitle}</p>
            <p className="font-body text-body text-ch-main opacity-60">
              Selected: {selectedCount}/{cards.length}
            </p>
          </div>
          <Divider tone="secondary" />

          {cards.length === 0 && (
            <p className="font-body text-body text-ch-main opacity-50 py-8 text-center">
              {business ? 'Add a page and upload an image to generate file names.' : 'Enter a business name and upload an image to get started.'}
            </p>
          )}

          {Object.entries(grouped).map(([page, imgs]) => (
            <div key={page} className="flex flex-col gap-2.5">
              <p className="text-[10px] font-label font-bold uppercase text-ch-main">{page}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {imgs.map((c) => (
                  <div key={c.key} className="flex flex-col gap-1.5">
                    <button onClick={() => toggleSelected(c.key)} className="relative aspect-square rounded-ch overflow-hidden border border-ch-border">
                      <img src={c.url} alt="" className="w-full h-full object-cover" />
                      <span className={`absolute top-1.5 right-1.5 w-4 h-4 rounded border flex items-center justify-center ${selected[c.key] ? 'bg-ch-main border-ch-main' : 'bg-white border-ch-border'}`}>
                        {selected[c.key] && <Icon name="check" size={10} color="#fff" />}
                      </span>
                    </button>
                    <p className="font-body text-body text-ch-main text-center leading-tight">{c.name}</p>
                  </div>
                ))}
              </div>
              <Divider tone="secondary" />
            </div>
          ))}

          <div className="flex items-center justify-between mt-auto pt-2">
            <label className="flex items-center gap-2 font-body text-body text-ch-main cursor-pointer">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} disabled={cards.length === 0} />
              Select All
            </label>
            <Button variant="primary" uppercase={false} icon={<Icon name="archive" size={14} color="#fff" />} onClick={downloadSelected} disabled={cards.length === 0}>
              Download Selected
            </Button>
          </div>
        </div>
      </div>

      <Modal open={editingFormat} onClose={() => setEditingFormat(false)} className="!max-w-xl !text-left max-h-[85vh] overflow-y-auto">
        <p className="font-heading font-bold text-h6 text-ch-main mb-1">Edit File Name Format</p>
        <p className="font-body text-body text-ch-main opacity-60 mb-4">
          Tokens: <code>{'{business}'}</code> business name · <code>{'{page}'}</code> page/item name · <code>{'{nn}'}</code> number
        </p>
        <div className="flex flex-col gap-3">
          {Object.entries(draftFormats).map(([key, val]) => (
            <div key={key}>
              <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-1">{key}</p>
              <input
                className="w-full h-9 px-3 bg-ch-secondary rounded-ch outline-none font-mono text-[11px] text-ch-main"
                value={val}
                onChange={(e) => setDraftFormats((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2.5 mt-5">
          <Button
            variant="primary"
            uppercase={false}
            className="flex-1"
            onClick={() => {
              setFormats(draftFormats);
              setEditingFormat(false);
              showToast('Format saved');
            }}
          >
            Save Format
          </Button>
          <Button variant="outline" uppercase={false} onClick={() => setDraftFormats(DEFAULT_FORMATS)}>
            Reset
          </Button>
          <Button variant="outline" uppercase={false} onClick={() => setEditingFormat(false)}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Toast msg={toast.msg} type={toast.type} />
    </AppLayout>
  );
}
