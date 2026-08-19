import Divider from '../ui/Divider';
import Button from '../ui/Button';
import { badgeColor, badgeLabel, initialsOf } from './badgeHelpers';

/** Single feed card: avatar + author + badge chip (+ edit/delete for the author), title, body, date. */
export default function AnnouncementCard({ announcement, isAuthor, onEdit, onDelete }) {
  const a = announcement;
  return (
    <div className="flex flex-col gap-3 items-start bg-white rounded-ch shadow-ch p-5 w-full">
      <div className="flex items-center gap-2.5 w-full">
        <div className="flex items-center justify-center w-[41px] h-[41px] rounded-full bg-ch-secondary text-ch-main font-body font-bold text-sm shrink-0">
          {initialsOf(a.author)}
        </div>
        <p className="font-heading font-bold text-h6 text-ch-main flex-1 min-w-0 truncate">{a.author}</p>
        <span
          className="px-2.5 py-1 rounded-full text-white text-badge font-label font-bold uppercase whitespace-nowrap"
          style={{ background: badgeColor(a.badge) }}
        >
          {badgeLabel(a.badge)}
        </span>
        {isAuthor && (
          <>
            <Button variant="outline" size="sm" onClick={() => onEdit(a)}>
              Edit
            </Button>
            <Button variant="outline" size="sm" className="!border-ch-red !text-ch-red" onClick={() => onDelete(a.id)}>
              Delete
            </Button>
          </>
        )}
      </div>
      <Divider tone="secondary" />
      <p className="font-heading font-bold text-h6 text-ch-main">{a.title}</p>
      {a.body && <p className="font-body text-body text-ch-main whitespace-pre-wrap">{a.body}</p>}
      <p className="font-body text-body text-ch-main opacity-60">
        {a.createdAt} — {badgeLabel(a.badge)}
      </p>
    </div>
  );
}
