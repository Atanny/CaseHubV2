import Pill from '../ui/Pill';
import Button from '../ui/Button';
import Divider from '../ui/Divider';
import { BADGE_OPTIONS } from './badgeHelpers';

/**
 * Left-column "Create post" / "Edit Post" panel. Fields map 1:1 to the real
 * data model (title, body, badge) — the Figma mockup shows rich-text
 * formatting and image attachments that have no backing field, so those are
 * intentionally left out rather than faked. See README for the same call
 * made in the legacy app.
 */
export default function ComposerCard({ form, setForm, isEditing, onSubmit, onCancel, saving }) {
  return (
    <div className="flex flex-col gap-3 items-start bg-white rounded-ch shadow-ch p-5 w-full max-w-[360px]">
      <p className="font-heading font-bold text-h6 text-ch-main">{isEditing ? 'Edit Post' : 'Create post'}</p>
      <Divider tone="secondary" />

      <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Title</p>
      <input
        className="w-full h-[45px] px-4 bg-ch-secondary rounded-ch-lg outline-none font-body text-body text-ch-main placeholder:opacity-50"
        placeholder="Title here"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
      />

      <p className="text-[10px] font-label font-bold uppercase text-ch-main opacity-60">Type</p>
      <div className="flex flex-wrap gap-2">
        {BADGE_OPTIONS.map(([v, l]) => (
          <Pill key={v} active={form.badge === v} onClick={() => setForm((f) => ({ ...f, badge: v }))}>
            {l}
          </Pill>
        ))}
      </div>

      <textarea
        className="w-full min-h-[140px] p-4 bg-ch-secondary rounded-ch-lg outline-none resize-y font-body text-body text-ch-main placeholder:opacity-50"
        placeholder="Insert Message Here"
        value={form.body}
        onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
      />

      <Divider tone="secondary" />
      <div className="flex gap-2.5 w-full">
        <Button variant="outline" className="flex-1 !border-ch-red !text-ch-red" onClick={onCancel} disabled={saving}>
          {isEditing ? 'Cancel' : 'Remove Fill'}
        </Button>
        <Button variant="primary" className="flex-1" onClick={onSubmit} disabled={saving}>
          {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Post'}
        </Button>
      </div>
    </div>
  );
}
