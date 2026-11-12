// Translates between the DB row shape (snake_case) and the client case shape.

export function caseToDb(c) {
  return {
    user_email: c.userEmail || c.user_email || null,
    mode: c._mode || c.mode || null,
    case_num: c.caseNum || null,
    account_num: c.accountNum || null,
    amend_type: c.amendType || null,
    inbound_num: c.inboundNum || null,
    in_progress: c.inProgress || false,
    entries: (c.entries || []).map(({ _file, ...rest }) => rest),
    devices: c.devices || {},
    checklist: c.checklist || {},
    email_address: c.emailAddress || null,
    email_type: c.emailType || 'clarification',
    ended_at: c.endedAt || null,
    tracker_checklist_link: c.trackerChecklistLink || null,
    bundled_with: c._bundledWith
      ? (Array.isArray(c._bundledWith) ? c._bundledWith : [c._bundledWith]).filter(Boolean)
      : null,
    image_urls: [
      ...(c.images || []).map(i => ({ url: i.url, name: i.name, path: i.path || null, type: 'main' })),
      ...(c.backupImages || []).map(i => ({ url: i.url, name: i.name, path: i.path || null, type: 'backup' })),
    ],
  }
}

export function dbToCase(row) {
  const imgs = (row.image_urls || [])
  return {
    _id: row.id, _mode: row.mode, userEmail: row.user_email,
    caseNum: row.case_num, accountNum: row.account_num,
    amendType: row.amend_type, inboundNum: row.inbound_num,
    inProgress: row.in_progress,
    entries: Array.isArray(row.entries) ? row.entries : (row.entries ? Object.values(row.entries) : []),
    devices: row.devices || {}, checklist: row.checklist || {},
    emailAddress: row.email_address, emailType: row.email_type,
    trackerChecklistLink: row.tracker_checklist_link || '',
    _bundledWith: row.bundled_with
      ? (Array.isArray(row.bundled_with) ? row.bundled_with : [row.bundled_with]).filter(Boolean)
      : null,
    images: imgs.filter(i => i.type === 'main').map(i => ({ ...i, id: i.path || i.url })),
    backupImages: imgs.filter(i => i.type === 'backup').map(i => ({ ...i, id: i.path || i.url })),
    savedAt: row.saved_at ? new Date(row.saved_at).toLocaleString() : new Date().toLocaleString(),
    endedAt: row.ended_at || null,
  }
}