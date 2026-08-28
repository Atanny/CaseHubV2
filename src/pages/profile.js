import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import HeaderQuickActions from '../components/HeaderQuickActions';
import Divider from '../components/Divider';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Toast, { useToast } from '../components/Toast';
import Icon from '../components/Icon';
import { useSession } from '../hooks/useSession';
import { profileService } from '../services/profileService';
import { requestorsService } from '../services/requestorsService';
import { settingsService } from '../services/settingsService';
import { authService } from '../services/authService';
import { ROUTES } from '../constants/routes';

/** A settings card: title, description, one or two inputs, a Save button, and a "currently" readout. */
function SettingCard({ title, description, children, onSave, current, extra }) {
  return (
    <Card className="w-full">
      <p className="font-heading font-bold text-h6 text-ch-main mb-1">{title}</p>
      <p className="font-body text-body text-ch-main opacity-60 mb-4">{description}</p>
      <div className="flex items-center gap-3 flex-wrap">
        {children}
        <Button variant="primary" size="sm" onClick={onSave} className="ml-auto">
          Save
        </Button>
        {extra}
      </div>
      {current && <p className="font-body text-body text-ch-main opacity-60 mt-2">{current}</p>}
    </Card>
  );
}

/** Chip showing a special requestor's initials + name, with a remove button. */
function RequestorChip({ name, onRemove }) {
  const initials = (name || '')
    .split(' ')
    .map((w) => w && w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex items-center gap-2 bg-ch-secondary rounded-full pl-1 pr-3 py-1">
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-ch-main text-white text-[11px] font-bold shrink-0">
        {initials}
      </span>
      <span className="font-body text-body text-ch-main">{name}</span>
      <button onClick={onRemove} className="text-ch-main opacity-50 hover:opacity-100 text-xs ml-1">
        ✕
      </button>
    </div>
  );
}

const DEFAULT_GREETING = [{ id: 'default', label: 'Check-in', base: 'Hi po Ms. Tina, magpapacheck lang po', fillType: 'caseNum' }];
const APPEND_OPTIONS = [
  ['none', 'None'],
  ['siteComment', 'Site Comment #'],
  ['caseNum', 'Case #'],
  ['inbound', 'Inbound #'],
];

function defaultFileNames(name) {
  const n = (name || 'User').trim().replace(/\s+/g, '_');
  return {
    beforeName: `Post_Live_Amend_Before_${n}_Amends`,
    afterName: `Post_Live_Amend_After_${n}_Amends`,
    screenshotName: `Post_Live_Amend_Screenshot_${n}_Amends`,
  };
}

function buildPreview(base, fillType) {
  const b = base || 'Hi po Ms. Tina, magpapacheck lang po';
  if (fillType === 'none') return b;
  if (fillType === 'siteComment') return `${b} Site Comment #12345`;
  if (fillType === 'caseNum') return `${b} Case #12345`;
  if (fillType === 'inbound') return `${b} Inbound #67890`;
  return b;
}

export default function ProfilePage() {
  const { user, setUser, signOut } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, showToast] = useToast();
  const avatarInputRef = useRef();

  const [form, setForm] = useState({ name: '', role: '', avatarUrl: '', beforeName: '', afterName: '', screenshotName: '', greetingMessages: DEFAULT_GREETING });
  const [pwForm, setPwForm] = useState({ next: '', confirm: '' });

  const [requestors, setRequestors] = useState([]);
  const [newReq, setNewReq] = useState('');

  const [settings, setSettings] = useState(settingsService.defaults());
  const [timerInput, setTimerInput] = useState('30');
  const [qaInput, setQaInput] = useState('10');
  const [shiftStartInput, setShiftStartInput] = useState('');
  const [shiftStartWarnInput, setShiftStartWarnInput] = useState('10');
  const [shiftEndInput, setShiftEndInput] = useState('');
  const [shiftWarnInput, setShiftWarnInput] = useState('10');

  useEffect(() => {
    const s = settingsService.getAll();
    setSettings(s);
    setTimerInput(String(s.timerLimit));
    setQaInput(String(s.qaLimit));
    setShiftStartInput(s.shiftStartTime);
    setShiftStartWarnInput(String(s.shiftStartWarnMins));
    setShiftEndInput(s.shiftEndTime);
    setShiftWarnInput(String(s.shiftWarnMins));
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      try {
        const [profile, reqs] = await Promise.all([profileService.get(user.email), requestorsService.list()]);
        const defs = defaultFileNames(user.name);
        setForm({
          name: profile.name || user.name || '',
          role: profile.role || user.role || '',
          avatarUrl: profile.avatar_url || user.avatarUrl || '',
          beforeName: profile.before_name || defs.beforeName,
          afterName: profile.after_name || defs.afterName,
          screenshotName: profile.screenshot_name || defs.screenshotName,
          greetingMessages: profile.greeting_messages?.length ? profile.greeting_messages : DEFAULT_GREETING,
        });
        setRequestors(reqs);
      } catch (e) {
        showToast('Could not load profile', 'error');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  async function saveProfile(successMsg = 'Profile saved') {
    if (!form.name.trim()) {
      showToast('Name required', 'error');
      return;
    }
    setSaving(true);
    try {
      await profileService.save({
        email: user.email,
        name: form.name,
        role: form.role,
        before_name: form.beforeName,
        after_name: form.afterName,
        screenshot_name: form.screenshotName,
        avatar_url: form.avatarUrl || null,
        greeting_messages: form.greetingMessages || [],
      });
      setUser((u) => ({ ...u, name: form.name, role: form.role, avatarUrl: form.avatarUrl }));
      showToast(successMsg);
    } catch (e) {
      showToast('Error saving profile', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setForm((f) => ({ ...f, avatarUrl: previewUrl }));
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const res = await fetch('/api/images/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileBase64: ev.target.result, fileName: `avatar_${user.id}`, mimeType: file.type || 'image/jpeg' }),
        });
        const data = await res.json();
        if (res.ok) {
          setForm((f) => ({ ...f, avatarUrl: data.url }));
          await profileService.save({ email: user.email, avatar_url: data.url });
          setUser((u) => ({ ...u, avatarUrl: data.url }));
          showToast('Photo updated');
        } else {
          showToast('Upload failed', 'error');
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      showToast('Upload error', 'error');
    }
  }

  async function changePassword() {
    if (pwForm.next.length < 6) return showToast('Min. 6 characters', 'error');
    if (pwForm.next !== pwForm.confirm) return showToast("Passwords don't match", 'error');
    setSaving(true);
    try {
      await authService.changePassword(pwForm.next);
      setPwForm({ next: '', confirm: '' });
      showToast('Password changed');
    } catch (e) {
      showToast(e.message || 'Error', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function addRequestor() {
    const name = newReq.trim();
    if (!name) return showToast('Name required', 'error');
    if (requestors.includes(name)) return showToast('Already exists', 'error');
    try {
      await requestorsService.create(name);
      setRequestors((r) => [...r, name]);
      setNewReq('');
      showToast(`Added ${name}!`);
    } catch (e) {
      showToast('Failed to add', 'error');
    }
  }

  async function removeRequestor(name) {
    try {
      await requestorsService.remove(name);
      setRequestors((r) => r.filter((n) => n !== name));
    } catch (e) {
      showToast('Failed to remove', 'error');
    }
  }

  function updateMsg(idx, patch) {
    setForm((f) => {
      const arr = [...(f.greetingMessages || [])];
      arr[idx] = { ...arr[idx], ...patch };
      return { ...f, greetingMessages: arr };
    });
  }
  function addMsg() {
    setForm((f) => ({
      ...f,
      greetingMessages: [...(f.greetingMessages || []), { id: Date.now().toString(), label: 'New Message', base: 'Hi po Ms. Tina, magpapacheck lang po', fillType: 'caseNum' }],
    }));
  }
  function removeMsg(idx) {
    setForm((f) => ({ ...f, greetingMessages: (f.greetingMessages || []).filter((_, i) => i !== idx) }));
  }

  const initials = (form.name || user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppLayout>
      <PageHeader title="Profile & Settings" subtitle="Manage your Profile" actions={<HeaderQuickActions />} />
      <Divider className="mb-1" />

      {loading ? (
        <Card className="w-full text-center text-ch-main opacity-60">Loading profile…</Card>
      ) : (
        <div className="flex gap-2.5 items-start w-full flex-wrap">
          {/* Left column */}
          <div className="flex flex-col gap-2.5 flex-1 min-w-[320px] max-w-[420px]">
            <Card className="w-full">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 cursor-pointer bg-ch-secondary flex items-center justify-center" onClick={() => avatarInputRef.current?.click()}>
                  {form.avatarUrl ? (
                    <img src={form.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-heading font-bold text-h6 text-ch-main">{initials}</span>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Icon name="edit" size={16} color="#fff" />
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-bold text-h6 text-ch-main truncate">{form.name || user?.name}</p>
                  <p className="font-body text-body text-ch-main opacity-60 truncate">{user?.email}</p>
                  {form.role && <p className="font-body text-body text-ch-main opacity-60">{form.role}</p>}
                </div>
              </div>
              <Divider tone="secondary" className="my-3" />
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Full Name</p>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Role / Title</p>
                  <Input value={form.role} placeholder="e.g. Web Specialist" onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
                </div>
                <Button variant="primary" onClick={() => saveProfile()} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </Card>

            <Card className="w-full">
              <div className="flex items-center justify-between mb-1">
                <p className="font-heading font-bold text-h6 text-ch-main">Check-in Messages</p>
                <Button variant="primary" size="sm" onClick={addMsg}>
                  + Add
                </Button>
              </div>
              <p className="font-body text-body text-ch-main opacity-60 mb-3">Message base text. The append option adds a case/inbound number automatically when copying.</p>
              {(form.greetingMessages || []).length === 0 && <p className="font-body text-body text-ch-main opacity-50 py-2">No messages yet.</p>}
              {(form.greetingMessages || []).map((m, mi) => (
                <div key={m.id} className="bg-ch-secondary rounded-ch p-3.5 mb-2.5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <input
                      className="flex-1 h-9 px-3 bg-white rounded-ch outline-none font-body text-body font-bold text-ch-main"
                      value={m.label || ''}
                      placeholder="Label"
                      onChange={(e) => updateMsg(mi, { label: e.target.value })}
                    />
                    <button onClick={() => removeMsg(mi)} className="shrink-0">
                      <Icon name="trash" size={14} color="#C54446" />
                    </button>
                  </div>
                  <textarea
                    className="w-full min-h-[64px] p-3 bg-white rounded-ch outline-none resize-y font-body text-body text-ch-main mb-2.5"
                    value={m.base || ''}
                    onChange={(e) => updateMsg(mi, { base: e.target.value })}
                  />
                  <div className="flex gap-1.5 flex-wrap mb-2.5">
                    {APPEND_OPTIONS.map(([v, l]) => (
                      <button
                        key={v}
                        onClick={() => updateMsg(mi, { fillType: v })}
                        className={`px-2.5 py-1.5 rounded-full text-badge font-label border ${m.fillType === v ? 'bg-ch-main border-ch-main text-white' : 'bg-white border-ch-border text-ch-main'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <p className="font-body text-body text-ch-main opacity-60">
                    Preview: <span className="text-ch-main font-bold">{buildPreview(m.base, m.fillType)}</span>
                  </p>
                </div>
              ))}
              <Button variant="primary" onClick={() => saveProfile('Messages saved')} disabled={saving}>
                {saving ? 'Saving…' : 'Save Messages'}
              </Button>
            </Card>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-2.5 flex-[2] min-w-[320px]">
            <Card className="w-full">
              <div className="flex items-center justify-between mb-1">
                <p className="font-heading font-bold text-h6 text-ch-main">Special Requestors</p>
              </div>
              <p className="font-body text-body text-ch-main opacity-60 mb-3">Shown in the Live Summary panel as a reminder during active cases.</p>
              <div className="flex gap-2 flex-wrap mb-3">
                {requestors.map((name) => (
                  <RequestorChip key={name} name={name} onRemove={() => removeRequestor(name)} />
                ))}
                {requestors.length === 0 && <p className="font-body text-body text-ch-main opacity-50">No special requestors yet.</p>}
              </div>
              <div className="flex gap-2.5">
                <input
                  className="flex-1 h-[42px] px-3.5 bg-ch-secondary rounded-ch outline-none font-body text-body text-ch-main placeholder:opacity-50"
                  placeholder="e.g. John Smith"
                  value={newReq}
                  onChange={(e) => setNewReq(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addRequestor()}
                />
                <Button variant="primary" onClick={addRequestor}>
                  Add
                </Button>
              </div>
            </Card>

            <Card className="w-full">
              <p className="font-heading font-bold text-h6 text-ch-main mb-1">Screenshot File Names</p>
              <p className="font-body text-body text-ch-main opacity-60 mb-3">Used when uploading screenshots in Post-Live Amends. Independent from your profile name.</p>
              {[
                ['beforeName', 'Before Screenshot Name', 'Step 2 — Before Screenshot'],
                ['afterName', 'After / Main Screenshot Name', 'Step 5 — After Screenshot'],
                ['screenshotName', 'Backup Screenshot Name', 'Step 6 — Backup Screenshots'],
              ].map(([key, label, hint]) => (
                <div key={key} className="mb-3">
                  <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60 mb-1.5">{label}</p>
                  <Input value={form[key] || ''} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
                  <p className="font-body text-body text-ch-main opacity-50 mt-1">{hint}</p>
                </div>
              ))}
              <Button variant="primary" onClick={() => saveProfile('File names saved')} disabled={saving}>
                {saving ? 'Saving…' : 'Save File Names'}
              </Button>
            </Card>

            <Card className="w-full">
              <p className="font-heading font-bold text-h6 text-ch-main mb-3">Change Password</p>
              <div className="flex flex-col gap-2.5 mb-3">
                <Input type="password" placeholder="Min. 6 characters" value={pwForm.next} onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))} />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && changePassword()}
                />
              </div>
              <Button variant="primary" onClick={changePassword} disabled={saving}>
                {saving ? 'Updating…' : 'Update Password'}
              </Button>
            </Card>

            <SettingCard
              title="Combined Tracker Alert"
              description="Alarm fires after this many minutes of case elapsed time. Default 30 min."
              current={`Currently: ${settings.timerLimit} min`}
              onSave={() => {
                const v = settingsService.saveTimerLimit(timerInput);
                setSettings((s) => ({ ...s, timerLimit: v }));
                showToast('Combined Tracker timer updated');
              }}
            >
              <input
                type="number"
                min="1"
                max="240"
                className="w-24 h-10 text-center font-bold bg-ch-secondary rounded-ch outline-none font-body text-body text-ch-main"
                value={timerInput}
                onChange={(e) => setTimerInput(e.target.value)}
              />
              <span className="font-body text-body text-ch-main opacity-60">minutes</span>
            </SettingCard>

            <SettingCard
              title="QA Checklist Alert"
              description="Alarm fires after this many minutes since QA Checklist was started. Default 10 min."
              current={`Currently: ${settings.qaLimit} min`}
              onSave={() => {
                const v = settingsService.saveQaLimit(qaInput);
                setSettings((s) => ({ ...s, qaLimit: v }));
                showToast('QA Checklist timer updated');
              }}
            >
              <input
                type="number"
                min="1"
                max="240"
                className="w-24 h-10 text-center font-bold bg-ch-secondary rounded-ch outline-none font-body text-body text-ch-main"
                value={qaInput}
                onChange={(e) => setQaInput(e.target.value)}
              />
              <span className="font-body text-body text-ch-main opacity-60">minutes</span>
            </SettingCard>

            <SettingCard
              title="Shift Start Alarm"
              description="Get alerted before your shift starts. Leave blank to disable."
              current={settings.shiftStartTime ? `Active: warns ${settings.shiftStartWarnMins} min before ${settings.shiftStartTime}` : null}
              onSave={() => {
                const t = settingsService.saveShiftStartTime(shiftStartInput);
                const w = settingsService.saveShiftStartWarnMins(shiftStartWarnInput);
                setSettings((s) => ({ ...s, shiftStartTime: t, shiftStartWarnMins: w }));
                showToast('Shift start alarm updated');
              }}
              extra={
                settings.shiftStartTime && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShiftStartInput('');
                      settingsService.saveShiftStartTime('');
                      setSettings((s) => ({ ...s, shiftStartTime: '' }));
                      showToast('Shift start alarm disabled');
                    }}
                  >
                    Disable
                  </Button>
                )
              }
            >
              <input type="time" className="h-10 px-3 bg-ch-secondary rounded-ch outline-none font-body text-body text-ch-main" value={shiftStartInput} onChange={(e) => setShiftStartInput(e.target.value)} />
              <input
                type="number"
                min="1"
                max="60"
                className="w-20 h-10 text-center bg-ch-secondary rounded-ch outline-none font-body text-body text-ch-main"
                value={shiftStartWarnInput}
                onChange={(e) => setShiftStartWarnInput(e.target.value)}
              />
              <span className="font-body text-body text-ch-main opacity-60">min before</span>
            </SettingCard>

            <SettingCard
              title="Shift End Alarm"
              description="Set your shift end time and how many minutes before it to be alerted. Leave blank to disable."
              current={settings.shiftEndTime ? `Active: warns ${settings.shiftWarnMins} min before ${settings.shiftEndTime}` : null}
              onSave={() => {
                const t = settingsService.saveShiftEndTime(shiftEndInput);
                const w = settingsService.saveShiftWarnMins(shiftWarnInput);
                setSettings((s) => ({ ...s, shiftEndTime: t, shiftWarnMins: w }));
                showToast('Shift end alarm updated');
              }}
              extra={
                settings.shiftEndTime && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShiftEndInput('');
                      settingsService.saveShiftEndTime('');
                      setSettings((s) => ({ ...s, shiftEndTime: '' }));
                      showToast('Shift alarm disabled');
                    }}
                  >
                    Disable
                  </Button>
                )
              }
            >
              <input type="time" className="h-10 px-3 bg-ch-secondary rounded-ch outline-none font-body text-body text-ch-main" value={shiftEndInput} onChange={(e) => setShiftEndInput(e.target.value)} />
              <input
                type="number"
                min="1"
                max="60"
                className="w-20 h-10 text-center bg-ch-secondary rounded-ch outline-none font-body text-body text-ch-main"
                value={shiftWarnInput}
                onChange={(e) => setShiftWarnInput(e.target.value)}
              />
              <span className="font-body text-body text-ch-main opacity-60">min before</span>
            </SettingCard>

            <Card className="w-full !border !border-ch-red/30">
              <p className="font-heading font-bold text-h6 text-ch-red mb-2">Danger Zone</p>
              <p className="font-body text-body text-ch-main opacity-60 mb-3">Signing out will end your current session.</p>
              <Button variant="danger" onClick={() => { signOut(); router.push(ROUTES.login); }}>
                Sign Out
              </Button>
            </Card>
          </div>
        </div>
      )}

      <Toast msg={toast.msg} type={toast.type} />
    </AppLayout>
  );
}
