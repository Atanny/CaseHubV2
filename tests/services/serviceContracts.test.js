// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as auth from '@/services/authService'
import * as cases from '@/services/caseService'
import * as drafts from '@/services/draftService'
import * as ann from '@/services/announcementService'
import * as links from '@/services/linkService'
import * as req from '@/services/requestorService'
import * as prof from '@/services/profileService'
import * as sess from '@/services/sessionService'
import * as img from '@/services/imageService'

// Each row: [name, call, expected URL, expected method, expected JSON body (or undefined)]
const B = { a: 1, b: 'x y' }
const E = 'a+b@x.com'
const ee = encodeURIComponent(E)
const contracts = [
  ['signIn', () => auth.signIn(B), '/api/auth/signin', 'POST', B],
  ['signUp', () => auth.signUp(B), '/api/auth/signup', 'POST', B],
  ['requestPasswordReset', () => auth.requestPasswordReset(B), '/api/auth/reset', 'POST', B],
  ['refreshSession', () => auth.refreshSession(B), '/api/auth/refresh', 'POST', B],
  ['changePassword', () => auth.changePassword(B), '/api/auth/password', 'POST', B],
  ['listCases', () => cases.listCases(E), `/api/cases?email=${ee}`, 'GET'],
  ['createCase', () => cases.createCase(B), '/api/cases', 'POST', B],
  ['updateCase', () => cases.updateCase('c9', B), '/api/cases/c9', 'PUT', B],
  ['deleteCase', () => cases.deleteCase('c9'), '/api/cases/c9', 'DELETE'],
  ['listDrafts', () => drafts.listDrafts(E), `/api/drafts?email=${ee}`, 'GET'],
  ['createDraft', () => drafts.createDraft(B), '/api/drafts', 'POST', B],
  ['updateDraft', () => drafts.updateDraft('d1', B), '/api/drafts/d1', 'PUT', B],
  ['deleteDraft', () => drafts.deleteDraft('d1'), '/api/drafts/d1', 'DELETE'],
  ['listArchivedDrafts', () => drafts.listArchivedDrafts(E), `/api/archived-drafts?email=${ee}`, 'GET'],
  ['archiveDraft', () => drafts.archiveDraft(B), '/api/archived-drafts', 'POST', B],
  ['deleteArchivedDraft', () => drafts.deleteArchivedDraft('z'), '/api/archived-drafts/z', 'DELETE'],
  ['listAnnouncements', () => ann.listAnnouncements(), '/api/announcements', 'GET'],
  ['createAnnouncement', () => ann.createAnnouncement(B), '/api/announcements', 'POST', B],
  ['updateAnnouncement', () => ann.updateAnnouncement(4, B), '/api/announcements/4', 'PUT', B],
  ['deleteAnnouncement', () => ann.deleteAnnouncement(4), '/api/announcements/4', 'DELETE'],
  ['listLinks', () => links.listLinks(E), `/api/links?email=${ee}`, 'GET'],
  ['createLink', () => links.createLink(B), '/api/links', 'POST', B],
  ['updateLink', () => links.updateLink(2, B), '/api/links/2', 'PUT', B],
  ['deleteLink', () => links.deleteLink(2), '/api/links/2', 'DELETE'],
  ['listRequestors', () => req.listRequestors(), '/api/requestors', 'GET'],
  ['createRequestor', () => req.createRequestor({ name: 'A B' }), '/api/requestors', 'POST', { name: 'A B' }],
  ['deleteRequestor', () => req.deleteRequestor('A B/C'), `/api/requestors/${encodeURIComponent('A B/C')}`, 'DELETE'],
  ['getProfile', () => prof.getProfile(E), `/api/profile?email=${ee}`, 'GET'],
  ['saveProfile', () => prof.saveProfile(B), '/api/profile', 'POST', B],
  ['postSessionAction', () => sess.postSessionAction(B), '/api/sessions', 'POST', B],
  ['getSessionLog', () => sess.getSessionLog('s1'), '/api/sessions?action=get_log&session_id=s1', 'GET'],
  ['deleteSession', () => sess.deleteSession('s1'), '/api/sessions?id=s1', 'DELETE'],
  ['listSessions', () => sess.listSessions('?x=1'), '/api/sessions?x=1', 'GET'],
  ['uploadImageData', () => img.uploadImageData(B), '/api/images/upload', 'POST', B],
]

let calls
beforeEach(() => {
  calls = []
  localStorage.clear()
  globalThis.fetch = vi.fn(async (url, init) => { calls.push([String(url), init || {}]); return { ok: true, status: 200, json: async () => ({}) } })
})

describe('service functions send the documented requests', () => {
  it.each(contracts)('%s', async (_name, call, url, method, body) => {
    await call()
    const [gotUrl, init] = calls[0]
    expect(gotUrl).toBe(url)
    expect(init.method || 'GET').toBe(method)
    if (body === undefined) expect(init.body).toBeUndefined()
    else {
      expect(init.body).toBe(JSON.stringify(body))
      expect(init.headers['Content-Type']).toBe('application/json')
    }
  })
})
