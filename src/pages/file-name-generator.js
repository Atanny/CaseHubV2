import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import HeaderQuickActions from '../components/HeaderQuickActions';
import Divider from '../components/Divider';
import Button from '../components/Button';
import Input from '../components/Input';
import Pill from '../components/Pill';
import Modal from '../components/Modal';
import Toast, { useToast } from '../components/Toast';
import { CopyCell, DynList, FngSection } from '../components/FngHelpers';

const san = (s) => (s || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
const nn = (i) => String(i + 1).padStart(2, '0');

const EMPTY_FORM = { bizFilename: '', bizAlt: '', accountNum: '', pages: [''], badges: [''], teamMembers: [''], menuNames: [''], pdfNames: [''] };

const DEFAULT_FORMAT = {
  logo: '{nob}-logo',
  favicon: '{nob}-favicon',
  blogLogo: '{nob}-blog-logo',
  introWhy: '{nob}-intro-why-choose',
  heroCust: '{nob}-hero-{page}',
  heroSlider: '{nob}-hero-slider-{nn}',
  galleryNon: '{nob}-gallery-{nn}',
  gallerySpec: '{nob}-{page}-gallery-{nn}',
  before: '{nob}-before-{nn}',
  after: '{nob}-after-{nn}',
  badge: '{nob}-badge-{badge}',
  team: '{nob}-{member}',
  menu: '{nob}-menu-{nn}',
  menuNamed: '{nob}-menu-{menu}-{nn}',
  pageContent: '{nob}-{page}-{nn}',
  pdf: '{nob}-{pdf}-pdf',
};

const TABS = [
  ['logo', 'Logo & Misc'],
  ['hero', 'Hero'],
  ['gallery', 'Gallery'],
  ['beforeafter', 'Before/After'],
  ['badges', 'Badges'],
  ['team', 'Team'],
  ['menu', 'Menu'],
  ['content', 'Content Image'],
  ['pdf', 'PDF'],
  ['slider', 'Hero Slider'],
];

const N = 20;

function loadJSON(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? { ...fallback, ...JSON.parse(v) } : fallback;
  } catch {
    return fallback;
  }
}

export default function FileNameGeneratorPage() {
  const [form, setForm] = useState(() => loadJSON('ch_fng_form', EMPTY_FORM));
  const [format, setFormat] = useState(() => loadJSON('ch_fng_format', DEFAULT_FORMAT));
  const [draftFmt, setDraftFmt] = useState(DEFAULT_FORMAT);
  const [editingFormat, setEditingFormat] = useState(false);
  const [tab, setTab] = useState('logo');
  const [copiedVal, setCopiedVal] = useState(null);
  const [toast, showToast] = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('ch_fng_form', JSON.stringify(form));
  }, [form]);

  const nob = san(form.bizFilename);
  const nobFull = san(form.bizAlt) || nob;

  function applyFmt(tpl, vars = {}) {
    if (!nob) return '';
    const defaults = {
      page: san(form.pages.filter(Boolean)[0] || ''),
      badge: san(form.badges.filter(Boolean)[0] || ''),
      member: san(form.teamMembers.filter(Boolean)[0] || ''),
      menu: san(form.menuNames.filter(Boolean)[0] || ''),
      pdf: san(form.pdfNames.filter(Boolean)[0] || ''),
      nn: '01',
    };
    const resolved = { ...defaults, ...vars };
    let s = tpl.replace(/{nob}/g, nob).replace(/{nobfull}/g, nobFull || nob);
    Object.entries(resolved).forEach(([k, v]) => {
      s = s.replace(new RegExp(`{${k}}`, 'g'), san(v) || k);
    });
    return s;
  }

  function copy(val) {
    if (!val) return;
    navigator.clipboard?.writeText(val).then(() => {
      setCopiedVal(val);
      setTimeout(() => setCopiedVal(null), 1500);
    });
  }
  function copyAll(vals) {
    const t = vals.filter(Boolean).join('\n');
    if (!t) return;
    navigator.clipboard?.writeText(t).then(() => showToast('Copied all!'));
  }

  function setListItem(field, i, v) {
    setForm((f) => {
      const arr = [...f[field]];
      arr[i] = v;
      return { ...f, [field]: arr };
    });
  }
  function addListItem(field) {
    setForm((f) => ({ ...f, [field]: [...f[field], ''] }));
  }
  function removeListItem(field, i) {
    setForm((f) => {
      const arr = [...f[field]];
      arr.splice(i, 1);
      return { ...f, [field]: arr.length ? arr : [''] };
    });
  }

  const logoVals = [applyFmt(format.logo), applyFmt(format.favicon), applyFmt(format.blogLogo), applyFmt(format.introWhy)];
  const pages = form.pages.filter(Boolean);
  const heroVals = pages.length ? pages.map((p) => applyFmt(format.heroCust, { page: san(p) })) : [applyFmt(format.heroCust, { page: 'home' })];
  const galleryNonVals = Array.from({ length: N }, (_, i) => applyFmt(format.galleryNon, { nn: nn(i) }));
  const gallerySpecVals = pages.flatMap((p) => Array.from({ length: 10 }, (_, i) => applyFmt(format.gallerySpec, { page: san(p), nn: nn(i) })));
  const baVals = Array.from({ length: N }, (_, i) => [applyFmt(format.before, { nn: nn(i) }), applyFmt(format.after, { nn: nn(i) })]).flat();
  const badgeVals = form.badges.filter(Boolean).map((b) => applyFmt(format.badge, { badge: san(b) }));
  const teamVals = form.teamMembers.filter(Boolean).map((m) => applyFmt(format.team, { member: san(m) }));
  const menuNumVals = Array.from({ length: 10 }, (_, i) => applyFmt(format.menu, { nn: nn(i) }));
  const menuNamedVals = form.menuNames.filter(Boolean).flatMap((m) => Array.from({ length: 5 }, (_, i) => applyFmt(format.menuNamed, { menu: san(m), nn: nn(i) })));
  const contentVals = pages.flatMap((p) => Array.from({ length: 10 }, (_, i) => applyFmt(format.pageContent, { page: san(p), nn: nn(i) })));
  const pdfVals = form.pdfNames.filter(Boolean).map((p) => applyFmt(format.pdf, { pdf: san(p) }));
  const sliderVals = Array.from({ length: N }, (_, i) => applyFmt(format.heroSlider, { nn: nn(i) }));

  return (
    <AppLayout>
      <PageHeader
        title="File Name Generator"
        subtitle={nob ? `Generating for "${nob}"` : 'Fill in business info below to start'}
        actions={<HeaderQuickActions />}
      />
      <Divider className="mb-1" />

      <div className="flex gap-2.5 w-full">
        <Button
          variant="outline"
          onClick={() => {
            setDraftFmt({ ...format });
            setEditingFormat(true);
          }}
        >
          Edit Format
        </Button>
        <Button
          variant="outline"
          className="!border-ch-red !text-ch-red"
          onClick={() => {
            setForm(EMPTY_FORM);
            showToast('Cleared', 'info');
          }}
        >
          Clear All
        </Button>
      </div>

      <div className="bg-white rounded-ch shadow-ch p-5 w-full">
        <p className="font-heading font-bold text-h6 text-ch-main mb-3">Business Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-1.5">Business Name (NOB)</p>
            <Input value={form.bizFilename} onChange={(e) => setForm((f) => ({ ...f, bizFilename: e.target.value }))} placeholder="Fire Force" />
          </div>
          <div>
            <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-1.5">Business Name + Suffix</p>
            <Input value={form.bizAlt} onChange={(e) => setForm((f) => ({ ...f, bizAlt: e.target.value }))} placeholder="Fire Force LLC" />
          </div>
          <div>
            <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-1.5">Account Number</p>
            <Input value={form.accountNum} onChange={(e) => setForm((f) => ({ ...f, accountNum: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DynList label="Pages" items={form.pages} onSet={(i, v) => setListItem('pages', i, v)} onAdd={() => addListItem('pages')} onRemove={(i) => removeListItem('pages', i)} />
          <DynList label="Badges" items={form.badges} onSet={(i, v) => setListItem('badges', i, v)} onAdd={() => addListItem('badges')} onRemove={(i) => removeListItem('badges', i)} />
          <DynList label="Team Members" items={form.teamMembers} onSet={(i, v) => setListItem('teamMembers', i, v)} onAdd={() => addListItem('teamMembers')} onRemove={(i) => removeListItem('teamMembers', i)} />
          <DynList label="Menu Names" items={form.menuNames} onSet={(i, v) => setListItem('menuNames', i, v)} onAdd={() => addListItem('menuNames')} onRemove={(i) => removeListItem('menuNames', i)} />
          <DynList label="PDF Names" items={form.pdfNames} onSet={(i, v) => setListItem('pdfNames', i, v)} onAdd={() => addListItem('pdfNames')} onRemove={(i) => removeListItem('pdfNames', i)} />
        </div>
      </div>

      {!nob && (
        <div className="w-full bg-white rounded-ch shadow-ch p-6 text-center font-body text-body text-ch-main opacity-60">
          Enter a business name above to generate file names.
        </div>
      )}

      {nob && (
        <>
          <div className="flex items-center gap-2 flex-wrap w-full">
            {TABS.map(([v, l]) => (
              <Pill key={v} active={tab === v} onClick={() => setTab(v)}>
                {l}
              </Pill>
            ))}
          </div>

          {tab === 'logo' && (
            <FngSection title="Logo & Misc" values={logoVals} onCopyAll={copyAll}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {logoVals.map((v, i) => (
                  <CopyCell key={i} value={v} onCopy={copy} copied={copiedVal === v} />
                ))}
              </div>
            </FngSection>
          )}
          {tab === 'hero' && (
            <FngSection title="Hero Images" values={heroVals} onCopyAll={copyAll}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {heroVals.map((v, i) => (
                  <CopyCell key={i} value={v} onCopy={copy} copied={copiedVal === v} />
                ))}
              </div>
            </FngSection>
          )}
          {tab === 'gallery' && (
            <>
              <FngSection title="Gallery (general)" values={galleryNonVals} onCopyAll={copyAll}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {galleryNonVals.map((v, i) => (
                    <CopyCell key={i} value={v} onCopy={copy} copied={copiedVal === v} />
                  ))}
                </div>
              </FngSection>
              {pages.length > 0 && (
                <FngSection title="Gallery (per page)" values={gallerySpecVals} onCopyAll={copyAll}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {gallerySpecVals.map((v, i) => (
                      <CopyCell key={i} value={v} onCopy={copy} copied={copiedVal === v} />
                    ))}
                  </div>
                </FngSection>
              )}
            </>
          )}
          {tab === 'beforeafter' && (
            <FngSection title="Before / After" values={baVals} onCopyAll={copyAll}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {baVals.map((v, i) => (
                  <CopyCell key={i} value={v} onCopy={copy} copied={copiedVal === v} />
                ))}
              </div>
            </FngSection>
          )}
          {tab === 'badges' && (
            <FngSection title="Badges" values={badgeVals} onCopyAll={copyAll}>
              {badgeVals.length === 0 ? (
                <p className="font-body text-body text-ch-main opacity-50">Add badge names above.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {badgeVals.map((v, i) => (
                    <CopyCell key={i} value={v} onCopy={copy} copied={copiedVal === v} />
                  ))}
                </div>
              )}
            </FngSection>
          )}
          {tab === 'team' && (
            <FngSection title="Team" values={teamVals} onCopyAll={copyAll}>
              {teamVals.length === 0 ? (
                <p className="font-body text-body text-ch-main opacity-50">Add team members above.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {teamVals.map((v, i) => (
                    <CopyCell key={i} value={v} onCopy={copy} copied={copiedVal === v} />
                  ))}
                </div>
              )}
            </FngSection>
          )}
          {tab === 'menu' && (
            <>
              <FngSection title="Menu (numbered)" values={menuNumVals} onCopyAll={copyAll}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {menuNumVals.map((v, i) => (
                    <CopyCell key={i} value={v} onCopy={copy} copied={copiedVal === v} />
                  ))}
                </div>
              </FngSection>
              {form.menuNames.filter(Boolean).length > 0 && (
                <FngSection title="Menu (named)" values={menuNamedVals} onCopyAll={copyAll}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {menuNamedVals.map((v, i) => (
                      <CopyCell key={i} value={v} onCopy={copy} copied={copiedVal === v} />
                    ))}
                  </div>
                </FngSection>
              )}
            </>
          )}
          {tab === 'content' && (
            <FngSection title="Content Image" values={contentVals} onCopyAll={copyAll}>
              {contentVals.length === 0 ? (
                <p className="font-body text-body text-ch-main opacity-50">Add pages above.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {contentVals.map((v, i) => (
                    <CopyCell key={i} value={v} onCopy={copy} copied={copiedVal === v} />
                  ))}
                </div>
              )}
            </FngSection>
          )}
          {tab === 'pdf' && (
            <FngSection title="PDF" values={pdfVals} onCopyAll={copyAll}>
              {pdfVals.length === 0 ? (
                <p className="font-body text-body text-ch-main opacity-50">Add PDF names above.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {pdfVals.map((v, i) => (
                    <CopyCell key={i} value={v} onCopy={copy} copied={copiedVal === v} />
                  ))}
                </div>
              )}
            </FngSection>
          )}
          {tab === 'slider' && (
            <FngSection title="Hero Slider" values={sliderVals} onCopyAll={copyAll}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {sliderVals.map((v, i) => (
                  <CopyCell key={i} value={v} onCopy={copy} copied={copiedVal === v} />
                ))}
              </div>
            </FngSection>
          )}
        </>
      )}

      <Modal open={editingFormat} onClose={() => setEditingFormat(false)} className="!max-w-2xl !text-left max-h-[85vh] overflow-y-auto">
        <p className="font-heading font-bold text-h6 text-ch-main mb-1">Edit Filename Format Templates</p>
        <p className="font-body text-body text-ch-main opacity-60 mb-4">
          Tokens: <code>{'{nob}'}</code> name · <code>{'{nobfull}'}</code> name+suffix · <code>{'{nn}'}</code> number · <code>{'{page}'}</code>{' '}
          <code>{'{member}'}</code> <code>{'{badge}'}</code> <code>{'{menu}'}</code> <code>{'{pdf}'}</code>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(draftFmt).map(([key, val]) => (
            <div key={key}>
              <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              <input
                className="w-full h-9 px-3 bg-ch-secondary rounded-ch outline-none font-mono text-[11px] text-ch-main"
                value={val}
                onChange={(e) => setDraftFmt((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2.5 mt-5">
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => {
              setFormat(draftFmt);
              localStorage.setItem('ch_fng_format', JSON.stringify(draftFmt));
              setEditingFormat(false);
              showToast('Format saved');
            }}
          >
            Save Format
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setFormat(DEFAULT_FORMAT);
              setDraftFmt(DEFAULT_FORMAT);
              localStorage.removeItem('ch_fng_format');
              showToast('Reset to default', 'info');
            }}
          >
            Reset
          </Button>
          <Button variant="outline" onClick={() => setEditingFormat(false)}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Toast msg={toast.msg} type={toast.type} />
    </AppLayout>
  );
}
