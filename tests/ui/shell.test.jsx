// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PageHeader } from '@/components/layout/PageHeader'
import { Sidebar } from '@/components/navigation/Sidebar'
import { NAV_ITEMS } from '@/config/routes'
import { ShellContext } from '@/core/ShellContext'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container, root
const render = async (el) => {
  container = document.createElement('div'); document.body.appendChild(container)
  await act(async () => { root = createRoot(container); root.render(el) })
}
afterEach(async () => { await act(async () => root?.unmount()); container?.remove() })

const shellValue = (over = {}) => ({
  breakTimer: null, timedIn: true, formInFields: false, openHourActive: false,
  requestBreak: vi.fn(), requestCancelBreak: vi.fn(), requestOpenHour: vi.fn(), requestCancelOpenHour: vi.fn(), logout: vi.fn(),
  ...over,
})
const header = (v) => createElement(ShellContext.Provider, { value: v }, createElement(PageHeader, { title: 'Case History', subtitle: 'Where' }))
const pills = () => [...container.querySelectorAll('.ph-pill')]
const click = async (el) => act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })) })

describe('PageHeader', () => {
  it('shows the title, subtitle, three breaks, meeting and Log Out', async () => {
    await render(header(shellValue()))
    expect(container.querySelector('.ph-title').textContent).toBe('Case History')
    expect(container.querySelector('.ph-sub').textContent).toBe('Where')
    expect(pills().map((p) => p.textContent.trim())).toEqual(['15 MIN', '30 MIN', '1 HOUR', 'MEETING'])
    expect(container.querySelector('.ph-logout').textContent).toContain('Log Out')
  })

  it('asks the app to start a break with the original labels', async () => {
    const v = shellValue(); await render(header(v))
    await click(pills()[0]); await click(pills()[1]); await click(pills()[2])
    expect(v.requestBreak.mock.calls).toEqual([['15 min', 15], ['30 min', 30], ['Lunch', 60]])
  })

  it('highlights the active break, lets it be ended, and disables the others', async () => {
    const v = shellValue({ breakTimer: { mins: 30, label: '30 min' } }); await render(header(v))
    const [b15, b30, b60, meeting] = pills()
    expect(b30.classList.contains('active')).toBe(true)
    expect(b15.disabled && b60.disabled && meeting.disabled).toBe(true)
    await click(b30)
    expect(v.requestCancelBreak).toHaveBeenCalledTimes(1)
  })

  it('locks break buttons while a form is being filled', async () => {
    await render(header(shellValue({ formInFields: true })))
    expect(pills().slice(0, 3).every((p) => p.disabled)).toBe(true)
  })

  it('only allows a meeting when clocked in, and ends it when active', async () => {
    await render(header(shellValue({ timedIn: false })))
    expect(pills()[3].disabled).toBe(true)
    await act(async () => root.unmount()); container.remove()
    const v = shellValue({ openHourActive: true }); await render(header(v))
    expect(pills()[3].disabled).toBe(false)
    await click(pills()[3])
    expect(v.requestCancelOpenHour).toHaveBeenCalledTimes(1)
  })

  it('logs out', async () => {
    const v = shellValue(); await render(header(v))
    await click(container.querySelector('.ph-logout'))
    expect(v.logout).toHaveBeenCalledTimes(1)
  })
})

describe('Sidebar rail', () => {
  const props = (over = {}) => ({
    allCases: [1, 2], announcements: [1], archivedDrafts: [], coreNav: NAV_ITEMS, dbStatus: { status: 'connected', latency: 12, recheck: vi.fn() },
    formActive: false, handleNav: vi.fn(), links: [], logout: vi.fn(), page: 'history', setLinks: vi.fn(), sidebarDragRef: { current: null }, ...over,
  })

  it('renders every visible screen as an accessible icon button and marks the current one', async () => {
    await render(createElement(Sidebar, props()))
    const labels = [...container.querySelectorAll('.rail-nav button')].map((b) => b.getAttribute('aria-label'))
    expect(labels).toEqual(NAV_ITEMS.filter((n) => n.id).map((n) => n.label))
    expect(container.querySelector('[aria-current="page"]').getAttribute('aria-label')).toBe('Case History')
  })

  it('navigates and shows counts for history and announcements only when non-zero', async () => {
    const p = props(); await render(createElement(Sidebar, p))
    const badges = [...container.querySelectorAll('.rail-badge')].map((b) => b.textContent)
    expect(badges).toEqual(['2', '1'])
    await click(container.querySelector('[aria-label="Quick Links"]'))
    expect(p.handleNav).toHaveBeenCalledWith('links')
  })

  it('flags an in-progress form on the post-live item when elsewhere', async () => {
    await render(createElement(Sidebar, props({ formActive: true, page: 'dashboard' })))
    expect(container.querySelector('[aria-label="Post-Live Amends"] .rail-dot')).not.toBeNull()
  })

  it('does not expose Build / Pre-Live in the nav but keeps them as valid pages', async () => {
    const { isValidPage } = await import('@/config/routes')
    await render(createElement(Sidebar, props()))
    expect(container.textContent).not.toMatch(/Build|Pre-Live/)
    expect(isValidPage('build') && isValidPage('prelive')).toBe(true)
  })

  it('signs out from the rail', async () => {
    const p = props(); await render(createElement(Sidebar, p))
    await click(container.querySelector('.rail-logout'))
    expect(p.logout).toHaveBeenCalledTimes(1)
  })
})
