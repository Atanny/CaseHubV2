import { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'
import Head from 'next/head'
import dynamic from 'next/dynamic'


// ─────────────────────────────────────────────────────────────────────────────
// FONTS & CSS
// ─────────────────────────────────────────────────────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Moderustic:wght@500;700&family=Prompt:wght@600;700&display=swap');`;

const CSS = `
${FONTS}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
@keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(1.4);}}

/* ══════════════════════ CASEHUB FIGMA THEME ══════════════════════
   Retheme to the Figma "CASEHUB" design tokens. The whole app is built on
   these CSS variables, so this single block re-skins every page (sidebar,
   cards, buttons, badges) without touching any page's JSX/logic.
   Dark-mode toggle is kept wired (body.light class still works) but both
   states now use the Figma palette — the design is a single light theme,
   so "dark mode" maps to the same tokens rather than a separate look.
   Figma tokens: Main #40513B, Background #E8DFCA, Secondary/Tertiary #F5EFE6,
   Card/White #FFFFFF, Border #E8DFCA, Small Shadow 2px 5px 10px rgba(64,81,59,.1),
   Site Comment #4760FF, Inbound #8A38F5, Pending/Amber #EDC00B, Green #58A767,
   Red #C54446. */
:root{
  --bg:#e8dfca;--surface:#f5efe6;--card:#ffffff;--card2:#f5efe6;--border:#e8dfca;
  --accent:#40513b;--accent2:#40513b;--green:#58a767;--red:#c54446;--amber:#edc00b;
  --text:#40513b;--muted:rgba(64,81,59,.6);--radius:10px;
  --inp-bg:#ffffff;--entry-bg:#f5efe6;--sum-bg:#f5efe6;--code-bg:#f5efe6;
  --shadow:2px 5px 10px rgba(64,81,59,.15);--shadow-sm:2px 5px 10px rgba(64,81,59,.1);
  --site-comment:#4760ff;--inbound:#8a38f5;
  --btn-cancel-bg:#fff1f1;--btn-cancel-border:#c54446;--btn-cancel-text:#c54446;
  --btn-draft-bg:#fdf8e7;--btn-draft-border:#edc00b;--btn-draft-text:#7a6300;
  --btn-save-bg:#40513b;
  --btn-ghost-bg:#ffffff;--btn-ghost-border:#e8dfca;--btn-ghost-text:#40513b;
  --nav-active-bg:#ffffff;
  --nav-active-border:#40513b;
  --h-badge-site-bg:#4760ff;--h-badge-email-bg:#8a38f5;
  --quick-hover:rgba(64,81,59,.06);--choice-hover:rgba(64,81,59,.06);
  --entry-accent-bg:rgba(71,96,255,.1);
  --glass-bg:#ffffff;--glass-border:#e8dfca;--glass-blur:none;
  --glass-shadow:2px 5px 10px rgba(64,81,59,.1);
}
/* "Light mode" toggle kept functional but mapped to the same Figma palette —
   the Figma design is one theme, not a dark/light pair. */
body.light,:root.light{
  --bg:#e8dfca;--surface:#f5efe6;--card:#ffffff;--card2:#f5efe6;--border:#e8dfca;
  --text:#40513b !important;--muted:rgba(64,81,59,.6) !important;
  --inp-bg:#ffffff;--entry-bg:#f5efe6;--sum-bg:#f5efe6;--code-bg:#f5efe6;
  --shadow:2px 5px 10px rgba(64,81,59,.15);--shadow-sm:2px 5px 10px rgba(64,81,59,.1);
  --btn-cancel-bg:#fff1f1;--btn-cancel-border:#c54446;--btn-cancel-text:#c54446;
  --btn-draft-bg:#fdf8e7;--btn-draft-border:#edc00b;--btn-draft-text:#7a6300;
  --btn-save-bg:#40513b;
  --btn-ghost-bg:#ffffff;--btn-ghost-border:#e8dfca;--btn-ghost-text:#40513b;
  --nav-active-bg:#ffffff;
  --nav-active-border:#40513b;
  --h-badge-site-bg:#4760ff;--h-badge-email-bg:#8a38f5;
  --quick-hover:rgba(64,81,59,.06);--choice-hover:rgba(64,81,59,.06);
  --entry-accent-bg:rgba(71,96,255,.1);
  --glass-bg:#ffffff;--glass-border:#e8dfca;--glass-blur:none;
  --glass-shadow:2px 5px 10px rgba(64,81,59,.1);
}

body{
  font-family:'Poppins',sans-serif;
  background:var(--bg);color:var(--text);
  min-height:100vh;transition:background .3s,color .3s;
  -webkit-font-smoothing:antialiased;
}
body.light{background:#e8dfca !important;}
h1,h2,h3,h4,.logo,.page-title,.step-title,.section-title,.stat-val,.choice-btn-title,.quick-title,.analytics-title,.modal h3,.case-num-badge,.entry-label,.auth-title,.soon-title,.ann-title,.case-entry-num{
  font-family:'Moderustic',sans-serif;font-weight:700;text-transform:uppercase;
}
/* Figma "label" style — small bold uppercase caption text (field labels, nav groups, badges) */
.nav-group,.act-badge,.filter-btn,.badge,.field-label,.entry-num-badge{
  font-family:'Prompt',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.2px;
}
button{cursor:pointer;font-family:'Poppins',sans-serif;}
input,textarea,select{font-family:'Poppins',sans-serif;}
a{color:var(--accent);text-decoration:none;}

/* ── Fancy scrollbars ── */
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:rgba(245,148,92,.25);border-radius:99px;}
::-webkit-scrollbar-thumb:hover{background:rgba(245,148,92,.5);}
body.light ::-webkit-scrollbar-thumb{background:rgba(212,114,74,.2);}
body.light ::-webkit-scrollbar-thumb:hover{background:rgba(212,114,74,.45);}
*{scrollbar-width:thin;scrollbar-color:rgba(245,148,92,.25) transparent;}
body.light *{scrollbar-color:rgba(212,114,74,.2) transparent;}
/* ── Shell ── */
.shell{display:flex;min-height:100vh;}
.sidebar{
  width:240px;
  background:var(--glass-bg);
  border-right:1px solid var(--glass-border);
  display:flex;
  flex-direction:column;
  padding:20px 14px;
  gap:2px;
  position:sticky;
  top:0;
  height:100vh;
  flex-shrink:0;
  overflow-y:auto;
  overflow-x:hidden;
  backdrop-filter:var(--glass-blur);
  -webkit-backdrop-filter:var(--glass-blur);
  box-shadow:var(--glass-shadow);
  transition:width .25s cubic-bezier(.4,0,.2,1),
              padding .25s cubic-bezier(.4,0,.2,1);
}

/* ── Sidebar collapsed ── */
.sidebar.collapsed{
  width:64px;
  padding:20px 6px;
  overflow-x:hidden;
  overflow-y:hidden;
}

/* ── SAFE COLLAPSE STATE (DO NOT USE DISPLAY NONE FOR CORE STRUCTURE) ── */
.sidebar.collapsed .logo-text,
.sidebar.collapsed .nav-group,
.sidebar.collapsed .profile-name,
.sidebar.collapsed .profile-role,
.sidebar.collapsed .theme-toggle .toggle-label,
.sidebar.collapsed .toggle-track,
.sidebar.collapsed .db-status,
.sidebar.collapsed .break-btns,
.sidebar.collapsed .sidebar-divider,
.sidebar.collapsed .nav-custom-link,
.sidebar.collapsed .sidebar-shift-timer{
  opacity:0;
  pointer-events:none;
  max-width:0;
  overflow:hidden;
  white-space:nowrap;
  transform:translateX(-4px);
  transition:opacity .2s ease, max-width .25s ease, transform .2s ease;
}

/* ── expanded state ── */
.sidebar .logo-text,
.sidebar .nav-group,
.sidebar .nav-label,
.sidebar .profile-name,
.sidebar .profile-role,
.sidebar .theme-toggle .toggle-label,
.sidebar .toggle-track,
.sidebar .db-status,
.sidebar .break-btns,
.sidebar .sidebar-divider,
.sidebar .nav-custom-link,
.sidebar .sidebar-shift-timer{
  opacity:1;
  max-width:200px;
  transition:opacity .2s ease,
              max-width .25s cubic-bezier(.4,0,.2,1);
}

/* ── FIX: NAV ITEM CENTERING ── */
.sidebar.collapsed .nav-item{
  justify-content:flex-start;
  align-items:center;
  gap:0;
  padding:10px 0 10px 16px;
}

/* ensure icon is truly centered when collapsed — fixed size so badge doesn't shift layout */
.sidebar.collapsed .nav-icon-wrap{
  width:20px;
  height:20px;
  display:inline-flex;
  justify-content:center;
  align-items:center;
  position:relative;
  flex-shrink:0;
  padding:0;
  margin:0;
  overflow:visible;
}

/* hide elements that affect spacing */
.sidebar.collapsed .nav-badge,
.sidebar.collapsed .nav-inprogress,
.sidebar.collapsed .nav-text{
  display:none !important;
}

/* ── extra safety (prevents offset issues) ── */
.nav-item{
  display:flex;
  align-items:center;
  gap:10px;
  padding:10px 12px;
  border-radius:30px;
  font-size:13px;
  font-weight:500;
  color:var(--muted);
  border:none;
  background:none;
  width:100%;
  text-align:left;
  transition:.18s;
  position:relative;
  font-family:'Poppins',sans-serif;
}

.nav-item:hover{
  background:var(--card2);
  color:var(--text);
}

.nav-item.active{
  background: var(--nav-active-bg);
  color: var(--muted);
  border: 1px solid var(--nav-active-border);
  font-weight: 600;
  opacity: 0.7;
  pointer-events: none;
}
.nav-item:hover{border-radius:6px;}

/* Sidebar divider */
.sidebar-divider{height:1px;background:rgba(255,255,255,.06);margin:8px 10px;border:none;}
body.light .sidebar-divider{background:rgba(180,90,40,.1);}

/* ── icons wrapper — fixed size so badge never shifts layout ── */
.nav-icon-wrap{
  position:relative;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  flex-shrink:0;
  width:20px;
  height:20px;
  overflow:visible;
}

/* ── badges ── */
.nav-badge{
  margin-left:auto;
  background:var(--accent);
  color:#fff;
  border-radius:30px;
  font-size:10px;
  font-weight:700;
  padding:1px 7px;
  line-height:1.6;
}

/* ── nav section group labels ── */
.nav-group{
  font-size:8px;font-weight:700;color:var(--muted);
  text-transform:uppercase;letter-spacing:1.2px;
  padding:10px 12px 3px;
  font-family:'Poppins',sans-serif;
  opacity:.55;
}

/* keep your existing styles below untouched */

.nav-icon-wrap{
  position:relative;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  flex-shrink:0;
  width:20px;
  height:20px;
  overflow:visible;
}

.nav-badge-dot{
  position:absolute;
  top:0;
  right:0;
  transform:translate(50%,-50%);
  min-width:16px;
  height:16px;
  border-radius:8px;
  background:var(--accent);
  color:#fff;
  font-size:9px;
  font-weight:700;
  line-height:16px;
  text-align:center;
  padding:0 4px;
  pointer-events:none;
  display:flex;
  align-items:center;
  justify-content:center;
  box-shadow:0 0 0 2px var(--bg);
  z-index:2;
}

.nav-active-dot{
  position:absolute;
  top:-4px;
  right:-4px;
  width:8px;
  height:8px;
  border-radius:50%;
  background:var(--accent);
  display:none;
  animation:pulse-dot 1.4s ease-in-out infinite;
  box-shadow:0 0 0 2px var(--bg);
  z-index:2;
}

.sidebar.collapsed .nav-active-dot{
  display:block;
}

.sidebar.collapsed .profile-text{
  display:none;
}

/* ── ✅ FIX: NAV TEXT CLIPPING (NEW ADDITION) ── */
.nav-text{
  display:inline-block;
  white-space:nowrap;
  overflow:hidden;

  max-width:200px;
  opacity:1;
  transform:translateX(0);

  transition:
    max-width .25s cubic-bezier(.4,0,.2,1),
    opacity .2s ease,
    transform .25s ease;
}

/* ── SAFE TEXT COLLAPSE (DO NOT BREAK LAYOUT) ── */
.sidebar.collapsed .nav-text{
  max-width:0;
  opacity:0;
  overflow:hidden;
  white-space:nowrap;
  transform:translateX(-6px);
  pointer-events:none;
  transition:all .25s ease;
}
.nav-text{
  will-change:opacity, transform;
}
.toc-card-header{
  padding:10px 12px 8px;border-bottom:1px solid var(--border);
  font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;
  color:var(--muted);font-family:'Poppins',sans-serif;
  display:flex;align-items:center;gap:6px;
}
.toc-item{
  display:flex;align-items:center;justify-content:flex-start;width:100%;text-align:left;background:none;border:none;
  padding:7px 10px;font-size:11px;color:var(--muted);cursor:pointer;
  font-family:'Poppins',sans-serif;transition:.12s;line-height:1.4;border-left:2px solid transparent;
  gap:6px;
}
.toc-item:hover{color:var(--text);background:var(--card2);}
.toc-item.active{color:var(--accent);font-weight:700;border-left-color:var(--accent);background:var(--entry-accent-bg);}
.toc-item.done{background:rgba(16,185,129,.10);color:var(--green);border-left-color:var(--green);}
.toc-item.done.active{background:rgba(16,185,129,.18);border-left-color:var(--green);color:var(--green);}
.toc-item .toc-check{margin-left:auto;font-size:10px;opacity:.8;}
.toc-card{display:flex;flex-direction:column;}
.toc-requestors{padding:10px 12px;border-top:1px solid var(--border);margin-top:auto;}
.toc-req-title{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);margin-bottom:6px;font-family:'Poppins',sans-serif;}
.toc-req-chip{display:flex;align-items:center;gap:5px;margin-bottom:4px;font-size:11px;font-weight:600;color:var(--accent);}
.toc-req-avatar{width:18px;height:18px;border-radius:50%;background:var(--btn-save-bg);display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:8px;font-weight:700;flex-shrink:0;}
.toc-num{font-size:9px;opacity:.5;font-variant-numeric:tabular-nums;flex-shrink:0;width:12px;text-align:center;}
.toc-label{flex:0 1 auto;text-align:center;}
.form-progress-pill{
  position:fixed;bottom:24px;right:24px;z-index:900;
  display:flex;align-items:center;justify-content:flex-start;gap:10px;
  padding:11px 16px;
  background:var(--accent);color:#fff;
  cursor:pointer;transition:.2s;
  box-shadow:0 4px 24px rgba(245,148,92,.45);
  font-family:'Poppins',sans-serif;
}
.form-progress-pill:hover{background:var(--accent2);transform:translateY(-2px);box-shadow:0 8px 32px rgba(245,148,92,.5);}
.form-progress-pill-dot{width:8px;height:8px;border-radius:50%;background:#fff;animation:pulse-dot 1.4s ease-in-out infinite;}
.nav-inprogress{
  margin-left:auto;display:flex;align-items:center;gap:4px;
  font-size:9px;font-weight:700;color:var(--accent);
  font-family:'Poppins',sans-serif;letter-spacing:.3px;
  animation:pulse-dot 1.4s ease-in-out infinite;
}
.nav-custom-link{
  display:flex;align-items:center;gap:10px;
  padding:9px 12px;border-radius:30px;
  font-size:12px;font-weight:500;color:var(--muted);
  transition:.18s;text-decoration:none;
}
.nav-custom-link:hover{background:var(--card2);color:var(--accent);}
.main-area{flex:1;overflow-y:auto;padding:32px;height:100vh;}

/* ── Form Mode: main-area fills exactly, no outer scroll ── */
.main-area.form-mode{overflow:hidden;padding:0;display:flex;flex-direction:column;}
.main-area.form-mode > div{flex:1;overflow:hidden;display:flex;flex-direction:column;min-height:0;padding-bottom:68px;}
.main-area.form-mode .form-cols{flex:1;min-height:0;overflow:hidden;}
.main-area.form-mode .page-header{margin-bottom:0;background:var(--glass-bg);backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);flex-shrink:0;}
/* Live Summary and Steps col: flush, square, same glass bg */
.main-area.form-mode .right-panel{border-radius:0;border:none;box-shadow:none;background:var(--glass-bg);backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);}
.main-area.form-mode .right-panel-header{border-radius:0;background:rgba(255,255,255,.03);}
.main-area.form-mode .toc-card{border-radius:0;border:none;border-right:1px solid var(--glass-border);background:var(--glass-bg);backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);}

/* Theme toggle */
.theme-toggle{
  display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:30px;
  font-size:13px;font-weight:500;color:var(--muted);
  border:1px solid var(--border);background:var(--card2);
  width:100%;text-align:left;transition:.18s;margin-top:auto;margin-bottom:6px;
  font-family:'Poppins',sans-serif;
}
.theme-toggle:hover{color:var(--text);border-color:var(--accent);}
.toggle-track{width:36px;height:20px;border-radius:10px;background:var(--border);position:relative;transition:.25s;flex-shrink:0;}
.toggle-track.on{background:var(--btn-save-bg);}
.toggle-thumb{width:14px;height:14px;border-radius:50%;background:#fff;position:absolute;top:3px;left:3px;transition:.25s;box-shadow:0 1px 4px rgba(0,0,0,.3);}
.toggle-track.on .toggle-thumb{left:19px;}

/* Profile mini */
.sidebar-profile{
  display:flex;align-items:center;gap:10px;padding:10px 12px;
  border-radius:30px;border:1px solid var(--border);background:var(--card2);
  cursor:pointer;transition:.18s;margin-bottom:4px;
}
.sidebar-profile:hover{border-color:var(--accent);}
.profile-avatar{
  width:32px;height:32px;border-radius:50%;
  background:var(--btn-save-bg);
  display:flex;align-items:center;justify-content:center;
  font-size:14px;font-weight:700;color:#fff;flex-shrink:0;
}
.profile-name{font-size:12px;font-weight:600;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.profile-role{font-size:10px;color:var(--muted);}

/* Page header */
.page-header{margin-bottom:28px;}
.main-area.form-mode .page-header{display:flex;flex-direction:row;align-items:center;gap:0;justify-content:space-between;flex-wrap:wrap;}
.main-area.form-mode .page-header>div:first-child{flex:1;min-width:0;}
.page-title{font-size:26px;font-weight:800;letter-spacing:-.4px;}
.page-sub{color:var(--muted);font-size:13px;margin-top:5px;font-family:'Poppins',sans-serif;}
.back-btn{
  background:var(--card2);border:1px solid var(--border);color:var(--muted);
  font-size:13px;padding:7px 14px;border-radius:30px;cursor:pointer;
  display:inline-flex;align-items:center;gap:6px;transition:.15s;font-weight:500;
  margin-bottom:10px;
}
.back-btn:hover{color:var(--text);border-color:var(--accent);}

/* Buttons */
.btn{
  padding:10px 20px;border-radius:30px;font-size:13px;font-weight:600;
  border:none;transition:.2s;display:inline-flex;align-items:center;gap:7px;
  letter-spacing:.1px;font-family:'Poppins',sans-serif;
}
.btn:active{transform:scale(.96);}
.btn-ghost{background:var(--btn-ghost-bg);border:1.5px solid var(--btn-ghost-border);color:var(--btn-ghost-text);}
.btn-ghost:hover{border-color:var(--accent);color:var(--accent);background:var(--entry-accent-bg);}
.btn-cancel{background:var(--btn-cancel-bg);border:1.5px solid var(--btn-cancel-border);color:var(--btn-cancel-text);}
.btn-cancel:hover{filter:brightness(1.15);box-shadow:0 2px 12px rgba(244,63,94,.3);}
.btn-draft{background:var(--btn-draft-bg);border:1.5px solid var(--btn-draft-border);color:var(--btn-draft-text);}
.btn-draft:hover{filter:brightness(1.12);box-shadow:0 2px 12px rgba(245,158,11,.3);}
.btn-save{background:var(--btn-save-bg);color:#fff;border:none;box-shadow:0 2px 12px rgba(245,148,92,.3),inset 0 1px 0 rgba(255,255,255,.15);}
.btn-save:hover{filter:brightness(1.08);box-shadow:0 4px 18px rgba(245,148,92,.45),inset 0 1px 0 rgba(255,255,255,.2);}
.btn-danger{background:var(--btn-cancel-bg);border:1.5px solid var(--btn-cancel-border);color:var(--btn-cancel-text);}
.btn-danger:hover{filter:brightness(1.15);box-shadow:0 2px 12px rgba(244,63,94,.3);}
.btn-primary{background:var(--btn-save-bg);color:#fff;border:none;box-shadow:0 2px 12px rgba(245,148,92,.3),inset 0 1px 0 rgba(255,255,255,.15);}
.btn-primary:hover{filter:brightness(1.08);box-shadow:0 4px 18px rgba(245,148,92,.45),inset 0 1px 0 rgba(255,255,255,.2);}
.btn-amber{background:var(--btn-draft-bg);border:1.5px solid var(--btn-draft-border);color:var(--btn-draft-text);}
.btn-amber:hover{filter:brightness(1.12);}
.btn-green{background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;box-shadow:0 3px 12px rgba(16,185,129,.35);}
.btn-green:hover{filter:brightness(1.1);}
.spacer{flex:1;}
.action-bar{
  display:grid;grid-template-columns:1fr auto 1fr;
  align-items:center;gap:12px;
  margin-top:24px;padding:12px 20px;
  border-top:1px solid var(--glass-border);
  background:var(--glass-bg);
  backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);
  box-shadow:0 -8px 32px rgba(0,0,0,.22);
  position:fixed;left:240px;right:0;bottom:0;z-index:950;
}
.action-group{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.action-group-left{justify-self:start;}
.action-group-center{justify-self:center;justify-content:center;}
.action-group-right{justify-self:end;justify-content:flex-end;}
.shell.sidebar-collapsed .action-bar{left:64px;}
body.light .action-bar{background:rgba(255,248,243,.92);}
@media (max-width:1100px){
  .action-bar{left:0 !important;grid-template-columns:1fr;justify-items:center;padding:12px 16px;}
  .action-group-left,.action-group-center,.action-group-right{justify-self:center;justify-content:center;}
}

/* Stat cards */
.stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;margin-bottom:28px;}
#fngen-dropdown.open{display:block!important;}
.stat-card{
  background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius);
  padding:20px;position:relative;overflow:hidden;transition:.2s;cursor:default;
  backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);
}
.stat-card:hover{transform:translateY(-2px);box-shadow:var(--glass-shadow);border-color:rgba(245,148,92,.35);}
.stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;}
.stat-card.blue::before{background:linear-gradient(90deg,var(--accent),var(--accent2));}
.stat-card.green::before{background:linear-gradient(90deg,var(--green),#059669);}
.stat-card.amber::before{background:linear-gradient(90deg,var(--amber),#d97706);}
.stat-card.purple::before{background:linear-gradient(90deg,var(--accent2),var(--accent));}
.stat-card.red::before{background:linear-gradient(90deg,var(--red),#e11d48);}
.stat-label{font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;}
.stat-val{font-size:30px;font-weight:800;line-height:1;}
.stat-sub{font-size:11px;color:var(--muted);margin-top:6px;}
.stat-icon{position:absolute;top:16px;right:16px;font-size:20px;opacity:.3;}
.stat-card.blue .stat-val{color:var(--accent);}
.stat-card.green .stat-val{color:var(--green);}
.stat-card.amber .stat-val{color:var(--amber);}
.stat-card.purple .stat-val{color:var(--accent2);}
.stat-card.red .stat-val{color:var(--red);}

/* Section title */
.section-title{font-size:15px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px;letter-spacing:-.2px;}

/* Activity rows */
.activity-row{
  display:flex;align-items:center;gap:12px;padding:13px 16px;
  background:var(--card);border:1px solid var(--border);border-radius:30px;
  margin-bottom:8px;transition:.15s;
}
.activity-row:hover{border-color:rgba(245,148,92,.3);transform:translateX(2px);}
.act-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.act-dot.green{background:var(--green);}
.act-dot.blue{background:var(--accent);}
.act-dot.purple{background:var(--accent2);}
.act-info{flex:1;min-width:0;}
.act-title{font-size:13px;font-weight:600;}
.act-sub{font-size:11px;color:var(--muted);margin-top:2px;}
.act-badge{font-size:11px;font-weight:600;padding:3px 10px;border-radius:30px;}
.act-badge.site{background:var(--h-badge-site-bg);color:var(--accent);}
.act-badge.email{background:var(--h-badge-email-bg);color:var(--accent2);}

/* Quick cards */
.quick-links{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px;}
.quick-card{
  background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius);
  padding:18px 20px;cursor:pointer;transition:.2s;
  display:flex;align-items:center;gap:14px;
  backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);
}
.quick-card:hover{border-color:var(--accent);background:var(--quick-hover);transform:translateY(-2px);box-shadow:var(--glass-shadow);}
.quick-icon{font-size:26px;}
.quick-title{font-size:14px;font-weight:700;}
.quick-sub{font-size:11px;color:var(--muted);margin-top:3px;font-family:'Poppins',sans-serif;}

/* Analytics */
.analytics-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:28px;}
.analytics-card{background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius);padding:20px;backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);}
.analytics-title{font-size:13px;font-weight:700;margin-bottom:16px;letter-spacing:-.1px;}
.bar-row{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.bar-label{font-size:11px;color:var(--muted);width:90px;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:'Poppins',sans-serif;}
.bar-track{flex:1;height:8px;background:var(--border);border-radius:30px;overflow:hidden;}
.bar-fill{height:100%;border-radius:30px;transition:width .8s cubic-bezier(.4,0,.2,1);}
.bar-fill.blue{background:linear-gradient(90deg,var(--accent),var(--accent2));}
.bar-fill.green{background:linear-gradient(90deg,var(--green),#059669);}
.bar-fill.amber{background:linear-gradient(90deg,var(--amber),#d97706);}
.bar-fill.red{background:linear-gradient(90deg,var(--red),#e11d48);}
.bar-fill.purple{background:var(--accent2);}
.bar-count{font-size:12px;font-weight:700;color:var(--text);width:22px;text-align:right;flex-shrink:0;font-family:'Poppins',sans-serif;}
.empty-analytics{color:var(--muted);font-size:12px;text-align:center;padding:24px 0;font-family:'Poppins',sans-serif;}

/* Choice buttons */
.pl-type-btn{
  flex:1;padding:18px 20px;border-radius:30px;
  border:1.5px solid var(--border);background:var(--card);color:var(--text);
  display:flex;align-items:center;gap:14px;
  transition:.18s;text-align:left;cursor:pointer;
  font-family:'Plus Jakarta Sans',sans-serif;
}
.pl-type-btn:hover:not(:disabled){border-color:var(--accent);background:var(--card2);}
.pl-type-btn:disabled{cursor:not-allowed;}
.pl-type-icon{width:46px;height:46px;background:var(--entry-accent-bg);border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.pl-type-title{font-size:14px;font-weight:700;}
.pl-type-sub{font-size:11px;color:var(--muted);margin-top:3px;font-family:'Poppins',sans-serif;}
/* Form layout */
.form-cols{display:flex;gap:0;align-items:stretch;flex-wrap:nowrap;}
.form-left{flex:1;min-width:0;padding-bottom:140px;overflow-wrap:break-word;word-break:break-word;overflow-y:auto;padding-right:12px;padding-left:32px;padding-top:16px;}
.form-right{
  width:280px;
  flex-shrink:0;
  overflow:hidden;
  display:flex;
  flex-direction:column;
  border-right:1px solid var(--glass-border);
  padding:0;
}

@media(max-width:1366px){
  .form-right{
    width:260px;
  }
}
@media(max-width:900px){
  .form-cols{flex-direction:column;flex-wrap:nowrap;}
  .form-right{
    width:100%;
    height:38vh;
    flex-shrink:0;
    border-right:none;
    border-bottom:1px solid var(--glass-border);
    padding:0;
  }
  .form-left{min-width:0;width:100%;padding-left:16px;padding-right:16px;padding-top:12px;}
  .main-area.form-mode .toc-card{display:none;}
}
@media(max-width:600px){
  .form-right{height:33vh;}
  .form-left{padding-left:12px;padding-right:12px;}
}

/* Right panel */
.right-panel {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);

  overflow: hidden;

  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  box-shadow: var(--glass-shadow);

  display: flex;
  flex-direction: column;

  height: 100%;
  min-height: 0;
  flex: 1;
}

.right-panel-header{
  padding:16px 18px;
  border-bottom:1px solid var(--border);
  font-size:15px;
  font-weight:800;
  display:flex;
  align-items:center;
  gap:10px;
  background:linear-gradient(135deg,rgba(245,148,92,.1),rgba(212,114,74,.08));
  font-family:'Plus Jakarta Sans',sans-serif;
  letter-spacing:-.2px;
  border-radius:var(--radius) var(--radius) 0 0;
  flex-shrink:0;
}
.meta-stack{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;border-bottom:1px solid var(--border);flex-shrink:0;}
.meta-row{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px 10px;gap:5px;text-align:center;border-right:1px solid var(--border);}
.meta-row:last-child{border-right:none;}
.meta-row .meta-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);white-space:nowrap;}
.meta-row .meta-val{color:var(--text);font-weight:700;font-size:11px;font-family:'Poppins',sans-serif;line-height:1.3;text-align:center;}
.meta-row .timer-val{color:var(--accent);font-weight:800;font-size:32px;font-variant-numeric:tabular-nums;font-family:'Plus Jakarta Sans',sans-serif;letter-spacing:-.5px;line-height:1.1;}
.summary-panel{padding:14px 16px;overflow-y:auto;flex:1;min-height:0;}
.main-area.form-mode .summary-panel{padding-bottom:16px;}

/* Copy row */
.copy-row-wrap{margin-bottom:8px;background:var(--sum-bg);border:1px solid var(--border);border-radius:30px;padding:10px 14px;transition:.15s;}
.copy-row-wrap:hover{border-color:var(--accent);}
.copy-row-label{font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;font-family:'Poppins',sans-serif;}
.copy-row-inner{display:flex;align-items:flex-start;gap:8px;}
.copy-row-val{flex:1;font-size:13px;color:var(--text);line-height:1.65;word-break:break-word;white-space:pre-wrap;font-family:'Poppins',sans-serif;font-weight:500;}
.copy-row-btn{
  flex-shrink:0;background:var(--btn-save-bg);color:#fff;border:none;
  border-radius:30px;padding:4px 10px;font-size:11px;font-weight:600;
  cursor:pointer;transition:.15s;white-space:nowrap;font-family:'Poppins',sans-serif;
}
.copy-row-btn:hover{filter:brightness(1.15);}
.copy-row-btn.done{background:var(--green);}

/* Step cards */
.step-card{border-radius:var(--radius);margin-bottom:8px;overflow:hidden;transition:.25s;border:1px solid var(--border);}
.step-card.locked{background:var(--entry-bg);opacity:.4;pointer-events:none;}
.step-card.unlocked{background:var(--glass-bg);backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);}
.step-card.done{background:var(--glass-bg);border-color:rgba(16,185,129,.35);backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);}
.step-card.open:not(.locked){border-color:rgba(245,148,92,.4);box-shadow:0 0 0 1px rgba(245,148,92,.1);}
.step-header{display:flex;align-items:center;gap:12px;padding:14px 18px;cursor:pointer;user-select:none;transition:.15s;}
.step-header:hover{background:var(--card2);}
.step-num{width:30px;height:30px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;color:var(--text);transition:.25s;font-family:'Poppins',sans-serif;}
.step-card.done .step-num{background:var(--green);color:#fff;box-shadow:0 0 0 4px rgba(16,185,129,.15);}
.step-card.open:not(.locked) .step-num{background:var(--btn-save-bg);color:#fff;box-shadow:0 0 0 4px rgba(245,148,92,.15);}
.step-card.locked .step-num{opacity:.4;}
.step-title{font-size:13px;font-weight:700;flex:1;letter-spacing:-.1px;}
.step-card.locked .step-title{color:var(--muted);}
.step-lock-icon{font-size:13px;color:var(--muted);}
.step-chevron{color:var(--muted);font-size:12px;transition:.25s;}
.step-card.open .step-chevron{transform:rotate(180deg);}
.step-body{padding:4px 18px 18px;animation:fadeIn .2s ease;}
@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}

/* Fields */
.field{margin-bottom:14px;}
.field label{display:block;font-size:10px;font-weight:700;color:var(--muted);margin-bottom:5px;text-transform:uppercase;letter-spacing:.8px;font-family:'Poppins',sans-serif;}
.req{color:var(--red);}
.inp{
  width:100%;background:var(--inp-bg);border:1.5px solid var(--border);
  border-radius:30px;color:var(--text);padding:10px 13px;font-size:13px;outline:none;
  transition:.15s;font-family:'Poppins',sans-serif;
}
.inp:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(245,148,92,.12);}
.inp::placeholder{color:var(--muted);opacity:.5;}
textarea.inp{resize:vertical;min-height:80px;line-height:1.6;}
select.inp{cursor:pointer;}

/* Radio */
.radio-group{display:flex;gap:8px;margin-top:4px;flex-wrap:wrap;}
.radio-label{
  display:inline-flex;align-items:center;gap:8px;
  background:var(--inp-bg);border:1.5px solid var(--border);
  padding:8px 14px;border-radius:30px;font-size:12px;cursor:pointer;
  transition:.15s;font-family:'Poppins',sans-serif;
  line-height:1;user-select:none;white-space:nowrap;
}
.radio-label:hover{border-color:var(--accent);}
.radio-label input[type="radio"]{
  appearance:none;-webkit-appearance:none;
  width:14px;height:14px;min-width:14px;min-height:14px;
  border:2px solid var(--border);border-radius:50%;
  background:var(--inp-bg);
  cursor:pointer;transition:.15s;
  margin:0;padding:0;flex-shrink:0;
  position:relative;top:0;
  box-sizing:border-box;
}
.radio-label input[type="radio"]::after{
  content:"";display:block;
  width:6px;height:6px;border-radius:50%;
  background:transparent;transition:.15s;
  position:absolute;top:2px;left:2px;
}
.radio-label input[type="radio"]:checked{border-color:var(--accent);}
.radio-label input[type="radio"]:checked::after{background:var(--accent);}
.radio-label.selected-clarif{border-color:var(--amber);color:var(--amber);background:var(--btn-draft-bg);}
.radio-label.selected-clarif input[type="radio"]{border-color:var(--amber);}
.radio-label.selected-clarif input[type="radio"]:checked::after{background:var(--amber);}
.radio-label.selected-complete{border-color:var(--green);color:var(--green);background:rgba(16,185,129,.08);}
.radio-label.selected-complete input[type="radio"]{border-color:var(--green);}
.radio-label.selected-complete input[type="radio"]:checked::after{background:var(--green);}

/* Checkboxes */
.check-group{display:flex;flex-wrap:wrap;gap:9px;}
.check-label{display:flex;align-items:center;gap:8px;background:var(--inp-bg);border:1.5px solid var(--border);padding:9px 15px;border-radius:30px;font-size:13px;cursor:pointer;transition:.15s;font-family:'Poppins',sans-serif;}
.check-label:hover{border-color:var(--accent);}
.check-label input{accent-color:var(--accent);}
.check-label.checked{border-color:var(--green);color:var(--green);background:rgba(16,185,129,.07);}

/* Copy name */
.copy-name{background:var(--inp-bg);border:1.5px solid var(--border);border-radius:30px;padding:11px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:4px;}
.copy-name-text{font-size:12px;color:var(--accent);font-weight:600;word-break:break-all;font-family:'Poppins',sans-serif;}
.copy-btn{background:var(--btn-save-bg);color:#fff;border:none;border-radius:30px;padding:7px 14px;font-size:12px;font-weight:600;white-space:nowrap;transition:.15s;font-family:'Poppins',sans-serif;}
.copy-btn:hover{filter:brightness(1.1);}
.copy-btn.green{background:var(--green) !important;}

/* Entry cards */
.entry-card{background:var(--entry-bg);border:1.5px solid var(--border);border-radius:30px;padding:15px;margin-bottom:10px;transition:.2s;}
.entry-card.saved{background:var(--card);border-color:var(--border);opacity:.92;}
.entry-card.dragging{opacity:.35;border-style:dashed;}
.drag-skeleton{
  height:72px;border:2px dashed var(--accent);background:var(--entry-accent-bg);
  border-radius:30px;margin-bottom:10px;opacity:.6;
  display:flex;align-items:center;justify-content:center;
  font-size:11px;color:var(--accent);font-weight:600;font-family:'Poppins',sans-serif;
  letter-spacing:.5px;gap:8px;pointer-events:none;
}
.link-drag-skeleton{
  height:60px;border:2px dashed var(--accent);background:var(--entry-accent-bg);
  border-radius:30px;margin-bottom:10px;opacity:.6;
  display:flex;align-items:center;justify-content:center;
  font-size:11px;color:var(--accent);font-weight:600;font-family:'Poppins',sans-serif;
  letter-spacing:.5px;gap:8px;pointer-events:none;
}
.drag-skeleton{
  height:72px;border:2px dashed var(--accent);background:var(--entry-accent-bg);
  border-radius:30px;margin-bottom:10px;opacity:.5;
  display:flex;align-items:center;justify-content:center;
  font-size:11px;color:var(--accent);font-weight:600;font-family:'Poppins',sans-serif;
  letter-spacing:.5px;gap:8px;
}
.link-drag-skeleton{
  height:60px;border:2px dashed var(--accent);background:var(--entry-accent-bg);
  border-radius:30px;margin-bottom:10px;opacity:.5;
  display:flex;align-items:center;justify-content:center;
  font-size:11px;color:var(--accent);font-weight:600;font-family:'Poppins',sans-serif;
  letter-spacing:.5px;gap:8px;
}
.entry-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:11px;gap:8px;}
.entry-label{font-size:13px;font-weight:700;color:var(--accent);font-family:'Plus Jakarta Sans',sans-serif;}
.drag-handle{display:flex;flex-direction:column;gap:3px;padding:4px 8px;cursor:grab;flex-shrink:0;opacity:.5;transition:.15s;touch-action:none;}
.drag-handle:hover{opacity:1;}
.drag-handle:active{cursor:grabbing;opacity:1;}
.entry-drag-row{position:relative;}
.drop-line{height:3px;background:var(--accent);border-radius:2px;margin:2px 0;pointer-events:none;}
.drag-handle:hover{opacity:1;}
.drag-handle span{display:block;width:16px;height:2px;background:var(--muted);border-radius:1px;}
.entry-saved-preview{font-size:12px;color:var(--text);line-height:1.7;white-space:pre-wrap;word-break:break-word;padding:6px 0 2px;}
.entry-saved-preview em{color:var(--muted);font-style:italic;}
.entry-del{background:none;border:1px solid transparent;color:var(--muted);font-size:15px;padding:4px 7px;border-radius:30px;transition:.15s;}
.entry-del:hover{color:var(--red);background:var(--btn-cancel-bg);border-color:var(--btn-cancel-border);}
.ai-row{display:flex;align-items:center;gap:8px;margin-top:6px;}
.ai-btn{background:linear-gradient(135deg,var(--accent2),var(--accent));color:#fff;border:none;border-radius:30px;padding:5px 12px;font-size:11px;font-weight:600;transition:.15s;font-family:'Poppins',sans-serif;}
.ai-btn:disabled{opacity:.35;cursor:not-allowed;}
.add-entry-btn{background:none;border:2px dashed var(--border);border-radius:30px;color:var(--muted);padding:12px;width:100%;font-size:13px;font-weight:600;transition:.18s;margin-top:4px;font-family:'Poppins',sans-serif;}
.add-entry-btn:hover{border-color:var(--accent);color:var(--accent);background:var(--entry-accent-bg);}
.copy-all-btn{background:var(--card2);border:1.5px solid var(--border);color:var(--text);border-radius:30px;padding:10px 16px;font-size:13px;font-weight:600;margin-top:12px;display:flex;align-items:center;gap:8px;transition:.2s;width:100%;justify-content:center;font-family:'Poppins',sans-serif;}
.copy-all-btn:hover{border-color:var(--accent);color:var(--accent);background:var(--entry-accent-bg);}
.copy-all-btn.copied{border-color:var(--green) !important;color:var(--green) !important;background:rgba(16,185,129,.07) !important;}

/* Image upload */
.img-zone{border:2px dashed var(--border);border-radius:30px;padding:22px;text-align:center;cursor:pointer;transition:.2s;position:relative;}
.img-zone:hover,.img-zone.drag{border-color:var(--accent);background:var(--entry-accent-bg);}
.img-zone input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}
.img-thumb-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;}
.img-thumb{position:relative;width:100px;height:78px;border-radius:30px;overflow:hidden;border:1.5px solid var(--border);}
.img-thumb img{width:100%;height:100%;object-fit:cover;}
.img-thumb-del{position:absolute;top:3px;right:3px;background:rgba(0,0,0,.7);border:none;color:#fff;border-radius:30px;width:18px;height:18px;font-size:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;}
.img-dl-btn{display:block;margin-top:4px;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:30px;padding:4px 8px;font-size:11px;width:100px;text-align:center;cursor:pointer;transition:.15s;font-family:'Poppins',sans-serif;}
.img-dl-btn:hover{border-color:var(--accent);color:var(--accent);}

/* Modals */
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:999;backdrop-filter:blur(8px);animation:fadeIn .15s ease;}
.modal{background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:30px;padding:32px;max-width:390px;width:90%;text-align:center;backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);box-shadow:var(--glass-shadow);animation:popIn .2s ease;}
@keyframes popIn{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}
.modal h3{font-size:20px;margin-bottom:8px;}
.modal p{color:var(--muted);font-size:13px;margin-bottom:24px;line-height:1.65;font-family:'Poppins',sans-serif;}
.modal-btns{display:flex;gap:10px;justify-content:center;}
.edit-modal{background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:30px;padding:28px;max-width:500px;width:90%;max-height:85vh;overflow-y:auto;backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);box-shadow:var(--glass-shadow);animation:popIn .2s ease;}

/* Toast */
.toast{position:fixed;bottom:26px;right:26px;color:#fff;padding:12px 20px;border-radius:30px;font-size:13px;font-weight:600;z-index:1000;animation:slideUp .3s ease;box-shadow:var(--shadow);font-family:'Poppins',sans-serif;}
.toast.success{background:linear-gradient(135deg,var(--green),#059669);}
.toast.error{background:linear-gradient(135deg,var(--red),#be123c);}
.toast.info{background:linear-gradient(135deg,var(--accent),var(--accent2));}
@keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}

/* Saved/Draft rows */
.saved-row{background:var(--card);border:1.5px solid var(--border);border-radius:30px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;transition:.2s;box-shadow:var(--shadow-sm);}
.saved-row:hover{border-color:var(--green);transform:translateX(3px);}
.saved-dot{width:10px;height:10px;border-radius:50%;background:linear-gradient(135deg,var(--green),#059669);flex-shrink:0;box-shadow:0 0 0 3px rgba(16,185,129,.15);}
.saved-info{flex:1;min-width:0;}
.saved-case{font-weight:700;font-size:13px;font-family:'Poppins',sans-serif;}
.saved-meta{color:var(--muted);font-size:11px;margin-top:3px;font-family:'Poppins',sans-serif;}
.saved-type{font-size:11px;font-weight:700;padding:4px 11px;border-radius:30px;background:var(--h-badge-site-bg);color:var(--accent);white-space:nowrap;border:1px solid rgba(91,156,246,.25);}
.draft-row{background:var(--card);border:1.5px solid rgba(245,158,11,.4);border-radius:30px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px;transition:.2s;}
.draft-row:hover{transform:translateX(3px);}
.draft-dot{width:10px;height:10px;border-radius:50%;background:linear-gradient(135deg,var(--amber),#d97706);flex-shrink:0;animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
.draft-badge{font-size:11px;font-weight:700;padding:4px 11px;border-radius:30px;background:var(--btn-draft-bg);color:var(--btn-draft-text);white-space:nowrap;border:1px solid rgba(245,158,11,.35);}
.draft-resume{font-size:12px;font-weight:700;padding:8px 16px;border-radius:30px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;cursor:pointer;transition:.18s;white-space:nowrap;box-shadow:0 2px 10px rgba(245,158,11,.4);font-family:'Poppins',sans-serif;}
.draft-resume:hover{filter:brightness(1.1);}

/* Case History */
.case-card{background:var(--glass-bg);border:1.5px solid var(--glass-border);border-radius:30px;margin-bottom:12px;overflow:hidden;transition:.25s;backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);box-shadow:var(--glass-shadow);}
.case-card:hover{border-color:rgba(245,148,92,.35);}
.case-card.expanded{border-color:rgba(245,148,92,.5);box-shadow:var(--glass-shadow);}
.case-card-header{display:flex;align-items:center;gap:14px;padding:18px 20px;cursor:pointer;user-select:none;transition:.15s;}
.case-card-header:hover{background:var(--card2);}
.case-num-badge{font-size:16px;font-weight:800;color:var(--accent);background:var(--entry-accent-bg);border:1.5px solid rgba(91,156,246,.25);border-radius:30px;padding:5px 14px;white-space:nowrap;}
.case-meta-main{font-size:13px;font-weight:600;margin-bottom:3px;font-family:'Poppins',sans-serif;}
.case-meta-sub{font-size:11px;color:var(--muted);font-family:'Poppins',sans-serif;}
.case-expand-btn{background:var(--btn-ghost-bg);border:1.5px solid var(--btn-ghost-border);color:var(--btn-ghost-text);border-radius:30px;padding:6px 12px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:5px;transition:.2s;white-space:nowrap;flex-shrink:0;font-family:'Poppins',sans-serif;}
.case-card:hover .case-expand-btn{border-color:var(--accent);color:var(--accent);}
.case-expand-icon{transition:.25s;display:inline-block;}
.case-card.expanded .case-expand-icon{transform:rotate(180deg);}
.case-body{border-top:1px solid var(--border);}
.case-body-inner{padding:20px;}
.case-section{background:var(--entry-bg);border:1px solid var(--border);border-radius:30px;padding:16px;margin-bottom:12px;}
.case-section-title{font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;display:flex;align-items:center;gap:6px;font-family:'Poppins',sans-serif;}
.case-field-row{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);}
.case-field-row:last-child{border-bottom:none;padding-bottom:0;}
.case-field-label{font-size:11px;color:var(--muted);width:120px;flex-shrink:0;font-weight:500;font-family:'Poppins',sans-serif;}
.case-field-val{font-size:13px;font-weight:600;flex:1;word-break:break-word;color:var(--text);font-family:'Poppins',sans-serif;}
.case-field-edit{background:var(--btn-ghost-bg);border:1.5px solid var(--btn-ghost-border);color:var(--btn-ghost-text);border-radius:30px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;transition:.15s;flex-shrink:0;font-family:'Poppins',sans-serif;}
.case-field-edit:hover{border-color:var(--accent);color:var(--accent);background:var(--entry-accent-bg);}
.case-entry-card{background:var(--card);border:1.5px solid var(--border);border-radius:30px;padding:12px 14px;margin-bottom:8px;}
.case-entry-card:last-child{margin-bottom:0;}
.case-entry-num{font-size:12px;font-weight:700;color:var(--accent);margin-bottom:6px;font-family:'Plus Jakarta Sans',sans-serif;}
.case-entry-field{font-size:13px;margin-bottom:4px;line-height:1.6;font-family:'Poppins',sans-serif;}
.case-entry-key{color:var(--muted);font-size:11px;font-weight:600;}
.case-device-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:4px;}
.case-device-chip{display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:30px;font-size:12px;font-weight:600;border:1.5px solid;font-family:'Poppins',sans-serif;}
.case-device-chip.active{background:rgba(16,185,129,.1);border-color:rgba(16,185,129,.4);color:var(--green);}
.case-device-chip.inactive{background:var(--entry-bg);border-color:var(--border);color:var(--muted);opacity:.6;}
.case-checklist-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px;}
.case-check-item{display:flex;align-items:center;gap:7px;font-size:12px;padding:6px 10px;border-radius:30px;background:var(--card);border:1px solid var(--border);font-family:'Poppins',sans-serif;}
.case-check-item.done{color:var(--green);border-color:rgba(16,185,129,.25);background:rgba(16,185,129,.06);}
.case-check-item.undone{color:var(--muted);}
.case-imgs{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;}
.case-img-thumb{width:88px;height:68px;border-radius:30px;overflow:hidden;border:1.5px solid var(--border);cursor:pointer;transition:.2s;}
.case-img-thumb:hover{transform:scale(1.06);border-color:var(--accent);}
.case-img-thumb img{width:100%;height:100%;object-fit:cover;}
.case-actions{display:flex;gap:8px;margin-top:16px;padding-top:16px;border-top:1px solid var(--border);}
.h-btn{background:var(--btn-ghost-bg);border:1.5px solid var(--btn-ghost-border);color:var(--btn-ghost-text);border-radius:30px;padding:8px 14px;font-size:12px;font-weight:700;transition:.18s;display:inline-flex;align-items:center;gap:6px;font-family:'Poppins',sans-serif;}
.h-btn:hover{border-color:var(--text);color:var(--text);}
.h-btn.danger:hover{border-color:var(--btn-cancel-border);color:var(--btn-cancel-text);background:var(--btn-cancel-bg);}
.h-btn.dl:hover{border-color:var(--green);color:var(--green);background:rgba(16,185,129,.08);}
.empty-history{text-align:center;padding:80px 0;color:var(--muted);font-size:14px;font-family:'Poppins',sans-serif;}
.lightbox-bg{position:fixed;inset:0;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;z-index:1001;cursor:pointer;backdrop-filter:blur(8px);}
.lightbox-img{max-width:90vw;max-height:88vh;border-radius:30px;box-shadow:var(--shadow);}

/* Inline edit */
.inline-edit-inp{background:var(--inp-bg);border:1.5px solid var(--accent);border-radius:30px;color:var(--text);padding:6px 11px;font-size:13px;outline:none;flex:1;box-shadow:0 0 0 3px rgba(245,148,92,.12);font-family:'Poppins',sans-serif;}
.inline-save-btn{background:linear-gradient(135deg,var(--green),#059669);color:#fff;border:none;border-radius:30px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;transition:.15s;font-family:'Poppins',sans-serif;}
.inline-cancel-btn{background:var(--btn-ghost-bg);border:1.5px solid var(--btn-ghost-border);color:var(--btn-ghost-text);border-radius:30px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer;transition:.15s;font-family:'Poppins',sans-serif;}

/* Soon */
.soon-wrap{display:flex;align-items:center;justify-content:center;min-height:60vh;flex-direction:column;gap:16px;}
.soon-badge{font-size:80px;animation:float 3s ease-in-out infinite;}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.soon-title{font-size:32px;font-weight:800;}
.soon-sub{color:var(--muted);font-size:15px;font-family:'Poppins',sans-serif;}

/* Search */
.search-wrap{position:relative;margin-bottom:20px;}
.search-inp{width:100%;background:var(--card);border:1.5px solid var(--border);border-radius:30px;color:var(--text);padding:10px 14px 10px 40px;font-size:13px;outline:none;transition:.15s;font-family:'Poppins',sans-serif;}
.search-inp:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(245,148,92,.1);}
.search-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--muted);font-size:15px;}
.filter-row{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;}
.filter-btn{background:var(--card);border:1.5px solid var(--border);color:var(--muted);border-radius:30px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;transition:.15s;font-family:'Poppins',sans-serif;}
.filter-btn:hover,.filter-btn.active{border-color:var(--accent);color:var(--accent);background:var(--entry-accent-bg);}

/* Auth pages */
.auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);position:relative;overflow:hidden;}
.auth-page::before{content:'';position:absolute;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(245,148,92,.12),transparent 70%);top:-120px;right:-120px;pointer-events:none;}
.auth-page::after{content:'';position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(245,148,92,.07),transparent 70%);bottom:-80px;left:-80px;pointer-events:none;}
.auth-card{background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:30px;padding:40px;width:100%;max-width:420px;backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);box-shadow:var(--glass-shadow);position:relative;z-index:1;}
.auth-logo{display:flex;align-items:center;gap:12px;margin-bottom:32px;justify-content:center;}
.auth-logo-icon{width:40px;height:40px;display:flex;align-items:center;justify-content:center;}
.auth-logo-text{font-size:24px;font-weight:800;letter-spacing:-.5px;}
.auth-logo-text span{color:var(--accent);}
.auth-title{font-size:22px;font-weight:800;text-align:center;margin-bottom:6px;}
.auth-sub{font-size:13px;color:var(--muted);text-align:center;margin-bottom:28px;font-family:'Poppins',sans-serif;line-height:1.5;}
.auth-link{color:var(--accent);cursor:pointer;font-weight:600;background:none;border:none;font-size:13px;font-family:'Poppins',sans-serif;}
.auth-link:hover{text-decoration:underline;}
.auth-divider{text-align:center;color:var(--muted);font-size:12px;margin:20px 0;position:relative;font-family:'Poppins',sans-serif;}
.auth-divider::before,.auth-divider::after{content:'';position:absolute;top:50%;width:40%;height:1px;background:var(--border);}
.auth-divider::before{left:0;}.auth-divider::after{right:0;}

/* Profile */
.profile-card{background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:var(--radius);padding:28px;margin-bottom:20px;backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);box-shadow:var(--glass-shadow);}
.profile-avatar-large{width:80px;height:80px;border-radius:50%;background:var(--btn-save-bg);display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:800;color:#fff;margin-bottom:0;box-shadow:var(--glass-shadow);flex-shrink:0;overflow:hidden;position:relative;cursor:pointer;}
.profile-avatar-large img{width:100%;height:100%;object-fit:cover;border-radius:50%;}
.profile-avatar-overlay{position:absolute;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;opacity:0;transition:.2s;border-radius:50%;font-size:18px;}
.profile-avatar-large:hover .profile-avatar-overlay{opacity:1;}
.profile-avatar-large input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}

/* Announcements */
.announcement-card{background:var(--card);border:1px solid var(--border);border-radius:30px;padding:20px;margin-bottom:12px;transition:.2s;}
.announcement-card:hover{border-color:rgba(245,148,92,.3);}
.ann-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;}
.ann-title{font-size:15px;font-weight:700;font-family:'Plus Jakarta Sans',sans-serif;}
.ann-meta{font-size:11px;color:var(--muted);margin-top:3px;font-family:'Poppins',sans-serif;}
.ann-body{font-size:13px;color:var(--muted);line-height:1.7;font-family:'Poppins',sans-serif;}
.ann-badge{font-size:11px;font-weight:700;padding:3px 10px;border-radius:30px;white-space:nowrap;}
.ann-badge.info{background:var(--h-badge-site-bg);color:var(--accent);}
.ann-badge.urgent{background:rgba(244,63,94,.15);color:var(--red);}
.ann-badge.update{background:rgba(16,185,129,.12);color:var(--green);}

/* Links page */
.link-card{background:var(--card);border:1px solid var(--border);border-radius:30px;padding:16px;margin-bottom:10px;display:flex;align-items:center;gap:14px;transition:.2s;}
.link-card:hover{border-color:rgba(245,148,92,.3);}
.link-icon{width:40px;height:40px;border-radius:30px;background:var(--entry-accent-bg);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.link-info{flex:1;min-width:0;}
.link-title{font-size:13px;font-weight:600;font-family:'Poppins',sans-serif;}
.link-url{font-size:11px;color:var(--muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:'Poppins',sans-serif;}
.link-actions{display:flex;gap:6px;flex-shrink:0;}

/* Special requestors */
.requestor-grid{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px;}
.requestor-chip{
  display:flex;align-items:center;gap:8px;padding:10px 16px;
  border-radius:30px;background:var(--card);border:1.5px solid var(--border);
  font-size:13px;font-weight:600;font-family:'Poppins',sans-serif;
  transition:.2s;cursor:default;
}
.requestor-chip:hover{border-color:rgba(245,148,92,.4);}
.requestor-avatar{width:28px;height:28px;border-radius:50%;background:var(--btn-save-bg);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;flex-shrink:0;}
.requestor-del{background:none;border:none;color:var(--muted);font-size:14px;padding:2px 4px;border-radius:30px;transition:.15s;cursor:pointer;}
.requestor-del:hover{color:var(--red);}

/* ── Case History Edit Styles ── */
.edit-entry-card{background:var(--card);border:2px solid var(--accent);border-radius:30px;padding:16px;margin-bottom:10px;position:relative;}
.edit-entry-card .entry-del{position:absolute;top:12px;right:12px;}
.edit-section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.add-entry-btn-sm{background:none;border:2px dashed var(--border);border-radius:30px;color:var(--muted);padding:8px 14px;font-size:12px;font-weight:600;transition:.18s;font-family:'Poppins',sans-serif;cursor:pointer;}
.add-entry-btn-sm:hover{border-color:var(--accent);color:var(--accent);background:var(--entry-accent-bg);}
.img-edit-grid{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;}
.img-edit-item{position:relative;width:100px;height:78px;border-radius:30px;overflow:hidden;border:2px solid var(--border);transition:.2s;}
.img-edit-item:hover{border-color:var(--accent);}
.img-edit-item img{width:100%;height:100%;object-fit:cover;}
.img-edit-del{position:absolute;top:4px;right:4px;background:rgba(244,63,94,.9);border:none;color:#fff;border-radius:30px;width:20px;height:20px;font-size:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-weight:700;}
.img-edit-replace{position:absolute;bottom:4px;left:4px;right:4px;background:rgba(0,0,0,.75);border:none;color:#fff;border-radius:30px;padding:2px 0;font-size:9px;font-weight:700;cursor:pointer;text-align:center;transition:.15s;font-family:'Poppins',sans-serif;}
.img-edit-replace:hover{background:rgba(91,156,246,.9);}
.img-add-zone{width:100px;height:78px;border-radius:30px;border:2px dashed var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:.2s;position:relative;color:var(--muted);font-size:11px;gap:4px;font-family:'Poppins',sans-serif;}
.img-add-zone:hover{border-color:var(--accent);color:var(--accent);background:var(--entry-accent-bg);}
.img-add-zone input{position:absolute;inset:0;opacity:0;cursor:pointer;}
.edit-mode-banner{background:linear-gradient(135deg,rgba(245,148,92,.12),rgba(212,114,74,.12));border:1.5px solid rgba(245,148,92,.3);border-radius:30px;padding:10px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;font-size:12px;font-weight:600;color:var(--accent);}
.field-row-edit{margin-bottom:12px;}
.field-row-edit label{display:block;font-size:10px;font-weight:700;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.8px;font-family:'Poppins',sans-serif;}
.device-edit-group{display:flex;gap:8px;flex-wrap:wrap;}
.checklist-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.checklist-edit-item{display:flex;align-items:center;gap:8px;background:var(--inp-bg);border:1.5px solid var(--border);padding:8px 12px;border-radius:30px;cursor:pointer;transition:.15s;font-size:12px;font-family:'Poppins',sans-serif;}
.checklist-edit-item.checked{border-color:var(--green);background:rgba(16,185,129,.07);color:var(--green);}
.checklist-edit-item input{accent-color:var(--green);}

/* Donut chart */
.donut-wrap{display:flex;align-items:center;gap:20px;}
.donut-svg{flex-shrink:0;}
.donut-legend{display:flex;flex-direction:column;gap:8px;}
.donut-legend-item{display:flex;align-items:center;gap:8px;font-size:12px;font-family:'Poppins',sans-serif;}
.donut-legend-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}

/* Sparkline */
.sparkline-wrap{position:relative;}

/* Login page specific */
.login-page{min-height:100vh;}

/* No border for active nav custom link */
.nav-custom-active{color:var(--accent) !important;background:var(--nav-active-bg) !important;border:1px solid var(--nav-active-border) !important;}

/* Break timer */
.break-bar{
  position:fixed;bottom:0;left:0;right:0;z-index:900;
  display:flex;align-items:center;gap:14px;
  padding:10px 20px;
  background:var(--glass-bg);border-top:2px solid var(--accent);
  backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);
  box-shadow:0 -4px 32px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.07);
  font-family:'Poppins',sans-serif;font-size:13px;
  animation:slideUp .3s ease;
}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.break-bar.warn{border-top-color:var(--amber);}
.break-bar.ended{border-top-color:var(--green);}
.break-label{font-weight:700;color:var(--text);}
.break-time{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums;color:var(--accent);min-width:60px;}
.break-bar.warn .break-time{color:var(--amber);}
.break-bar.ended .break-time{color:var(--green);}
.break-progress{flex:1;height:6px;background:var(--border);border-radius:0;}
.break-progress-fill{height:100%;background:var(--btn-save-bg);transition:width .5s linear;border-radius:0;}
.break-bar.warn .break-progress-fill{background:linear-gradient(90deg,var(--amber),#d97706);}
.break-bar.ended .break-progress-fill{background:linear-gradient(90deg,var(--green),#059669);}
.break-stop{background:none;border:1.5px solid var(--border);color:var(--muted);padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer;transition:.15s;font-family:'Poppins',sans-serif;}
.break-stop:hover{border-color:var(--red);color:var(--red);}
/* Alarm overlay */
@keyframes alarmPulse{0%,100%{box-shadow:0 0 0 0 rgba(245,148,92,.6)}50%{box-shadow:0 0 0 18px rgba(245,148,92,0)}}
.alarm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:1100;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease;backdrop-filter:blur(12px);}
.alarm-modal{background:var(--glass-bg);border:2px solid var(--accent);border-radius:30px;padding:40px 44px;text-align:center;max-width:420px;width:90%;backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);box-shadow:0 0 60px rgba(245,148,92,.35),var(--glass-shadow);animation:popIn .25s ease,alarmPulse 1.4s ease-in-out infinite;}
.alarm-icon{font-size:56px;display:block;margin-bottom:16px;animation:float 1s ease-in-out infinite;}
.alarm-title{font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:800;margin-bottom:8px;color:var(--accent);}
.alarm-sub{font-size:14px;color:var(--muted);margin-bottom:28px;line-height:1.6;}
.alarm-btns{display:flex;gap:12px;justify-content:center;}
.alarm-snooze{background:var(--btn-draft-bg);border:1.5px solid var(--btn-draft-border);color:var(--btn-draft-text);padding:12px 24px;font-size:14px;font-weight:700;font-family:'Poppins',sans-serif;cursor:pointer;transition:.15s;}
.alarm-snooze:hover{filter:brightness(1.15);}
.alarm-dismiss{background:var(--btn-save-bg);border:none;color:#fff;padding:12px 28px;font-size:14px;font-weight:700;font-family:'Poppins',sans-serif;cursor:pointer;transition:.15s;box-shadow:0 3px 14px rgba(245,148,92,.4);}
.alarm-dismiss:hover{filter:brightness(1.1);}
/* Break buttons in sidebar */
.break-btns{display:flex;flex-direction:column;gap:4px;padding:8px 0 4px;}
.break-btn{display:flex;align-items:center;gap:8px;padding:10px 12px;font-size:12px;font-weight:600;color:var(--muted);background:none;border:1px solid var(--border);cursor:pointer;transition:.18s;width:100%;text-align:left;font-family:'Poppins',sans-serif;border-radius:30px;}
.sidebar.collapsed .break-btn{justify-content:center;gap:0;}
.sidebar.collapsed .break-btn>span{display:none;max-width:0;overflow:hidden;}
.sidebar.collapsed .break-btn>svg:not(:first-child){display:none;}
.sidebar.collapsed .sidebar-logout-btn{justify-content:center;gap:0;}
.sidebar.collapsed .sidebar-logout-btn .nav-label{display:none;max-width:0;overflow:hidden;}
.break-btn:hover{background:var(--card2);color:var(--text);border-color:var(--accent);}
.break-btn.active{background:var(--entry-accent-bg);color:var(--accent);border-color:var(--accent);}
.sidebar.collapsed .break-collapsed-label{display:inline !important;}
.sidebar.collapsed .break-btn .nav-text{display:none !important;max-width:0 !important;}

/* DB status bar */
.db-status{
  display:flex;align-items:center;gap:8px;padding:8px 12px;
  font-size:11px;font-weight:600;font-family:'Poppins',sans-serif;
  border-top:1px solid var(--border);margin-top:4px;
  color:var(--muted);transition:.3s;
}
.db-dot{
  width:8px;height:8px;border-radius:50%;flex-shrink:0;transition:.3s;
}
.db-dot.connected{background:#10b981;box-shadow:0 0 6px rgba(16,185,129,.6);}
.db-dot.connecting{background:#f59e0b;animation:pulse-dot 1s ease-in-out infinite;}
.db-dot.error{background:#f43f5e;box-shadow:0 0 6px rgba(244,63,94,.5);}
@keyframes pulse-dot{0%,100%{opacity:1;}50%{opacity:.3;}}
@keyframes pulse-ring{0%{transform:scale(1);opacity:.5;}70%{transform:scale(1.6);opacity:0;}100%{transform:scale(1.6);opacity:0;}}

/* Improved Step card */
.step-card{border-radius:12px;margin-bottom:8px;overflow:hidden;transition:.22s cubic-bezier(.34,1.56,.64,1);border:1.5px solid var(--border);position:relative;}
.step-card.done{border-color:rgba(16,185,129,.4);background:linear-gradient(135deg,rgba(16,185,129,.04),var(--glass-bg));}
.step-card.open:not(.locked){border-color:rgba(1,118,211,.5);box-shadow:0 0 0 3px rgba(1,118,211,.08),0 4px 20px rgba(0,0,0,.15);}
.step-card.locked{opacity:.45;filter:grayscale(.3);}
.step-header{border-radius:12px;padding:14px 18px;gap:14px;}
.step-card.open:not(.locked) .step-header{border-radius:12px 12px 0 0;background:linear-gradient(135deg,rgba(1,118,211,.06),transparent);}
.step-card.done .step-header{background:linear-gradient(135deg,rgba(16,185,129,.06),transparent);}
.step-num{width:34px;height:34px;border-radius:50%;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.15);}
.step-card.done .step-num{background:linear-gradient(135deg,#10b981,#059669);box-shadow:0 0 0 4px rgba(16,185,129,.2),0 2px 8px rgba(16,185,129,.3);}
.step-card.open:not(.locked) .step-num{background:linear-gradient(135deg,#1a8fe8,#0164b8);box-shadow:0 0 0 4px rgba(1,118,211,.2);}
.step-title{font-size:13px;font-weight:700;letter-spacing:-.1px;}
.step-body{padding:6px 18px 20px;animation:fadeIn .2s ease;}

/* Live summary panel */
.right-panel{border-radius:14px;overflow:hidden;max-height:calc(100vh - 120px);}
.right-panel-header{font-size:14px;font-weight:800;padding:14px 18px;letter-spacing:-.2px;background:var(--card);border-bottom:1px solid var(--border);flex-shrink:0;}
.meta-stack{border-bottom:1px solid var(--border);flex-shrink:0;}
.meta-row{padding:12px 14px;transition:.15s;}
.meta-row:hover{background:var(--card2);}
.meta-row .meta-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);}
.meta-row .timer-val{font-size:26px;font-weight:800;color:var(--accent);letter-spacing:-1px;font-family:'Plus Jakarta Sans',sans-serif;}
.summary-panel{overflow-y:auto;flex:1;min-height:0;}
.copy-row-wrap{border-radius:8px;margin-bottom:6px;transition:.15s;}
.copy-row-wrap:hover{border-color:var(--accent);transform:translateX(2px);}
.copy-row-btn{border-radius:6px;padding:5px 12px;font-size:11px;}
.db-status.connected{color:var(--green);}
.db-status.error{color:var(--red);}

/* ══════════════════════ PROFESSIONAL DESIGN ENHANCEMENTS ══════════════════════ */

/* Refined sidebar */
.sidebar{
  border-right:1px solid rgba(255,255,255,.06);
  background:linear-gradient(180deg,rgba(10,14,26,.95) 0%,rgba(8,12,20,.98) 100%);
  box-shadow:4px 0 24px rgba(0,0,0,.4);
}
body.light .sidebar{
  background:linear-gradient(180deg,rgba(255,248,243,.97) 0%,rgba(253,245,239,.99) 100%);
  border-right:1px solid rgba(200,130,80,.15);
  box-shadow:4px 0 24px rgba(180,90,40,.06);
}

/* Logo polish */
.logo{
  padding:6px 10px 24px;
  border-bottom:1px solid rgba(255,255,255,.05);
  margin-bottom:8px;
}
body.light .logo{border-bottom-color:rgba(200,130,80,.12);}

/* Nav item refinements */
.nav-item{
  border-radius:6px;
  margin-bottom:1px;
  letter-spacing:.01em;
}
/* Active item becomes muted AND non-interactive */
.nav-item.active {
  background: var(--nav-active-bg);
  color: var(--muted);
  border: 1px solid var(--nav-active-border);
  font-weight: 600;
  opacity: 0.7;
  pointer-events: none;
}
.nav-item:hover{border-radius:6px;}

/* Sidebar divider */
.sidebar-divider{height:1px;background:rgba(255,255,255,.06);margin:8px 10px;border:none;}
body.light .sidebar-divider{background:rgba(180,90,40,.1);}

/* Refined profile card */
.sidebar-profile{border-radius:8px;transition:.2s;margin-top:auto;}
.sidebar-profile:hover{border-color:var(--accent);background:var(--card);}

/* Theme toggle refinement */
.theme-toggle{border-radius:8px;margin-top:4px;}

/* Refined stat cards */
.stat-card{border-radius:10px;transition:.22s cubic-bezier(.34,1.56,.64,1);}
.stat-card:hover{transform:translateY(-4px) scale(1.01);box-shadow:0 16px 40px rgba(0,0,0,.35),0 0 0 1px rgba(245,148,92,.15);}
.stat-card::after{content:'';position:absolute;inset:0;border-radius:10px;background:linear-gradient(135deg,rgba(255,255,255,.04) 0%,transparent 60%);pointer-events:none;}

/* Refined step cards */
.step-card{border-radius:10px;transition:.22s;}
.step-header{border-radius:10px;}
.step-card.open:not(.locked) .step-header{border-radius:10px 10px 0 0;}
.step-num{box-shadow:0 2px 8px rgba(0,0,0,.2);}

/* Refined buttons */
.btn{border-radius:8px;letter-spacing:.02em;}
.btn-save,.btn-primary{
  background:linear-gradient(135deg,#1a8fe8,#0164b8);
  box-shadow:0 3px 12px rgba(1,118,211,.35),inset 0 1px 0 rgba(255,255,255,.2);
}
.btn-save:hover,.btn-primary:hover{
  background:linear-gradient(135deg,#2299f8,#0176D3);
  box-shadow:0 6px 20px rgba(1,118,211,.45),inset 0 1px 0 rgba(255,255,255,.25);
  transform:translateY(-1px);
}
.btn-ghost{border-radius:8px;}
.btn-cancel,.btn-danger{border-radius:8px;}
.btn-draft,.btn-amber{border-radius:8px;}
.btn-green{border-radius:8px;}
.back-btn{border-radius:7px;}
.copy-btn,.copy-row-btn,.draft-resume{border-radius:6px;}
.filter-btn{border-radius:7px;}

/* Time In button — make it pop */
.btn-save.timein-btn{
  background:linear-gradient(135deg,#10b981,#059669);
  box-shadow:0 4px 16px rgba(16,185,129,.4),inset 0 1px 0 rgba(255,255,255,.25);
  font-size:14px;padding:12px 24px;letter-spacing:.03em;
}
.btn-save.timein-btn:hover{
  background:linear-gradient(135deg,#12c98c,#0aab74);
  box-shadow:0 8px 24px rgba(16,185,129,.5);
  transform:translateY(-2px);
}
.btn-danger.timeout-btn{
  border-radius:8px;
  box-shadow:0 2px 10px rgba(244,63,94,.2);
}
.btn-danger.timeout-btn:hover{transform:translateY(-1px);}

/* Time In/Out card */
.timeinout-card{
  background:var(--glass-bg);
  border:1px solid var(--glass-border);
  backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);
  box-shadow:var(--glass-shadow);
  border-radius:12px;
  padding:16px 20px;
  display:flex;align-items:center;gap:16px;flex-shrink:0;
  transition:.2s;
}

/* Refined type chooser buttons */
.pl-type-btn{
  border-radius:12px;
  padding:20px 22px;
  transition:.2s cubic-bezier(.34,1.56,.64,1);
  position:relative;overflow:hidden;
}
.pl-type-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.04) 0%,transparent 60%);border-radius:12px;pointer-events:none;}
.pl-type-btn:hover:not(:disabled){
  border-color:var(--accent);
  transform:translateY(-3px);
  box-shadow:0 10px 28px rgba(0,0,0,.2),0 0 0 1px rgba(1,118,211,.15);
}
.pl-type-icon{border-radius:10px;width:50px;height:50px;}

/* Refined modals */
.modal{border-radius:16px;padding:36px;}
.modal-bg{backdrop-filter:blur(12px);}

/* Refined input fields */
.inp{border-radius:8px;}
.inp:focus{box-shadow:0 0 0 3px rgba(1,118,211,.15);}
.search-inp{border-radius:9px;}
.search-inp:focus{box-shadow:0 0 0 3px rgba(1,118,211,.12);}

/* Refined radio/check */
.radio-label{border-radius:8px;}
.radio-label:hover{border-color:var(--accent);}
.check-label{border-radius:8px;}

/* Refined cards */
.quick-card{border-radius:12px;}
.quick-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,.25);}
.analytics-card{border-radius:12px;}
.case-card{border-radius:12px;}
.case-section{border-radius:8px;}
.announcement-card{border-radius:10px;}
.link-card{border-radius:10px;}
.activity-row{border-radius:8px;}
.right-panel{border-radius:12px;}
.toc-card{border-radius:12px;}
.auth-card{border-radius:16px;}
.profile-card{border-radius:12px;}
.entry-card{border-radius:10px;}
.stat-card{border-radius:12px;}
.copy-row-wrap{border-radius:8px;}
.copy-name{border-radius:8px;}

/* Session Time Log redesign - fully consistent cell widths */
.session-log-wrap {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  box-shadow: var(--glass-shadow);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
}

/* Header */
.session-log-header {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  padding: 18px 18px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(135deg, rgba(1,118,211,.08), rgba(1,84,160,.06));
}

/* Table header */
.session-log-table-head {
  display: grid;
  grid-template-columns: repeat(8, calc(100% / 8));
  background: rgba(1,118,211,.1);
  border-bottom: 2px solid rgba(1,118,211,.2);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--muted);
  font-family: 'Poppins', sans-serif;
}

.session-log-table-head > span {
  padding: 12px 12px;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.session-log-table-head > span:last-child {
  border-right: ;
}

/* Table body rows */
.session-log-row {
  display: grid;
  grid-template-columns: repeat(8, calc(100% / 8));
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  align-items: stretch;
  transition: .12s;
}

.session-log-row > * {
  padding: 9px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.session-log-row > *:last-child {
  border-right: none;
}

.session-log-row:hover {
  background: rgba(255,255,255,.03);
}

/* Status styling */
.session-log-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-family: 'Poppins', sans-serif;
  font-size: 11px;
}

.session-log-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.session-log-ongoing {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: var(--muted);
  font-style: italic;
}

/* Total row */
.session-log-total {
  display: grid;
  grid-template-columns: repeat(8, calc(100% / 8));
  background: linear-gradient(135deg, rgba(1,118,211,.08), rgba(1,84,160,.05));
}

.session-log-total > span {
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(1,118,211,.12);
}

.session-log-total > span:last-child {
  border-right: none;
}
/* Page-level header area */
.page-hero{
  background:var(--glass-bg);
  border:1px solid var(--glass-border);
  backdrop-filter:var(--glass-blur);-webkit-backdrop-filter:var(--glass-blur);
  border-radius:14px;padding:22px 24px;margin-bottom:24px;
  display:flex;align-items:center;justify-content:space-between;gap:16px;
  flex-wrap:wrap;
  box-shadow:var(--glass-shadow);
}

/* Draft/saved rows */
.saved-row{border-radius:10px;}
.draft-row{border-radius:10px;}
.case-card-header{border-radius:12px;}

/* Break bar */
.break-bar{border-radius:0;box-shadow:0 -4px 20px rgba(0,0,0,.25);}
.break-stop{border-radius:0;}

/* DB dot animation */
.db-dot.connected{animation:none;}

/* Toast refinement */
.toast{border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.4);}

/* Sidebar collapse button */
.sidebar-collapse-btn{border-radius:50%;width:22px;height:22px;}

/* Nav badge refinement */
.nav-badge{border-radius:4px;}

/* Form progress pill */
.form-progress-pill{border-radius:50px;padding:10px 18px;}

/* Alarm modal */
.alarm-modal{border-radius:16px;}

/* Right panel meta rows */
.meta-row{transition:.15s;}
.meta-row:hover{background:var(--card2);}

/* Field labels */
.field label{letter-spacing:.06em;}

/* Section titles */
.section-title{
  font-size:14px;font-weight:800;
  letter-spacing:-.2px;
  padding-bottom:10px;
  border-bottom:1px solid var(--border);
  margin-bottom:16px;
}

/* Edit modal */
.edit-modal{border-radius:16px;}

/* Saved case card accordion */
.case-expand-btn{border-radius:7px;}

/* Image thumbnails */
.img-thumb{border-radius:6px;}
.img-thumb-del{border-radius:4px;}
.img-zone{border-radius:10px;}
.img-add-zone{border-radius:6px;}
.img-edit-item{border-radius:6px;}
.img-edit-del{border-radius:4px;}

/* Copy name chip */
.copy-name{border-radius:8px;}
.copy-name-text{font-size:13px;}

/* Inline edit */
.inline-edit-inp{border-radius:7px;}
.inline-save-btn{border-radius:6px;}
.inline-cancel-btn{border-radius:6px;}

/* History case */
.case-entry-card{border-radius:8px;}

/* Highlight ongoing status pulse */
@keyframes ongoingPulse{0%,100%{opacity:1;}50%{opacity:.5;}}
.ongoing-dot{animation:ongoingPulse 1.8s ease-in-out infinite;}
.session-log-edit-btn{
  background:rgba(1,118,211,.12);border:1px solid rgba(1,118,211,.3);
  color:var(--accent);border-radius:4px;
  padding:4px 10px;font-size:10px;font-weight:700;
  font-family:'Poppins',sans-serif;letter-spacing:.3px;
  cursor:pointer;transition:.15s;white-space:nowrap;
}
.session-log-edit-btn:hover{background:var(--accent);color:#fff;border-color:var(--accent);}
.session-log-edit-btn:disabled{opacity:.35;cursor:not-allowed;}

/* Refined scrollbar */
::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-thumb{border-radius:8px;}

/* Page transition */
.main-area{animation:pageFade .18s ease;}
@keyframes pageFade{from{opacity:.7;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}

/* ── PERFECT ICON CENTERING (collapsed sidebar) ── */
.sidebar.collapsed .nav-item {
  padding: 10px 0 10px 16px !important;
  justify-content: flex-start !important;
  align-items: center !important;
  gap: 0 !important;
  overflow: visible !important;
}

.sidebar.collapsed .nav-icon-wrap {
  width: 20px !important;
  height: 20px !important;
  display: inline-flex !important;
  justify-content: center !important;
  align-items: center !important;
  flex-shrink: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: visible !important;
}

/* ══════════════════════ DASHBOARD — Figma rebuild ══════════════════════ */
.chd-dash{font-family:'Poppins',sans-serif;color:var(--text);display:flex;flex-direction:column;gap:10px;}
.chd-h4{font-family:'Moderustic',sans-serif;font-weight:700;font-size:24px;text-transform:uppercase;color:var(--text);line-height:1.2;}
.chd-h6{font-family:'Moderustic',sans-serif;font-weight:700;font-size:16px;text-transform:uppercase;color:var(--text);}
.chd-label{font-family:'Prompt',sans-serif;font-weight:700;font-size:10px;text-transform:uppercase;color:var(--text);letter-spacing:.2px;}
.chd-p{font-family:'Poppins',sans-serif;font-size:12px;color:var(--text);text-transform:capitalize;}
.chd-p-muted{font-family:'Poppins',sans-serif;font-size:12px;color:var(--muted);}
.chd-divider{height:3px;background:var(--card2);border-radius:100px;width:100%;margin:4px 0;}
.chd-greet-row{display:flex;gap:10px;align-items:stretch;width:100%;flex-wrap:wrap;}
.chd-greet-card{background:var(--card);border-radius:10px;padding:20px;display:flex;gap:14px;align-items:center;flex:1;min-width:280px;box-shadow:var(--shadow-sm);}
.chd-avatar{width:66px;height:66px;border-radius:100px;object-fit:cover;flex-shrink:0;background:var(--card2);}
.chd-mini-row{display:flex;gap:10px;}
.chd-mini-card{background:var(--card);border:1px solid var(--card2);border-radius:10px;box-shadow:var(--shadow-sm);padding:20px;display:flex;flex-direction:column;gap:8px;align-items:center;justify-content:center;min-width:96px;}
.chd-quick-row{display:flex;gap:10px;width:100%;flex-wrap:wrap;}
.chd-datetime-card{background:var(--card);border:1px solid var(--card2);border-radius:10px;box-shadow:var(--shadow-sm);padding:20px;min-width:280px;display:flex;flex-direction:column;gap:10px;}
.chd-datetime-row{display:flex;align-items:center;justify-content:space-between;font-family:'Moderustic',sans-serif;font-weight:700;font-size:24px;}
.chd-quickactions-card{background:var(--card);border:1px solid var(--card2);border-radius:10px;box-shadow:var(--shadow-sm);padding:20px;flex:1;min-width:320px;display:flex;flex-direction:column;gap:10px;}
.chd-qa-buttons{display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:center;width:100%;}
.chd-qa-left{display:flex;gap:10px;flex-wrap:wrap;}
.chd-btn-secondary{background:#fff;border:1px solid var(--text);border-radius:10px;box-shadow:var(--shadow-sm);padding:10px 20px;font-family:'Poppins',sans-serif;font-size:12px;color:var(--text);cursor:pointer;}
.chd-btn-primary{background:var(--text);border:1px solid #fff;border-radius:10px;box-shadow:var(--shadow-sm);padding:10px 20px;font-family:'Poppins',sans-serif;font-size:12px;color:#fff;cursor:pointer;}
.chd-main-row{display:flex;gap:10px;width:100%;align-items:flex-start;flex-wrap:wrap;}
.chd-totals-col{flex:1;min-width:420px;background:var(--card);border:1px solid var(--card2);border-radius:10px;box-shadow:var(--shadow-sm);padding:20px;display:flex;flex-direction:column;gap:10px;}
.chd-totalcards{display:flex;flex-wrap:wrap;gap:10px;width:100%;}
.chd-totalcard{flex:1;min-width:120px;background:#fff;border:1px solid var(--card2);border-radius:5px;box-shadow:var(--shadow-sm);padding:20px;display:flex;flex-direction:column;align-items:center;gap:8px;}
.chd-totalcard .chd-h4{font-size:24px;}
.chd-totalcard .chd-p{text-align:center;}
.chd-headline{display:flex;align-items:center;justify-content:space-between;width:100%;}
.chd-seeall{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--site-comment,#4760ff);cursor:pointer;background:none;border:none;font-family:'Poppins',sans-serif;padding:0;}
.chd-list-box{background:var(--card2);border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:10px;width:100%;max-height:260px;overflow-y:auto;}
.chd-ann-card{background:#fff;border:1px solid var(--card2);border-radius:10px;box-shadow:var(--shadow-sm);padding:20px;display:flex;flex-direction:column;gap:10px;}
.chd-case-card{background:#fff;border:1px solid var(--card2);border-radius:10px;box-shadow:var(--shadow-sm);padding:20px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;cursor:pointer;}
.chd-badge{border:1px solid #fff;border-radius:10px;padding:5px 10px;font-family:'Prompt',sans-serif;font-weight:700;font-size:10px;color:#fff;text-transform:uppercase;white-space:nowrap;}
.chd-empty{color:var(--muted);font-size:12px;text-align:center;padding:20px 0;}
.chd-charts-col{flex:1;min-width:340px;display:flex;flex-direction:column;gap:10px;}
.chd-chart-card{background:#fff;border:1px solid var(--card2);border-radius:10px;box-shadow:var(--shadow-sm);padding:20px;display:flex;flex-direction:column;gap:10px;width:100%;}
.chd-legend-row{display:flex;gap:14px;flex-wrap:wrap;}
.chd-legend-item{display:flex;align-items:center;gap:6px;font-family:'Prompt',sans-serif;font-weight:700;font-size:10px;text-transform:uppercase;color:var(--text);}
.chd-legend-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
.chd-donut-wrap{display:flex;align-items:center;gap:20px;justify-content:center;border:1px solid var(--card2);border-radius:10px;box-shadow:var(--shadow-sm);padding:20px;}
.chd-hbar-row{display:flex;align-items:center;gap:10px;width:100%;}
.chd-hbar-label{font-family:'Prompt',sans-serif;font-weight:700;font-size:10px;text-transform:uppercase;color:var(--text);width:90px;flex-shrink:0;}
.chd-hbar-track{flex:1;height:19px;border-radius:100px;background:var(--card2);overflow:hidden;}
.chd-hbar-fill{height:100%;border-radius:100px;transition:width .6s ease;}
@media (max-width:900px){.chd-main-row{flex-direction:column;}.chd-totals-col,.chd-charts-col{min-width:0;width:100%;}}

/* ══════════════════════ SHARED PAGE STYLES — Figma rebuild ══════════════════════ */
.chd-page-head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;width:100%;margin-bottom:6px;}
.chd-search-row{display:flex;gap:10px;flex-wrap:wrap;width:100%;margin-bottom:10px;}
.chd-search-inp{background:#fff;border:1px solid var(--border);border-radius:15px;padding:16px 23px;font-family:'Poppins',sans-serif;font-size:12px;color:var(--text);flex:1;min-width:220px;}
.chd-date-inp{background:#fff;border:1px solid var(--border);border-radius:15px;padding:16px 23px;font-family:'Poppins',sans-serif;font-size:12px;color:var(--text);}
.chd-radio-row{display:flex;gap:10px;flex-wrap:wrap;width:100%;margin-bottom:10px;}
.chd-radio-pill{background:#fff;border:1px solid var(--border);border-radius:15px;padding:10px 20px;display:flex;align-items:center;gap:10px;font-family:'Poppins',sans-serif;font-size:12px;color:var(--text);cursor:pointer;box-shadow:var(--shadow-sm);}
.chd-radio-pill.active{border-color:var(--text);font-weight:600;}
.chd-radio-dot{width:16px;height:16px;border-radius:50%;border:2px solid var(--text);flex-shrink:0;position:relative;}
.chd-radio-pill.active .chd-radio-dot::after{content:"";position:absolute;inset:3px;border-radius:50%;background:var(--text);}
.chd-accordion{width:100%;background:#fff;border-radius:10px;box-shadow:var(--shadow-sm);overflow:hidden;margin-bottom:10px;}
.chd-accordion-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:20px;cursor:pointer;flex-wrap:wrap;}
.chd-title-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.chd-row-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.chd-accordion-body{padding:0 20px 20px;border-top:2px solid var(--border);}
.chd-info-grid{display:flex;gap:10px;flex-wrap:wrap;padding-top:10px;}
.chd-info-card{flex:1;min-width:260px;background:var(--card2);border:1px solid var(--border);border-radius:5px;box-shadow:var(--shadow-sm);padding:20px;display:flex;flex-direction:column;gap:10px;}
.chd-info-cols{display:flex;gap:20px;flex-wrap:wrap;}
.chd-shots{display:flex;flex-wrap:wrap;gap:10px;}
.chd-shot{width:160px;height:160px;border:1px solid var(--border);border-radius:10px;box-shadow:var(--shadow-sm);overflow:hidden;cursor:zoom-in;}
.chd-shot img{width:100%;height:100%;object-fit:cover;}
.chd-empty-box{width:100%;text-align:center;padding:60px 20px;color:var(--muted);font-family:'Poppins',sans-serif;font-size:12px;}
.chd-table{width:100%;border-collapse:separate;border-spacing:0 10px;font-family:'Poppins',sans-serif;}
.chd-table th{font-family:'Prompt',sans-serif;font-weight:700;font-size:10px;text-transform:uppercase;color:var(--text);opacity:.6;text-align:center;padding:0 10px 6px;}
.chd-table td{padding:14px 10px;text-align:center;background:var(--card2);font-size:12px;color:var(--text);}
.chd-table tr td:first-child{border-radius:10px 0 0 10px;}
.chd-table tr td:last-child{border-radius:0 10px 10px 0;}
.chd-modal-bg{position:fixed;inset:0;background:rgba(64,81,59,.4);display:flex;align-items:center;justify-content:center;z-index:60;}
.chd-modal-card{background:#fff;border-radius:10px;padding:30px;max-width:380px;width:90%;text-align:center;box-shadow:var(--shadow);}
.chd-link-card{background:#fff;border:1px solid var(--border);border-radius:10px;box-shadow:var(--shadow-sm);padding:20px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}
.chd-link-grid{display:flex;flex-direction:column;gap:10px;width:100%;}
.chd-profile-card{background:#fff;border:1px solid var(--border);border-radius:10px;box-shadow:var(--shadow-sm);padding:20px;display:flex;flex-direction:column;gap:14px;width:100%;max-width:520px;}
.chd-profile-row{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}
.chd-field{display:flex;flex-direction:column;gap:6px;flex:1;min-width:160px;}
.chd-field input,.chd-field select{background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:10px 14px;font-family:'Poppins',sans-serif;font-size:12px;color:var(--text);}
.chd-big-btn{background:#fff;border:1px solid var(--border);border-radius:10px;box-shadow:var(--shadow-sm);padding:15px 20px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex:1;min-width:220px;cursor:pointer;}
.chd-big-btn-left{display:flex;align-items:center;gap:10px;text-align:left;}
.chd-big-btn-icon{background:var(--text);border-radius:10px;padding:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px;}

/* ══════════════════════ SIDEBAR — Figma icon rail ══════════════════════ */
.chd-sidebar{background:#fff;width:84px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;padding:40px 10px 20px;position:sticky;top:0;height:100vh;overflow-y:auto;z-index:5;border-right:2px solid #fff;box-shadow:var(--shadow-sm);}
.chd-sb-logo{width:64px;height:64px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;flex-shrink:0;background:var(--text);border-radius:14px;color:#fff;font-family:'Moderustic',sans-serif;font-weight:700;font-size:15px;}
.chd-sb-group{display:flex;flex-direction:column;gap:10px;align-items:center;width:100%;margin-bottom:18px;}
.chd-sb-grouplabel{font-family:'Prompt',sans-serif;font-weight:700;font-size:10px;text-transform:uppercase;color:var(--text);opacity:.6;}
.chd-sb-item{position:relative;display:flex;align-items:center;justify-content:center;width:100%;padding:15px 10px;border-radius:10px;cursor:pointer;color:var(--text);border-bottom:1px solid rgba(222,220,220,.5);background:none;border-left:none;border-right:none;border-top:none;}
.chd-sb-item.active{background:#fff;box-shadow:var(--shadow-sm);}
.chd-sb-item.active::after{content:"";position:absolute;right:-10px;top:50%;transform:translateY(-50%);width:3px;height:29px;background:var(--text);border-radius:10px 0 0 10px;}
.chd-sb-tip{position:absolute;left:44px;top:50%;transform:translateY(-50%);background:var(--card2);padding:6px 10px;border-radius:5px;font-family:'Prompt',sans-serif;font-weight:700;font-size:10px;text-transform:uppercase;color:var(--text);white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .15s ease;z-index:20;box-shadow:var(--shadow-sm);}
.chd-sb-item:hover .chd-sb-tip{opacity:1;}
.chd-sb-badge{position:absolute;top:6px;right:14px;background:var(--red);color:#fff;font-size:9px;font-weight:800;min-width:14px;height:14px;border-radius:20px;display:flex;align-items:center;justify-content:center;padding:0 3px;}
.chd-sb-dot{position:absolute;top:8px;right:16px;width:7px;height:7px;border-radius:50%;background:var(--amber);}
.chd-sb-bottom{margin-top:auto;display:flex;flex-direction:column;gap:8px;align-items:center;width:100%;padding-top:14px;}
.chd-sb-logout{width:100%;background:var(--red);color:#fff;border:1px solid var(--red);border-radius:10px;box-shadow:var(--shadow-sm);padding:12px 10px;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;}
`;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const cls = (...a) => a.filter(Boolean).join(" ");
// Collapse tabs and runs of multiple spaces down to a single space, and strip leading whitespace.
// Used on text inputs to prevent accidental long gaps from repeated spacebar presses or pasted text.
const cleanSpaces = (s) => (s||"").replace(/\t/g," ").replace(/ {2,}/g," ").replace(/^\s+/,"");

// ── DB Connection Status Hook ──
function useDbStatus() {
  const [status, setStatus] = useState("connecting"); // connecting | connected | error
  const [lastSaved, setLastSaved] = useState(null);
  const [latency, setLatency] = useState(null);

  const check = useCallback(async () => {
    const t0 = Date.now();
    try {
      const res = await fetch("/api/db-status", { method:"GET", signal: AbortSignal.timeout(5000) });
      const ms = Date.now() - t0;
      if (res.ok) {
        setStatus("connected");
        setLatency(ms);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
      setLatency(null);
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 15000); // re-check every 15s
    return () => clearInterval(interval);
  }, [check]);

  // expose a "markSaved" so operations can update lastSaved time
  const markSaved = useCallback(() => setLastSaved(new Date()), []);

  return { status, latency, lastSaved, markSaved, recheck: check };
}

function copyToClipboard(text) {
  if (navigator.clipboard?.writeText)
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  fallbackCopy(text); return Promise.resolve();
}
function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text; ta.style.cssText = "position:fixed;top:-9999px;opacity:0;";
  document.body.appendChild(ta); ta.focus(); ta.select();
  try { document.execCommand("copy"); } catch(e) {}
  document.body.removeChild(ta);
}
function fmtDT(d) {
  return d.toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
}
function fmtElapsed(s) {
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;
  return h>0?`${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}
async function checkGrammar(text) {
  if (!text.trim()) return {result:text,changes:0};
  try {
    const r = await fetch("/api/grammar",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({text})
    });
    if(!r.ok) return {result:text,changes:0};
    const d = await r.json();
    return {result:d.result||text, changes:d.changes||0};
  } catch { return {result:text,changes:0}; }
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if(!msg) return null;
  return <div className={cls("toast", type||"success")}>{msg}</div>;
}

function useToast() {
  const [toast,setToast] = useState({});
  const show = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast({}),2800); };
  return [toast, show];
}

function CopyName({ name, onCopy }) {
  const [c,setC] = useState(false);
  return (
    <div className="copy-name">
      <span className="copy-name-text">{name}</span>
      <button className={cls("copy-btn",c&&"green")}
        onClick={()=>copyToClipboard(name).then(()=>{setC(true);onCopy&&onCopy();setTimeout(()=>setC(false),1800);})}>
        {c?"✓ Copied!":"Copy"}
      </button>
    </div>
  );
}

// Step card — single-open: receives openStep/setOpenStep from parent
function StepCard({ num, title, children, done, locked, openStep, setOpenStep }) {
  const isOpen = openStep === num;
  const cardRef = useRef();
  const handleToggle = () => {
    if(locked) return;
    const opening = !isOpen;
    setOpenStep(opening ? num : null);
    if(opening){
      setTimeout(()=>{
        const el=cardRef.current||document.getElementById(`step-${num}`);
        const container=document.querySelector('.form-left');
        if(el && container){
          const elTop = el.getBoundingClientRect().top;
          const containerTop = container.getBoundingClientRect().top;
          const containerH = container.clientHeight;
          const elH = el.offsetHeight;
          // Center the card in the visible area
          const scrollOffset = container.scrollTop + (elTop - containerTop) - (containerH/2) + (elH/2);
          container.scrollTo({top: Math.max(0, scrollOffset), behavior:'smooth'});
        } else if(el){
          el.scrollIntoView({behavior:"smooth",block:"center"});
        }
      },40);
    }
  };
  return (
    <div id={`step-${num}`} ref={cardRef} className={cls("step-card", locked?"locked":"unlocked", done&&"done", isOpen&&!locked&&"open")}>
      <div className="step-header" onClick={handleToggle}>
        <div className="step-num" style={{position:"relative"}}>
          {done ? <span style={{fontSize:14}}>✓</span> : <span>{num}</span>}
          {!done&&!locked&&isOpen&&<span style={{position:"absolute",inset:-4,borderRadius:"50%",border:"2px solid var(--accent)",opacity:.4,animation:"pulse-ring 1.5s ease-in-out infinite"}}/>}
        </div>
        <div style={{flex:1}}>
          <div className="step-title">{title}</div>
          {done&&<div style={{fontSize:10,color:"var(--green)",fontWeight:600,marginTop:2,fontFamily:"'Poppins',sans-serif"}}>Complete ✓</div>}
          {locked&&<div style={{fontSize:10,color:"var(--muted)",marginTop:2,fontFamily:"'Poppins',sans-serif"}}>Complete previous step first</div>}
        </div>
        {locked
          ? <span className="step-lock-icon" style={{fontSize:14,opacity:.4}}>🔒</span>
          : <span className="step-chevron" style={{fontSize:11,background:"var(--card2)",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>▼</span>
        }
      </div>
      {isOpen&&!locked&&<div className="step-body" onClick={e=>e.stopPropagation()}>{children}</div>}
    </div>
  );
}

// Upload a single file to Supabase Storage — returns persistent URL
async function uploadImageToStorage(file, name) {
  const ext = file.name?.split(".").pop() || "png";
  const fileName = `${name}.${ext}`;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async(e) => {
      try {
        const res = await fetch("/api/images/upload", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ fileBase64: e.target.result, fileName, mimeType: file.type || "image/png" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        resolve({ url: data.url, path: data.path, name, id: data.path, _inDB: true });
      } catch(err) {
        console.warn("Storage upload failed:", err.message);
        resolve(null); // caller handles failure
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
// ── IndexedDB helpers: persist pending images across refreshes ──
const IDB_NAME = 'ch_pending_images';
const IDB_STORE = 'blobs';
const IDB_DIR_STORE = 'dirhandles';
const IDB_VERSION = 2;

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(IDB_DIR_STORE)) {
        db.createObjectStore(IDB_DIR_STORE, { keyPath: 'id' });
      }
    };
  });
}

// Persist the chosen directory handle in IDB so it survives page reloads.
// The browser retains the permission for the current session; we just need
// to remember WHICH folder was picked so we don't re-ask on every click.
async function idbSaveDirHandle(handle) {
  try {
    const db = await idbOpen();
    return new Promise((res, rej) => {
      const tx = db.transaction(IDB_DIR_STORE, 'readwrite');
      tx.objectStore(IDB_DIR_STORE).put({ id: 'savedDir', handle });
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  } catch(e) { /* IDB unavailable — non-fatal */ }
}

async function idbLoadDirHandle() {
  try {
    const db = await idbOpen();
    return new Promise((res) => {
      const tx = db.transaction(IDB_DIR_STORE, 'readonly');
      const req = tx.objectStore(IDB_DIR_STORE).get('savedDir');
      req.onsuccess = () => res(req.result?.handle || null);
      req.onerror = () => res(null);
    });
  } catch(e) { return null; }
}

async function idbClearDirHandle() {
  try {
    const db = await idbOpen();
    return new Promise((res) => {
      const tx = db.transaction(IDB_DIR_STORE, 'readwrite');
      tx.objectStore(IDB_DIR_STORE).delete('savedDir');
      tx.oncomplete = res; tx.onerror = res;
    });
  } catch(e) { /* non-fatal */ }
}

async function idbPutImage(id, file, meta = {}) {
  // 1. Read file FIRST (outside any IDB transaction)
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  // 2. Then open transaction and write
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const req = store.put({ id, data, name: file.name, type: file.type, meta });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGetImages(storeKey) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result || [];
      resolve(all.filter(item => item.meta.storeKey === storeKey));
    };
    req.onerror = () => reject(req.error);
  });
}

async function idbDeleteImage(id) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.onerror = () => reject(tx.error);
  });
}

async function idbClearImages(storeKey) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    // Use cursor to delete inside the same transaction safely
    const req = store.openCursor();
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        if (!storeKey || cursor.value.meta?.storeKey === storeKey) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}
// Upload an array of RAM images (blob URLs with .file attached) to Storage
// Used when a new case is finally saved
async function uploadPendingImages(images) {
  return Promise.all((images || []).map(async(img) => {
    if (img._inDB || !img._file) return img; // already in DB or no file to upload
    const uploaded = await uploadImageToStorage(img._file, img.name);
    return uploaded || img; // fallback to original if upload fails
  }));
}

// immediateUpload=true  → upload to Storage right away (editing an already-saved case)
// ── Persistent directory handle — module-level, lives for the whole page session ──
// One handle is shared by all tabs/components. A lock prevents "picker already active".
let _savedDirHandle = null;
let _pickerOpen = false; // prevents concurrent showDirectoryPicker calls
function resetSessionDir() { _savedDirHandle = null; }
async function getOrPickDir() {
  // Already have a valid handle — return immediately, no picker needed
  if (_savedDirHandle) return _savedDirHandle;
  // Another call already opened the picker — wait for it to finish
  if (_pickerOpen) {
    await new Promise(res => {
      const interval = setInterval(() => {
        if (!_pickerOpen) { clearInterval(interval); res(); }
      }, 100);
    });
    if (_savedDirHandle) return _savedDirHandle;
  }
  // Open the picker exactly once
  _pickerOpen = true;
  try {
    _savedDirHandle = await window.showDirectoryPicker({ mode: "readwrite", startIn: "downloads" });
    return _savedDirHandle;
  } finally {
    _pickerOpen = false;
  }
}
function ImageUpload({ baseName, multiple, onImages, immediateUpload=false, initialImages=[], caseNum="", businessName="", storageKey="default", isActive=false }) {
  // Filter out dead blob URLs that may come from server-saved drafts
  const validInitial = (initialImages || []).filter(img => !img.url?.startsWith('blob:'));
  const [images,setImages] = useState(()=>validInitial||[]);
  const [drag,setDrag] = useState(false);
  const [uploading,setUploading] = useState(false);
  const ref = useRef(); 
  const imgRef = useRef(images);
  useEffect(()=>{imgRef.current=images;},[images]);

  // Restore pending images from IndexedDB on mount (only for non-immediate upload)
  useEffect(() => {
    if (immediateUpload) return;
    let cancelled = false;
    idbGetImages(storageKey).then(stored => {
      if (cancelled) return;
      if (stored.length === 0 && validInitial.length === 0) return;
      const restored = stored.map(s => {
        const file = dataURLtoFile(s.data, s.name || 'image.png');
        return {
          id: s.id,
          url: URL.createObjectURL(file),
          name: s.meta.name || s.name,
          _file: file,
          _inDB: false,
          _fromIDB: true,
        };
      });
      // Merge valid initial images with restored pending images
      const existingIds = new Set(validInitial.map(i => i.id));
      const merged = [...validInitial, ...restored.filter(r => !existingIds.has(r.id))];
      setImages(merged);
      onImages && onImages(merged);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [immediateUpload, storageKey]); // intentional: do NOT re-run when initialImages changes

  // Sync if parent passes new initialImages (e.g. draft restore)
  const prevInit = useRef(initialImages);
  useEffect(()=>{
    const freshValid = (initialImages || []).filter(img => !img.url?.startsWith('blob:'));
    const hasNew = freshValid.some(img => !images.some(existing => existing.id === img.id));
    if(freshValid.length>0 && prevInit.current !== initialImages && (images.length===0 || hasNew)){
      const merged = [...images, ...freshValid.filter(img => !images.some(existing => existing.id === img.id))];
      setImages(merged); 
      imgRef.current=merged; 
      prevInit.current=initialImages;
      onImages && onImages(merged);
    }
  },[initialImages]);

  const addFiles = useCallback(async(files) => {
    const cur = imgRef.current;
    setUploading(true);
    try {
      let next;
      if (immediateUpload) {
        const uploaded = await Promise.all(
          Array.from(files).map((f, i) => {
            const name = multiple ? `backup-screenshot-${cur.length + i + 1}` : baseName;
            return uploadImageToStorage(f, name);
          })
        );
        const valid = uploaded.filter(Boolean);
        next = multiple ? [...cur, ...valid] : valid.slice(0, 1);
        idbClearImages(storageKey).catch(() => {});
      } else {
        const arr = Array.from(files).map((f, i) => {
          const id = `ram-${Date.now()}-${i}`;
          // Persist to IndexedDB so images survive page refresh
          idbPutImage(id, f, { name: multiple ? `backup-screenshot-${cur.length + i + 1}` : baseName, caseNum, storeKey: storageKey });
          return {
            _file: f,
            url: URL.createObjectURL(f),
            name: multiple ? `backup-screenshot-${cur.length + i + 1}` : baseName,
            id,
            _inDB: false,
          };
        });
        next = multiple ? [...cur, ...arr] : arr.slice(0, 1);
      }
      setImages(next); 
      onImages && onImages(next);
    } finally { 
      setUploading(false); 
    }
  }, [baseName, multiple, onImages, immediateUpload, caseNum, storageKey]);

  const remove = (id) => { 
    const n = imgRef.current.filter(i => i.id !== id); 
    setImages(n); 
    onImages && onImages(n); 
    idbDeleteImage(id).catch(() => {});
  };

  const dl = async(img) => {
    const urlExt = (img.url||"").split("?")[0].split(".").pop().toLowerCase();
    const safeExt = ["jpg","jpeg","png","gif","webp"].includes(urlExt) ? urlExt : "png";
    const baseName = (img.name||"screenshot").replace(/\.[^/.]+$/,"");
    const fileName = `${baseName}.${safeExt}`;
    if (window.showDirectoryPicker) {
      try {
        const dir = await getOrPickDir();
        const fh = await dir.getFileHandle(fileName, { create: true });
        const wr = await fh.createWritable();
        // Fetch blob — handle both http URLs and blob: URLs
        let blob;
        if (img._file) {
          blob = img._file;
        } else if (img.url?.startsWith("blob:")) {
          const r = await fetch(img.url);
          blob = await r.blob();
        } else {
          const r = await fetch(img.url);
          if (!r.ok) throw new Error("fetch failed: " + r.status);
          blob = await r.blob();
        }
        await wr.write(blob);
        await wr.close();
        showToast && showToast(`✅ Saved: ${fileName}`, "success");
        return;
      } catch(e) {
        if (e.name === "AbortError") return; // user cancelled folder picker
        // If folder picker failed (permission issue), reset so next click asks again
        if (e.name === "SecurityError") {
          resetSessionDir();
        }
        // Fallthrough to <a> download as fallback
      }
    }
    // Fallback: browser download
    const a = document.createElement("a"); a.href = img.url; a.download = fileName; a.click();
  };

  useEffect(() => {
    // Only capture paste events when this upload accordion is the active/open one
    if(!isActive) return;
    const h = (e) => { 
      // Don't intercept if user is typing in an input/textarea
      const tag=(document.activeElement?.tagName||"").toLowerCase();
      if(tag==="input"||tag==="textarea") return;
      const items = Array.from(e.clipboardData?.items||[]).filter(i=>i.kind==="file"); 
      if(items.length){ e.preventDefault(); addFiles(items.map(i=>i.getAsFile())); }
    };
    window.addEventListener("paste", h); 
    return () => window.removeEventListener("paste", h);
  }, [addFiles, isActive]);

  return (
    <div>
      <div className={cls("img-zone", drag&&"drag")} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files);}} onClick={()=>!uploading&&ref.current?.click()}>
        <input ref={ref} type="file" accept="image/*" multiple={multiple} onChange={e=>addFiles(e.target.files)} style={{pointerEvents:"none"}}/>
        <div style={{fontSize:28,marginBottom:8}}>{uploading ? <Icon name="loading" size={28} color="var(--accent)"/> : <Icon name="image" size={28} color="var(--muted)"/>}</div>
        <div style={{fontSize:13,color:"var(--muted)"}}>
          {uploading
            ? (immediateUpload ? "Uploading to database…" : "Preparing image…")
            : <span>Click, drag-drop, or <kbd style={{background:"var(--border)",padding:"1px 6px",borderRadius:4,fontSize:10}}>Ctrl+V</kbd> to paste</span>
          }
        </div>
        <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>
          {immediateUpload
            ? <>Saved as: <span style={{color:"var(--accent)",fontWeight:600}}>{baseName}</span></>
            : <>Name on save: <span style={{color:"var(--accent)",fontWeight:600}}>{baseName}</span> · <span style={{color:"var(--amber)"}}>⏳ uploads when case is saved</span></>
          }
        </div>
      </div>
      {images.length > 0 && (
        <div className="img-thumb-row">
          {images.map(img => (
            <div key={img.id} style={{display:"flex",flexDirection:"column",alignItems:"flex-start"}}>
              <div className="img-thumb" style={{position:"relative"}}>
                <img src={img.url} alt=""/>
                <button className="img-thumb-del" onClick={()=>remove(img.id)}>✕</button>
                {img._inDB && <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(16,185,129,.85)",color:"#fff",fontSize:9,textAlign:"center",padding:"1px 0"}}>✓ in DB</div>}
                {!img._inDB && <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(245,158,11,.85)",color:"#fff",fontSize:9,textAlign:"center",padding:"1px 0"}}>⏳ on save</div>}
              </div>
              <button className="img-dl-btn" onClick={()=>dl(img)}>⬇ Save</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EntryCard({ entry, label, index, onChange, onDelete, showNumber, onDragHandlePointerDown, isDragging }) {
  const [checking,setChecking]=useState(null);
  // New entries start in edit mode; saved entries start locked
  const [saved,setSaved]=useState(!!entry._saved);
  const ai=async(field)=>{ if(!entry[field]?.trim())return; setChecking(field); const {result,changes}=await checkGrammar(entry[field]); onChange({...entry,[field]:result}); setChecking(changes>0?`fixed-${field}`:null); setTimeout(()=>setChecking(null),2000); };
  const handleSave=()=>{ setSaved(true); onChange({...entry,_saved:true}); };
  const handleEdit=()=>{ setSaved(false); onChange({...entry,_saved:false}); };

  return (
    <div className={cls("entry-card entry-card-wrap",saved&&"saved")} style={{opacity:isDragging?0.3:1,transition:"opacity .1s"}}>
      <div className="entry-header">
        {/* Drag handle — pointer down here starts drag */}
        <div className="drag-handle" title="Drag to reorder"
          onPointerDown={ev=>{ev.stopPropagation();onDragHandlePointerDown&&onDragHandlePointerDown(ev);}}>
          <span/><span/><span/>
        </div>
        <span className="entry-label" style={{flex:1}}>{showNumber?`${label} #${entry.number||(index+1)}`:label}</span>
        {saved
          ? <button className="h-btn" style={{fontSize:11,padding:"3px 10px",borderColor:"var(--accent)",color:"var(--accent)"}} onClick={handleEdit}><Icon name="edit" size={11} style={{marginRight:4}}/>Edit</button>
          : <button className="btn btn-primary" style={{fontSize:11,padding:"4px 12px"}} onClick={handleSave}><Icon name="save" size={11} style={{marginRight:4}}/>Save</button>
        }
        {(showNumber||(index>0))&&<button className="entry-del" onClick={onDelete}><Icon name="trash" size={13} color="var(--red)"/></button>}
      </div>
      {saved ? (
        <div className="entry-saved-preview">
          {entry.number&&<div style={{fontSize:11,color:"var(--muted)",marginBottom:4}}>#{entry.number}</div>}
          {entry.note ? <div>{entry.note}</div> : <em>No note</em>}
          {entry.clarification&&<div style={{marginTop:6,paddingTop:6,borderTop:"1px solid var(--border)",color:"var(--muted)",fontSize:12}}>{entry.clarification}</div>}
        </div>
      ) : (
        <>
          {showNumber&&(<div className="field"><label>Number <span className="req">*</span></label><input draggable={false} className="inp" placeholder="e.g. 25" value={entry.number} onChange={e=>onChange({...entry,number:e.target.value})}/></div>)}
          <div className="field"><label>Note (optional)</label><textarea draggable={false} className="inp" rows={3} value={entry.note} onChange={e=>onChange({...entry,note:e.target.value})} placeholder="Describe what was done or assumed..."/><div className="ai-row"><button className="ai-btn" disabled={!entry.note?.trim()||checking==="note"} onClick={()=>ai("note")}>{checking==="note"?"Checking...":(checking===`fixed-note`?"✓ Fixed!":"Grammar Check")}</button></div></div>
          <div className="field"><label>Clarification (optional)</label><textarea draggable={false} className="inp" rows={3} value={entry.clarification} onChange={e=>onChange({...entry,clarification:e.target.value})} placeholder="Confirmation or extra details..."/><div className="ai-row"><button className="ai-btn" disabled={!entry.clarification?.trim()||checking==="clarification"} onClick={()=>ai("clarification")}>{checking==="clarification"?"Checking...":(checking===`fixed-clarification`?"✓ Fixed!":"Grammar Check")}</button></div></div>
        </>
      )}
    </div>
  );
}

function CopyRow({ label, value, groupColor, groupBorder }) {
  const [c,setC]=useState(false);
  const empty = !value || !value.trim();
  const handleClick = () => {
    if(empty) return;
    copyToClipboard(value).then(()=>{setC(true);setTimeout(()=>setC(false),1800);});
  };
  return (
    <div
      className="copy-row-wrap"
      onClick={handleClick}
      title={empty ? undefined : "Click to copy"}
      style={{cursor: empty ? "default" : "pointer", userSelect:"none", position:"relative", ...(groupColor?{background:groupColor}:{}), ...(groupBorder?{borderColor:groupBorder}:{})}}
    >
      <div className="copy-row-label" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span>{label}</span>
        {!empty && <span style={{fontSize:10,opacity:c?1:0.45,color:c?"var(--green)":"var(--muted)",transition:"opacity .2s",fontWeight:700}}>{c?"✓ Copied":"Copy"}</span>}
      </div>
      {empty ? (
        <div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",padding:"3px 0"}}>—</div>
      ) : (
        <div className="copy-row-val">{value}</div>
      )}
    </div>
  );
}

// ── CopyCaseBtn — tiny inline copy icon for session log case numbers ──
function CopyCaseBtn({ caseNum }) {
  const [copied,setCopied]=useState(false);
  const handleClick=(e)=>{
    e.stopPropagation();
    copyToClipboard(caseNum).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1500);});
  };
  return (
    <button onClick={handleClick} title="Copy case number" style={{background:"none",border:"none",cursor:"pointer",padding:"0 2px",color:copied?"var(--green)":"var(--muted)",fontSize:10,lineHeight:1,transition:"color .2s",flexShrink:0,display:"inline-flex",alignItems:"center"}}>
      {copied?"✓":"Copy"}
    </button>
  );
}

// ── GreetingRow — multi-message panel in Live Summary ──
function GreetingRow({ greetingMessages, caseNum, inboundNum, isSC }) {
  const DEFAULT_MSGS = [{ id:"default", label:"Check-in", base:"Hi po Ms. Tina, magpapacheck lang po", fillType:"caseNum" }];
  const msgs = (greetingMessages&&greetingMessages.length>0) ? greetingMessages : DEFAULT_MSGS;
  const [copiedId,setCopiedId]=useState(null);

  // Build the filled message — radio picks which number(s) to insert
  const buildMsg=(m)=>{
    const b=(m.base||m.template||"Hi po Ms. Tina, magpapacheck lang po").trim();
    if(m.fillType==="none")        return b;
    if(m.fillType==="siteComment") return `${b} Site Comment #${caseNum||"—"}`;
    if(m.fillType==="caseNum")     return `${b} Case #${caseNum||"—"}`;
    if(m.fillType==="inbound")     return `${b} Inbound #${inboundNum||"—"}`;
    return `${b} Case #${caseNum||"—"}`;
  };

  const copy=(m)=>{
    const txt=buildMsg(m);
    copyToClipboard(txt).then(()=>{setCopiedId(m.id);setTimeout(()=>setCopiedId(null),1800);});
  };

  if(!caseNum) return null;

  return (
    <div className="copy-row-wrap" style={{paddingBottom:10,background:"rgba(1,118,211,.07)",borderColor:"rgba(1,118,211,.22)"}}>
      <div className="copy-row-label" style={{marginBottom:8}}>Messages</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {msgs.map(m=>(
          <button
            key={m.id}
            onClick={()=>copy(m)}
            title={buildMsg(m)}
            style={{
              padding:"4px 12px",
              borderRadius:20,
              border:`1px solid ${copiedId===m.id?"var(--green)":"rgba(1,118,211,.35)"}`,
              background:copiedId===m.id?"rgba(16,185,129,.12)":"rgba(1,118,211,.1)",
              color:copiedId===m.id?"var(--green)":"var(--accent)",
              fontSize:11,fontWeight:600,cursor:"pointer",
              fontFamily:"'Poppins',sans-serif",
              transition:".18s",userSelect:"none",
              whiteSpace:"nowrap",
            }}
          >
            {copiedId===m.id?"✓ Copied":m.label||"Message"}
          </button>
        ))}
      </div>
    </div>
  );
}

function StickyPanel({ startTimeRef, form, isSC, buildEntriesText, buildEmailText, onTimerEnd, onQaTimerEnd, specialRequestors, timerLimitSecs, qaTimerLimitSecs=600, greetingMessages, footerElapsed=0, phase2Elapsed=null }) {
  const [elapsed,setElapsed]=useState(0);
  const [now,setNow]=useState(new Date());
  const firedRef=useRef(false);
  const qaFiredRef=useRef(false);
  const [dlState,setDlState]=useState("idle"); // idle | downloading | done | error
  const summaryPanelRef=useRef(null);

  const scrollToGroup = useCallback((id) => {
    const panel = summaryPanelRef.current;
    const el = document.getElementById(id);
    if (el && panel) {
      const offset = el.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop;
      panel.scrollTo({ top: Math.max(0, offset - 8), behavior: 'smooth' });
    }
  }, []);

  // Display-only sync — alarm firing now happens at the PostLivePage parent level
  // (more reliable across mount/queue/activation cycles, since it's keyed off the same
  // tabTimerStates that already drives the tab strip and TimerBar). This effect just
  // keeps StickyPanel's own visual clock in sync; it does not fire any alarm itself.
  useEffect(()=>{
    setElapsed(footerElapsed);
    setNow(new Date());
  },[footerElapsed]);
  // form is real React state — re-renders on every form change, images update instantly
  const f=form;
  const emailTypeLabel=f.emailType==="clarification"?"Clarification":"Completed";
  const allImages=[...(f.images||[]),...(f.backupImages||[])];

  // Color dot nav entries — only show dots for visible groups
  const navDots = [
    { id:'sum-g-caseinfo',  color:'#0176D3', label:'Case Info',     abbr:'CI'  },
    ...(f.customerName||f.customerEmail||f.businessName ? [{ id:'sum-g-customer', color:'#f59e0b', label:'Customer Info', abbr:'CU'  }] : []),
    { id:'sum-g-amends',   color:'#f5945c', label:'Amends Copy',  abbr:'AC'  },
    ...(f.caseNum ? [{ id:'sum-g-messages', color:'#38bdf8', label:'Messages',     abbr:'MSG' }] : []),
    ...(!isSC ? [{ id:'sum-g-email', color:'#a78bfa', label:'Email',          abbr:'EM'  }] : []),
  ];

  return (
    <div className="right-panel">
      <div className="right-panel-header">
        <span style={{fontSize:16,marginRight:8}}>📊</span> Live Summary
        {f.caseNum&&<span style={{marginLeft:"auto",fontSize:11,fontWeight:600,color:"var(--accent)",background:"var(--entry-accent-bg)",padding:"2px 10px",borderRadius:20,border:"1px solid rgba(1,118,211,.2)"}}>#{f.caseNum}</span>}
      </div>

      {/* ── Body: summary content + right-side dot rail ── */}
      <div style={{display:"flex",flex:1,minHeight:0,overflow:"hidden"}}>

      <div className="summary-panel" ref={summaryPanelRef} style={{flex:1,minWidth:0}}>
        {/* ── GROUP 1: Case Info (blue) ── */}
        <div id="sum-g-caseinfo" style={{marginBottom:10}}>
          <div style={{fontSize:9,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6,paddingLeft:2,opacity:.7}}>Case Info</div>
          <CopyRow label="Account #" value={f.accountNum} groupColor="rgba(1,118,211,.13)" groupBorder="rgba(1,118,211,.28)"/>
          <CopyRow label="Case #" value={f.caseNum} groupColor="rgba(1,118,211,.13)" groupBorder="rgba(1,118,211,.28)"/>
          {!isSC&&<CopyRow label="Inbound #" value={f.inboundNum} groupColor="rgba(1,118,211,.13)" groupBorder="rgba(1,118,211,.28)"/>}
          <CopyRow label="Amend Type" value={f.amendType} groupColor="rgba(1,118,211,.13)" groupBorder="rgba(1,118,211,.28)"/>
        </div>
        {/* ── GROUP 2: Customer Info (amber) — only if any filled ── */}
        {(f.customerName||f.customerEmail||f.businessName)&&(
          <div id="sum-g-customer" style={{marginBottom:10}}>
            <div style={{fontSize:9,fontWeight:700,color:"var(--amber)",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6,paddingLeft:2,opacity:.7}}>Customer Info</div>
            {f.customerName&&<CopyRow label="Customer Name" value={f.customerName} groupColor="rgba(245,158,11,.1)" groupBorder="rgba(245,158,11,.3)"/>}
            {f.customerEmail&&<CopyRow label="Customer Email" value={f.customerEmail} groupColor="rgba(245,158,11,.1)" groupBorder="rgba(245,158,11,.3)"/>}
            {f.businessName&&<CopyRow label="Business Name" value={f.businessName+(f.businessSuffix?' '+f.businessSuffix:'')} groupColor="rgba(245,158,11,.1)" groupBorder="rgba(245,158,11,.3)"/>}
          </div>
        )}
        {/* ── GROUP 3: Amends Copy (orange-accent) ── */}
        <div id="sum-g-amends" style={{marginBottom:10}}>
          <div style={{fontSize:9,fontWeight:700,color:"rgb(245,148,92)",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6,paddingLeft:2,opacity:.7}}>Amends Copy</div>
          <CopyRow label={isSC?"Site Comments":"Assumptions"} value={isSC?buildEntriesText():buildEmailText()} groupColor="rgba(245,148,92,.1)" groupBorder="rgba(245,148,92,.3)"/>
          {(()=>{
            const entries=f.entries.filter(e=>e.clarification&&e.clarification.trim());
            if(!entries.length)return null;
            const clarifLines=isSC
              ?entries.map(e=>`Site Comment #${e.number}: ${e.clarification.trim()}`).join("\n\n")
              :entries.map(e=>e.clarification.trim()).join("\n\n");
            return <CopyRow label="Email Format" value={clarifLines} groupColor="rgba(245,148,92,.1)" groupBorder="rgba(245,148,92,.3)"/>;
          })()}
        </div>
        {/* ── GROUP 4: Messages (blue chips) ── */}
        {f.caseNum&&(
          <div id="sum-g-messages" style={{marginBottom:10}}>
            <div style={{fontSize:9,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6,paddingLeft:2,opacity:.7}}>Messages</div>
            <GreetingRow greetingMessages={greetingMessages} caseNum={f.caseNum} inboundNum={f.inboundNum} isSC={isSC}/>
          </div>
        )}
        {/* ── GROUP 5: Email (purple) — inbound only ── */}
        {!isSC&&(
          <div id="sum-g-email" style={{marginBottom:10}}>
            <div style={{fontSize:9,fontWeight:700,color:"#a78bfa",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6,paddingLeft:2,opacity:.7}}>Email</div>
            <CopyRow label="Email Type" value={emailTypeLabel} groupColor="rgba(124,58,237,.1)" groupBorder="rgba(124,58,237,.3)"/>
            <CopyRow label="Email Address" value={f.emailAddress} groupColor="rgba(124,58,237,.1)" groupBorder="rgba(124,58,237,.3)"/>
          </div>
        )}
        {allImages.length > 0 && (
  <div
    className="copy-row-wrap"
    style={{
      cursor: dlState==="downloading"?"wait":"pointer",
      border: dlState==="done"?"1px solid var(--green)":dlState==="error"?"1px solid var(--red)":"",
      transition:".25s",
    }}
    onClick={async () => {
      if(dlState==="downloading") return;
      setDlState("downloading");
      try {
        const bizPart = (f.businessName || "").trim();
        const cx=(f._caseComplexity||"minor");const cxLabel=cx==="major"?"Major":cx==="complex"?"Complex":"Minor";const folderName = `${cxLabel} ${f.caseNum||"unknown"}${bizPart?" "+bizPart:""}`
          .replace(/[^a-zA-Z0-9 _()-]/g, "").replace(/\s+/g," ").trim();

        // Helper: get blob — prefer _file (in-memory), fallback fetch
        const getBlob = async (img) => {
          if (img._file instanceof File || img._file instanceof Blob) return img._file;
          const r = await fetch(img.url); return r.blob();
        };

        if (window.showDirectoryPicker) {
          // Must call getOrPickDir immediately (first await) to preserve user-gesture context
          let rootDir;
          try { rootDir = await getOrPickDir(); }
          catch (err) {
            if (err.name === "AbortError"){ setDlState("idle"); return; }
            // Permission/security error — reset cached handle so next click re-asks
            if (err.name === "SecurityError") { resetSessionDir(); }
            throw err; // re-throw so outer catch shows error state
          }

          const caseDir = await rootDir.getDirectoryHandle(folderName, { create: true });
          for (const img of allImages) {
            try {
              const urlExt = (img.url || "").split("?")[0].split(".").pop().toLowerCase();
              const safeExt = ["jpg","jpeg","png","gif","webp"].includes(urlExt) ? urlExt : "png";
              const baseName = (img.name || "screenshot").replace(/\.[^/.]+$/, "");
              const blob = await getBlob(img);
              const fh = await caseDir.getFileHandle(`${baseName}.${safeExt}`, { create: true });
              const wr = await fh.createWritable();
              await wr.write(blob);
              await wr.close();
            } catch (imgErr) { console.warn("img failed:", imgErr); }
          }
          setDlState("done"); setTimeout(()=>setDlState("idle"),3000);
          return;
        }

        // Fallback for browsers without File System API (Firefox etc): individual <a> downloads — no zip
        for (const img of allImages) {
          try {
            const urlExt = (img.url||"").split("?")[0].split(".").pop().toLowerCase();
            const safeExt = ["jpg","jpeg","png","gif","webp"].includes(urlExt) ? urlExt : "png";
            const baseName = (img.name || "screenshot").replace(/\.[^/.]+$/,"");
            const blob = await getBlob(img);
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${baseName}.${safeExt}`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
          } catch (err) { console.warn("img failed:", err); }
        }
        setDlState("done"); setTimeout(()=>setDlState("idle"),3000);
      } catch (err) {
        console.error("Bulk download failed:", err);
        setDlState("error"); setTimeout(()=>setDlState("idle"),3000);
      }
    }}
  >
    <div className="copy-row-label">
      Screenshots ({allImages.length})
    </div>

    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
      {allImages.map((img) => (
        <div
          key={img.id}
          style={{
            width: 68,
            height: 52,
            borderRadius: 6,
            overflow: "hidden",
            border: img._inDB ? "1.5px solid var(--green)" : "1.5px solid var(--amber)",
            position: "relative",
          }}
        >
          <img
            src={img.url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: img._inDB ? "rgba(16,185,129,.85)" : "rgba(245,158,11,.85)",
            color: "#fff", fontSize: 8, textAlign: "center",
            padding: "2px 0", fontWeight: 700, letterSpacing: ".3px",
          }}>
            {img._inDB ? "✓ SAVED" : "⏳ ON SAVE"}
          </div>
        </div>
      ))}
    </div>

    {/* 👇 STATUS TEXT */}
    <div style={{marginTop:6,fontSize:11,fontWeight:700,textAlign:"center",transition:".2s",
      color: dlState==="done"?"var(--green)":dlState==="downloading"?"var(--accent)":dlState==="error"?"var(--red)":"var(--muted)",
    }}>
      {dlState==="done"   && "✅ Download Complete!"}
      {dlState==="downloading" && "⏳ Downloading…"}
      {dlState==="error"  && "❌ Download failed"}
      {dlState==="idle"   && "Click to download All"}
    </div>
  </div>
)}
      </div>

      {/* ── Right-side color dot rail ── */}
      <div style={{
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        gap:10,padding:"10px 4px",
        borderLeft:"1px solid var(--border)",
        background:"var(--card)",
        flexShrink:0,width:28,
      }}>
        {navDots.map(dot=>(
          <button
            key={dot.id}
            onClick={()=>scrollToGroup(dot.id)}
            title={dot.label}
            style={{
              display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              background:"none",border:"none",padding:"3px 2px",
              cursor:"pointer",flexShrink:0,
              borderRadius:6,
              transition:".15s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.background=`${dot.color}18`;}}
            onMouseLeave={e=>{e.currentTarget.style.background="none";}}
          >
            <span style={{
              width:9,height:9,borderRadius:"50%",
              background:dot.color,
              display:"inline-block",flexShrink:0,
              opacity:.7,
              transition:".15s",
            }}/>
            <span style={{
              fontSize:7,fontWeight:800,
              color:dot.color,
              letterSpacing:".4px",
              lineHeight:1,
              fontFamily:"'Poppins',sans-serif",
              opacity:.8,
            }}>{dot.abbr}</span>
          </button>
        ))}
      </div>

      </div>{/* closes flex body wrapper */}
    </div>
  );
}


// ─── Flat SVG Icon System ──────────────────────────────
function Icon({ name, size=16, color="currentColor", style={} }) {
  const [mounted,setMounted]=useState(false);
  useEffect(()=>setMounted(true),[]);
  const s = { width:size, height:size, display:"inline-block", flexShrink:0, ...style };
  const sp = { display:"inline-flex",alignItems:"center",verticalAlign:"middle",flexShrink:0,width:size,height:size };
  if(!mounted) return <span style={sp}/>;
  const icons = {
    dashboard:    <svg viewBox="0 0 16 16" fill="none" style={s}><rect x="1" y="1" width="6" height="6" fill={color}/><rect x="9" y="1" width="6" height="6" fill={color} opacity=".5"/><rect x="1" y="9" width="6" height="6" fill={color} opacity=".5"/><rect x="9" y="9" width="6" height="6" fill={color} opacity=".25"/></svg>,
    postlive:     <svg viewBox="0 0 16 16" fill="none" style={s}><rect x="2" y="2" width="12" height="12" rx="0" stroke={color} strokeWidth="1.5"/><path d="M5 8.5l2.5 2.5L11 6" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    prelive:      <svg viewBox="0 0 16 16" fill="none" style={s}><rect x="2" y="2" width="12" height="12" stroke={color} strokeWidth="1.5"/><path d="M5 8h6M8 5v6" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    history:      <svg viewBox="0 0 16 16" fill="none" style={s}><circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5"/><path d="M8 5v3.5l2.5 1.5" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    announcements:<svg viewBox="0 0 16 16" fill="none" style={s}><path d="M3 6h2v5H3V6zM5 6l7-4v13L5 11V6z" fill={color} opacity=".8"/><rect x="8" y="12" width="2" height="3" rx="1" fill={color}/></svg>,
    links:        <svg viewBox="0 0 16 16" fill="none" style={s}><path d="M6 9.5a3.5 3.5 0 004.95-4.95L9.54 3.15A3.5 3.5 0 004.6 8.1" stroke={color} strokeWidth="1.5" strokeLinecap="square"/><path d="M10 6.5a3.5 3.5 0 00-4.95 4.95l1.41 1.4A3.5 3.5 0 0011.4 7.9" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    profile:      <svg viewBox="0 0 16 16" fill="none" style={s}><circle cx="8" cy="5" r="3" stroke={color} strokeWidth="1.5"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    analytics:    <svg viewBox="0 0 16 16" fill="none" style={s}><rect x="1" y="9" width="3" height="6" fill={color}/><rect x="6" y="5" width="3" height="10" fill={color} opacity=".7"/><rect x="11" y="1" width="3" height="14" fill={color} opacity=".45"/></svg>,
    requestors:   <svg viewBox="0 0 16 16" fill="none" style={s}><polygon points="8,1 10,6 15,6 11,9.5 12.5,15 8,11.5 3.5,15 5,9.5 1,6 6,6" fill={color} opacity=".8"/></svg>,
    quickaction:  <svg viewBox="0 0 16 16" fill="none" style={s}><path d="M9 1L4 9h5l-2 6 7-8h-5l2-6z" fill={color}/></svg>,
    sitecomment:  <svg viewBox="0 0 16 16" fill="none" style={s}><rect x="1" y="2" width="14" height="10" rx="0" stroke={color} strokeWidth="1.5"/><path d="M4 14l3-2h5" stroke={color} strokeWidth="1.5" strokeLinecap="square"/><path d="M4 6h8M4 8.5h5" stroke={color} strokeWidth="1.4" strokeLinecap="square" opacity=".6"/></svg>,
    inbound:      <svg viewBox="0 0 16 16" fill="none" style={s}><rect x="1" y="3" width="14" height="10" stroke={color} strokeWidth="1.5"/><path d="M1 3l7 6 7-6" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    draft:        <svg viewBox="0 0 16 16" fill="none" style={s}><rect x="3" y="1" width="10" height="14" stroke={color} strokeWidth="1.5"/><path d="M6 5h4M6 8h4M6 11h2" stroke={color} strokeWidth="1.4" strokeLinecap="square" opacity=".7"/></svg>,
    save:         <svg viewBox="0 0 16 16" fill="none" style={s}><path d="M2 2h9l3 3v9H2V2z" stroke={color} strokeWidth="1.5"/><rect x="5" y="10" width="6" height="4" stroke={color} strokeWidth="1.4"/><rect x="5" y="2" width="5" height="4" fill={color} opacity=".5"/></svg>,
    trash:        <svg viewBox="0 0 16 16" fill="none" style={s}><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    edit:         <svg viewBox="0 0 16 16" fill="none" style={s}><path d="M10 2l4 4-8 8H2v-4l8-8z" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    back:         <svg viewBox="0 0 16 16" fill="none" style={s}><path d="M10 3L5 8l5 5" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    check:        <svg viewBox="0 0 16 16" fill="none" style={s}><path d="M2 8l4.5 5L14 3" stroke={color} strokeWidth="2" strokeLinecap="square"/></svg>,
    warn:         <svg viewBox="0 0 16 16" fill="none" style={s}><path d="M8 1L1 14h14L8 1z" stroke={color} strokeWidth="1.5" strokeLinecap="square"/><path d="M8 6v4M8 12v1" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    clear:        <svg viewBox="0 0 16 16" fill="none" style={s}><path d="M2 4h12M5 4V2h6v2M4 4l8 10H4L2 4" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    pin:          <svg viewBox="0 0 16 16" fill="none" style={s}><path d="M10 2l4 4-2 2-1-1-4 4 1 1-2 2-4-4 2-2 1 1 4-4-1-1 2-2zM5 11l-3 3" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    image:        <svg viewBox="0 0 16 16" fill="none" style={s}><rect x="1" y="2" width="14" height="12" stroke={color} strokeWidth="1.5"/><circle cx="5.5" cy="6" r="1.5" fill={color} opacity=".7"/><path d="M1 11l4-4 3 3 2-2 5 5" stroke={color} strokeWidth="1.4" strokeLinecap="square" opacity=".8"/></svg>,
    copy:         <svg viewBox="0 0 16 16" fill="none" style={s}><rect x="5" y="1" width="10" height="12" stroke={color} strokeWidth="1.5"/><rect x="1" y="4" width="10" height="12" fill="var(--bg)" stroke={color} strokeWidth="1.5"/></svg>,
    close:        <svg viewBox="0 0 16 16" fill="none" style={s}><path d="M3 3l10 10M13 3L3 13" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    play:         <svg viewBox="0 0 16 16" fill="none" style={s}><path d="M4 2l10 6-10 6V2z" fill={color}/></svg>,
    loading:      <svg viewBox="0 0 16 16" fill="none" style={s}><circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" opacity=".25"/><path d="M8 2a6 6 0 016 6" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    empty:        <svg viewBox="0 0 16 16" fill="none" style={s}><rect x="2" y="2" width="12" height="12" stroke={color} strokeWidth="1.5" opacity=".4"/><path d="M6 6h4M6 10h2" stroke={color} strokeWidth="1.4" strokeLinecap="square" opacity=".4"/></svg>,
    coffee:       <svg viewBox="0 0 16 16" fill="none" style={s}><path d="M3 5h8v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke={color} strokeWidth="1.5"/><path d="M11 7h1a2 2 0 010 4h-1" stroke={color} strokeWidth="1.5"/><path d="M6 2v2M8 1v2" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    meditate:     <svg viewBox="0 0 16 16" fill="none" style={s}><circle cx="8" cy="3" r="2" stroke={color} strokeWidth="1.5"/><path d="M4 8c0-2 1.5-3.5 4-3.5S12 6 12 8" stroke={color} strokeWidth="1.5" strokeLinecap="square"/><path d="M1 11h14M4 11v3M12 11v3M8 8v3" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    lunch:        <svg viewBox="0 0 16 16" fill="none" style={s}><path d="M3 2v12M6 2v5a3 3 0 003 3v4M9 2v4a3 3 0 003-3V2" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    lock:         <svg viewBox="0 0 16 16" fill="none" style={s}><rect x="3" y="7" width="10" height="8" stroke={color} strokeWidth="1.5"/><path d="M5 7V5a3 3 0 016 0v2" stroke={color} strokeWidth="1.5"/><circle cx="8" cy="11" r="1.5" fill={color}/></svg>,
    user:         <svg viewBox="0 0 16 16" fill="none" style={s}><circle cx="8" cy="5" r="3" stroke={color} strokeWidth="1.5"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    signout:      <svg viewBox="0 0 16 16" fill="none" style={s}><path d="M6 14H2V2h4" stroke={color} strokeWidth="1.5" strokeLinecap="square"/><path d="M10 5l4 3-4 3M14 8H6" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    announce:     <svg viewBox="0 0 16 16" fill="none" style={s}><path d="M3 6h2v5H3V6zM5 6l7-4v13L5 11V6z" fill={color} opacity=".8"/></svg>,
    camera:       <svg viewBox="0 0 16 16" fill="none" style={s}><path d="M1 5h14v9H1V5z" stroke={color} strokeWidth="1.5"/><circle cx="8" cy="9.5" r="2.5" stroke={color} strokeWidth="1.5"/><path d="M5 5l1.5-2h3L11 5" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    casebox:      <svg viewBox="0 0 16 16" fill="none" style={s}><rect x="1" y="4" width="14" height="11" stroke={color} strokeWidth="1.5"/><path d="M5 4V2h6v2" stroke={color} strokeWidth="1.5" strokeLinecap="square"/><path d="M1 8h14" stroke={color} strokeWidth="1.5"/></svg>,
    timer:        <svg viewBox="0 0 16 16" fill="none" style={s}><circle cx="8" cy="9" r="6" stroke={color} strokeWidth="1.5"/><path d="M8 6v3.5l2 2" stroke={color} strokeWidth="1.5" strokeLinecap="square"/><path d="M6 1h4" stroke={color} strokeWidth="2" strokeLinecap="square"/></svg>,
    bell:         <svg viewBox="0 0 16 16" fill="none" style={s}><path d="M8 1v1M8 1a5 5 0 015 5v4l1.5 1.5H1.5L3 11V7a5 5 0 015-5z" stroke={color} strokeWidth="1.5" strokeLinecap="square"/><path d="M6 13a2 2 0 004 0" stroke={color} strokeWidth="1.5"/></svg>,
    password:     <svg viewBox="0 0 16 16" fill="none" style={s}><circle cx="4" cy="8" r="2" stroke={color} strokeWidth="1.5"/><path d="M6 8h8M11 6v4M13 7v2" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    snooze:       <svg viewBox="0 0 16 16" fill="none" style={s}><circle cx="8" cy="9" r="6" stroke={color} strokeWidth="1.5"/><path d="M5.5 7h3L5.5 11H9" stroke={color} strokeWidth="1.5" strokeLinecap="square"/><path d="M3 3L2 2M13 3l1-2" stroke={color} strokeWidth="1.5" strokeLinecap="square"/></svg>,
    inprogress:   <svg viewBox="0 0 16 16" fill="none" style={s}><circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5"/><path d="M8 5v3.5l2.5 1.5" stroke={color} strokeWidth="1.5" strokeLinecap="square"/><circle cx="8" cy="8" r="2" fill={color} opacity=".25"/></svg>,
    archive:      <svg viewBox="0 0 16 16" fill="none" style={s}><rect x="1" y="4" width="14" height="2" fill={color} opacity=".7"/><rect x="1" y="1" width="14" height="3" rx="0" stroke={color} strokeWidth="1.5"/><rect x="1" y="6" width="14" height="9" rx="0" stroke={color} strokeWidth="1.5"/><path d="M5.5 10.5h5" stroke={color} strokeWidth="1.4" strokeLinecap="square" opacity=".6"/></svg>,
  };
  const el = icons[name] || <svg viewBox="0 0 16 16" style={s}/>;
  return <span style={sp}>{el}</span>;
}
// ─────────────────────────────────────────────────────────────────────────────
// FORM DATA
// ─────────────────────────────────────────────────────────────────────────────
const emptyEntry = ()=>({id:String(Date.now()+Math.random()),number:"",note:"",clarification:""});
const emptyBase  = ()=>({
  caseNum:"",accountNum:"",amendType:"",inProgress:false,inboundNum:"",
  customerName:"",customerEmail:"",businessName:"",businessSuffix:"",
  _caseComplexity:"minor",
  entries:[emptyEntry()],
  devices:{mobile:false,tablet:false,desktop:false},
  checklist:{backup:false,caseComment:false,combinedTracker:false,qaChecklist:false,completeJob:false,closeSiteComment:false,emailSales:false,trackerChecklist:false,completeStatus:false},
  trackerChecklistLink:"",
  images:[],backupImages:[],emailAddress:"",emailType:"clarification",
  _startTime: Date.now(), _elapsedAtSave: 0
});


// ── Table of Contents / Outline Panel — sticky card column ──────────────────

// ── TimerBar — compact inline timer display for the form header ──────────────
function TimerBar({ footerElapsed, resumeElapsed, phase2Elapsed, isDraftResumed, isEditMode, prevElapsedSecs, originalTotalSecs, originalOutcome, fmtElapsed }) {
  const sep = <span style={{color:"var(--glass-border)",fontSize:16,fontWeight:300,margin:"0 4px"}}>|</span>;
  const block = (label, val, color, extra={}) => (
    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",lineHeight:1.1,...(extra.style||{})}}>
      <span style={{fontSize:9,color:color||"var(--muted)",fontFamily:"'Poppins',sans-serif",fontWeight:700,textTransform:"uppercase",letterSpacing:".5px",opacity:.8,display:"flex",alignItems:"center",gap:4}}>
        {label}
        {extra.pulsing&&<span style={{width:6,height:6,borderRadius:"50%",background:"var(--green)",display:"inline-block",animation:"pulse-dot 1.2s infinite"}}/>}
        {extra.paused&&<span style={{fontSize:8,color:"var(--muted)",fontWeight:600,opacity:.7}}>⏸ paused</span>}
      </span>
      <span style={{fontSize:28,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",color:color||"var(--accent)",letterSpacing:"-1.5px",fontVariantNumeric:"tabular-nums"}}>{fmtElapsed(val)}</span>
    </div>
  );
  const phase2Active = phase2Elapsed !== null;

  if(isDraftResumed){
    if(isEditMode){
      return (
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 16px",borderLeft:"1px solid var(--glass-border)",marginLeft:8,flexWrap:"wrap"}}>
          {block("Total Time Spent", originalTotalSecs, "var(--muted)")}
          {sep}
          {block("Combined Tracker", footerElapsed, phase2Active?"var(--muted)":"var(--accent)", {paused:phase2Active})}
          {phase2Active && <>{sep}{block("QA Checklist", phase2Elapsed, "var(--green)", {pulsing:true})}</>}
        </div>
      );
    }
    return (
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 16px",borderLeft:"1px solid var(--glass-border)",marginLeft:8,flexWrap:"wrap"}}>
        {block("Combined Tracker", prevElapsedSecs, "var(--muted)")}
        {sep}
        {block("Combined Tracker", footerElapsed, phase2Active?"var(--muted)":"var(--accent)", {paused:phase2Active})}
        {phase2Active && <>{sep}{block("QA Checklist", phase2Elapsed, "var(--green)", {pulsing:true})}</>}
      </div>
    );
  }
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 16px",borderLeft:"1px solid var(--glass-border)",marginLeft:8}}>
      {block("Combined Tracker", footerElapsed, phase2Active?"var(--muted)":"var(--accent)", {paused:phase2Active})}
      {phase2Active && <>{sep}{block("QA Checklist", phase2Elapsed, "var(--green)", {pulsing:true})}</>}
    </div>
  );
}

function TocPanel({ openStep, setOpenStep, isSC, page, doneMap={}, specialRequestors=[] }) {
  if(page!=="postlive") return null;
  const steps=[
    {num:1,label:"Case Info"},
    {num:2,label:"Before Name"},
    {num:3,label:"Extra Backups"},
    {num:4,label:isSC?"Amends Notepad":"Assumptions"},
    {num:5,label:"Device Check"},
    {num:6,label:"After Name"},
    {num:7,label:"B/A Backup"},
    {num:8,label:"Checklist"},
  ];
  return (
    <div className="toc-card">
      <div className="toc-card-header">
        <Icon name="dashboard" size={10} color="var(--muted)"/>Steps
      </div>
      {steps.map(s=>{
        const done=!!doneMap[s.num];
        return (
          <button key={s.num} className={cls("toc-item",done&&"done",openStep===s.num&&"active")}
            onClick={()=>{
              setOpenStep(s.num);
              setTimeout(()=>{
                const el=document.getElementById(`step-${s.num}`);
                const container=document.querySelector('.form-left');
                if(el && container){
                  const offset=el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
                  container.scrollTo({top: Math.max(0, offset - 12), behavior:'smooth'});
                } else if(el){
                  el.scrollIntoView({behavior:"smooth",block:"start"});
                }
              },50);
            }}>
            <span className="toc-num">{s.num}</span>
            <span style={{flex:'0 1 auto',textAlign:'center',minWidth:0}}>{s.label}</span>
            {done&&<span className="toc-check">✓</span>}
          </button>
        );
      })}
      {(specialRequestors||[]).length>0&&(
        <div className="toc-requestors">
          <div className="toc-req-title">Requestors</div>
          {(specialRequestors||[]).map((name,i)=>(
            <div key={i} className="toc-req-chip">
              <span className="toc-req-avatar">{(name||"").split(" ").map(w=>w&&w[0]).filter(Boolean).join("").slice(0,2).toUpperCase()}</span>
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function PostLiveForm({ mode, onSave, onBack, onCancelForm, onSaveDraftDirect, onAutoSaveDraft, onStartBreak, onStartOpenHour, onStopOpenHour, openHourActive=false, breakActive=false, draftData, user, onTimerEnd, onQaTimerEnd, specialRequestors, timerLimitSecs, qaTimerLimitSecs=600, globalTimeIn, isEditMode=false, isMinimisedResume=false, caseStartTime=null, externalFormRef=null, isResumingDraft=false, originalOutcome="", originalTotalSecs=0, containerStyle={}, onTimerTick=null, prolongedActive=false, onProlongedDismiss=null, onProceedWithNext=null, prolongedMinsForNext=30, tabStorageKey=null, onTabDataChange=null }) {
  const isSC = mode==="siteComment";
  const entryLabel = isSC?"Site Comment":"Assumption";
  const rawName = user?.name || "User";
  const userName = rawName.trim().replace(/\s+/g,"_");
  const beforeName    = user?.beforeName  || `Post_Live_Amend_Before_${userName}_Amends`;
  const afterName     = user?.afterName   || `Post_Live_Amend_After_${userName}_Amends`;
  const screenshotName= user?.screenshotName || `Post_Live_Amend_Screenshot_${userName}_Amends`;

  const [form,setForm] = useState(()=>{
    // 1. Per-tab persistence — restores this specific tab's form after page refresh
    if(tabStorageKey && typeof window!=="undefined"){
      const tabSaved=localStorage.getItem(`ch_tab_form_${tabStorageKey}`);
      if(tabSaved){ try{ return {...emptyBase(),...JSON.parse(tabSaved)}; }catch{} }
    }
    // 2. Draft / minimised form (first-tab restore path)
    if(draftData) return {...emptyBase(),...draftData};
    // Check for bundle prefill — data from the existing case chosen in the bundle modal
    if(typeof window!=="undefined"){
      const raw = localStorage.getItem("ch_bundle_prefill");
      if(raw){
        try{
          const prefill = JSON.parse(raw);
          localStorage.removeItem("ch_bundle_prefill");
          const base = emptyBase();
          const newIsSC = mode==="siteComment";
          const srcIsSC = prefill._sourceMode==="siteComment";
          // Map entries: copy them regardless of mode switch — label will adapt via entryLabel
          // For cross-mode bundles, entries carry the text content; the label (Site Comment/Assumption) changes automatically
          return {
            ...base,
            accountNum: prefill.accountNum||"",
            amendType: prefill.amendType||"",
            customerName: prefill.customerName||"",
            customerEmail: prefill.customerEmail||"",
            businessName: prefill.businessName||"",
            businessSuffix: prefill.businessSuffix||"",
            inboundNum: newIsSC ? "" : (prefill.inboundNum||""),
            inProgress: prefill.inProgress||false,
            // ASSUMPTION/CASE COMMENT
            entries: (prefill.entries&&prefill.entries.length>0) ? prefill.entries : base.entries,
            // ADDITIONAL BACKUP SCREENSHOT
            images: prefill.images||[],
            // BEFORE/AFTER BACKUP
            backupImages: prefill.backupImages||[],
            // CASE INFORMATION (except case number)
            emailAddress: newIsSC ? "" : (prefill.emailAddress||""),
            emailType: newIsSC ? "clarification" : (prefill.emailType||"clarification"),
            trackerChecklistLink: prefill.trackerChecklistLink||"",
            _caseComplexity: prefill._caseComplexity||"minor",
          };
        }catch(e){ localStorage.removeItem("ch_bundle_prefill"); }
      }
    }
    return emptyBase();
  });
  const formRef = useRef(form);
  useEffect(()=>{
    formRef.current=form;
    if(externalFormRef) externalFormRef.current=form;
    // Auto-persist form to localStorage on every change so refresh restores it
    // Only do this for active (non-edit) forms — edit mode doesn't need persistence
    if(!isEditMode && typeof window!=="undefined"){
      const toSave={...form,_mode:mode,_startTime:startTimeRef.current,images:(form.images||[]).filter(i=>i._inDB),backupImages:(form.backupImages||[]).filter(i=>i._inDB)};
      localStorage.setItem("ch_minimised_form",JSON.stringify(toSave));
      // Per-tab key so ALL tabs survive page refresh independently
      if(tabStorageKey) localStorage.setItem(`ch_tab_form_${tabStorageKey}`,JSON.stringify(toSave));
      window.dispatchEvent(new Event("ch_case_saved"));
    }
    // Notify parent tab strip with latest caseNum + businessName + complexity for live label update
    if(onTabDataChange) onTabDataChange({ caseNum: form.caseNum||'', businessName: form.businessName||'', complexity: form._caseComplexity||'minor' });
  },[form]);

  // ── File Name Generator — listen for fill event, only apply to the active tab ──
  useEffect(()=>{
    if(caseStartTime===null) return; // queued tab — ignore
    const h=(e)=>{
      const {caseNum,businessName,complexity}=e.detail||{};
      setF({
        ...(caseNum?{caseNum}:{}),
        ...(businessName?{businessName}:{}),
        ...(complexity?{_caseComplexity:complexity}:{}),
      });
    };
    window.addEventListener("fngen_fill",h);
    return()=>window.removeEventListener("fngen_fill",h);
  },[caseStartTime]);

  // Always use caseStartTime (globalTimeIn passed from session) so the form timer is consistent
  // with the session active timer — whether opening fresh, continuing suspended, or editing.
  // If caseStartTime is null the tab is queued and not yet active — timer stays frozen at 0.
  const isQueued = caseStartTime === null;
  const startTimeRef = useRef(isQueued ? Date.now() : (caseStartTime || (draftData?._startTime) || Date.now()));

  // isDraft: true only for resumed *suspended* drafts — locks case info fields.
  // Minimised resume is NOT a draft lock — user should be able to edit case info.
  const isDraft = !isMinimisedResume && !!(draftData && (draftData.caseNum || draftData.accountNum || draftData._elapsedAtSave));

  // isDraftResumed: true when resuming a suspended draft OR editing (shows split timer)
  const isDraftResumed = isEditMode || (!isMinimisedResume && !!(draftData && draftData._elapsedAtSave));

  // For suspended/edit: store how long elapsed before this resume so we can show "Before: X / Now: Y"
  // For suspended: prevElapsedSecs = _elapsedAtSave (time on case before suspend)
  // For edit: snapshot elapsed at mount time — static, does not tick
  // resumeStartRef = wall-clock when this resume/edit session began — persisted so refresh doesn't reset it
  const _resumeInit = typeof window!=="undefined" ? (() => { const v=localStorage.getItem("ch_resume_start"); return v?Number(v):Date.now(); })() : Date.now();
  const resumeStartRef = useRef(_resumeInit);
  // On first mount, stamp it so subsequent refreshes restore correctly
  useEffect(()=>{
    if(typeof window!=="undefined"&&!localStorage.getItem("ch_resume_start")){
      localStorage.setItem("ch_resume_start",String(resumeStartRef.current));
    }
  },[]);

  // For suspended/edit: store how long elapsed before this resume so we can show "Before: X / Now: Y"
  // For suspended: prevElapsedSecs = _elapsedAtSave (time on case before suspend)
  // For edit: snapshot elapsed at mount time — static, does not tick
  const prevElapsedSecs = isDraftResumed
    ? (isEditMode
        ? Math.floor((_resumeInit - (caseStartTime || _resumeInit)) / 1000)
        : (draftData?._elapsedAtSave || 0))
    : 0;

  // Phase 2 timer: starts when Combined Tracker checkbox is first checked
  // Scoped per-tab using tabStorageKey so tabs never share phase2 state
  const p2Key = tabStorageKey ? `ch_phase2_start_${tabStorageKey}` : null;
  const _phase2Init = (p2Key && typeof window!=="undefined") ? (() => { const v=localStorage.getItem(p2Key); return v?Number(v):null; })() : null;
  const phase2StartRef = useRef(_phase2Init);
  const [phase2Elapsed, setPhase2Elapsed] = useState(()=>{
    if(!p2Key||typeof window==="undefined") return null;
    const v=localStorage.getItem(p2Key);
    return v?Math.floor((Date.now()-Number(v))/1000):null;
  });

  const [openStep,setOpenStep] = useState(1);
  const [modal,setModal] = useState(null);
  const [saveOutcomeType,setSaveOutcomeType] = useState("completed"); // "completed" | "clarification"
  const [toast,showToast] = useToast();
  const [copiedAll,setCopiedAll] = useState(false);
  const [draftSaving,setDraftSaving] = useState(false);
  const [breakConfirmData,setBreakConfirmData] = useState(null); // {label,mins} for break confirmation
  // Footer timer — ticks every second for the action-bar elapsed display
  const [footerElapsed,setFooterElapsed] = useState(()=> isQueued ? 0 : Math.floor((Date.now()-startTimeRef.current)/1000));
  const [resumeElapsed,setResumeElapsed] = useState(0); // seconds since this resume started
  // Freeze the main elapsed value the moment Phase 2 starts — it won't tick further
  const frozenElapsedRef = useRef(null);
  const frozenResumeRef  = useRef(null);
  // Keep onTimerTick in a ref so the interval always calls the latest version
  const onTimerTickRef = useRef(onTimerTick);
  useEffect(()=>{ onTimerTickRef.current=onTimerTick; },[onTimerTick]);
  // Track active state — starts false for queued tabs, flips true when caseStartTime becomes non-null
  const timerActiveRef = useRef(!isQueued);
  useEffect(()=>{
    if(caseStartTime===null){
      // Tab was queued or reset — fully clear phase2 state
      timerActiveRef.current = false;
      frozenElapsedRef.current = null;
      frozenResumeRef.current = null;
      phase2StartRef.current = null;
      setPhase2Elapsed(null);
      setFooterElapsed(0);
      setResumeElapsed(0);
      if(p2Key && typeof window!=="undefined") localStorage.removeItem(p2Key);
    } else if(!timerActiveRef.current){
      // Tab just became active — stamp startTime and begin ticking
      startTimeRef.current = caseStartTime;
      resumeStartRef.current = caseStartTime;
      timerActiveRef.current = true;
      // Reset phase2 frozen refs so newly activated tab never inherits stale values
      frozenElapsedRef.current = null;
      frozenResumeRef.current = null;
      phase2StartRef.current = null;
      setPhase2Elapsed(null);
      if(p2Key && typeof window!=="undefined") localStorage.removeItem(p2Key);
    }
  },[caseStartTime]);
  // ── "Break for a while" pause/resume — freezes THIS tab's clock while on break ──
  // (only relevant if this tab stayed active/mounted through the break, i.e. wasn't saved away)
  const breakPausedRef = useRef(false);
  const breakPauseStartRef = useRef(null);
  useEffect(()=>{
    if(breakActive){
      // Only pause if this tab is genuinely running (not a queued tab sitting at 0)
      if(timerActiveRef.current && !breakPausedRef.current){
        breakPausedRef.current = true;
        breakPauseStartRef.current = Date.now();
      }
    } else if(breakPausedRef.current){
      // Break just ended — shift all start references forward by however long we were paused,
      // so the clock continues from exactly where it was instead of jumping ahead.
      const pausedMs = Date.now() - (breakPauseStartRef.current||Date.now());
      startTimeRef.current += pausedMs;
      resumeStartRef.current += pausedMs;
      if(phase2StartRef.current !== null) phase2StartRef.current += pausedMs;
      breakPausedRef.current = false;
      breakPauseStartRef.current = null;
    }
  },[breakActive]);
  useEffect(()=>{
    const tick=()=>{
      if(!timerActiveRef.current) return; // still queued
      if(breakPausedRef.current) return; // on break — keep display frozen, don't advance
      const phase2Active = phase2StartRef.current !== null;
      if(phase2Active && frozenElapsedRef.current === null){
        frozenElapsedRef.current = Math.floor((Date.now()-startTimeRef.current)/1000);
        frozenResumeRef.current  = Math.floor((Date.now()-resumeStartRef.current)/1000);
      }
      const fe = phase2Active ? frozenElapsedRef.current : Math.floor((Date.now()-startTimeRef.current)/1000);
      const re = phase2Active ? frozenResumeRef.current  : Math.floor((Date.now()-resumeStartRef.current)/1000);
      const p2 = phase2Active ? Math.floor((Date.now()-phase2StartRef.current)/1000) : null;
      setFooterElapsed(fe);
      setResumeElapsed(re);
      if(p2!==null) setPhase2Elapsed(p2);
      if(onTimerTickRef.current) onTimerTickRef.current({footerElapsed:fe,resumeElapsed:re,phase2Elapsed:p2,isDraftResumed,isEditMode,prevElapsedSecs,originalTotalSecs,originalOutcome});
    };
    const t=setInterval(tick,1000);
    return()=>clearInterval(t);
  },[]);
  // ── Drag: track by entry ID not index ──
  const dragFromId  = useRef(null);
  const dragToId    = useRef(null);
  const [dragActiveId, setDragActiveId] = useState(null);

  // Auto-save removed — only user can decide to suspend/draft via the Suspend Case button.

  const setF=(patch)=>setForm(f=>({...f,...patch}));

  // Auto-fill emailAddress from customerEmail whenever customerEmail changes (inbound only)
  useEffect(()=>{
    if(!isSC && form.customerEmail && !form._emailAddressManuallySet){
      setForm(f=>({...f, emailAddress: form.customerEmail}));
    }
  },[form.customerEmail]);

  const step1Done = !!(form.caseNum&&form.accountNum&&form.amendType&&(isSC||form.inboundNum));
  const step2Done = !!form._beforeCopied;
  const step3Done = isSC
    ?form.entries.some(e=>e.number.trim())
    :form.entries.some(e=>e.note.trim()||e.clarification.trim());
  const step4Done = form.devices.mobile&&form.devices.tablet&&form.devices.desktop;
  const step5Done = step4Done;
  const step6Done = !!form._afterCopied;
  const step7NameDone = !!form._screenshotCopied||form.images?.length>0;
  // Only check the keys that are actually rendered for this mode.
  // For inbound: exclude closeSiteComment (SC-only) and check closeInboundCase instead.
  // For siteComment: exclude closeInboundCase and check closeSiteComment instead.
  const relevantChecklistKeys = isSC
    ? ["backup","caseComment",...(prolongedActive?[]:["combinedTracker"]),"qaChecklist","closeSiteComment","completeJob","emailSales","trackerChecklist","completeStatus"]
    : ["backup","caseComment",...(prolongedActive?[]:["combinedTracker"]),"qaChecklist","completeJob","closeInboundCase","emailSales","trackerChecklist","completeStatus"];
  const step7Done = relevantChecklistKeys.every(k => !!form.checklist[k]);

  const addEntry    = ()=>setF({entries:[...form.entries,emptyEntry()]});
  const updateEntry = (id,val)=>setF({entries:form.entries.map(e=>e.id===id?val:e)});
  const deleteEntry = (id)=>setF({entries:form.entries.filter(e=>e.id!==id)});
  const moveEntry = (fromId,toId)=>setF(f=>{
    const arr=[...f.entries];
    const fi=arr.findIndex(e=>e.id===fromId);
    const ti=arr.findIndex(e=>e.id===toId);
    if(fi===-1||ti===-1||fi===ti) return f;
    const [moved]=arr.splice(fi,1);
    arr.splice(ti,0,moved);
    return{...f,entries:arr};
  });

  const buildEntriesText = ()=>{
    const es=formRef.current.entries;
    let out="Post-Live Amends:";
    es.forEach(e=>{
      if(!e.number&&!e.note&&!e.clarification)return;
      if(isSC){
        out+=`\n\nSite Comment #${e.number}:\n`;
        if(e.note)out+=`Note: ${e.note}`;
        if(e.clarification)out+=`\n\nClarification:  ${e.clarification}`;
      } else {
        out+=`\n\nAssumption:\n`;
        if(e.note)out+=`Note: ${e.note}`;
        if(e.clarification)out+=`\n\nClarification:  ${e.clarification}`;
      }
    });
    return out.trimEnd();
  };
  const buildEmailText = ()=>{
    const f=formRef.current;
    const tl=f.emailType==="clarification"?"Clarification email sent to":"Email completed sent to";
    return `${buildEntriesText()}\n\n${tl} ${f.emailAddress||"—"}.`;
  };

  const handleCopyAll=()=>{ const txt=isSC?buildEntriesText():buildEmailText(); copyToClipboard(txt).then(()=>{setCopiedAll(true);setTimeout(()=>setCopiedAll(false),1800);}); };
  const handleSave=()=>{
    if(!step1Done)return showToast("Complete Step 1 first","error");
    if(!step4Done)return showToast("All 3 devices must be checked","error");
    if(!step7Done)return showToast("Complete the Final Checklist first","error");
    setModal("save");
  };

  const handleDraft=()=>{
    if(!step1Done)return showToast("Complete Step 1 first","error");
    setModal("draft");
  };
  
  const getCleanForm = () => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current)/1000);
    const strip=(imgs)=>(imgs||[]).map(({_file,url,name,id,path,_inDB})=>({url,name,id,path:path||id,_inDB:_inDB||false}));
    return {...formRef.current,images:strip(formRef.current.images),backupImages:strip(formRef.current.backupImages),_elapsedAtSave:elapsed,_startTime:startTimeRef.current,trackerChecklistLink:formRef.current.trackerChecklistLink||""};
  };

 

  const confirmSaveDraft = async() => {
    if(draftSaving) return;
    setDraftSaving(true);
    try{
      setModal(null);
      await onSaveDraftDirect(getCleanForm());
    }catch(e){
      setDraftSaving(false);
      showToast("❌ Failed to Suspend Case — check connection","error");
    }
  };

  const stepProps = {openStep, setOpenStep};

  return (
    <div className="form-cols" style={containerStyle}>
      <div className="form-right">
        <StickyPanel startTimeRef={startTimeRef} form={form} isSC={isSC} buildEntriesText={buildEntriesText} buildEmailText={buildEmailText} onTimerEnd={onTimerEnd} onQaTimerEnd={onQaTimerEnd} specialRequestors={specialRequestors} timerLimitSecs={timerLimitSecs} qaTimerLimitSecs={qaTimerLimitSecs} greetingMessages={user?.greetingMessages} footerElapsed={footerElapsed} phase2Elapsed={phase2Elapsed}/>
      </div>

      <div className="form-left">

        <StepCard num={1} title="Case Information" done={step1Done} locked={false} {...stepProps}>
          <div className="field"><label>Case Number <span className="req">*</span></label><input className="inp" placeholder="e.g. 1234567" value={form.caseNum} onChange={e=>setF({caseNum:cleanSpaces(e.target.value)})}/></div>
          <div className="field"><label>Account Number <span className="req">*</span></label><input className="inp" placeholder="e.g. ACC-9876" value={form.accountNum} onChange={e=>setF({accountNum:cleanSpaces(e.target.value)})}/></div>
          {!isSC&&(<div className="field"><label>Inbound Number <span className="req">*</span></label><input className="inp" placeholder="Enter inbound number" value={form.inboundNum||""} onChange={e=>setF({inboundNum:cleanSpaces(e.target.value)})}/></div>)}
          <div className="field"><label>Amend Type <span className="req">*</span></label><input className="inp" placeholder="e.g. Content, Layout, Link..." value={form.amendType} onChange={e=>setF({amendType:cleanSpaces(e.target.value)})}/></div>
          <div className="field">
            <label>Case Complexity</label>
            <select className="inp" value={form._caseComplexity||"minor"} onChange={e=>setF({_caseComplexity:e.target.value})} style={{cursor:"pointer"}}>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
              <option value="complex">Complex</option>
            </select>
          </div>
          <div className="field"><label>Customer Name</label><input className="inp" placeholder="e.g. John Smith" value={form.customerName||""} onChange={e=>setF({customerName:cleanSpaces(e.target.value)})}/></div>
          <div className="field"><label>Customer Email</label><input className="inp" type="email" placeholder="e.g. client@email.com" value={form.customerEmail||""} onChange={e=>setF({customerEmail:cleanSpaces(e.target.value)})}/></div>
          <div className="field" style={{marginBottom:0}}>
            <label>Business Name</label>
            <div style={{display:"flex",gap:8}}>
              <input className="inp" placeholder="e.g. Fire Force" style={{flex:2}} value={form.businessName||""} onChange={e=>setF({businessName:cleanSpaces(e.target.value)})}/>
              <input className="inp" placeholder="LLC / Corp / Inc…" style={{flex:1}} value={form.businessSuffix||""} onChange={e=>setF({businessSuffix:cleanSpaces(e.target.value)})}/>
            </div>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>Business name · Suffix (optional)</div>
          </div>
          <label className={cls("check-label",form.inProgress&&"checked")} style={{marginTop:4,width:"fit-content"}}><input type="checkbox" checked={form.inProgress} onChange={e=>setF({inProgress:e.target.checked})}/>In-Progress Salesforce</label>
        </StepCard>

         
          
       <StepCard num={2} title="Before Screenshot Name" done={form._beforeCopied} locked={!step1Done&&!isDraft} {...stepProps}>
          <p style={{fontSize:13,color:"var(--muted)",marginBottom:9}}>Save your before screenshot with this name.</p>
          <CopyName name={beforeName} onCopy={()=>setF({_beforeCopied:true})}/>
        </StepCard>
      


          <StepCard num={3} title={`Additional Backup Screenshots${form.backupImages?.length>0?" ("+form.backupImages.length+")":""}`} done={form.backupImages?.length>0} locked={!step2Done&&!isDraft} {...stepProps}>
          <p style={{fontSize:13,color:"var(--muted)",marginBottom:11}}>Each renamed <span style={{color:"var(--accent)",fontWeight:600}}>backup-screenshot-N</span> on download.</p>
          <ImageUpload baseName="backup-screenshot" multiple onImages={imgs=>setF({backupImages:imgs,checklist:{...formRef.current.checklist}})} immediateUpload={false} initialImages={form.backupImages||[]} caseNum={form.caseNum||""} businessName={form.businessName||""} storageKey={tabStorageKey?`${tabStorageKey}-backup`:"backup"} isActive={openStep===3}/>
        </StepCard>

        


        <StepCard num={4} title={isSC?"Post-Live Amends Notepad":"Assumptions Notepad"} done={step3Done} locked={!step2Done&&!isDraft} {...stepProps}>
          <div id="entries-list">
          {form.entries.map((e,i)=>(
            <div key={e.id} className="entry-drag-row" data-entryid={e.id}>
              <EntryCard
                entry={e} label={entryLabel} index={i} showNumber={isSC}
                onChange={val=>updateEntry(e.id,val)}
                onDelete={()=>deleteEntry(e.id)}
                isDragging={dragActiveId===e.id}
                onDragHandlePointerDown={(ev)=>{
                  ev.preventDefault();
                  ev.stopPropagation();
                  const fromId=String(e.id);
                  dragFromId.current=fromId;
                  dragToId.current=fromId;
                  setDragActiveId(fromId);
                  document.body.style.cursor="grabbing";
                  document.body.style.userSelect="none";

                  const getRows=()=>document.querySelectorAll(".entry-drag-row");

                  const onMove=(mv)=>{
                    const y=mv.clientY;
                    // clear old lines
                    getRows().forEach(r=>r.querySelectorAll(".drop-line").forEach(l=>l.remove()));
                    let bestId=null, bestPos="after";
                    getRows().forEach(row=>{
                      const rid=row.dataset.entryid;
                      if(rid===fromId) return;
                      const rect=row.getBoundingClientRect();
                      if(y>=rect.top && y<=rect.bottom){
                        bestId=rid;
                        bestPos=y<rect.top+rect.height/2?"before":"after";
                      }
                    });
                    if(bestId){
                      dragToId.current=bestId+"::"+bestPos;
                      const targetRow=document.querySelector(`.entry-drag-row[data-entryid="${bestId}"]`);
                      if(targetRow){
                        const line=document.createElement("div");
                        line.className="drop-line";
                        if(bestPos==="before") targetRow.prepend(line);
                        else targetRow.appendChild(line);
                      }
                    } else {
                      dragToId.current=null;
                    }
                    // fade source row
                    getRows().forEach(row=>{
                      row.style.opacity=row.dataset.entryid===fromId?"0.3":"1";
                    });
                  };

                  const onUp=()=>{
                    document.body.style.cursor="";
                    document.body.style.userSelect="";
                    getRows().forEach(row=>{
                      row.querySelectorAll(".drop-line").forEach(l=>l.remove());
                      row.style.opacity="1";
                    });
                    const rawTo=dragToId.current;
                    setDragActiveId(null);
                    dragFromId.current=null;
                    dragToId.current=null;
                    if(rawTo && rawTo.includes("::")){
                      const [toId,pos]=rawTo.split("::");
                      setForm(prev=>{
                        const arr=[...prev.entries];
                        const fi=arr.findIndex(x=>String(x.id)===fromId);
                        let ti=arr.findIndex(x=>String(x.id)===toId);
                        if(fi===-1||ti===-1||fi===ti) return prev;
                        const [moved]=arr.splice(fi,1);
                        ti=arr.findIndex(x=>String(x.id)===toId);
                        const insertAt=pos==="after"?ti+1:ti;
                        arr.splice(insertAt,0,moved);
                        return{...prev,entries:arr};
                      });
                    }
                    window.removeEventListener("pointermove",onMove,true);
                    window.removeEventListener("pointerup",onUp,true);
                  };

                  window.addEventListener("pointermove",onMove,true);
                  window.addEventListener("pointerup",onUp,true);
                }}
              />
            </div>
          ))}
          </div>
          {isSC&&<button className="add-entry-btn" onClick={addEntry}>＋ Add New Site Comment</button>}
          {!isSC&&(
            <div style={{marginTop:16,padding:"15px",background:"var(--code-bg)",borderRadius:10,border:"1.5px solid var(--border)"}}>
              <div className="field"><label>Email Address <span className="req">*</span></label><input className="inp" type="email" placeholder="client@email.com" value={form.emailAddress} onChange={e=>setF({emailAddress:e.target.value,_emailAddressManuallySet:true})}/>{form.customerEmail&&!form.emailAddress&&<div style={{fontSize:10,color:"var(--accent)",marginTop:4,fontFamily:"'Poppins',sans-serif"}}>↑ Will auto-fill from Customer Email in Step 1</div>}</div>
              <div className="field" style={{marginBottom:0}}><label>Email Type <span className="req">*</span></label>
                <div className="radio-group">
                  <label className={cls("radio-label",form.emailType==="clarification"&&"selected-clarif")}><input type="radio" name="emailType" value="clarification" checked={form.emailType==="clarification"} onChange={()=>setF({emailType:"clarification"})} style={{display:"none"}}/>Clarification</label>
                  <label className={cls("radio-label",form.emailType==="completed"&&"selected-complete")}><input type="radio" name="emailType" value="completed" checked={form.emailType==="completed"} onChange={()=>setF({emailType:"completed"})} style={{display:"none"}}/>Completed</label>
                </div>
              </div>
            </div>
          )}
          <button className={cls("copy-all-btn",copiedAll&&"copied")} onClick={handleCopyAll}>{copiedAll?"✓ Copied!":"📋 Copy All "+(isSC?"Site Comments":"Assumptions + Email")}</button>
        </StepCard>

          <StepCard num={5} title="Device Check" done={step4Done} locked={!step3Done&&!isDraft} {...stepProps}>
          <p style={{fontSize:12,color:"var(--muted)",marginBottom:11}}>All three must be checked <span className="req">*</span></p>
          <div className="check-group">
            {[["mobile","Mobile"],["tablet","Tablet"],["desktop","Desktop"]].map(([k,l])=>(<label key={k} className={cls("check-label",form.devices[k]&&"checked")}><input type="checkbox" checked={form.devices[k]} onChange={e=>setF({devices:{...form.devices,[k]:e.target.checked}})}/>{l}</label>))}
          </div>
        </StepCard>

      


        <StepCard num={6} title="After Screenshot Name" done={form._afterCopied} locked={!step5Done&&!isDraft} {...stepProps}>
          <p style={{fontSize:13,color:"var(--muted)",marginBottom:9}}>Save your after screenshot with this name.</p>
          <CopyName name={afterName} onCopy={()=>setF({_afterCopied:true})}/>
        </StepCard>

           <StepCard num={7} title="Before/After Backup" done={!!form._screenshotCopied||form.images?.length>0} locked={!step6Done&&!isDraft} {...stepProps}>
          <p style={{fontSize:13,color:"var(--muted)",marginBottom:9}}>Upload screenshot — renamed automatically on download.</p>
          <CopyName name={screenshotName} onCopy={()=>setF({_screenshotCopied:true})}/>
          <div style={{marginTop:12}}><ImageUpload baseName={screenshotName} multiple={false} onImages={imgs=>{setF({images:imgs,_screenshotCopied:imgs&&imgs.length>0?true:form._screenshotCopied});}} immediateUpload={false} initialImages={form.images||[]} caseNum={form.caseNum||""} businessName={form.businessName||""} storageKey={tabStorageKey?`${tabStorageKey}-main`:"main"} isActive={openStep===7}/></div>
        </StepCard>

     
        <StepCard num={8} title="Final Checklist" done={step7Done} locked={!step7NameDone&&!isDraft} {...stepProps}>
          <p style={{fontSize:12,color:"var(--muted)",marginBottom:11}}>All items must be checked <span className="req">*</span></p>
          <div className="check-group" style={{flexDirection:"column"}}>
            {(isSC
              ? [["closeSiteComment","Close Site Comment?"],["backup","Before/After Backup?"],["caseComment","Case Comment"],["completeJob","Complete Job?"],["emailSales","Email Sales?"],["trackerChecklist","Complete Status Tracker?"],["combinedTracker","Combined Tracker?"],["qaChecklist","QA Checklist?"],["completeStatus","Tracker Checklist?"]]
              : [["backup","Before/After Backup?"],["caseComment","Case Comment"],["completeJob","Complete Job?"],["closeInboundCase","Close Inbound Case?"],["emailSales","Email Sales?"],["trackerChecklist","Complete Status Tracker?"],["combinedTracker","Combined Tracker?"],["qaChecklist","QA Checklist?"],["completeStatus","Tracker Checklist?"]]
            ).map(([k,l])=>{
              const isProlongedTracker = k==="combinedTracker" && prolongedActive;
              return (
              <div key={k}>
                {isProlongedTracker ? (
                  <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:30,border:"1px dashed rgba(245,158,11,.4)",background:"rgba(245,158,11,.06)",opacity:.7}}>
                    <span style={{fontSize:13}}>⏳</span>
                    <span style={{fontSize:12,color:"#f59e0b",fontFamily:"'Poppins',sans-serif",fontWeight:600}}>Combined Tracker — due after prolonged timer</span>
                  </div>
                ) : (
                <label className={cls("check-label",form.checklist[k]&&"checked")} style={{width:"fit-content"}}><input type="checkbox" checked={!!form.checklist[k]} onChange={e=>{
                  const newChecklist={...form.checklist,[k]:e.target.checked};
                  if(phase2StartRef.current===null){
                    const allThree=newChecklist.backup&&newChecklist.caseComment&&(prolongedActive||newChecklist.combinedTracker);
                    if(allThree){
                      const t=Date.now();
                      phase2StartRef.current=t;
                      if(p2Key&&typeof window!=="undefined") localStorage.setItem(p2Key,String(t));
                      setFooterElapsed(f=>f);
                      setResumeElapsed(r=>r);
                      setPhase2Elapsed(0);
                    }
                  }
                  setF({checklist:newChecklist});
                }}/>{l}</label>
                )}
              </div>
              );
            })}
          </div>
          <div className="field" style={{marginTop:14,marginBottom:0}}>
            <label style={{fontSize:10,fontWeight:700,color:"var(--accent)",marginBottom:4,display:"block",textTransform:"uppercase",letterSpacing:".7px"}}>🔗 Tracker Link</label>
            <input
              className="inp"
              type="url"
              placeholder="https://..."
              value={form.trackerChecklistLink||""}
              onChange={e=>setF({trackerChecklistLink:e.target.value})}
              style={{fontSize:12}}
            />
          </div>
          {/* Proceed with Next Case — multi-tab prolonged mode */}
          {onProceedWithNext&&!isEditMode&&(
            <div style={{marginTop:18,paddingTop:14,borderTop:"1px solid var(--border)"}}>
              <button
                style={{width:"100%",padding:"13px",borderRadius:10,border:"2px solid rgba(245,158,11,.4)",background:"rgba(245,158,11,.08)",color:"#f59e0b",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Poppins',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}
                onClick={()=>{
                  const elapsed=Math.floor((Date.now()-startTimeRef.current)/1000);
                  const f={...formRef.current,_saveOutcome:'completed',_elapsedAtSave:elapsed,_totalElapsed:elapsed};
                  onSave&&onSave(f);
                  onProceedWithNext(f,prolongedMinsForNext);
                }}
              >
                <span style={{fontSize:18}}>⏭</span>
                Proceed with Next Case
                <span style={{fontSize:11,fontWeight:400,color:"rgba(245,158,11,.7)"}}>saves this case &amp; opens next form</span>
              </button>
            </div>
          )}
        </StepCard>

  
      <div className="action-bar">
  {isEditMode ? (
    <>
      <div className="action-group action-group-left">
        <button 
          className="btn btn-danger" 
          style={{borderRadius:8}} 
          onClick={() => onBack && onBack()} 
        >
          ✕ Cancel Edit
        </button>

      </div>
      <div className="action-group action-group-center"/>
      <div className="action-group action-group-right">
        <button className="btn btn-save" style={{borderRadius:8}} onClick={handleSave}>💾 Save Case</button>
      </div>
    </>
  ) : (
    <>
      <div className="action-group action-group-left">
        {/* FIX: Using onBack here ensures new forms/inbound also cancel cleanly */}
        <button 
          className="btn btn-ghost" 
          style={{borderRadius:8}} 
          onClick={() => onBack && onBack()}
        >
          ← Back
        </button>
        <button className="btn btn-ghost" style={{borderRadius:8}} onClick={() => setModal("clear")}>🧹 Clear</button>

      </div>

      <div className="action-group action-group-center">
        {onStartBreak && [{label:"☕ 15m",mins:15},{label:"🧘 30m",mins:30},{label:"🍱 1h",mins:60}].map(({label,mins})=>(
          <button key={mins} className="btn btn-amber" style={{borderRadius:8,fontSize:12,padding:"8px 12px"}}
            onClick={() => {
              if(!form.caseNum){showToast("Enter a case number first","error");return;}
              setBreakConfirmData({label,mins});
              setModal("breakConfirm");
            }}>
            {label}
          </button>
        ))}
        {onStartOpenHour && (
          <button className="btn btn-amber" style={{borderRadius:8,fontSize:12,padding:"8px 12px"}}
            onClick={() => {
              if(!form.caseNum){showToast("Enter a case number first","error");return;}
              setBreakConfirmData({label:"🏢 Open Hour",mins:0,isOpenHour:true});
              setModal("breakConfirm");
            }}>
            🏢 Open Hour
          </button>
        )}
      </div>

      <div className="action-group action-group-right">
        {!isResumingDraft&&<button className="btn btn-draft" style={{borderRadius:8}} onClick={handleDraft}>💾 Suspend Case</button>}
        {onProceedWithNext&&!isEditMode&&(
          <button className="btn" style={{borderRadius:8,background:"rgba(245,158,11,.15)",border:"1px solid rgba(245,158,11,.4)",color:"#f59e0b",fontWeight:700,fontSize:13}} onClick={()=>{
            const elapsed=Math.floor((Date.now()-startTimeRef.current)/1000);
            const f={...formRef.current,_saveOutcome:'completed',_elapsedAtSave:elapsed,_totalElapsed:elapsed};
            onSave&&onSave(f);
            onProceedWithNext(f, prolongedMinsForNext);
          }}>⏭ Next Case</button>
        )}
        <button className="btn btn-save" style={{borderRadius:8}} onClick={handleSave}>✅ Save Case</button>
      </div>
    </>
  )}
</div>

        {modal==="clear"&&(<div className="modal-bg"><div className="modal"><div style={{marginBottom:14}}><Icon name="clear" size={40} color="var(--red)"/></div><h3>Clear All Fields?</h3><p style={{color:"var(--muted)",fontSize:13,marginBottom:20,lineHeight:1.6}}>All entered data will be cleared. The form stays open and the timer keeps running.</p><div className="modal-btns"><button className="btn btn-ghost" onClick={()=>setModal(null)}>Cancel</button><button className="btn btn-danger" onClick={()=>{
    setForm(emptyBase());
    resumeStartRef.current=Date.now();
    if(typeof window!=="undefined"){
        localStorage.setItem("ch_resume_start",String(Date.now()));
        if(p2Key) localStorage.removeItem(p2Key);
    }
    phase2StartRef.current=null;
    setPhase2Elapsed(null); frozenElapsedRef.current=null; frozenResumeRef.current=null;
    setModal(null);
    showToast("All fields cleared","info");
    // ADD THESE TWO LINES ↓
    idbClearImages("backup").catch(()=>{});
    idbClearImages("main").catch(()=>{});
}}>Clear All</button></div></div></div>)}
        {modal==="save"&&(<div className="modal-bg"><div className="modal"><div style={{marginBottom:14}}><Icon name="save" size={40} color="var(--accent)"/></div><h3>Save Case?</h3><p style={{color:"var(--muted)",fontSize:13,marginBottom:16,lineHeight:1.6}}>Case <strong style={{color:"var(--text)"}}>#{form.caseNum}</strong> — confirm everything is complete. The timer will reset.</p><div style={{marginBottom:18}}><div style={{fontSize:11,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".7px",fontFamily:"'Poppins',sans-serif",marginBottom:8}}>Case Outcome</div><div style={{display:"flex",gap:10}}><button onClick={()=>setSaveOutcomeType("completed")} style={{flex:1,padding:"10px 12px",borderRadius:10,border:`2px solid ${saveOutcomeType==="completed"?"var(--accent)":"var(--border)"}`,background:saveOutcomeType==="completed"?"var(--entry-accent-bg)":"var(--card)",color:saveOutcomeType==="completed"?"var(--accent)":"var(--muted)",fontWeight:700,fontSize:12,fontFamily:"'Poppins',sans-serif",cursor:"pointer",transition:".15s",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><span style={{fontSize:18}}>✅</span>Completed</button><button onClick={()=>setSaveOutcomeType("clarification")} style={{flex:1,padding:"10px 12px",borderRadius:10,border:`2px solid ${saveOutcomeType==="clarification"?"var(--amber)":"var(--border)"}`,background:saveOutcomeType==="clarification"?"rgba(245,158,11,.1)":"var(--card)",color:saveOutcomeType==="clarification"?"var(--amber)":"var(--muted)",fontWeight:700,fontSize:12,fontFamily:"'Poppins',sans-serif",cursor:"pointer",transition:".15s",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><span style={{fontSize:18}}>🔄</span>Clarification</button></div></div><div className="modal-btns"><button className="btn btn-ghost" onClick={()=>setModal(null)}>Go Back</button><button className="btn btn-primary" onClick={()=>{setModal(null);showToast("Case saved! ✅");const elapsed=Math.floor((Date.now()-startTimeRef.current)/1000);const p2=phase2Elapsed!==null?phase2Elapsed:0;const totalSecs=elapsed+(isEditMode?0:p2);const f={...formRef.current,_saveOutcome:saveOutcomeType,_elapsedAtSave:elapsed,_phase2Elapsed:p2,_totalElapsed:totalSecs,trackerChecklistLink:formRef.current.trackerChecklistLink||""};onSave&&onSave(f);}}>✅ Save Case</button></div></div></div>)}
        {modal==="draft"&&(<div className="modal-bg"><div className="modal">
          <div style={{marginBottom:14}}><Icon name="draft" size={44} color="var(--amber)"/></div>
          <h3 style={{marginBottom:8}}>Save as Draft?</h3>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:8,lineHeight:1.6}}>
            Your progress will be saved and you can resume anytime from Post-Live Amends.
          </p>
          <div style={{background:"var(--entry-accent-bg)",border:"1.5px solid var(--accent)",borderRadius:10,padding:"12px 16px",marginBottom:18,display:"flex",flexDirection:"column",gap:6}}>
            {form.caseNum&&<div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>Case #{form.caseNum}</div>}
            <div style={{fontSize:12,color:"var(--muted)"}}> Time on case: <strong style={{color:"var(--accent)",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15}}>{fmtElapsed(Math.floor((Date.now()-startTimeRef.current)/1000))}</strong></div>
            <div style={{fontSize:11,color:"var(--muted)"}}>This time will be restored when you resume.</div>
          </div>
          <div className="modal-btns">
            <button className="btn btn-ghost" onClick={()=>setModal(null)}>Keep Editing</button>
            <button className="btn btn-draft" onClick={confirmSaveDraft} disabled={draftSaving} style={{opacity:draftSaving?.6:1}}>{draftSaving?"Saving…":"💾 Save & Go Back"}</button>
          </div>
        </div></div>)}
        {modal==="breakConfirm"&&breakConfirmData&&(<div className="modal-bg"><div className="modal">
          <div style={{marginBottom:14,fontSize:36}}>{breakConfirmData.label.split(" ")[0]}</div>
          <h3 style={{marginBottom:6}}>{breakConfirmData.isOpenHour?"Starting Open Hour / Meeting":`Starting ${breakConfirmData.label} Break`}</h3>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:20,lineHeight:1.6}}>How would you like to save your current case before going {breakConfirmData.isOpenHour?"into Open Hour":"on break"}?</p>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:18}}>
            {!isResumingDraft&&(<button
              className="btn btn-draft"
              style={{borderRadius:8,justifyContent:"flex-start",padding:"12px 16px",textAlign:"left",display:"flex",alignItems:"center",gap:10}}
              onClick={async()=>{
                if(!step1Done){showToast("Fill in Case Information (Step 1) first","error");return;}
                setModal(null);
                const data=breakConfirmData;
                setBreakConfirmData(null);
                setDraftSaving(true);
                try{
                  await onSaveDraftDirect(getCleanForm());
                  if(data.isOpenHour){
                    setTimeout(()=>onStartOpenHour&&onStartOpenHour(),80);
                  } else {
                    setTimeout(()=>onStartBreak&&onStartBreak(data.label.replace(/[☕🧘🍱]/g,"").trim()+" break",data.mins),80);
                  }
                }catch(e){
                  setDraftSaving(false);
                  showToast("❌ Failed to suspend case — check connection","error");
                }
              }}
            >
              <span style={{fontSize:18}}>💾</span>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>Save as Suspended / Draft</div>
                <div style={{fontSize:11,opacity:.75,fontWeight:400}}>Requires Case Information (Step 1)</div>
              </div>
            </button>)}
            <button
              className="btn btn-save"
              style={{borderRadius:8,justifyContent:"flex-start",padding:"12px 16px",textAlign:"left",display:"flex",alignItems:"center",gap:10}}
              onClick={()=>{
                if(!step1Done){showToast("Complete Step 1 (Case Information) first","error");return;}
                if(!step4Done){showToast("All 3 devices must be checked","error");return;}
                if(!step7Done){showToast("Complete the Final Checklist first","error");return;}
                const data=breakConfirmData;
                setModal(null);
                setBreakConfirmData(null);
                onSave&&onSave({...formRef.current,trackerChecklistLink:formRef.current.trackerChecklistLink||"",_breakPending:true});
                if(data.isOpenHour){
                  setTimeout(()=>onStartOpenHour&&onStartOpenHour(),80);
                } else {
                  setTimeout(()=>onStartBreak&&onStartBreak(data.label.replace(/[☕🧘🍱]/g,"").trim()+" break",data.mins),80);
                }
              }}
            >
              <span style={{fontSize:18}}>✅</span>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>Save Case</div>
                <div style={{fontSize:11,opacity:.75,fontWeight:400}}>Requires all steps complete</div>
              </div>
            </button>
          </div>
          <div style={{borderTop:"1px solid var(--glass-border)",margin:"4px 0 14px",paddingTop:14}}>
            <button
              className="btn btn-ghost"
              style={{borderRadius:8,justifyContent:"flex-start",padding:"12px 16px",textAlign:"left",display:"flex",alignItems:"center",gap:10,width:"100%"}}
              onClick={()=>{
                const data=breakConfirmData;
                setModal(null);
                setBreakConfirmData(null);
                // Don't save/draft anything — the tab stays exactly as-is, just paused.
                if(data.isOpenHour){
                  onStartOpenHour&&onStartOpenHour();
                } else {
                  onStartBreak&&onStartBreak(data.label.replace(/[☕🧘🍱]/g,"").trim()+" break",data.mins);
                }
              }}
            >
              <span style={{fontSize:18}}>⏸️</span>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>Break for a while</div>
                <div style={{fontSize:11,opacity:.75,fontWeight:400}}>Don't save — case stays open in this tab, timer pauses and resumes after</div>
              </div>
            </button>
          </div>
          <div className="modal-btns" style={{justifyContent:"center"}}>
            <button className="btn btn-ghost" style={{borderRadius:8}} onClick={()=>{setModal(null);setBreakConfirmData(null);}}>Cancel</button>
          </div>
        </div></div>)}
      </div>

      <TocPanel openStep={openStep} setOpenStep={setOpenStep} isSC={isSC} page="postlive"
        specialRequestors={specialRequestors}
        doneMap={{
          1:step1Done,
          2:!!form._beforeCopied,
          3:!!(form.backupImages&&form.backupImages.length>0),
          4:step3Done,
          5:step4Done,
          6:!!form._afterCopied,
          7:!!form._screenshotCopied||!!(form.images?.length>0),
          8:step7Done,
        }}
      />

      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHARTS
// ─────────────────────────────────────────────────────────────────────────────
function BarChart({ data, colorClass }) {
  const max = Math.max(...data.map(d=>d.val),1);
  return (
    <div>
      {data.map((d,i)=>(
        <div key={i} className="bar-row">
          <div className="bar-label" title={d.label}>{d.label}</div>
          <div className="bar-track"><div className={cls("bar-fill",Array.isArray(colorClass)?colorClass[i%colorClass.length]:colorClass)} style={{width:`${(d.val/max)*100}%`}}/></div>
          <div className="bar-count">{d.val}</div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data, size=100, stroke=14 }) {
  const r = (size-stroke)/2; const circ = 2*Math.PI*r;
  const total = data.reduce((s,d)=>s+d.val,0)||1;
  let off = 0;
  const colors = ["#f5945c","#d4724a","#10b981","#f59e0b","#f43f5e"];
  return (
    <div className="donut-wrap">
      <svg className="donut-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((d,i)=>{
          const pct = d.val/total; const len = pct*circ; const dashArr = `${len} ${circ-len}`;
          const rotation = (off/total)*360-90; off+=d.val;
          return <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={colors[i%colors.length]} strokeWidth={stroke} strokeDasharray={dashArr} strokeDashoffset={-(rotation/360)*circ} strokeLinecap="round" style={{transition:"stroke-dasharray .8s cubic-bezier(.4,0,.2,1)"}}/>;
        })}
        <text x={size/2} y={size/2} textAnchor="middle" dy=".35em" fill="var(--text)" fontSize="14" fontWeight="800" fontFamily="Plus Jakarta Sans,sans-serif">{total}</text>
      </svg>
      <div className="donut-legend">
        {data.map((d,i)=>(<div key={i} className="donut-legend-item"><div className="donut-legend-dot" style={{background:colors[i%colors.length]}}/><span style={{color:"var(--muted)"}}>{d.label}</span><strong style={{marginLeft:"auto",paddingLeft:8}}>{d.val}</strong></div>))}
      </div>
    </div>
  );
}

function SparkLine({ data, color="#f5945c", height=40, width=200 }) {
  if(!data||data.length<2) return <div style={{color:"var(--muted)",fontSize:11,textAlign:"center",paddingTop:16}}>Not enough data</div>;
  const max=Math.max(...data,1); const min=0;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*width},${height-((v-min)/(max-min))*height}`).join(" ");
  const area=`0,${height} ${pts} ${width},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow:"visible"}}>
      <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".35"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <polygon points={area} fill="url(#sg)"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((v,i)=><circle key={i} cx={(i/(data.length-1))*width} cy={height-((v-min)/(max-min))*height} r="3" fill={color} stroke="var(--card)" strokeWidth="1.5"/>)}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard({ savedCases, setPage, specialRequestors, addRequestor, removeRequestor, user, announcements=[], archivedDrafts=[] }) {
  const now = new Date();
  const total     = savedCases.length;
  const today     = savedCases.filter(c=>new Date(c.savedAt).toDateString()===now.toDateString()).length;
  const scCount   = savedCases.filter(c=>c._mode==="siteComment").length;
  const ibCount   = savedCases.filter(c=>c._mode==="inbound").length;
  const completed = savedCases.filter(c=>c.checklist&&Object.values(c.checklist).every(Boolean)).length;

  const dayKeys=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const byDay={}; dayKeys.forEach(k=>{byDay[k]=0;});
  savedCases.forEach(c=>{const k=dayKeys[new Date(c.savedAt).getDay()]; byDay[k]=(byDay[k]||0)+1;});
  const dayData=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(label=>({label,val:byDay[label]}));

  const latestCases=[...savedCases].sort((a,b)=>new Date(b.savedAt)-new Date(a.savedAt)).slice(0,6);
  const latestAnnouncement = announcements&&announcements.length>0
    ? [...announcements].sort((a,b)=>new Date(b.createdAt||b.date||0)-new Date(a.createdAt||a.date||0))[0]
    : null;

  const modeBadgeColor = mode => mode==="inbound" ? "var(--inbound,#8a38f5)" : "var(--site-comment,#4760ff)";
  const modeLabel = mode => mode==="inbound" ? "Inbound Email" : "Site Comment";
  const cxLabel = cx => cx==="major"?"Major":cx==="complex"?"Complex":"Minor";

  // Amendments split — real Site Comment vs Inbound Email data.
  // Swap for real Build/Pre-Live/Post-Live once those pages are live (currently "Coming soon").
  const amendData=[
    {label:"Site Comment", val:scCount, color:"var(--site-comment,#4760ff)"},
    {label:"Inbound Email", val:ibCount, color:"var(--inbound,#8a38f5)"},
  ];

  const donutR=90-34/2, donutCirc=2*Math.PI*donutR;
  let donutOff=0;
  const maxDay=Math.max(...dayData.map(d=>d.val),1);
  const qWidth=520,qHeight=140,qStep=qWidth/(dayData.length-1||1);
  const qPts=dayData.map((d,i)=>({x:i*qStep,y:qHeight-(d.val/maxDay)*qHeight}));
  const qPath=qPts.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ");
  const maxAmend=Math.max(...amendData.map(d=>d.val),1);

  return (
    <div className="chd-dash">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <p className="chd-h4">Dashboard</p>
          <p className="chd-p-muted">Summary of Data</p>
        </div>
      </div>
      <div className="chd-divider"/>

      <div className="chd-greet-row">
        <div className="chd-greet-card">
          <img className="chd-avatar" src={user?.avatarUrl||"https://api.dicebear.com/7.x/initials/svg?seed="+(user?.name||"U")} alt=""/>
          <div>
            <p className="chd-h4">Hello, {user?.name||"there"}</p>
            <p className="chd-p-muted">{user?.role||"—"}</p>
          </div>
        </div>
        <div className="chd-mini-row">
          <div className="chd-mini-card"><p className="chd-h4">{total}</p><p className="chd-p-muted">Overall Cases</p></div>
          <div className="chd-mini-card"><p className="chd-h4">—</p><p className="chd-p-muted">My Latest Quota</p></div>
          <div className="chd-mini-card"><p className="chd-h4">{today}</p><p className="chd-p-muted">Cases Finished Today</p></div>
        </div>
      </div>

      <div className="chd-quick-row">
        <div className="chd-datetime-card">
          <p className="chd-label" style={{opacity:.6}}>Date &amp; Time</p>
          <div className="chd-datetime-row">
            <span>{now.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</span>
            <span>{now.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</span>
          </div>
        </div>
        <div className="chd-quickactions-card">
          <p className="chd-label" style={{opacity:.6}}>Quick Actions (Post Live)</p>
          <div className="chd-qa-buttons">
            <div className="chd-qa-left">
              <button className="chd-btn-secondary" onClick={()=>setPage("postlive")}>Site Comment</button>
              <button className="chd-btn-secondary" onClick={()=>setPage("postlive")}>Inbound</button>
              <button className="chd-btn-secondary" onClick={()=>setPage("postlive")}>Bundle</button>
            </div>
            <button className="chd-btn-primary" onClick={()=>setPage("postlive")}>Time-In</button>
          </div>
        </div>
      </div>

      <div className="chd-main-row">
        <div className="chd-totals-col">
          <p className="chd-label" style={{opacity:.6}}>Pre-Live</p>
          <div className="chd-totalcards">
            <div className="chd-totalcard"><p className="chd-h4" style={{color:"var(--site-comment,#4760ff)"}}>—</p><p className="chd-p">Total Site Comments</p></div>
            <div className="chd-totalcard"><p className="chd-h4" style={{color:"var(--amber)"}}>{archivedDrafts.length}</p><p className="chd-p">Archived Case</p></div>
            <div className="chd-totalcard"><p className="chd-h4" style={{color:"var(--green)"}}>—</p><p className="chd-p">Total Cases Finished</p></div>
          </div>

          <p className="chd-label" style={{opacity:.6}}>Post-Live</p>
          <div className="chd-totalcards">
            <div className="chd-totalcard"><p className="chd-h4" style={{color:"var(--site-comment,#4760ff)"}}>{scCount}</p><p className="chd-p">Total Site Comments</p></div>
            <div className="chd-totalcard"><p className="chd-h4" style={{color:"var(--inbound,#8a38f5)"}}>{ibCount}</p><p className="chd-p">Total Inbound Email</p></div>
            <div className="chd-totalcard"><p className="chd-h4" style={{color:"var(--green)"}}>{completed}</p><p className="chd-p">Total Cases Finished</p></div>
          </div>

          <div className="chd-headline">
            <p className="chd-label" style={{opacity:.6}}>Announcement</p>
            <button className="chd-seeall" onClick={()=>setPage("announcements")}>See All Announcement ›</button>
          </div>
          <div className="chd-list-box" style={{maxHeight:120}}>
            {latestAnnouncement ? (
              <div className="chd-ann-card">
                <div>
                  <p className="chd-h6">{latestAnnouncement.title||"Announcement"}</p>
                  <p className="chd-p-muted">{latestAnnouncement.body||latestAnnouncement.content||""}</p>
                </div>
              </div>
            ) : <div className="chd-empty">No announcements yet.</div>}
          </div>

          <div className="chd-headline">
            <p className="chd-label" style={{opacity:.6}}>Latest Case Processed</p>
            <button className="chd-seeall" onClick={()=>setPage("history")}>See All Cases ›</button>
          </div>
          <div className="chd-list-box">
            {latestCases.length>0 ? latestCases.map((c,i)=>(
              <div key={i} className="chd-case-card" onClick={()=>setPage("history")}>
                <div>
                  <p className="chd-h6">{c.caseNum} - {c.accountNum}</p>
                  <p className="chd-p-muted">{c.amendType||"—"}</p>
                </div>
                <span className="chd-badge" style={{background:modeBadgeColor(c._mode)}}>
                  {modeLabel(c._mode)} - {cxLabel(c._caseComplexity)}
                </span>
              </div>
            )) : <div className="chd-empty">No cases saved yet.</div>}
          </div>
        </div>

        <div className="chd-charts-col">
          <div className="chd-chart-card">
            <p className="chd-label" style={{opacity:.6}}>Amendments</p>
            <div className="chd-legend-row">
              {amendData.map((d,i)=>(
                <div key={i} className="chd-legend-item">
                  <div className="chd-legend-dot" style={{background:d.color}}/>
                  {d.label} {total>0?Math.round((d.val/(total||1))*1000)/10:0}%
                </div>
              ))}
            </div>
            {total>0 ? (
              <div className="chd-donut-wrap">
                <svg width={180} height={180} viewBox="0 0 180 180">
                  {amendData.map((d,i)=>{
                    const pct=d.val/(total||1), len=pct*donutCirc, dashArr=`${len} ${donutCirc-len}`;
                    const rotation=(donutOff/(total||1))*360-90; donutOff+=d.val;
                    return <circle key={i} cx={90} cy={90} r={donutR} fill="none" stroke={d.color} strokeWidth={34} strokeDasharray={dashArr} strokeDashoffset={-(rotation/360)*donutCirc}/>;
                  })}
                </svg>
              </div>
            ) : <div className="chd-empty">No data yet</div>}
          </div>

          <div className="chd-chart-card">
            <p className="chd-label" style={{opacity:.6}}>Quota Graph</p>
            {total>0 ? (
              <div style={{width:"100%",overflowX:"auto"}}>
                <svg width={qWidth} height={qHeight+30} viewBox={`0 0 ${qWidth} ${qHeight+30}`}>
                  {[0,0.25,0.5,0.75,1].map((f,i)=>(<line key={i} x1={0} x2={qWidth} y1={qHeight*f} y2={qHeight*f} stroke="var(--card2)" strokeWidth={1}/>))}
                  <path d={qPath} fill="none" stroke="#8a38f5" strokeWidth={2}/>
                  {qPts.map((p,i)=>(<circle key={i} cx={p.x} cy={p.y} r={5} fill="#8a38f5" stroke="#fff" strokeWidth={2}/>))}
                  {dayData.map((d,i)=>(<text key={i} x={i*qStep} y={qHeight+20} textAnchor="middle" fontSize="10" fontFamily="Prompt,sans-serif" fontWeight="700" fill="var(--text)">{d.label}</text>))}
                </svg>
              </div>
            ) : <div className="chd-empty">No data yet</div>}
          </div>

          <div className="chd-chart-card">
            <p className="chd-label" style={{opacity:.6}}>Amendments</p>
            {total>0 ? (
              <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%"}}>
                {amendData.map((d,i)=>(
                  <div key={i} className="chd-hbar-row">
                    <div className="chd-hbar-label">{d.label}</div>
                    <div className="chd-hbar-track"><div className="chd-hbar-fill" style={{width:`${(d.val/maxAmend)*100}%`,background:d.color}}/></div>
                  </div>
                ))}
              </div>
            ) : <div className="chd-empty">No data yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SavedCaseCard (mini dropdown for PostLive page)
// ─────────────────────────────────────────────────────────────────────────────
function SavedCaseCard({ c, openId, setOpenId, idx=0, onEdit }) {
  const cardId = c._id || `local-${idx}`;
  const open = openId === cardId;
  const isSC=c._mode==="siteComment";
  const allImages=[...(c.images||[]),...(c.backupImages||[])];
  return (
    <div style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:12,marginBottom:10,overflow:"hidden",transition:".2s",boxShadow:"var(--shadow-sm)"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer"}} onClick={()=>setOpenId(open ? null : cardId)}>
        <div className="saved-dot"/>
        <div className="saved-info">
          <div className="saved-case">Case #{c.caseNum} — {c.accountNum}</div>
          <div className="saved-meta">{c.amendType} · {c.savedAt}{c.endedAt&&<span style={{marginLeft:8,color:"var(--green)",fontWeight:700}}>✓ {c.endedAt}</span>}</div>
        </div>
        <span className="saved-type">{isSC?"Site Comment":"Inbound Email"}</span>
        {(()=>{const b=c._bundledWith;if(!b)return null;const nums=(Array.isArray(b)?b:[b]).filter(Boolean);if(!nums.length)return null;const isMulti=nums.length>1;const col=isMulti?"#f59e0b":"#10b981";const bg=isMulti?"rgba(245,158,11,.14)":"rgba(16,185,129,.14)";const bdr=isMulti?"1px solid rgba(245,158,11,.35)":"1px solid rgba(16,185,129,.35)";return <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:bg,border:bdr,color:col,fontWeight:700,flexShrink:0,fontFamily:"'Poppins',sans-serif"}}>🔗 w/ #{nums.join(", #")}</span>;})()}
        {onEdit&&<button className="btn btn-ghost" style={{fontSize:10,padding:"3px 10px",marginLeft:4}} onClick={e=>{e.stopPropagation();onEdit(c);}}><Icon name="edit" size={11} style={{marginRight:3}}/>Edit</button>}
        <span style={{color:"var(--muted)",fontSize:12,transition:".25s",display:"inline-block",transform:open?"rotate(180deg)":"none"}}>▼</span>
      </div>
      {open&&(
        <div style={{borderTop:"1px solid var(--border)",padding:"14px 16px",background:"var(--entry-bg)"}}>
          {(c.entries||[]).filter(e=>e.note||e.number||e.clarification).map((e,ei)=>(
            <div key={ei} className="case-entry-card" style={{marginBottom:8}}>
              <div className="case-entry-num">{isSC?`Site Comment #${e.number||ei+1}`:`Assumption ${ei+1}`}</div>
              {e.note&&<div className="case-entry-field"><span className="case-entry-key">Note: </span>{e.note}</div>}
              {e.clarification&&<div className="case-entry-field"><span className="case-entry-key">Clarification: </span>{e.clarification}</div>}
            </div>
          ))}
          {(c.customerName||c.customerEmail||c.businessName)&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
              {c.customerName&&<span style={{fontSize:11,padding:"2px 10px",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:20,color:"var(--text)",fontWeight:600,fontFamily:"'Poppins',sans-serif"}}>👤 {c.customerName}</span>}
              {c.customerEmail&&<span style={{fontSize:11,padding:"2px 10px",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:20,color:"var(--text)",fontWeight:600,fontFamily:"'Poppins',sans-serif"}}>✉️ {c.customerEmail}</span>}
              {c.businessName&&<span style={{fontSize:11,padding:"2px 10px",background:"var(--card2)",border:"1px solid var(--border)",borderRadius:20,color:"var(--text)",fontWeight:600,fontFamily:"'Poppins',sans-serif"}}>🏢 {c.businessName}{c.businessSuffix?' '+c.businessSuffix:''}</span>}
            </div>
          )}
          {!isSC&&c.emailAddress&&(<div style={{fontSize:13,color:"var(--muted)",marginBottom:8}}><Icon name="inbound" size={12} style={{marginRight:4,verticalAlign:"middle"}}/>{c.emailType==="clarification"?"Clarification":"Completed"} → <span style={{color:"var(--text)",fontWeight:600}}>{c.emailAddress}</span></div>)}
          <div style={{marginBottom:8}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".8px",color:"var(--muted)",marginBottom:5,fontFamily:"'Poppins',sans-serif"}}>🔗 Tracker Link</div>
            {c.trackerChecklistLink ? (
              <a href={c.trackerChecklistLink} target="_blank" rel="noopener noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:12,fontWeight:600,color:"var(--accent)",wordBreak:"break-all",padding:"5px 10px",background:"var(--entry-accent-bg)",border:"1px solid rgba(1,118,211,.2)",borderRadius:8,textDecoration:"none",transition:".15s",maxWidth:"100%"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(1,118,211,.18)"}
                onMouseLeave={e=>e.currentTarget.style.background="var(--entry-accent-bg)"}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                {c.trackerChecklistLink}
              </a>
            ) : (
              <span style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",fontFamily:"'Poppins',sans-serif"}}>—</span>
            )}
          </div>
          {allImages.length>0&&(
            <div style={{marginTop:10}}>
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".8px",color:"var(--muted)",marginBottom:8}}>Screenshots ({allImages.length})</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
                {allImages.map(img=>{
                  const isValidUrl=(img.url||"").startsWith("https://");
                  return (
                    <div key={img.id||img.name} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,maxWidth:80}}>
                      <div style={{width:80,height:60,borderRadius:6,overflow:"hidden",border:"1.5px solid var(--border)",background:"var(--entry-bg)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {isValidUrl
                          ? <img src={img.url} alt={img.name||""} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                              onError={e=>{e.currentTarget.style.display="none";e.currentTarget.parentNode.querySelector(".img-fallback").style.display="flex";}}
                            />
                          : null
                        }
                        <div className="img-fallback" style={{display:isValidUrl?"none":"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",width:"100%",height:"100%",gap:3}}>
                          <Icon name="image" size={20} color="var(--muted)"/>
                        </div>
                      </div>
                      <div style={{fontSize:9,color:"var(--muted)",textAlign:"center",wordBreak:"break-all",lineHeight:1.3,maxWidth:80,fontFamily:"'Poppins',sans-serif"}}>
                        {(img.name||"screenshot").replace(/\.[^.]+$/,"").slice(0,22)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="h-btn" style={{marginTop:10,fontSize:11,padding:"5px 12px",borderColor:"var(--green)",color:"var(--green)",fontWeight:700,display:"inline-flex",alignItems:"center",gap:6}} onClick={async(e)=>{
                e.stopPropagation();
                try{
                  const bizPart=(c.businessName||"").trim();const cx2=(c._caseComplexity||"minor");const cxLabel2=cx2==="major"?"Major":cx2==="complex"?"Complex":"Minor";const folderName=`${cxLabel2} ${c.caseNum||"unknown"}${bizPart?" "+bizPart:""}`.replace(/[^a-zA-Z0-9 _()-]/g,"").replace(/\s+/g," ").trim();
                  if(window.showDirectoryPicker){
                    try{
                      const rootDir=await getOrPickDir();
                      const caseDir=await rootDir.getDirectoryHandle(folderName,{create:true});
                      for(const img of allImages){
                        try{
                          const urlExt=(img.url||"").split("?")[0].split(".").pop().toLowerCase();
                          const safeExt=["jpg","jpeg","png","gif","webp"].includes(urlExt)?urlExt:"png";
                          const baseName=(img.name||"screenshot").replace(/\.[^/.]+$/,"");
                          const r=await fetch(img.url);const blob=await r.blob();
                          const fh=await caseDir.getFileHandle(`${baseName}.${safeExt}`,{create:true});
                          const wr=await fh.createWritable();await wr.write(blob);await wr.close();
                        }catch(e){console.warn("img failed:",e);}
                      }
                      return;
                    }catch(e){if(e.name==="AbortError")return;}
                  }
                  // Fallback: individual downloads with folder/filename path
                  for(const img of allImages){
                    try{
                      const urlExt=(img.url||"").split("?")[0].split(".").pop().toLowerCase();
                      const safeExt=["jpg","jpeg","png","gif","webp"].includes(urlExt)?urlExt:"png";
                      const baseName=(img.name||"screenshot").replace(/\.[^/.]+$/,"");
                      const r=await fetch(img.url);const blob=await r.blob();
                      const a=document.createElement("a");a.href=URL.createObjectURL(blob);
                      a.download=`${folderName}/${baseName}.${safeExt}`;
                      document.body.appendChild(a);a.click();document.body.removeChild(a);
                      URL.revokeObjectURL(a.href);
                      await new Promise(r=>setTimeout(r,120));
                    }catch(e){console.warn("img failed:",e);}
                  }
                }catch(e){console.error("Bulk download failed:",e);}
              }}>⬇ Bulk Download ({allImages.length})</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POST LIVE PAGE
// ─────────────────────────────────────────────────────────────────────────────
function PostLivePage({ onSaveCase, onUpdateCase, onUpdateDraft, onFormActive, onFormInFields, onMinimise, allSavedCases, dbDrafts, onSaveDraft, onDeleteDraft, onArchiveDraft, user, onTimerEnd, specialRequestors=[], alarmMins=30, qaAlarmMins=10, globalTimeIn, timedIn, breakActive=false, breakTimer=null, openHourActive=false, onTimeIn, onTimeOut, onTimerReset, sessionDbId, sessionLog=[], addSessionLog, setSessionLog, closeWithOutcome, closeSessionLog, clearSessionLog, onStartBreak, onStartBreakFull, onStopBreak, onStartOpenHour, onStopOpenHour, resumeTick=0 }) {
  const [mode,setMode]=useState(()=>{
    if(typeof window==="undefined") return null;
    // If live tabs are persisted, restore mode from the active tab
    try{
      const tabs=JSON.parse(localStorage.getItem("ch_live_tabs")||"[]");
      const activeId=localStorage.getItem("ch_live_tab_active");
      if(tabs.length>0){
        const activeTab=tabs.find(t=>t.id===activeId)||tabs[0];
        return activeTab.mode||localStorage.getItem("ch_active_form_mode")||null;
      }
    }catch{}
    return localStorage.getItem("ch_form_active")==="1"
      ? (localStorage.getItem("ch_active_form_mode")||null)
      : null;
  });
  const [useDraft,setUseDraft]=useState(()=>{
    if(typeof window==="undefined") return false;
    return localStorage.getItem("ch_active_form_use_draft")==="1";
  });
  const [backConfirm,setBackConfirm]=useState(false);
  const [deleteDraftConfirm,setDeleteDraftConfirm]=useState(null); // {id,mode}
  // ── Chrome-style multi-case tab system ─────────────────────────────────────
  const [formTabs,setFormTabs]=useState([]);        // [{id,mode,caseNum,label,status,timerDeadline,timerMins,warnFired}]
  // activeLiveTabs: open form tabs (each has its own PostLiveForm instance) — persisted across minimise/refresh
  const [activeLiveTabs,setActiveLiveTabs]=useState(()=>{
    if(typeof window==="undefined") return [];
    try{ const v=localStorage.getItem("ch_live_tabs"); return v?JSON.parse(v):[]; }catch{ return []; }
  });
  const [showTabPicker,setShowTabPicker]=useState(false);
  const [showAddTabPicker,setShowAddTabPicker]=useState(false);
  const [showFnGen,setShowFnGen]=useState(false);
  const [prolongedMins,setProlongedMins]=useState(30);
  const [prolongedMode,setProlongedMode]=useState(false);
  const [prolongedWarnToast,setProlongedWarnToast]=useState(null);
  const prolongedActive=formTabs.some(t=>t.status!=='done');
  const [activeFormTabId,setActiveFormTabId]=useState(()=>{
    if(typeof window==="undefined") return null;
    return localStorage.getItem("ch_live_tab_active")||null;
  });
  const [formTabTick,setFormTabTick]=useState(0);
  // Persist live tabs + active tab ID so they survive minimise/refresh
  useEffect(()=>{
    if(typeof window==="undefined") return;
    if(activeLiveTabs.length>0){
      localStorage.setItem("ch_live_tabs",JSON.stringify(activeLiveTabs));
    } else {
      localStorage.removeItem("ch_live_tabs");
    }
  },[activeLiveTabs]);
  useEffect(()=>{
    if(typeof window==="undefined") return;
    if(activeFormTabId) localStorage.setItem("ch_live_tab_active",activeFormTabId);
    else localStorage.removeItem("ch_live_tab_active");
  },[activeFormTabId]);
  // Tick every second while a tab is running
  useEffect(()=>{
    const hasRun=formTabs.some(t=>t.status==='running');
    if(!hasRun) return;
    const iv=setInterval(()=>setFormTabTick(n=>n+1),1000);
    return ()=>clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[formTabs.map(t=>t.status).join(',')]);
  // Auto-advance timer queue
  useEffect(()=>{
    if(!formTabs.length) return;
    setFormTabs(tabs=>{
      const running=tabs.find(t=>t.status==='running');
      if(!running) return tabs;
      const rem=running.timerDeadline-Date.now();
      // 1-min warning
      if(!running.warnFired&&rem<=60000&&rem>0){
        onTimerEnd&&onTimerEnd();
        return tabs.map(t=>t.id===running.id?{...t,warnFired:true}:t);
      }
      // Expired — mark overdue, update log, auto-start next
      if(rem<=0){
        setSessionLog&&setSessionLog(prev=>{
          const next=prev.map(e=>e.caseNum===running.caseNum&&e.outcome==='Pending'?{...e,outcome:'Completed Prolonged'}:e);
          if(typeof window!=='undefined') localStorage.setItem('ch_session_log',JSON.stringify(next));
          return next;
        });
        setTimeout(()=>setFormTabs(ts=>{
          const upd=ts.map(t=>t.id===running.id?{...t,status:'done'}:t);
          const np=upd.find(t=>t.status==='pending');
          if(np) return upd.map(t=>t.id===np.id?{...t,status:'running',timerDeadline:Date.now()+(t.timerMins*60000),warnFired:false}:t);
          return upd;
        }),1200);
        return tabs.map(t=>t.id===running.id?{...t,status:'overdue'}:t);
      }
      return tabs;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[formTabTick]);
  const [openSavedId,setOpenSavedId]=useState(null);
  const [editCase,setEditCase]=useState(null);
  const [showLog,setShowLog]=useState(true);
  const [editingCase,setEditingCase]=useState(null); // {savedCase, mode} — for editing from session log
  const [isMinimised,setIsMinimised]=useState(false); // true when a form is minimised (paused)
  const [minimisedFormData,setMinimisedFormData]=useState(()=>{ // saves form inputs when minimised
    if(typeof window==="undefined") return null;
    try{ const v=localStorage.getItem("ch_minimised_form"); return v?JSON.parse(v):null; }catch{ return null; }
  });
  const [activeDraftId,setActiveDraftId]=useState(null); // tracks which specific draft to resume
  const [toast,showToast]=useToast();
  const [bundleModal,setBundleModal]=useState(false); // bundle linking modal
  const [bundleForm,setBundleForm]=useState({type:"site",caseNum:""});
  // Tracks the case number of the existing case chosen in the bundle modal (a DIFFERENT case number)
  const [activeBundleCaseNum,setActiveBundleCaseNum]=useState(()=>{
    if(typeof window==="undefined") return "";
    return localStorage.getItem("ch_bundle_case_num")||"";
  });
  const handledResumeTick=useRef(0);
  const sharedFormRef=useRef(null); // shared ref so minimiseMode can access PostLiveForm's current fields
  const [tabTimerStates,setTabTimerStates]=useState({}); // {[tabId]: timerState}
  const zeroTimerState={footerElapsed:0,resumeElapsed:0,phase2Elapsed:null,isDraftResumed:false,isEditMode:false,prevElapsedSecs:0,originalTotalSecs:0,originalOutcome:""};
  // ── Sync activeLiveTabs and activeFormTabId to App-level global refs for the global alarm interval ──
  // Global alarm reads directly from localStorage — no ref syncing needed here
  // ── Draggable tab state ──
  const dragTabRef=useRef(null);
  const handleTabDragStart=(e,tabId)=>{ dragTabRef.current=tabId; e.dataTransfer.effectAllowed="move"; };
  const handleTabDrop=(e,targetTabId)=>{
    e.preventDefault();
    const dragId=dragTabRef.current;
    if(!dragId||dragId===targetTabId) return;
    setActiveLiveTabs(prev=>{
      const from=prev.findIndex(t=>t.id===dragId);
      const to=prev.findIndex(t=>t.id===targetTabId);
      if(from===-1||to===-1) return prev;
      const next=[...prev];
      const [moved]=next.splice(from,1);
      next.splice(to,0,moved);
      return next;
    });
    dragTabRef.current=null;
  };
  // ── Browser tab title: always CaseHub ──
  useEffect(()=>{ document.title="CaseHub"; },[]);

  // Alarm is now handled at App level (globalCtFiredRef/globalQaFiredRef interval)
  // computing directly from tab.startTime and localStorage p2 keys — no React state deps.
  // Tracks when the current case was started — persists across Site Comment ↔ Inbound switches
  const caseStartTimeRef=useRef((()=>{
    if(typeof window==="undefined") return globalTimeIn||Date.now();
    const v=localStorage.getItem("ch_case_start_time");
    return v?Number(v):(globalTimeIn||Date.now());
  })());

  const handleProceedWithNextCase=(savedForm,timerMins)=>{
    const id=String(Date.now());
    const caseNum=savedForm?.caseNum||'';
    const label=(mode==='inbound'?'Inbound Email':'Site Comment')+(caseNum?' — #'+caseNum:'');
    setFormTabs(tabs=>{
      const hasRunning=tabs.some(t=>t.status==='running');
      const status=hasRunning?'pending':'running';
      const deadline=hasRunning?0:Date.now()+(timerMins*60000);
      return [...tabs,{id,mode,caseNum,label,status,timerDeadline:deadline,timerMins,warnFired:false}];
    });
    // Add a new live tab for the next case (same mode)
    const newTabId=String(Date.now()+1);
    setActiveLiveTabs(ts=>[...ts,{id:newTabId,mode,key:newTabId}]);
    setActiveFormTabId(newTabId);
  };
  const enterMode = (m, withDraft = false, draftId = null, bundleCaseNum = null) => {
    // Always create a fresh live tab when opening a new form
    if(!withDraft && !editingCase){
      const tid=String(Date.now());
      setActiveLiveTabs(ts=>{
        // If there's already an empty unfilled tab of same mode, reuse it
        const existing=ts.find(t=>t.mode===m&&t.label.includes('New')&&!t.caseNum);
        if(existing){ setActiveFormTabId(existing.id); return ts; }
        const label=(m==='inbound'?'Inbound Email':'Site Comment')+' — New';
        setActiveFormTabId(tid);
        const t0 = globalTimeIn || Date.now();
        return [...ts,{id:tid,mode:m,key:tid,label,caseNum:'',startTime:t0}];
      });
    }
    if (breakActive) {
      showToast("Finish your break first before opening an amend form", "error");
      return;
    }

    const isResumingMinimised = minimisedFormData && minimisedFormData._mode === m && !withDraft;

    // Persist the case start time across Site Comment ↔ Inbound switches.
    // Only stamp a fresh start time when opening a completely new form (not resuming anything).
    const isResumingAny = isResumingMinimised || withDraft;
    if (!isResumingAny) {
      // Fresh form (Site Comment or Inbound clicked directly, not resuming).
      // Use globalTimeIn (session clock-in time) so the form timer is consistent with the session timer.
      const t = globalTimeIn || Date.now();
      caseStartTimeRef.current = t;
      if(typeof window !== "undefined") localStorage.setItem("ch_case_start_time", String(t));
    } else if (isResumingMinimised && minimisedFormData?._startTime) {
      // Resuming minimised — restore its start time
      caseStartTimeRef.current = minimisedFormData._startTime;
    } else if (withDraft && draftId) {
      // Resuming a suspended draft — use globalTimeIn so the form timer matches the session active timer.
      // Also clear ch_resume_start so the form's "Elapsed now" timer starts fresh.
      const t = globalTimeIn || Date.now();
      caseStartTimeRef.current = t;
      if(typeof window !== "undefined"){
        localStorage.setItem("ch_case_start_time", String(t));
        localStorage.removeItem("ch_resume_start");
      }
    }
    // If mode is already set (switching between siteComment ↔ inbound), keep existing caseStartTimeRef

    setMode(m);
    setUseDraft(withDraft);
    setActiveDraftId(draftId || null);
    setIsMinimised(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("ch_active_form_mode", m);
      localStorage.setItem("ch_active_form_use_draft", withDraft ? "1" : "0");
      if(bundleCaseNum) localStorage.setItem("ch_bundle_case_num", bundleCaseNum);
      else localStorage.removeItem("ch_bundle_case_num");
    }
    onFormActive && onFormActive(true);
    onFormInFields && onFormInFields(true);
    
    // Only update session log when resuming a suspended draft — not for new forms or minimised resume.
    // Status rename (Site Comment / Inbound Email) happens on Save or Suspend, not on open.
    if (!isResumingMinimised && withDraft && draftId) {
      // We are resuming a draft. Get the case number so we can attach it to the log.
      const draft = dbDrafts?.find(d => d._id === draftId);
      const draftCaseNum = draft?.caseNum || "";

      setSessionLog && setSessionLog(prev => {
        let next = [...prev];
        const hasOpen = next.some(e => !e.endedAt);
        
        if (hasOpen) {
          // Rename the active "Ongoing" entry to the specific status and attach the Case Number
          const label = m === "siteComment" ? "Site Comment" : "Inbound Email";
          next = next.map((e, i) => i === next.length - 1 && !e.endedAt
            ? { ...e, status: label, caseNum: draftCaseNum }
            : e);
        } else {
          // If no open entry exists for some reason, create a fresh one
          const label = m === "siteComment" ? "Site Comment" : "Inbound Email";
          const nowMs = Date.now();
          next = [...next, { id: nowMs, status: label, note: "Resumed draft", startedAt: nowMs, endedAt: null, outcome: "", caseNum: draftCaseNum, endNote: "" }];
        }
        if (typeof window !== "undefined") localStorage.setItem("ch_session_log", JSON.stringify(next));
        return next;
      });
    }
  };
  const exitMode=()=>{
    setProlongedMode(false);
    setActiveFormTabId(null);
    setActiveLiveTabs([]);
    setMode(null);
    setUseDraft(false);
    setActiveDraftId(null);
    setEditingCase(null);
    setIsMinimised(false);
    setMinimisedFormData(null);
    setActiveBundleCaseNum("");
    if(typeof window!=="undefined"){
      localStorage.removeItem("ch_active_form_mode");
      localStorage.removeItem("ch_active_form_use_draft");
      localStorage.removeItem("ch_minimised_form");
      localStorage.removeItem("ch_case_start_time");
      localStorage.removeItem("ch_resume_start");
      localStorage.removeItem("ch_bundle_case_num");
      localStorage.removeItem("ch_bundle_prefill");
      localStorage.removeItem("ch_live_tabs");
      localStorage.removeItem("ch_live_tab_active");
      // Clear all per-tab form persistence keys
      Object.keys(localStorage).filter(k=>k.startsWith("ch_tab_form_")).forEach(k=>localStorage.removeItem(k));
    }
    idbClearImages("backup").catch(()=>{});
    idbClearImages("main").catch(()=>{});
    onFormActive&&onFormActive(false);
    onFormInFields&&onFormInFields(false);
  };
  const pauseMode=(formData=null)=>{
    setMode(null);
    setIsMinimised(true);
    // Always clear useDraft when minimising so that on resume, isResumingMinimised
    // evaluates to true and minimisedFormData (with the user's latest edits) is used
    // rather than the stale DB draft.
    setUseDraft(false);
    if(typeof window!=="undefined") localStorage.setItem("ch_active_form_use_draft","0");
    if(formData){
      const toSave={...formData, _mode: mode||formData._mode};
      setMinimisedFormData(toSave);
      if(typeof window!=="undefined") localStorage.setItem("ch_minimised_form",JSON.stringify(toSave));
      if(typeof window!=="undefined") window.dispatchEvent(new Event("ch_case_saved"));
    }
    // NOTE: Do NOT clear IDB images or ch_live_tabs here — preserve all tab data across minimise/refresh.
    // Data is only wiped by the Clear button (clearAll) or explicit save.
    onFormActive&&onFormActive(true);
    onFormInFields&&onFormInFields(false);
  };

  // ── Edit a recently saved case from the session log ──
  // No new session log row is ever stacked.
  // The current open "Ongoing" row status is updated in-place to reflect the case being edited.
  // If a form is currently open, its open log entry is closed as "Suspended" first,
  // then the Ongoing row is updated for the edit.
  const enterEditFromLog=(entry)=>{
    if(breakActive){
      showToast("Finish your break first before editing a case","error");
      return;
    }
    const foundCase=allSavedCases.find(c=>c.caseNum&&c.caseNum===entry.caseNum);
    if(!foundCase){
      showToast("Could not find saved case #"+entry.caseNum,"error");
      return;
    }
    const editModeVal=(foundCase._mode||"")==="inbound"?"inbound":"siteComment";
    const editStatusLabel=editModeVal==="siteComment"?"Site Comment":"Inbound Email";
    const editCaseNum=foundCase.caseNum||"";

    setSessionLog&&setSessionLog(prev=>{
      let next=[...prev];
      if(mode){
        const nowMs=Date.now();
        next=next.map((e,i)=>i===next.length-1&&!e.endedAt
          ?{...e,endedAt:nowMs,outcome:"Suspended",caseNum:e.caseNum||""}
          :e);
      }
      const lastIdx=next.map((e,i)=>({e,i})).filter(({e})=>e.caseNum===editCaseNum&&e.endedAt).pop()?.i;
      if(lastIdx!=null){
        next=next.map((e,i)=>i===lastIdx?{...e,outcome:"Editing…"}:e);
      }
      if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
      return next;
    });

    // Stamp globalTimeIn so edit mode timer matches the session active timer.
    // Also clear ch_resume_start so the form's "Elapsed now" timer starts fresh.
    const editT = globalTimeIn || Date.now();
    caseStartTimeRef.current = editT;
    if(typeof window!=="undefined"){
      localStorage.setItem("ch_case_start_time", String(editT));
      localStorage.removeItem("ch_resume_start");
    }

    let enrichedCase={...foundCase};
    try{
      const raw=typeof window!=="undefined"?localStorage.getItem("ch_case_extra_cache"):null;
      if(raw){const cache=JSON.parse(raw);const cached=cache[foundCase.caseNum];if(cached){enrichedCase={...enrichedCase,customerName:enrichedCase.customerName||cached.customerName||"",customerEmail:enrichedCase.customerEmail||cached.customerEmail||"",businessName:enrichedCase.businessName||cached.businessName||"",businessSuffix:enrichedCase.businessSuffix||cached.businessSuffix||"",inboundNum:enrichedCase.inboundNum||cached.inboundNum||"",inProgress:enrichedCase.inProgress??cached.inProgress??false,entries:(enrichedCase.entries&&enrichedCase.entries.length>0)?enrichedCase.entries:(cached.entries||enrichedCase.entries||[]),checklist:enrichedCase.checklist||cached.checklist||{},devices:enrichedCase.devices||cached.devices||{},trackerChecklistLink:enrichedCase.trackerChecklistLink||cached.trackerChecklistLink||"",emailAddress:enrichedCase.emailAddress||cached.emailAddress||"",emailType:enrichedCase.emailType||cached.emailType||""};}}
    }catch(e){}
    try{
      const minData=typeof window!=="undefined"?localStorage.getItem("ch_minimised_form"):null;
      if(minData){const fd=JSON.parse(minData);if(fd.caseNum===foundCase.caseNum){enrichedCase={...enrichedCase,customerName:enrichedCase.customerName||fd.customerName||"",customerEmail:enrichedCase.customerEmail||fd.customerEmail||"",businessName:enrichedCase.businessName||fd.businessName||"",businessSuffix:enrichedCase.businessSuffix||fd.businessSuffix||""};}}
    }catch(e){}
    setEditingCase({savedCase:enrichedCase,mode:editModeVal});
    setMode(editModeVal);
    setUseDraft(false);
    if(typeof window!=="undefined"){
      localStorage.setItem("ch_active_form_mode",editModeVal);
      localStorage.setItem("ch_active_form_use_draft","0");
    }
    onFormActive&&onFormActive(true);
    onFormInFields&&onFormInFields(true);
  };
  const returnToChooser=(formData=null)=>{
    setBackConfirm(false);
    pauseMode(formData);
  };
  const minimiseMode=(formData=null)=>{
    setBackConfirm(false);
    pauseMode(formData);
    onMinimise&&onMinimise();
    // Do NOT clear activeLiveTabs or IDB images — all tab data must survive minimise
  };
  const cancelMode=()=>{
    idbClearImages("backup").catch(()=>{});
    idbClearImages("main").catch(()=>{});
    setBackConfirm(false);
    // Cancelling an edit from the session log: revert the Ongoing row back to "Ongoing"
    // with no caseNum — no new row, no stack, nothing logged.
    if(editingCase){
      const cancelCaseNum=editingCase.savedCase?.caseNum||"";
      setSessionLog&&setSessionLog(prev=>{
        // Clear the "Editing…" marker from the entry we tagged, revert open row to plain Ongoing
        const next=prev.map(e=>{
          if(e.outcome==="Editing…"&&e.caseNum===cancelCaseNum) return {...e,outcome:e._prevOutcome||""};
          if(!e.endedAt&&e.caseNum===cancelCaseNum) return {...e,caseNum:"",status:"Ongoing"};
          return e;
        });
        if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
        return next;
      });
      exitMode();
      return;
    }
    // If we were resuming a suspended draft (which renamed the log entry), revert it back to Ongoing.
    if(useDraft){
      setSessionLog&&setSessionLog(prev=>{
        const next=prev.map((e,i)=>i===prev.length-1&&!e.endedAt
          ?{...e,status:"Ongoing",caseNum:""}
          :e);
        if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
        return next;
      });
    }
    // For all other cancels (new form, minimised resume): close only THIS tab.
    // If other queued tabs remain, keep them open and activate the next one — don't wipe the whole session.
    setActiveLiveTabs(prev=>{
      const cancelledId=activeFormTabId;
      if(!cancelledId || prev.length===0){ exitMode(); return prev.length===0?prev:[]; }
      const remaining=prev.filter(t=>t.id!==cancelledId);
      if(remaining.length===0){
        exitMode();
        return [];
      }
      const idx=prev.findIndex(t=>t.id===cancelledId);
      const nextIdx=Math.min(idx,remaining.length-1);
      const now=Date.now();
      const updated=remaining.map((t,i)=> (i===nextIdx&&t.startTime===null&&!breakActive) ? {...t,startTime:now} : t);
      const nextTab=updated[nextIdx];
      setActiveFormTabId(nextTab?.id||null);
      setTabTimerStates(p=>{const n={...p};delete n[cancelledId];return n;});
      if(nextTab) setMode(nextTab.mode||mode);
      idbClearImages(`${cancelledId}-backup`).catch(()=>{});
      idbClearImages(`${cancelledId}-main`).catch(()=>{});
      return updated;
    });
  };

  useEffect(()=>{
    if(!resumeTick||resumeTick===handledResumeTick.current||typeof window==="undefined") return;
    handledResumeTick.current=resumeTick;
    const savedMode=localStorage.getItem("ch_active_form_mode");
    const savedUseDraft=localStorage.getItem("ch_active_form_use_draft")==="1";
    if(savedMode==="siteComment"||savedMode==="inbound"){
      setMode(savedMode);
      setUseDraft(savedUseDraft);
      onFormActive&&onFormActive(true);
      onFormInFields&&onFormInFields(true);
    }
  },[resumeTick]);

  // ── When break ends, auto-activate the first queued tab ──
  const prevBreakActive=useRef(breakActive);
  useEffect(()=>{
    const wasActive=prevBreakActive.current;
    prevBreakActive.current=breakActive;
    if(wasActive&&!breakActive){
      // Break just ended — find first queued tab and activate it
      setActiveLiveTabs(prev=>{
        const queuedIdx=prev.findIndex(t=>t.startTime===null);
        if(queuedIdx===-1) return prev;
        const now=Date.now();
        const updated=prev.map((t,i)=>i===queuedIdx?{...t,startTime:now}:t);
        setActiveFormTabId(updated[queuedIdx].id);
        return updated;
      });
    }
  },[breakActive]);

  // Only load draft when user explicitly clicked "Continue Suspended" — never on new form button
  // When editing from session log, use the savedCase as the form's initial data
  // When resuming minimised form, use the saved minimised form data
  const isResumingMinimised = !editingCase && !useDraft && minimisedFormData && minimisedFormData._mode === mode;
  const currentDraft=editingCase?editingCase.savedCase
    :isResumingMinimised?minimisedFormData
    :useDraft?(activeDraftId?dbDrafts?.find(d=>d._id===activeDraftId):dbDrafts?.find(d=>d._mode===mode)||null):null;
  const isEditingFromLog=!!editingCase;

  // ── hooks must be before any conditional return ──
  const recentAll = [...(allSavedCases||[])].slice(0,6);
  const [elapsed,setElapsed]=useState(0);
  useEffect(()=>{
    if(!timedIn) return;
    const t=setInterval(()=>setElapsed(globalTimeIn?Math.floor((Date.now()-globalTimeIn)/1000):0),1000);
    return()=>clearInterval(t);
  },[timedIn,globalTimeIn]);

  const amendTypesDisabled=!timedIn||isMinimised; // break no longer blocks adding new tabs

  if(mode==="siteComment"||mode==="inbound"){
    // Determine active live tab label for display
    const activeLiveTab=activeLiveTabs.find(t=>t.id===activeFormTabId)||activeLiveTabs[0];
    return (
      <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",minHeight:0}}>

        {/* Chrome-style tab bar at the very top */}
        {(activeLiveTabs.length>0)&&(
          <div style={{display:"flex",alignItems:"stretch",gap:0,background:"#1a1f2e",borderBottom:"1px solid rgba(255,255,255,.08)",padding:"0 8px",flexShrink:0,minHeight:46,overflowX:"auto"}}>
            {/* Live (filling) tabs */}
            {activeLiveTabs.map((tab,i)=>{
              const isActive=tab.id===activeFormTabId||(activeLiveTabs.length===1&&!activeFormTabId);
              const isQueued=tab.startTime===null&&!isActive;
              // Build compact label from live tab data
              const tState=tabTimerStates[tab.id];
              const timerSecs=tState&&tab.startTime!==null?(tState.footerElapsed||0):0;
              const hasTimer=timerSecs>0;
              const timerMins=Math.floor(timerSecs/60);
              const timerRemSecs=String(timerSecs%60).padStart(2,"0");
              const timerStr=`${timerMins}:${timerRemSecs}`;
              const cx=tab.complexity||'minor';
              const cxLetter=cx==='complex'?'C':cx==='major'?'M':'m'; // C=Complex M=Major m=minor
              const cxColor=cx==='complex'?'#f43f5e':cx==='major'?'#f59e0b':'#10b981';
              const cnum=tab.caseNum?`${cxLetter} #${tab.caseNum}`:'';
              // Business name = everything after the mode prefix in the label
              const bizRaw=(tab.label||'').replace(/^(Inbound Email|Site Comment)\s*[-—]?\s*/i,'').replace(/\s*#\S*\s*$/,'').trim();
              const tabDisplay=[cnum,bizRaw].filter(Boolean).join(' — ')||(tab.mode==='inbound'?'Inbound Email':'Site Comment');
              return (
                <div key={tab.id}
                  draggable
                  onDragStart={e=>handleTabDragStart(e,tab.id)}
                  onDragOver={e=>e.preventDefault()}
                  onDrop={e=>handleTabDrop(e,tab.id)}
                  onClick={()=>setActiveFormTabId(tab.id)}
                  style={{display:"flex",alignItems:"center",gap:6,padding:"0 10px 0 12px",cursor:"grab",minWidth:150,maxWidth:240,borderRadius:"6px 6px 0 0",marginTop:4,marginRight:2,background:isActive?"var(--card)":"rgba(255,255,255,.07)",borderTop:isActive?"2px solid var(--accent)":"2px solid transparent",position:"relative",flexShrink:0}}>
                  <span style={{width:8,height:8,borderRadius:"50%",flexShrink:0,background:tab.mode==='inbound'?"#8b5cf6":"#3b82f6",boxShadow:isActive?(tab.mode==='inbound'?"0 0 6px rgba(139,92,246,.7)":"0 0 6px rgba(59,130,246,.7)"):"none",display:"inline-block"}} title={tab.mode==='inbound'?"Inbound Email":"Site Comment"}/>
                  <span style={{fontSize:11,fontWeight:isActive?700:400,color:isActive?"var(--text)":"rgba(255,255,255,.6)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1,minWidth:0,fontFamily:"'Poppins',sans-serif"}}>{tabDisplay}</span>
                  {hasTimer&&!isQueued&&<span style={{fontSize:9,fontWeight:700,fontFamily:"monospace",color:isActive?"var(--accent)":"rgba(255,255,255,.45)",flexShrink:0,letterSpacing:".3px"}}>{timerStr}</span>}
                  {isQueued&&<span style={{fontSize:9,fontWeight:700,color:"var(--amber)",background:"rgba(245,158,11,.15)",border:"1px solid rgba(245,158,11,.3)",borderRadius:4,padding:"1px 5px",flexShrink:0,fontFamily:"'Poppins',sans-serif",letterSpacing:".4px"}}>QUEUED</span>}
                  {activeLiveTabs.length>1&&<button onClick={e=>{
                      e.preventDefault();
                      e.stopPropagation();
                      const closedTabId=tab.id;
                      // ── KEY RULE ──
                      // A tab has a RUNNING timer only when tab.startTime !== null.
                      // startTime===null means it is QUEUED (timer never started, elapsed=0).
                      // Only a tab with a running timer (startTime!==null) may pass its
                      // elapsed time to the next queued tab. Closing a queued tab is a
                      // simple removal — no timer logic, no queue-advance, nothing else.
                      const hasRunningTimer = tab.startTime !== null;
                      // Use the live state snapshot to avoid closure staleness
                      setActiveLiveTabs(current=>{
                        const remaining=current.filter(t=>t.id!==closedTabId);
                        if(!hasRunningTimer){
                          // Queued tab (0 timer) — just remove it, no time transfer
                          if(typeof window!=="undefined") localStorage.removeItem(`ch_tab_form_${closedTabId}`);
                          return remaining;
                        }
                        // Running (active) tab — pass its elapsed time to the next queued tab
                        if(remaining.length===0){ exitMode(); return []; }
                        const closedIdx=current.findIndex(t=>t.id===closedTabId);
                        const nextIdx=Math.min(closedIdx,remaining.length-1);
                        const now=Date.now();
                        const polledElapsed=tabTimerStates[closedTabId]?.footerElapsed||0;
                        const liveElapsed=Math.floor((now-tab.startTime)/1000);
                        const elapsedSecs=Math.max(polledElapsed,liveElapsed);
                        const updated=remaining.map((t,i)=>{
                          // Only activate the IMMEDIATELY NEXT tab; others stay queued at 0
                          if(i===nextIdx && t.startTime===null && !breakActive){
                            return {...t,startTime:now-(elapsedSecs*1000)};
                          }
                          return t;
                        });
                        const nextTab=updated[nextIdx];
                        setActiveFormTabId(nextTab?.id||null);
                        setTabTimerStates(prev=>{const n={...prev};delete n[closedTabId];return n;});
                        if(nextTab) setMode(nextTab.mode||mode);
                        // Clear the closed tab's persisted form data
                        if(typeof window!=="undefined") localStorage.removeItem(`ch_tab_form_${closedTabId}`);
                        return updated;
                      });
                    }} style={{background:"none",border:"none",color:isActive?"var(--text)":"rgba(255,255,255,.5)",cursor:"pointer",fontSize:15,padding:"0 0 0 4px",marginLeft:2,lineHeight:1,flexShrink:0,opacity:.6}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=.6}>×</button>}
                </div>
              );
            })}
            {/* Saved/timer tabs */}
            {formTabs.map(tab=>{
              const isRunning=tab.status==="running";
              const isOverdue=tab.status==="overdue";
              const isDone=tab.status==="done";
              const rem=isRunning?Math.max(0,tab.timerDeadline-Date.now()):0;
              const remM=Math.floor(rem/60000);
              const remS=String(Math.floor((rem%60000)/1000)).padStart(2,"0");
              return (
                <div key={tab.id} style={{display:"flex",alignItems:"center",gap:6,padding:"0 12px",minWidth:160,maxWidth:220,borderRadius:"6px 6px 0 0",marginTop:4,marginRight:2,background:"rgba(255,255,255,.04)",borderTop:"2px solid transparent",flexShrink:0,cursor:"default"}}>
                  <span style={{fontSize:11}}>{isOverdue?"🚨":isRunning?"⏳":isDone?"✅":"⌛"}</span>
                  <span style={{fontSize:11,color:"rgba(255,255,255,.5)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:100,fontFamily:"'Poppins',sans-serif"}}>{tab.label}</span>
                  {isRunning&&<span style={{fontSize:10,fontFamily:"monospace",fontWeight:700,color:rem<=60000?"#f43f5e":"#f59e0b",marginLeft:"auto",flexShrink:0}}>{remM}:{remS}</span>}
                  {isDone&&<button onClick={()=>setFormTabs(ts=>ts.filter(t=>t.id!==tab.id))} style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",cursor:"pointer",fontSize:13,padding:0,marginLeft:"auto",lineHeight:1,flexShrink:0}}>×</button>}
                </div>
              );
            })}
            {/* Add new tab button — visible even when a form is minimised */}
            {timedIn&&(
              <button onClick={()=>setShowAddTabPicker(true)} style={{display:"flex",alignItems:"center",justifyContent:"center",width:34,height:30,marginTop:4,borderRadius:"6px 6px 0 0",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderBottom:"none",color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:20,fontWeight:300,flexShrink:0,alignSelf:"flex-end",lineHeight:1}}>+</button>
            )}
            {/* Add-tab type picker modal */}
            {showAddTabPicker&&(
              <div className="modal-bg" onClick={e=>{if(e.target===e.currentTarget)setShowAddTabPicker(false);}}>
                <div className="modal" style={{maxWidth:480,width:"92%"}}>
                  <h3 style={{textAlign:"center",marginBottom:4}}>New Tab</h3>
                  <p style={{textAlign:"center",color:"var(--muted)",fontSize:13,marginBottom:18}}>What type of case is this?</p>
                  <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                    {[{m:"siteComment",label:"Site Comment",icon:"sitecomment"},{m:"inbound",label:"Inbound Email",icon:"inbound"}].map(({m,label,icon})=>(
                      <button key={m} className="pl-type-btn" style={{flex:"1 1 180px",minWidth:0,padding:"16px 18px"}} onClick={()=>{
                        setShowAddTabPicker(false);
                        const tid=String(Date.now());
                        const tabLabel=label+' — New';
                        // New queued tabs start frozen (startTime=null) until the active tab is saved
                        setActiveLiveTabs(ts=>[...ts,{id:tid,mode:m,key:tid,label:tabLabel,caseNum:'',startTime:null}]);
                        setActiveFormTabId(tid);
                        // Update global mode so header/context stays correct
                        setMode(m);
                        if(typeof window!=="undefined") localStorage.setItem("ch_active_form_mode",m);
                      }}>
                        <div className="pl-type-icon"><Icon name={icon} size={20} color="var(--accent)"/></div>
                        <div style={{fontSize:13,fontWeight:600}}>{label}</div>
                      </button>
                    ))}
                  </div>
                  <button className="btn btn-ghost" style={{width:"100%",marginTop:10}} onClick={()=>setShowAddTabPicker(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="page-header" style={{padding:"12px 32px 10px",flexShrink:0,borderBottom:"1px solid var(--glass-border)",margin:0,display:"flex",alignItems:"center",gap:12,justifyContent:"space-between"}}>
          <div>
            {(()=>{
              const activeTabMode=(activeLiveTabs.find(t=>t.id===activeFormTabId)||activeLiveTabs[0])?.mode||mode;
              const isSC=activeTabMode==="siteComment";
              return (<>
                <div className="page-title" style={{fontSize:20}}>{isEditingFromLog?`Editing Case #${editingCase.savedCase.caseNum}`:currentDraft&&!isResumingMinimised?`Continuing Suspended Case #${currentDraft.caseNum||""}`:isSC?"Post-Live — Site Comment":"Post-Live — Inbound Email"}</div>
                <div className="page-sub">{isEditingFromLog?"Editing saved case — all fields are editable.":currentDraft&&!isResumingMinimised?"Resuming suspended case — all fields are editable.":isSC?"Fill in each step. Steps unlock as you progress.":"Assumption-based format with email details."}</div>
              </>);
            })()}
          </div>
          {/* ── File Name Generator button ── */}
          <button style={{fontSize:11,padding:"6px 13px",borderRadius:8,border:"1px solid var(--accent)",background:"var(--accent)",color:"#fff",display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontWeight:600,letterSpacing:".2px",flexShrink:0}}
            onClick={()=>{
              // Trigger a fresh sync so the FNG reads the current active tab's data immediately
              if(typeof window!=="undefined") window.dispatchEvent(new Event("ch_case_saved"));
              setShowFnGen(true);
            }}>
            <span style={{fontSize:13}}>📋</span> File Name Generator
          </button>
          <TimerBar {...(()=>{
            const activeTab=activeLiveTabs.find(t=>t.id===activeFormTabId)||activeLiveTabs[0];
            if(activeTab&&activeTab.startTime===null) return zeroTimerState;
            return tabTimerStates[activeFormTabId]||zeroTimerState;
          })()} fmtElapsed={fmtElapsed}/>
        </div>



        {/* Break timer banner — same design as global break-bar */}
        {breakActive&&breakTimer&&(()=>{
          const pct=breakTimer.ended?100:Math.round((1-(breakTimer.secsLeft/(breakTimer.mins*60)))*100);
          const st=breakTimer.ended?"ended":breakTimer.warned?"warn":"";
          const mm=Math.floor((breakTimer.secsLeft||0)/60);
          const ss=String((breakTimer.secsLeft||0)%60).padStart(2,"0");
          return (
            <div className={cls("break-bar",st)} style={{position:"relative",flexShrink:0}}>
              <span style={{fontSize:18}}>{breakTimer.label.split(" ")[0]}</span>
              <div>
                <div className="break-label">{breakTimer.label.split(" ").slice(1).join(" ")}</div>
                <div style={{fontSize:10,color:"var(--muted)"}}>
                  {breakTimer.ended?"✅ Break over!":breakTimer.warned?"⚠️ 5 min warning!":"On break"}
                </div>
              </div>
              <div className="break-time">{breakTimer.ended?"Done!":mm+":"+ss}</div>
              <div className="break-progress" style={{flex:1}}>
                <div className="break-progress-fill" style={{width:pct+"%"}}/>
              </div>
              <button className="break-stop" onClick={onStopBreak}>✕ End</button>
            </div>
          );
        })()}

        {/* Open Hour / Meeting banner — same design as the break bar */}
        {openHourActive&&(
          <div className="break-bar" style={{position:"relative",flexShrink:0}}>
            <span style={{fontSize:18}}>🏢</span>
            <div>
              <div className="break-label">Open Hour / Meeting</div>
              <div style={{fontSize:10,color:"var(--muted)"}}>Active — session timer paused</div>
            </div>
            <div className="break-progress" style={{flex:1}}/>
            <button className="break-stop" onClick={onStopOpenHour}>✕ End</button>
          </div>
        )}

        {/* Render one PostLiveForm per live tab; only show active */}
        {(activeLiveTabs.length>0?activeLiveTabs:[{id:'default',mode,key:`${mode}-${activeDraftId||"new"}-${isEditingFromLog?"edit":"new"}`,isFirstTab:true}]).map((tab,tabIdx)=>{
          const tabMode=tab.mode||mode; // each tab can have its own mode
          const isActiveTab=tab.id===activeFormTabId||(activeLiveTabs.length<=1&&!activeFormTabId)||activeLiveTabs.length===0;
          // Only the first tab gets draft/edit data; additional tabs are always fresh
          const isFirstTab = tabIdx===0 || tab.isFirstTab;
          // For non-first tabs: restore from per-tab localStorage key if available.
          // PostLiveForm's own useState already checks this key first, so this is
          // a belt-and-suspenders pass for the draftData prop path.
          const tabPersistedData = (!isFirstTab && typeof window!=="undefined")
            ? (()=>{ try{ const v=localStorage.getItem(`ch_tab_form_${tab.id}`); return v?JSON.parse(v):null; }catch{return null;} })()
            : null;
          const tabDraftData = isFirstTab ? currentDraft : tabPersistedData;
          const tabIsEdit = isFirstTab && isEditingFromLog;
          const tabIsResumingMin = isFirstTab && isResumingMinimised;
          const tabUseDraft = isFirstTab && useDraft;
          return (
          <div key={tab.key||tab.id} style={{display:isActiveTab?"flex":"none",flexDirection:"column",flex:isActiveTab?1:undefined,overflow:"hidden",minHeight:isActiveTab?0:undefined}}>
          <PostLiveForm key={tab.key||`${tabMode}-${activeDraftId||"new"}-${isEditingFromLog?"edit":"new"}`} mode={tabMode} draftData={tabDraftData} user={user} onTimerEnd={isActiveTab&&(alarmMins>0)?onTimerEnd:null} onQaTimerEnd={isActiveTab&&(qaAlarmMins>0)?onTimerEnd:null} specialRequestors={specialRequestors} timerLimitSecs={alarmMins*60} qaTimerLimitSecs={qaAlarmMins*60} isEditMode={tabIsEdit} isMinimisedResume={tabIsResumingMin} caseStartTime={tab.startTime!==undefined?tab.startTime:caseStartTimeRef.current} externalFormRef={isFirstTab?sharedFormRef:null} isResumingDraft={tabUseDraft} onTimerTick={tab.startTime!==null?t=>setTabTimerStates(prev=>({...prev,[tab.id]:t})):null} prolongedActive={prolongedActive} onProlongedDismiss={()=>{setProlongedActive(false);setProlongedDeadline(null);}} onProceedWithNext={prolongedMode?handleProceedWithNextCase:null} prolongedMinsForNext={prolongedMins} tabStorageKey={tab.id||null} onTabDataChange={({caseNum,businessName,complexity})=>setActiveLiveTabs(ts=>ts.map(t=>t.id===tab.id?{...t,caseNum,complexity:complexity||'minor',label:(t.mode==='inbound'?'Inbound Email':'Site Comment')+(businessName?' — '+businessName:'')+(caseNum?' #'+caseNum:'')}:t))}
          originalOutcome={tabIsEdit?(editingCase.savedCase._saveOutcome||""):tabUseDraft?"Suspended":""}
          originalTotalSecs={(()=>{
            const targetCase = tabIsEdit ? editingCase.savedCase : tabDraftData;
            const caseNum = (targetCase?.caseNum||"").trim();
            // Use only the LATEST closed entry for this caseNum to avoid double-counting duplicates
            if(caseNum && sessionLog?.length){
              const entries = sessionLog.filter(e=>
                e.endedAt && (e.caseNum||"").trim()===caseNum &&
                e.status!=="Time In" && e.status!=="Time Out" && e.status!=="Break"
              );
              if(entries.length>0){
                const latest = entries.reduce((a,b)=>b.endedAt>a.endedAt?b:a);
                const ms = latest.endedAt - latest.startedAt;
                if(ms>0) return Math.floor(ms/1000);
              }
            }
            // Fallback: use stored _totalElapsed on the saved case
            return targetCase?._totalElapsed || targetCase?._elapsedAtSave || 0;
          })()}
          containerStyle={{flex:1,overflow:"hidden",minHeight:0}}
          onSave={f=>{
  const tabId=tab.id;
  const now=new Date();const rec={...f,_mode:tabMode,savedAt:now.toLocaleString(),endedAt:now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})};
  // Check if this case was started as a bundle
  const bundledWith = typeof window!=="undefined" ? (localStorage.getItem("ch_bundle_case_num")||"").trim() : "";
  if(bundledWith) {
    // New case stores bundled-with as array
    const prevOwn = rec._bundledWith ? (Array.isArray(rec._bundledWith)?rec._bundledWith:[rec._bundledWith]) : [];
    rec._bundledWith = [...new Set([...prevOwn, bundledWith])];
    // Update the existing case to point back at this new case number (deferred — newCaseNum available after save)
    const newNum = f.caseNum||"";
    const existingCase = allSavedCases.find(c=>c.caseNum===bundledWith);
    if(existingCase) {
      const prevExisting = existingCase._bundledWith ? (Array.isArray(existingCase._bundledWith)?existingCase._bundledWith:[existingCase._bundledWith]) : [];
      if(newNum && !prevExisting.includes(newNum)) {
        onUpdateCase&&onUpdateCase(existingCase._id,{...existingCase,_bundledWith:[...prevExisting,newNum]});
      }
    } else {
      // Partner may be a suspended draft — update it too
      const existingDraft = (dbDrafts||[]).find(d=>d.caseNum===bundledWith);
      if(existingDraft) {
        const prevExisting = existingDraft._bundledWith ? (Array.isArray(existingDraft._bundledWith)?existingDraft._bundledWith:[existingDraft._bundledWith]) : [];
        if(newNum && !prevExisting.includes(newNum)) {
          onUpdateDraft&&onUpdateDraft(existingDraft._id,{...existingDraft,_bundledWith:[...prevExisting,newNum]});
        }
      }
    }
    if(typeof window!=="undefined") localStorage.removeItem("ch_bundle_case_num");
    setActiveBundleCaseNum("");
  }
  if(isEditingFromLog){
    onUpdateCase&&onUpdateCase(editingCase.savedCase._id,rec);
    setEditingCase(null);
  } else {
    if(currentDraft?._id) onDeleteDraft&&onDeleteDraft(currentDraft._id,tabMode,true);
    onSaveCase&&onSaveCase(rec);
  }
  // Clear minimised form data since it's now saved
  setMinimisedFormData(null);
  if(typeof window!=="undefined"){
    // Persist key fields so File Name Generator auto-fills from latest saved case
    localStorage.setItem("ch_last_saved_case",JSON.stringify({businessName:f.businessName||"",businessSuffix:f.businessSuffix||"",accountNum:f.accountNum||""}));
    localStorage.removeItem("ch_minimised_form");
    localStorage.removeItem("ch_fng_last_source"); // reset so next new case triggers fresh autofill
    // Notify FNG on the same tab (storage event only fires across tabs)
    window.dispatchEvent(new Event("ch_case_saved"));
  }
  if(!isEditingFromLog) onTimerReset&&onTimerReset();
  
  // Set outcome based on save type (clarification / completed) and whether it was a draft
  const rawOutcome = f._saveOutcome === "clarification" ? "Clarification" : "Completed";
  const outcomeLabel = isEditingFromLog ? "Updated" : prolongedMode ? "Pending" : (useDraft ? "Completed" : rawOutcome);
  const statusLabel = tabMode === "siteComment" ? "Site Comment" : "Inbound Email";
  
  // For edit mode: just update the existing open row's caseNum/outcome in-place, revert to Ongoing — no new row added.
  // For new/suspended saves: close the open row and add a fresh Ongoing row.
  const nowMs=Date.now();
  setSessionLog&&setSessionLog(prev=>{
    let next;
    if(isEditingFromLog){
      // Only update the CLOSED "Editing…" row (endedAt set) — never touch the open Ongoing row.
      const entries=[...prev];
      const lastCaseIdx=entries.map((e,i)=>({e,i})).filter(({e})=>e.caseNum===f.caseNum&&e.endedAt).pop()?.i;
      next=entries.map((e,i)=>{
        if(i===lastCaseIdx) return {...e,outcome:"Updated",status:e.status==="Ongoing"?statusLabel:e.status};
        return e;
      });
    } else {
      // Normal save / suspended complete: close open entry, add fresh Ongoing
      const closed=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,status:statusLabel,endedAt:nowMs,outcome:outcomeLabel,caseNum:f.caseNum||e.caseNum||""}:e);
      const fresh={id:nowMs+1,status:"Ongoing",note:"",startedAt:nowMs,endedAt:null,outcome:"",endNote:""};
      next=[...closed,fresh];
    }
    if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
    return next;
  });
   idbClearImages("backup").catch(()=>{});
    idbClearImages("main").catch(()=>{});
    // Clear per-tab IDB keys for this specific tab
    idbClearImages(`${tabId}-backup`).catch(()=>{});
    idbClearImages(`${tabId}-main`).catch(()=>{});
    // Clear per-tab form persistence key
    if(typeof window!=="undefined") localStorage.removeItem(`ch_tab_form_${tabId}`);
  if(prolongedMode){
    setProlongedMode(false);
    enqueueProlongedTimer(f.caseNum||"", tabMode, prolongedMins);
  }
  // Close only the saved tab; if more tabs remain keep them open, else full exit
  setActiveLiveTabs(prev=>{
    const remaining=prev.filter(t=>t.id!==tabId);
    if(remaining.length===0){
      // Last tab saved — full exit
      exitMode();
      return [];
    }
    // Switch to adjacent tab — DO NOT remount other tabs (would wipe their form state)
    const savedIdx=prev.findIndex(t=>t.id===tabId);
    const nextIdx=Math.min(savedIdx,remaining.length-1);
    // Just update which tab is active — no key change
    // Only auto-start a queued tab if we are NOT on a break AND this save wasn't triggered by a break button
    const isBreakSave = !!(f&&f._breakPending);
    const updated=remaining.map((t,i)=>{
      if(i===nextIdx && t.startTime===null && !breakActive && !isBreakSave){
        // Not on break — activate the next queued tab immediately
        return {...t,startTime:Date.now()};
      }
      return t; // All other tabs: keep exactly as-is, no remount
    });
    setActiveFormTabId(updated[nextIdx].id);
    // Clean up ONLY the saved tab's timer state — leave others alone
    setTabTimerStates(prev=>{const n={...prev};delete n[tabId];return n;});
    // Update global mode to match newly active tab
    setMode(updated[nextIdx].mode||mode);
    if(typeof window!=="undefined") localStorage.setItem("ch_active_form_mode",updated[nextIdx].mode||mode);
    return updated;
  });
}}
          onSaveDraftDirect={async(fd)=>{
            // Apply bundle info before suspending (mirrors onSave logic)
            const bundledWithDraft = typeof window!=="undefined" ? (localStorage.getItem("ch_bundle_case_num")||"").trim() : "";
            if(bundledWithDraft){
              const prevOwn = fd._bundledWith ? (Array.isArray(fd._bundledWith)?fd._bundledWith:[fd._bundledWith]) : [];
              fd = {...fd, _bundledWith:[...new Set([...prevOwn,bundledWithDraft])]};
            }
            await onSaveDraft(tabMode,{...fd,_mode:tabMode});
            // Clear minimised form data since it's now properly suspended
            setMinimisedFormData(null);
            if(typeof window!=="undefined") localStorage.removeItem("ch_minimised_form");
            onTimerReset&&onTimerReset();
            const nowMs=Date.now();
            const statusLabel = tabMode === "siteComment" ? "Site Comment" : "Inbound Email";
            setSessionLog&&setSessionLog(prev=>{
              const closed=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,status:statusLabel,endedAt:nowMs,outcome:"Suspended",caseNum:fd.caseNum||e.caseNum||""}:e);
              const fresh={id:nowMs+1,status:"Ongoing",note:"",startedAt:nowMs,endedAt:null,outcome:"",endNote:""};
              const next=[...closed,fresh];
              if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
              return next;
            });
            if(sessionDbId) fetch('/api/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'log_case',session_id:sessionDbId,email:user?.email,case_num:fd.caseNum,case_type:tabMode,note:'draft'})}).catch(()=>{});
            // Close only this tab; full exit if last one
            setActiveLiveTabs(prev=>{
              const remaining=prev.filter(t=>t.id!==tab.id);
              if(remaining.length===0){ exitMode(); return []; }
              const savedIdx=prev.findIndex(t=>t.id===tab.id);
              const nextIdx=Math.min(savedIdx,remaining.length-1);
              const t2=Date.now();
              // Only activate the NEXT tab if it is genuinely queued (startTime===null)
              // and we are not on a break. NEVER remount other tabs (kills in-progress form state).
              // All other queued tabs remain frozen at startTime===null — no unintended activation.
              const updated=remaining.map((t,i)=>{
                if(i===nextIdx && t.startTime===null && !breakActive){
                  return {...t,startTime:t2};
                }
                return t;
              });
              setActiveFormTabId(updated[nextIdx].id);
              setTabTimerStates(prev=>{const n={...prev};delete n[tab.id];return n;});
              // Each tab clears its own scoped ch_phase2_start_{tabId} key on save — no global clear needed
              setMode(updated[nextIdx].mode||mode);
              if(typeof window!=="undefined") localStorage.setItem("ch_active_form_mode",updated[nextIdx].mode||mode);
              return updated;
            });
          }}
          onBack={()=>setBackConfirm(true)}
          onCancelForm={cancelMode}
          onStartBreak={onStartBreakFull||onStartBreak}
          onStartOpenHour={onStartOpenHour}
          onStopOpenHour={onStopOpenHour}
          openHourActive={openHourActive}
          breakActive={breakActive}
          setSessionLog={setSessionLog}/>
          </div>
          );
        })}
        
        {/* ── File Name Generator modal — rendered at root level so it covers the full viewport ── */}
        {showFnGen&&(
          <div className="modal-bg" onClick={e=>{if(e.target===e.currentTarget)setShowFnGen(false);}}>
            <div style={{background:"var(--glass-bg)",border:"1px solid var(--glass-border)",backdropFilter:"var(--glass-blur)",WebkitBackdropFilter:"var(--glass-blur)",borderRadius:14,padding:"24px 28px",width:"95%",maxWidth:1100,maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"var(--glass-shadow)",overflowY:"auto"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexShrink:0}}>
                <h3 style={{margin:0,fontSize:18,fontWeight:700}}>📋 File Name Generator</h3>
                <button onClick={()=>setShowFnGen(false)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:"var(--muted)",lineHeight:1}}>×</button>
              </div>
              {(()=>{
                // Compute active tab's current form data from per-tab localStorage key
                const activeTab=activeLiveTabs.find(t=>t.id===activeFormTabId)||activeLiveTabs[0];
                let liveTabData=null;
                if(activeTab&&typeof window!=="undefined"){
                  try{
                    const raw=localStorage.getItem(`ch_tab_form_${activeTab.id}`)||localStorage.getItem("ch_minimised_form");
                    if(raw){const fd=JSON.parse(raw);liveTabData={businessName:fd.businessName||"",businessSuffix:fd.businessSuffix||"",accountNum:fd.accountNum||"",caseNum:fd.caseNum||""};}
                  }catch{}
                }
                return (
                  <FileNameGeneratorPage
                    activeTabData={liveTabData}
                    onFill={({bizFilename,bizAlt,accountNum})=>{
                      if(activeTab){
                        window.dispatchEvent(new CustomEvent("fngen_fill",{detail:{
                          businessName: bizFilename||bizAlt||"",
                          caseNum: activeTab.caseNum||"",
                          complexity: activeTab.complexity||"minor"
                        }}));
                      }
                    }}/>
                );
              })()}
            </div>
          </div>
        )}

        {backConfirm && (
          <div className="modal-bg">
            <div className="modal">

              <div style={{ marginBottom: 14, textAlign: "center" }}>
                <Icon name="pin" size={36} color="var(--accent)" />
              </div>

              <h3 style={{ marginBottom: 6, textAlign: "center" }}>
                Leave this form?
              </h3>

              <p style={{
                color: "var(--muted)",
                fontSize: 13,
                marginBottom: 20,
                lineHeight: 1.6,
                textAlign: "center"
              }}>
                You can continue editing, minimize this form for later, or cancel it completely.
              </p>

              {/* BUTTONS */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>

                <div style={{ display: "flex", gap: 10, justifyContent: "center", width: "100%" }}>
                
                   <button
                  className="btn btn-danger"
                  style={{ flex: 1, justifyContent: "center"  }}
                  onClick={cancelMode}
                >
                  Cancel Case Form
                </button>

                 <button 
                        className="btn btn-primary" 
                        style={{ }}
                        onClick={() => {
                          minimiseMode(sharedFormRef.current || undefined);
                        }}
                      >
                        Minimize
                      </button>
                </div>

               
                  <button
                    className="btn btn-ghost"
                    style={{ width: "100%", justifyContent: "center"}}
                    onClick={() => setBackConfirm(false)}
                  >
                    Keep Editing
                  </button>
              </div>

            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Page Hero — title + Time In card */}
      <div className="chd-page-head">
        <div>
          <p className="chd-h4">Post-Live Amends</p>
          <p className="chd-p-muted">{timedIn ? "Session active — choose your amend type below." : "Clock in to begin your session."}</p>
        </div>
        {/* TIME IN / OUT card */}
       <div className="chd-datetime-card" style={{minWidth:0}}>
          {timedIn ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="chd-label" style={{opacity:.6}}>Session Active</span>
                <span className="chd-p-muted">Since:</span>
                <span className="chd-p" style={{fontWeight:700}}>
                  {globalTimeIn ? new Date(globalTimeIn).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}) : ""}
                </span>
                <span className="chd-h4" style={{color:"var(--green)"}}>{fmtElapsed(elapsed)}</span>
              </div>
              <button className="chd-btn-primary" style={{background:"var(--red)",borderColor:"var(--red)"}} onClick={()=>onTimeOut&&onTimeOut()}>
                <Icon name="stop" size={12} style={{ marginRight: 5 }} />Time Out
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: "10px" }}>
              <span className="chd-p-muted">Start your session</span>
              <button className="chd-btn-primary" onClick={() => onTimeIn && onTimeIn()} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon name="play" size={14} />Clock In
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="chd-divider"/>

      {/* Amend type chooser */}
      <div style={{display:"flex",gap:10,marginBottom:formTabs.length?8:20,flexWrap:"wrap"}}>
        {deleteDraftConfirm&&(<div className="chd-modal-bg"><div className="chd-modal-card">
          <p className="chd-h6">Archive Suspended Case?</p>
          <p className="chd-p-muted">This case will be moved to the Archive page. You can view it there anytime — nothing is permanently deleted.</p>
          <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:14}}>
            <button className="chd-btn-secondary" onClick={()=>setDeleteDraftConfirm(null)}>Keep Suspended</button>
            <button className="chd-btn-primary" style={{background:"var(--amber)",borderColor:"var(--amber)"}} onClick={()=>{onArchiveDraft&&onArchiveDraft(deleteDraftConfirm.id,deleteDraftConfirm.mode);setDeleteDraftConfirm(null);}}>Move to Archive</button>
          </div>
        </div></div>)}
        <button className="chd-big-btn" disabled={amendTypesDisabled||prolongedActive} onClick={()=>enterMode("siteComment")} style={{opacity:(amendTypesDisabled||prolongedActive)?.4:1}}>
          <div className="chd-big-btn-left">
            <div className="chd-big-btn-icon"><Icon name="sitecomment" size={22} color="#fff"/></div>
            <div><p className="chd-h6">Site Comment</p><p className="chd-p">Multiple Site Comment</p></div>
          </div>
          <Icon name="back" size={16} color="var(--muted)" style={{transform:"rotate(180deg)"}}/>
        </button>
        <button className="chd-big-btn" disabled={amendTypesDisabled||prolongedActive} onClick={()=>enterMode("inbound")} style={{opacity:(amendTypesDisabled||prolongedActive)?.4:1}}>
          <div className="chd-big-btn-left">
            <div className="chd-big-btn-icon"><Icon name="inbound" size={22} color="#fff"/></div>
            <div><p className="chd-h6">Inbound Email</p><p className="chd-p">Assumption Based Format</p></div>
          </div>
          <Icon name="back" size={16} color="var(--muted)" style={{transform:"rotate(180deg)"}}/>
        </button>
        <button className="chd-big-btn" disabled={amendTypesDisabled||prolongedActive} onClick={()=>{setBundleForm({type:"site",caseNum:""});setBundleModal(true);}} style={{opacity:(amendTypesDisabled||prolongedActive)?.4:1}}>
          <div className="chd-big-btn-left">
            <div className="chd-big-btn-icon">🔗</div>
            <div><p className="chd-h6">Bundle</p><p className="chd-p">Linked with existing Case</p></div>
          </div>
          <Icon name="back" size={16} color="var(--muted)" style={{transform:"rotate(180deg)"}}/>
        </button>
      </div>

      {/* Tab picker modal for adding new prolonged case */}
      {showTabPicker&&(
        <div className="modal-bg" onClick={e=>{if(e.target===e.currentTarget){setShowTabPicker(false);setProlongedMode(false);}}}>
          <div className="modal" style={{maxWidth:400}}>
            <div style={{textAlign:"center",marginBottom:14}}>
              <span style={{fontSize:28}}>⏳</span>
              <h3 style={{margin:"8px 0 4px"}}>New Prolonged Case</h3>
              <p style={{fontSize:12,color:"var(--muted)",lineHeight:1.5,margin:0}}>
                Fill the form normally — combined tracker reminder fires after you submit.
              </p>
            </div>
            <div className="field" style={{marginBottom:16}}>
              <label style={{display:"block",marginBottom:6}}>Tracker reminder after</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[15,30,45,60,90,120].map(m=>(
                  <button key={m} onClick={()=>setProlongedMins(m)} style={{padding:"4px 12px",borderRadius:8,border:prolongedMins===m?"2px solid #f59e0b":"1px solid var(--border)",background:prolongedMins===m?"rgba(245,158,11,.12)":"var(--glass-bg)",color:prolongedMins===m?"#f59e0b":"var(--muted)",fontWeight:prolongedMins===m?700:400,cursor:"pointer",fontSize:12,fontFamily:"'Poppins',sans-serif"}}>{m}m</button>
                ))}
                <input type="number" min={1} max={480} value={prolongedMins} onChange={e=>setProlongedMins(Math.max(1,Number(e.target.value)))} className="inp" style={{width:64,textAlign:"center"}}/>
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button className="pl-type-btn" style={{flex:1}} onClick={()=>{setShowTabPicker(false);enterMode("siteComment");}}>
                <div className="pl-type-icon"><Icon name="sitecomment" size={20} color="var(--accent)"/></div>
                <div style={{flex:1}}><div className="pl-type-title" style={{fontSize:12}}>Site Comment</div></div>
              </button>
              <button className="pl-type-btn" style={{flex:1}} onClick={()=>{setShowTabPicker(false);enterMode("inbound");}}>
                <div className="pl-type-icon" style={{background:"rgba(124,58,237,.1)",borderColor:"rgba(124,58,237,.25)"}}><Icon name="inbound" size={20} color="#7c3aed"/></div>
                <div style={{flex:1}}><div className="pl-type-title" style={{fontSize:12,color:"#7c3aed"}}>Inbound</div></div>
              </button>
            </div>
            <button className="btn btn-ghost" style={{width:"100%",marginTop:10,textAlign:"center",justifyContent:"center"}} onClick={()=>{setShowTabPicker(false);setProlongedMode(false);}}>Cancel</button>
          </div>
        </div>
      )}



      {/* 1-min warning toast */}
      {prolongedWarnToast&&(
        <div style={{position:"fixed",top:20,right:20,zIndex:9999,background:"rgba(244,63,94,.95)",border:"1px solid rgba(244,63,94,.6)",borderRadius:10,padding:"12px 18px",color:"#fff",fontFamily:"'Poppins',sans-serif",fontSize:13,fontWeight:700,boxShadow:"0 4px 20px rgba(0,0,0,.3)",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>🚨</span>
          <div><div>1 minute left!</div><div style={{fontFamily:"monospace",fontSize:15}}>Fill tracker for #{prolongedWarnToast}</div></div>
        </div>
      )}

      {/* Bundle Modal */}
      {bundleModal&&(()=>{
        // Only show cases that are active in the CURRENT session log
        const sessionCaseNums = [...new Set(
          (sessionLog||[]).filter(e=>e.caseNum&&e.caseNum.trim()).map(e=>e.caseNum.trim())
        )];

        const caseOptions = sessionCaseNums.map(cn=>{
          const saved = allSavedCases.find(c=>c.caseNum===cn);
          const draft = (dbDrafts||[]).find(d=>d.caseNum===cn);
          const src = saved ? "saved" : draft ? "suspended" : "session";
          return {
            caseNum: cn,
            accountNum: (saved||draft)?.accountNum||"",
            amendType: (saved||draft)?.amendType||"",
            _mode: (saved||draft)?._mode||"",
            _bundledWith: saved?._bundledWith||null,
            _caseComplexity: (saved||draft)?._caseComplexity||"minor",
            source: src,
            _id: saved?._id||draft?._id||cn,
            _fullData: saved||draft||null,
          };
        });

        return (
        <div className="modal-bg">
  <div className="modal" style={{ maxWidth: 440 }}>
    
    <div style={{ marginBottom: 10, fontSize: 32, textAlign: "center" }}>🔗</div>

    <h3 style={{ marginBottom: 6, textAlign: "center" }}>Bundle Cases</h3>

    <p
      style={{
        color: "var(--muted)",
        fontSize: 13,
        marginBottom: 18,
        lineHeight: 1.6,
        textAlign: "center",
      }}
    >
      Start a new case bundled with an existing one. A{" "}
      <span style={{ color: "#10b981", fontWeight: 700 }}>🔗 Bundled</span>{" "}
      badge will appear on <strong>both</strong> cases in Case History.
    </p>

    <div className="field" style={{ marginBottom: 14 }}>
      <label style={{ marginBottom: 6, display: "block" }}>
        New Case Type
      </label>

      <div style={{ display: "flex", gap: 8 }}>
        <label
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "9px 12px",
            borderRadius: 8,
            border: "1px solid",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            background:
              bundleForm.type === "site"
                ? "#fef3c7"
                : "var(--entry-bg)",
            borderColor:
              bundleForm.type === "site"
                ? "#f59e0b"
                : "var(--border)",
            color:
              bundleForm.type === "site"
                ? "#92400e"
                : "var(--text)",
          }}
        >
          <input
            type="radio"
            name="bundleType"
            checked={bundleForm.type === "site"}
            onChange={() =>
              setBundleForm((f) => ({ ...f, type: "site" }))
            }
          />
          Site Comment
        </label>

        <label
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "9px 12px",
            borderRadius: 8,
            border: "1px solid",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            background:
              bundleForm.type === "inbound"
                ? "#dcfce7"
                : "var(--entry-bg)",
            borderColor:
              bundleForm.type === "inbound"
                ? "#22c55e"
                : "var(--border)",
            color:
              bundleForm.type === "inbound"
                ? "#166534"
                : "var(--text)",
          }}
        >
          <input
            type="radio"
            name="bundleType"
            checked={bundleForm.type === "inbound"}
            onChange={() =>
              setBundleForm((f) => ({ ...f, type: "inbound" }))
            }
          />
          Inbound Email
        </label>
      </div>
    </div>

    <div className="field">
      <label>
        Bundle with Case from This Session{" "}
        <span className="req">*</span>
      </label>

      {caseOptions.length > 0 ? (
        <select
          className="inp"
          value={bundleForm.caseNum}
          onChange={(e) =>
            setBundleForm((f) => ({
              ...f,
              caseNum: e.target.value,
            }))
          }
          style={{ cursor: "pointer" }}
        >
          <option value="">— Select a case —</option>
          {caseOptions.map((c) => (
            <option key={c._id || c.caseNum} value={c.caseNum}>
              #{c.caseNum}
              {c.accountNum ? ` — ${c.accountNum}` : ""}
              {c.amendType ? ` · ${c.amendType}` : ""}
              {c.source === "suspended" ? " ⏸" : ""}
              {c.source === "saved" ? " ✅" : ""}
              {c.source === "session" ? " 🕐" : ""}
              {c._bundledWith ? " 🔗" : ""}
            </option>
          ))}
        </select>
      ) : (
        <div
          style={{
            padding: "12px 14px",
            background: "var(--entry-bg)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--muted)",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          No saved cases found.
          <br />
          Complete or suspend a case first, then bundle.
        </div>
      )}

      {bundleForm.caseNum &&
        (() => {
          const sel = caseOptions.find(
            (o) => o.caseNum === bundleForm.caseNum
          );
          if (!sel) return null;

          const statusLabel =
            sel.source === "suspended"
              ? "⏸ Suspended"
              : sel.source === "saved"
              ? "✅ Saved"
              : "🕐 Session";

          return (
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                color: "var(--muted)",
                padding: "6px 10px",
                background: "var(--entry-bg)",
                borderRadius: 6,
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <strong style={{ color: "var(--text)" }}>
                #{sel.caseNum}
              </strong>

              {sel.accountNum && (
                <span>· {sel.accountNum}</span>
              )}

              {sel._mode && (
                <span>
                  ·{" "}
                  {sel._mode === "siteComment"
                    ? "Site Comment"
                    : "Inbound Email"}
                </span>
              )}

              {(()=>{
                const cx=sel._caseComplexity||"minor";
                if(cx==="major") return <span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.3)",color:"#f59e0b",fontWeight:700}}>Major</span>;
                if(cx==="complex") return <span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:"rgba(244,63,94,.12)",border:"1px solid rgba(244,63,94,.3)",color:"#f43f5e",fontWeight:700}}>Complex</span>;
                return <span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:"rgba(16,185,129,.12)",border:"1px solid rgba(16,185,129,.3)",color:"#10b981",fontWeight:700}}>Minor</span>;
              })()}

              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  padding: "1px 7px",
                  borderRadius: 20,
                  background: "var(--card2)",
                  color: "var(--muted)",
                  fontWeight: 600,
                }}
              >
                {statusLabel}
              </span>

              {sel._bundledWith && (
                <span
                  style={{
                    color: "#10b981",
                    fontWeight: 700,
                    fontSize: 10,
                  }}
                >
                  🔗 Already bundled
                </span>
              )}
            </div>
          );
        })()}
    </div>

    <div className="modal-btns">
      <button
        className="btn btn-ghost"
        onClick={() => setBundleModal(false)}
      >
        Cancel
      </button>

      <button
        className="btn btn-primary"
        onClick={() => {
          if (!bundleForm.caseNum.trim()) {
            showToast("Select a case to bundle", "error");
            return;
          }

          // Store the full existing case data so the new bundle form can be prefilled
          const selCase = caseOptions.find(o=>o.caseNum===bundleForm.caseNum.trim());
          if(selCase?._fullData && typeof window!=="undefined"){
            try{
              // Only carry over images already in storage (have url, no pending _file blob).
              // Note: images loaded from DB don't carry _inDB:true, so we check url+!_file instead.
              const safeImages = (selCase._fullData.images||[])
                .filter(i=>i.url&&!i._file)
                .map(i=>({...i,_inDB:true}));
              const safeBackups = (selCase._fullData.backupImages||[])
                .filter(i=>i.url&&!i._file)
                .map(i=>({...i,_inDB:true}));
              const prefill = {
                // CASE INFORMATION (except case number)
                accountNum: selCase._fullData.accountNum||"",
                amendType: selCase._fullData.amendType||"",
                customerName: selCase._fullData.customerName||"",
                customerEmail: selCase._fullData.customerEmail||"",
                businessName: selCase._fullData.businessName||"",
                businessSuffix: selCase._fullData.businessSuffix||"",
                inboundNum: selCase._fullData.inboundNum||"",
                inProgress: selCase._fullData.inProgress||false,
                emailAddress: selCase._fullData.emailAddress||"",
                emailType: selCase._fullData.emailType||"clarification",
                trackerChecklistLink: selCase._fullData.trackerChecklistLink||"",
                _caseComplexity: selCase._fullData._caseComplexity||"minor",
                // ASSUMPTION/CASE COMMENT
                entries: selCase._fullData.entries||[],
                // ADDITIONAL BACKUP SCREENSHOT
                images: safeImages,
                // BEFORE/AFTER BACKUP
                backupImages: safeBackups,
                _sourceMode: selCase._fullData._mode||"",
              };
              localStorage.setItem("ch_bundle_prefill", JSON.stringify(prefill));
            }catch(e){ /* ignore serialisation errors */ }
          }

          setBundleModal(false);

          enterMode(
            bundleForm.type === "inbound"
              ? "inbound"
              : "siteComment",
            false,
            null,
            bundleForm.caseNum.trim()
          );

          showToast(
            "🔗 Bundle set — info from the existing case has been pre-filled",
            "info"
          );
        }}
      >
        🔗 Start Bundled Case
      </button>
    </div>
  </div>
</div>
     
        );
      })()}
      {!timedIn&&<div style={{fontSize:12,color:"var(--muted)",marginTop:-16,marginBottom:24,fontFamily:"'Poppins',sans-serif",padding:"10px 14px",background:"var(--entry-bg)",border:"1px solid var(--border)",borderRadius:8,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:16}}>⏰</span> Click <strong style={{color:"var(--text)"}}>Clock In</strong> above to start your session and unlock amend types.
      </div>}
      {breakActive&&<div style={{fontSize:12,color:"var(--muted)",marginTop:-16,marginBottom:24,fontFamily:"'Poppins',sans-serif",padding:"10px 14px",background:"var(--entry-bg)",border:"1px solid var(--border)",borderRadius:8,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:16}}>☕</span> Finish your break first to open <strong style={{color:"var(--text)"}}>Site Comment</strong> or <strong style={{color:"var(--text)"}}>Inbound Email</strong>.
      </div>}
      {isMinimised&&!breakActive&&<div style={{fontSize:12,color:"var(--amber)",marginTop:-16,marginBottom:24,fontFamily:"'Poppins',sans-serif",padding:"10px 14px",background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.35)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
        <span style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>🗕</span> A form is currently <strong style={{color:"var(--amber)"}}>minimised</strong> — resume or cancel it before starting a new one.</span>
        <button className="btn btn-ghost" style={{fontSize:11,padding:"5px 12px",borderRadius:6,color:"var(--amber)",borderColor:"rgba(245,158,11,.4)"}} onClick={()=>{const m=minimisedFormData?._mode||(typeof window!=="undefined"?localStorage.getItem("ch_active_form_mode"):null);if(m==="siteComment"||m==="inbound"){setMode(m);setIsMinimised(false);onFormActive&&onFormActive(true);onFormInFields&&onFormInFields(true);}}}> Resume</button>
      </div>}

      {/* Session Time Log */}
      

      {dbDrafts&&dbDrafts.length>0&&(
        <div style={{marginBottom:22}}>
          <p className="chd-h6" style={{marginBottom:10}}>Suspended Case</p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {dbDrafts.map((d,i)=>(
            <div key={d._id||i} className="chd-case-card" style={{cursor:"default"}}>
              <div>
                <div className="chd-title-row">
                  <p className="chd-h6">{d.caseNum||"—"} - {d.accountNum||"—"}</p>
                  <span className="chd-badge" style={{background:d._mode==="siteComment"?"var(--site-comment,#4760ff)":"var(--inbound,#8a38f5)"}}>{d._mode==="siteComment"?"Site Comment":"Inbound Email"} - {(d._caseComplexity||"minor").charAt(0).toUpperCase()+(d._caseComplexity||"minor").slice(1)}</span>
                  {(()=>{const b=d._bundledWith;if(!b)return null;const nums=(Array.isArray(b)?b:[b]).filter(Boolean);if(!nums.length)return null;return <span className="chd-badge" style={{background:"var(--amber)"}}>w/ #{nums.join(", #")}</span>;})()}
                </div>
                <p className="chd-p-muted">{d.amendType||"No amend type"} · {d.draftAt}</p>
              </div>
              <div className="chd-row-actions">
                <button className="chd-btn-primary" disabled={!timedIn||breakActive||isMinimised} onClick={()=>enterMode(d._mode, true, d._id)} style={{opacity:(!timedIn||breakActive||isMinimised)?.45:1,cursor:(!timedIn||breakActive||isMinimised)?"not-allowed":"pointer"}}>Continue</button>
                <button className="chd-btn-secondary" disabled={!timedIn||breakActive||isMinimised} onClick={() => setDeleteDraftConfirm({ id: d._id, mode: d._mode })} style={{opacity:(!timedIn||breakActive||isMinimised)?.45:1,cursor:(!timedIn||breakActive||isMinimised)?"not-allowed":"pointer",borderColor:"var(--amber)",color:"var(--amber)"}}>Archive case</button>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}


      {sessionLog.length>0&&(
        <div className="session-log-wrap">
          <div className="session-log-header">
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              
              <div className="section-title" style={{marginBottom:0,borderBottom:"none",paddingBottom:0,fontSize:13}}>Session Time Log</div>
              <span style={{fontSize:10,padding:"2px 8px",background:"rgba(1,118,211,.12)",color:"var(--accent)",borderRadius:20,fontWeight:700,fontFamily:"'Poppins',sans-serif"}}>{new Set(sessionLog.filter(e=>e.caseNum).map(e=>e.caseNum)).size} cases</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn btn-ghost" style={{fontSize:11,padding:"5px 12px",borderRadius:7}} onClick={()=>setShowLog(s=>!s)}>{showLog?"▲ Hide":"▼ Show"} Log</button>
              
            </div>
          </div>
          {showLog&&(
            <>
              {(()=>{
  const caseNumCounts=sessionLog.reduce((acc,e)=>{
    const key=(e.caseNum||"").trim();
    if(key) acc[key]=(acc[key]||0)+1;
    return acc;
  },{});
  
  // FIX 2: Create a unique color map for each duplicated case number
  const dupColors = [
    { border: "#f59e0b", bg: "rgba(245,158,11,.15)" }, // amber
    { border: "#10b981", bg: "rgba(16,185,129,.15)" }, // green
    { border: "#3b82f6", bg: "rgba(59,130,246,.15)" }, // blue
    { border: "#8b5cf6", bg: "rgba(139,92,246,.15)" }, // violet
    { border: "#ec4899", bg: "rgba(236,72,153,.15)" }, // pink
    { border: "#06b6d4", bg: "rgba(6,182,212,.15)" }   // cyan
  ];
  
  let dupIndex = 0;
  const dupColorMap = {};
  Object.entries(caseNumCounts).forEach(([num, count]) => {
    if (count > 1) {
      dupColorMap[num] = dupColors[dupIndex % dupColors.length];
      dupIndex++;
    }
  });
  
  // Display: open Time In entry pinned first, rest in chronological order (newest at bottom)
  const openEntry = sessionLog.find(e => e.status === "Time In" && !e.endedAt);
  const otherEntries = sessionLog.filter(e => !(e.status === "Time In" && !e.endedAt));
  // Newest at bottom: closed entries in chronological order, open entry pinned at bottom
  const displayLog = openEntry ? [...otherEntries, openEntry] : [...sessionLog];

  // Find the latest entry per case by endedAt time (on original sessionLog for correctness)
  const caseNumLastIdx={};
  sessionLog.forEach((e,idx)=>{
    const key=(e.caseNum||"").trim();
    if(!key) return;
    if(!e.endedAt) return;
    if(caseNumLastIdx[key]===undefined){
      caseNumLastIdx[key]=idx;
    }else{
      const currentLatest=sessionLog[caseNumLastIdx[key]];
      if(e.endedAt > currentLatest.endedAt){
        caseNumLastIdx[key]=idx;
      }
    }
  });
  // Remap caseNumLastIdx to displayLog indices
  const displayCaseNumLastIdx={};
  displayLog.forEach((e,idx)=>{
    const key=(e.caseNum||"").trim();
    if(!key||!e.endedAt) return;
    if(displayCaseNumLastIdx[key]===undefined){
      displayCaseNumLastIdx[key]=idx;
    }else{
      const currentLatest=displayLog[displayCaseNumLastIdx[key]];
      if(e.endedAt > currentLatest.endedAt){
        displayCaseNumLastIdx[key]=idx;
      }
    }
  });

  const hasDuplicateCases=Object.values(caseNumCounts).some(v=>v>1);
  return <>
    {hasDuplicateCases&&<div style={{padding:"10px 16px",background:"rgba(245,158,11,.1)",borderBottom:"1px solid rgba(245,158,11,.2)",fontSize:11,fontWeight:700,color:"var(--amber)",fontFamily:"'Poppins',sans-serif"}}>⚠ Duplicate case numbers — only the latest entry per case can be edited.</div>}
    
    <div className="session-log-table-head">
      <span>Case Number</span><span>Status</span><span>Started</span><span>Ended</span><span>Duration</span><span>Complexity</span><span>Outcome</span><span>Actions</span>
    </div>
    
    {displayLog.map((entry,i)=>{
      const start=new Date(entry.startedAt);
      const end=entry.endedAt?new Date(entry.endedAt):null;
      const durMs=end?(entry.endedAt-entry.startedAt):null;
      const h=durMs!=null?Math.floor(durMs/3600000):0;
      const m=durMs!=null?Math.floor((durMs%3600000)/60000):0;
      const s=durMs!=null?Math.floor((durMs%60000)/1000):0;
      const durStr=durMs!=null?(h>0?`${h}h ${m}m ${s}s`:m>0?`${m}m ${s}s`:`${s}s`):"–";
      const fmtT=(d)=>d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
      
      const statusColors={
        "Time In":"#7c3aed","Time Out":"#6b7280",
        "Ongoing":"var(--amber)",
        "Site Comment":"#0176D3","Inbound Email":"#7c3aed",
        "Break":"var(--green)",
      };
      
      const outcomeColors={
        "Completed":"var(--green)",
        "Updated":"var(--accent)",
        "Clarification":"var(--amber)",
        "Suspended":"var(--red)",
        "Deleted":"#f43f5e",
        "Editing…":"var(--muted)",
        "Continued Draft Saved":"var(--amber)",
        "Draft Saved":"var(--amber)",
        "Prolonged":"#f59e0b",
        "Completed Prolonged":"var(--green)",
        "Pending":"#f59e0b",
        "Break Ended":"var(--amber)",
        "Open Hour Ended":"var(--accent)",
        "Cancelled":"var(--red)",
        "Archived":"var(--amber)"
      };
      
      const col=statusColors[entry.status]||"var(--text)";
      const isOngoing=!end;
      const outcome=entry.outcome||"";
      const caseNum=entry.caseNum||"";
      
      // Determine if duplicate and get unique color
      const isDuplicate=!!caseNum&&caseNumCounts[caseNum]>1;
      const activeDupColor = isDuplicate ? dupColorMap[caseNum] : null;

      const outcomeColor=outcome?outcomeColors[outcome]||"var(--muted)":"var(--muted)";
      const isLatestForCase=!!caseNum&&displayCaseNumLastIdx[caseNum.trim()]===i;
      const editButtonDisabled = !!editCase && (editCase._mode === "siteComment" || editCase._mode === "inbound");
      
      const hasSuspendedDraft = !!dbDrafts?.find(d => d.caseNum === caseNum);
      const isSuspended = outcome === "Suspended";
      
      const isCaseEntry = entry.status==="Site Comment" || 
                          entry.status==="Inbound Email" || 
                          (entry.status==="Ongoing" && caseNum && outcome);
      
      const isContinueSuspended = outcome === "Suspended";
      const isDeleted = outcome === "Deleted";
      const buttonText = isContinueSuspended ? "Continue" : "Edit";

      // A suspended entry should lose its "Continue" button once the case has been
      // completed — either as a later entry in this same session log, or saved to
      // allSavedCases (continued in a previous / the same session and fully saved).
      const suspendedButLaterCompleted = isContinueSuspended && caseNum && (() => {
        // Check if a later session-log entry for the same case is Completed/Updated
        const laterCompletedInLog = sessionLog.some((e, j) =>
          j > i &&
          (e.caseNum || "").trim() === caseNum.trim() &&
          (e.outcome === "Completed" || e.outcome === "Updated")
        );
        if (laterCompletedInLog) return true;
        // Check if the case exists in allSavedCases (completed and persisted)
        const isSavedCompleted = !!(allSavedCases || []).find(c => c.caseNum === caseNum);
        if (isSavedCompleted) return true;
        return false;
      })();

      const showButton = isCaseEntry && 
                         caseNum && 
                         !isOngoing && 
                         outcome !== "Prolonged" && outcome !== "Pending" && outcome !== "Completed Prolonged" &&
                         !suspendedButLaterCompleted &&
                         (!isDuplicate || isLatestForCase);

      // ── Bundle badge: look up this case in saved cases and drafts ──
      // ── Post-save bundle: look up _bundledWith on saved/draft case ──
      // Use only the correct source: suspended entries live in drafts, completed ones in saved cases.
      // Merging both caused cross-contamination (e.g. completed case showing suspended partner badge).
      const entryIsSuspended = outcome === "Suspended";
      const savedCaseForEntry = !entryIsSuspended && caseNum ? allSavedCases?.find(c => c.caseNum === caseNum) : null;
      const draftCaseForEntry = entryIsSuspended && caseNum ? dbDrafts?.find(d => d.caseNum === caseNum) : null;
      const rawBundledWith = savedCaseForEntry?._bundledWith ?? draftCaseForEntry?._bundledWith ?? null;
      const savedBundleNums = rawBundledWith
        ? (Array.isArray(rawBundledWith) ? rawBundledWith : [rawBundledWith]).filter(Boolean)
        : [];
      const isSavedBundle = savedBundleNums.length > 0;

      // ── Pre-save bundle: detect using activeBundleCaseNum (the chosen partner) ──
      // The EXISTING chosen case: its caseNum matches activeBundleCaseNum
      const isChosenBundle = !!activeBundleCaseNum && caseNum === activeBundleCaseNum;
      // The NEW active case: it is the current open (not yet ended) form entry while a bundle is set
      const isNewActiveBundle = !!activeBundleCaseNum && !entry.endedAt &&
        (entry.status === "Site Comment" || entry.status === "Inbound Email" || entry.status === "Ongoing");

      const isBundled = isSavedBundle || isChosenBundle || isNewActiveBundle;

      // Build the label text for the badge
      const bundleNums = isSavedBundle
        ? savedBundleNums
        : isChosenBundle
          ? ["new case"]           // existing case: partner is the new case being worked on
          : [activeBundleCaseNum]; // new active case: partner is the chosen existing case
   
      return (
        <div key={entry.id} className="session-log-row" style={{
          background: i%2===0?"var(--none)":"transparent",
          borderLeft: isDuplicate ? `3px solid ${activeDupColor.border}` : "3px solid transparent"
        }}>
          
          {/* Case Number cell — wraps case # + bundle badge in one grid column */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-center",gap:4,justifyContent:"center"}}>
            <span style={{
              color: isDuplicate ? activeDupColor.border : (caseNum ? "var(--text)" : "var(--muted)"),
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: caseNum ? 700 : 400,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: isDuplicate ? activeDupColor.bg : "transparent",
              padding: isDuplicate ? "2px 8px" : "0",
              borderRadius: isDuplicate ? "4px" : "0"
            }}>
              {caseNum ? `#${caseNum}` : "-"}
              {isDuplicate && <span style={{fontSize:9,fontFamily:"'Poppins',sans-serif",fontWeight:800}}></span>}
              {caseNum && <CopyCaseBtn caseNum={caseNum}/>}
            </span>
            {isBundled && (()=>{
              const isMulti = bundleNums.length > 1;
              const col = isMulti ? "#f59e0b" : "#10b981";
              const bg  = isMulti ? "rgba(245,158,11,.14)" : "rgba(16,185,129,.14)";
              const bdr = isMulti ? "1px solid rgba(245,158,11,.35)" : "1px solid rgba(16,185,129,.35)";
              return (
                <span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:9,fontWeight:800,color:col,background:bg,border:bdr,padding:"2px 7px",borderRadius:20,whiteSpace:"nowrap",fontFamily:"'Poppins',sans-serif",lineHeight:1.4}}>
                  {isSavedBundle ? `🔗 w/ #${bundleNums.join(", #")}` : isChosenBundle ? "🔗 Bundling w/ new case" : `🔗 Bundle of #${activeBundleCaseNum}`}
                </span>
              );
            })()}
            {(()=>{
              const logCase = caseNum ? ((allSavedCases||[]).find(c=>c.caseNum===caseNum)||(dbDrafts||[]).find(d=>d.caseNum===caseNum)) : null;
              const cx = logCase?._caseComplexity;
              if(!cx||cx==="minor") return null;
              if(cx==="major") return <span style={{display:"inline-flex",alignItems:"center",fontSize:9,fontWeight:800,color:"#f59e0b",background:"rgba(245,158,11,.14)",border:"1px solid rgba(245,158,11,.35)",padding:"2px 7px",borderRadius:20,whiteSpace:"nowrap",fontFamily:"'Poppins',sans-serif",lineHeight:1.4}}>Major</span>;
              return <span style={{display:"inline-flex",alignItems:"center",fontSize:9,fontWeight:800,color:"#f43f5e",background:"rgba(244,63,94,.14)",border:"1px solid rgba(244,63,94,.35)",padding:"2px 7px",borderRadius:20,whiteSpace:"nowrap",fontFamily:"'Poppins',sans-serif",lineHeight:1.4}}>Complex</span>;
            })()}
          </div>
          
          <div style={{color:col,display:"flex",alignItems:"center",gap:6,fontWeight:700,fontFamily:"'Poppins',sans-serif",fontSize:11,whiteSpace:"nowrap"}}>
            <span className={`session-log-status-dot${isOngoing?" ongoing-dot":""}`} style={{background:col,boxShadow:`0 0 6px ${col}55`,width:7,height:7,borderRadius:"50%",flexShrink:0}}/>
            {entry.status}
          </div>
          
          <span style={{color:"var(--text)",fontFamily:"monospace",fontSize:11}}>{fmtT(start)}</span>
          <span style={{color:end?"var(--text)":"var(--accent)",fontFamily:"monospace",fontSize:11}}>
            {end?fmtT(end):<span className="session-log-ongoing">-</span>}
          </span>
          <span style={{color:isOngoing?"var(--accent)":"var(--muted)",fontSize:11,fontFamily:"monospace",fontWeight:isOngoing?700:400}}>
            {isOngoing?"-":durStr}
          </span>
          <span style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
            {caseNum&&(()=>{
              const logCase = (allSavedCases||[]).find(c=>c.caseNum===caseNum)||(dbDrafts||[]).find(d=>d.caseNum===caseNum);
              const cx = logCase?._caseComplexity||"minor";
              if(cx==="major") return <span style={{fontSize:9,fontWeight:800,color:"#f59e0b",background:"rgba(245,158,11,.14)",border:"1px solid rgba(245,158,11,.35)",padding:"2px 7px",borderRadius:20,fontFamily:"'Poppins',sans-serif"}}>Major</span>;
              if(cx==="complex") return <span style={{fontSize:9,fontWeight:800,color:"#f43f5e",background:"rgba(244,63,94,.14)",border:"1px solid rgba(244,63,94,.35)",padding:"2px 7px",borderRadius:20,fontFamily:"'Poppins',sans-serif"}}>Complex</span>;
              return <span style={{fontSize:9,fontWeight:800,color:"#10b981",background:"rgba(16,185,129,.14)",border:"1px solid rgba(16,185,129,.35)",padding:"2px 7px",borderRadius:20,fontFamily:"'Poppins',sans-serif"}}>Minor</span>;
            })()}
          </span>
          <span style={{color:outcomeColor,fontSize:10,fontWeight:700,fontFamily:"'Poppins',sans-serif",letterSpacing:".2px"}}>
            {outcome||"-"}
          </span>
          <div>
            {isDeleted?(
              <span style={{fontSize:10,fontWeight:700,color:"#f43f5e",fontFamily:"'Poppins',sans-serif",background:"rgba(244,63,94,.12)",padding:"3px 8px",borderRadius:2,border:"1px solid rgba(244,63,94,.3)"}}>🗑 Deleted</span>
            ):(outcome==="Prolonged"||outcome==="Pending")?(
              <span style={{fontSize:9,fontWeight:700,color:"#f59e0b",fontFamily:"'Poppins',sans-serif",background:"rgba(245,158,11,.1)",padding:"3px 8px",borderRadius:6,border:"1px solid rgba(245,158,11,.3)"}}>⏳ Tracker pending</span>
            ):outcome==="Completed Prolonged"?(
              <span style={{fontSize:9,fontWeight:700,color:"var(--green)",fontFamily:"'Poppins',sans-serif",background:"rgba(16,185,129,.1)",padding:"3px 8px",borderRadius:6,border:"1px solid rgba(16,185,129,.3)"}}>✅ Prolonged done</span>
            ):showButton?(
              <button
                className="session-log-edit-btn"
                disabled={breakActive || isMinimised || editButtonDisabled}
                onClick={() => {
                  const draft = dbDrafts?.find(d => d.caseNum === caseNum);
                  if (draft && isSuspended) {
                    enterMode(draft._mode, true, draft._id);
                  } else {
                    enterEditFromLog(entry);
                  }
                }}
                style={{
                  opacity: (breakActive || isMinimised || editButtonDisabled) ? 0.45 : 1,
                  cursor: (breakActive || isMinimised || editButtonDisabled) ? "not-allowed" : "pointer",
                }}
              >
                {buttonText}
              </button>
            ):<span style={{color:"var(--muted)",fontSize:10}}></span>}
          </div>
        </div>
      );
    })}
                  {(()=>{
                    // ── Total time: sum ALL closed entries (every row in the table is a sequential,
                    // non-overlapping block, so plain addition gives the real wall-clock total) ──
                    const totalMs=sessionLog.filter(e=>e.endedAt).reduce((acc,e)=>acc+(e.endedAt-e.startedAt),0);

                    // ── Break total (for display) ──
                    const breakMs=sessionLog.filter(e=>e.status==="Break"&&e.endedAt).reduce((acc,e)=>acc+(e.endedAt-e.startedAt),0);

                    // ── Outcome counters ──
                    const uniqueCases=new Set(sessionLog.filter(e=>e.caseNum).map(e=>(e.caseNum||"").trim()));
                    const totalCasesCount=uniqueCases.size;
                    const completedCount=sessionLog.filter(e=>e.outcome==="Completed").length;
                    const clarificationCount=sessionLog.filter(e=>e.outcome==="Clarification").length;
                    const suspendedCount=sessionLog.filter(e=>e.outcome==="Suspended").length;
                    const prolongedCount=sessionLog.filter(e=>e.outcome==="Prolonged").length;

                    // ── Weighted case score (Minor=1, Major=2, Complex=3) ──
                    const cxWeight=(cx)=>cx==="complex"?3:cx==="major"?2:1;
                    const weightedScore=[...uniqueCases].reduce((acc,cn)=>{
                      const saved=(allSavedCases||[]).find(c=>c.caseNum===cn);
                      const draft=(dbDrafts||[]).find(d=>d.caseNum===cn);
                      return acc+cxWeight((saved||draft)?._caseComplexity);
                    },0);

                    const fmtMs=(ms)=>{
                      const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000),s=Math.floor((ms%60000)/1000);
                      return h>0?`${h}h ${m}m ${s}s`:m>0?`${m}m ${s}s`:`${s}s`;
                    };

                    const pill=(label,val,color,bg)=>(
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"6px 14px",background:bg||"var(--entry-bg)",border:`1.5px solid ${color}33`,borderRadius:8,minWidth:70,flex:1}}>
                        <span style={{fontSize:16,fontWeight:800,color,fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1}}>{val}</span>
                        <span style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".7px",fontFamily:"'Poppins',sans-serif",marginTop:3,fontWeight:700,textAlign:"center"}}>{label}</span>
                      </div>
                    );

                    return (
                      <>
                        <div className="session-log-total">
                          <span style={{fontWeight:800,fontSize:11,color:"var(--accent)",fontFamily:"'Poppins',sans-serif"}}>⏱ Total tracked time</span>
                          <span/><span/><span/>
                          <span style={{fontSize:10,color:"var(--muted)",fontFamily:"'Poppins',sans-serif",fontStyle:"italic"}}>
                            {breakMs>0&&`☕ ${fmtMs(breakMs)} breaks`}
                          </span>
                          <span/>
                          <span style={{fontWeight:800,fontSize:12,color:"var(--accent)",fontFamily:"monospace"}}>{fmtMs(totalMs)}</span>
                        </div>
                        {/* ── Summary footer pills ── */}
                        <div style={{display:"flex",gap:8,padding:"12px 16px",borderTop:"1px solid var(--border)",background:"var(--glass-bg)",flexWrap:"wrap"}}>
                          {pill("Total Hours",fmtMs(totalMs),"var(--accent)")}
                          {pill("Cases",totalCasesCount,"var(--accent2)")}
                          {pill("Weighted",weightedScore,"#a855f7","rgba(168,85,247,.07)")}
                          {pill("Completed",completedCount,"var(--green)","rgba(16,185,129,.07)")}
                          {pill("Clarification",clarificationCount,"var(--amber)","rgba(245,158,11,.07)")}
                          {pill("Suspended",suspendedCount,"var(--red)","rgba(244,63,94,.07)")}
                          {(()=>{const pendingCount=(sessionLog||[]).filter(e=>e.outcome==="Pending").length;const doneCount=(sessionLog||[]).filter(e=>e.outcome==="Completed Prolonged").length;return<>{pendingCount>0&&pill("Pending",pendingCount,"#f59e0b","rgba(245,158,11,.07)")}{doneCount>0&&pill("Prolonged Done",doneCount,"var(--green)","rgba(16,185,129,.07)")}</>})()}
                          {breakMs>0&&pill("Break Time",fmtMs(breakMs),"var(--muted)")}
                        </div>
                      </>
                    );
                  })()}
                </>;
              })()}
            </>
          )}
        </div>
      )}

      <div>
        <div className="section-title">Recently Saved Cases</div>
        {recentAll.length===0&&<div style={{color:"var(--muted)",fontSize:13,padding:"8px 0"}}>No cases saved yet.</div>}
        {recentAll.map((c,i)=>(
          <SavedCaseCard key={c._id||`local-${i}`} c={c} idx={i} openId={openSavedId} setOpenId={setOpenSavedId}
            onEdit={(rec)=>{
              // Open edit modal
              setEditCase(rec);
            }}
          />
        ))}
      </div>
      {editCase&&(()=>{
        const isEditSC = editCase._mode==="siteComment";
        return (
        <div className="modal-bg"><div className="modal" style={{maxWidth:520,width:"100%",maxHeight:"85vh",overflowY:"auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <h3 style={{margin:0}}>Edit Case #{editCase.caseNum}</h3>
            <span style={{fontSize:11,padding:"2px 10px",background:"var(--entry-accent-bg)",border:"1px solid var(--border)",color:"var(--accent)",fontWeight:700}}>{isEditSC?"Site Comment":"Inbound Email"}</span>
          </div>

          {/* Core fields */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div className="field" style={{marginBottom:0}}>
              <label>Case #</label>
              <input className="inp" value={editCase.caseNum||""} onChange={e=>setEditCase(c=>({...c,caseNum:e.target.value}))}/>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label>Account #</label>
              <input className="inp" value={editCase.accountNum||""} onChange={e=>setEditCase(c=>({...c,accountNum:e.target.value}))}/>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label>Amend Type</label>
              <input className="inp" value={editCase.amendType||""} onChange={e=>setEditCase(c=>({...c,amendType:e.target.value}))}/>
            </div>
            {!isEditSC&&(
              <div className="field" style={{marginBottom:0}}>
                <label>Inbound #</label>
                <input className="inp" value={editCase.inboundNum||""} onChange={e=>setEditCase(c=>({...c,inboundNum:e.target.value}))}/>
              </div>
            )}
            <div className="field" style={{marginBottom:0}}>
              <label>Customer Name</label>
              <input className="inp" placeholder="e.g. John Smith" value={editCase.customerName||""} onChange={e=>setEditCase(c=>({...c,customerName:e.target.value}))}/>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label>Customer Email</label>
              <input className="inp" type="email" placeholder="e.g. client@email.com" value={editCase.customerEmail||""} onChange={e=>setEditCase(c=>({...c,customerEmail:e.target.value}))}/>
            </div>
            <div className="field" style={{marginBottom:0,gridColumn:"1/-1"}}>
              <label>Business Name</label>
              <div style={{display:"flex",gap:8}}>
                <input className="inp" placeholder="e.g. Fire Force" style={{flex:2}} value={editCase.businessName||""} onChange={e=>setEditCase(c=>({...c,businessName:e.target.value}))}/>
                <input className="inp" placeholder="LLC / Corp / Inc…" style={{flex:1}} value={editCase.businessSuffix||""} onChange={e=>setEditCase(c=>({...c,businessSuffix:e.target.value}))}/>
              </div>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label>Time In</label>
              <input className="inp" value={editCase.savedAt||""} onChange={e=>setEditCase(c=>({...c,savedAt:e.target.value}))}/>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label>Completed Time</label>
              <input className="inp" value={editCase.endedAt||""} placeholder="e.g. 02:30 PM" onChange={e=>setEditCase(c=>({...c,endedAt:e.target.value}))}/>
            </div>
          </div>

          {/* Inbound email fields */}
          {!isEditSC&&(
            <div style={{marginBottom:12,padding:"10px 12px",background:"var(--entry-bg)",border:"1px solid var(--border)",borderRadius:8}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",marginBottom:8,textTransform:"uppercase",letterSpacing:".6px"}}>Email Details</div>
              <div className="field" style={{marginBottom:8}}>
                <label>Email Address</label>
                <input className="inp" value={editCase.emailAddress||""} onChange={e=>setEditCase(c=>({...c,emailAddress:e.target.value}))}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                {["clarification","completed"].map(v=>(
                  <label key={v} className={`radio-label${editCase.emailType===v?" selected-"+(v==="clarification"?"clarif":"complete"):""}`}>
                    <input type="radio" name="editEmailType" checked={editCase.emailType===v} onChange={()=>setEditCase(c=>({...c,emailType:v}))} style={{display:"none"}}/>
                    {v==="clarification"?"Clarification":"Completed"}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Entries */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",marginBottom:8,textTransform:"uppercase",letterSpacing:".6px"}}>{isEditSC?"Site Comments":"Assumptions"}</div>
            {(editCase.entries||[]).map((e,ei)=>(
              <div key={e.id||ei} style={{background:"var(--entry-bg)",border:"1px solid var(--border)",padding:"10px 12px",marginBottom:8,borderRadius:8}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:11,fontWeight:700,color:"var(--accent)"}}>{isEditSC?`SC #${e.number||ei+1}`:`Assumption ${ei+1}`}</span>
                  <button className="entry-del" onClick={()=>setEditCase(c=>({...c,entries:c.entries.filter((_,i)=>i!==ei)}))}>
                    <Icon name="trash" size={12} color="var(--red)"/>
                  </button>
                </div>
                {isEditSC&&<div className="field" style={{marginBottom:6}}><label>SC #</label><input className="inp" value={e.number||""} onChange={ev=>setEditCase(c=>({...c,entries:c.entries.map((x,i)=>i===ei?{...x,number:ev.target.value}:x)}))}/></div>}
                <div className="field" style={{marginBottom:6}}><label>Note</label><textarea className="inp" rows={2} value={e.note||""} onChange={ev=>setEditCase(c=>({...c,entries:c.entries.map((x,i)=>i===ei?{...x,note:ev.target.value}:x)}))}/></div>
                <div className="field" style={{marginBottom:0}}><label>Clarification</label><textarea className="inp" rows={2} value={e.clarification||""} onChange={ev=>setEditCase(c=>({...c,entries:c.entries.map((x,i)=>i===ei?{...x,clarification:ev.target.value}:x)}))}/></div>
              </div>
            ))}
          </div>

          <div className="modal-btns">
            <button className="btn btn-ghost" onClick={()=>setEditCase(null)}>Cancel</button>
            <button className="btn btn-save" onClick={()=>{onUpdateCase&&onUpdateCase(editCase._id,editCase);setEditCase(null);showToast("Case updated ✅");}}>💾 Save Changes</button>
          </div>
        </div></div>
        );
      })()}
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DOWNLOAD
// ─────────────────────────────────────────────────────────────────────────────
async function downloadCase(c) {
  const isSC=c._mode==="siteComment"; const entries=(c.entries||[]);
  let txt="Post-Live Amends:\n";
  entries.forEach(e=>{if(!e.number&&!e.note&&!e.clarification)return;txt+="\n";if(isSC){txt+=`Site Comment #${e.number}:\n`;if(e.note)txt+=`Note: ${e.note}\n`;if(e.clarification)txt+=`\nClarification: ${e.clarification}\n`;}else{txt+=`Assumption:\n`;if(e.note)txt+=`Note: ${e.note}\n`;if(e.clarification)txt+=`\nClarification: ${e.clarification}\n`;}txt+="\n";});
  if(!isSC&&c.emailAddress){const tl=c.emailType==="clarification"?"Clarification email sent to":"Email completed sent to";txt+=`\n${tl} ${c.emailAddress}.`;}
  const meta=[`Post-Live Amends Case Export`,"─".repeat(36),`Saved: ${c.savedAt}`,`Type: ${isSC?"Site Comment":"Inbound Email"}`,`Case #: ${c.caseNum||"—"}`,`Account #: ${c.accountNum||"—"}`,...(isSC?[]:[`Inbound #: ${c.inboundNum||"—"}`]),`Amend Type: ${c.amendType||"—"}`,``,txt].join("\n");
  const bizPart=(c.businessName||"").trim();
  const cx3=(c._caseComplexity||"minor");const cxLabel3=cx3==="major"?"Major":cx3==="complex"?"Complex":"Minor";const folderName=`${cxLabel3} ${c.caseNum||"unknown"}${bizPart?" "+bizPart:""}`.replace(/[^a-zA-Z0-9 _()-]/g,"").replace(/\s+/g," ").trim();

  // Try folder picker API (Chrome/Edge) — save files into a real folder
  if(window.showDirectoryPicker){
    try{
      const dir=await getOrPickDir();
      const caseDir=await dir.getDirectoryHandle(folderName,{create:true});
      // Save case data text
      const txtHandle=await caseDir.getFileHandle("case_data.txt",{create:true});
      const txtWr=await txtHandle.createWritable();
      await txtWr.write(new Blob([meta],{type:"text/plain"}));
      await txtWr.close();
      // Save images
      for(const img of [...(c.images||[]),...(c.backupImages||[])]){
        try{
          const r=await fetch(img.url);const blob=await r.blob();
          const ext=(img.name||"screenshot").split(".").pop()||"png";
          const baseName=(img.name||"screenshot").replace(/\.[^/.]+$/,"");
          const fh=await caseDir.getFileHandle(`${baseName}.${ext}`,{create:true});
          const wr=await fh.createWritable();await wr.write(blob);await wr.close();
        }catch(e){console.warn("Image fetch failed:",e);}
      }
      return;
    }catch(e){
      if(e.name==="AbortError")return;
    }
  }
  // Fallback: download case_data.txt + each image with folder/filename path
  const txtBlob=new Blob([meta],{type:"text/plain"});
  const ta=document.createElement("a");ta.href=URL.createObjectURL(txtBlob);
  ta.download=`${folderName}/case_data.txt`;ta.click();URL.revokeObjectURL(ta.href);
  await new Promise(r=>setTimeout(r,120));
  for(const img of [...(c.images||[]),...(c.backupImages||[])]){
    try{
      const r=await fetch(img.url);const blob=await r.blob();
      const ext=(img.name||"screenshot").split(".").pop()||"png";
      const baseName=(img.name||"screenshot").replace(/\.[^/.]+$/,"");
      const a=document.createElement("a");a.href=URL.createObjectURL(blob);
      a.download=`${folderName}/${baseName}.${ext}`;
      document.body.appendChild(a);a.click();document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      await new Promise(r=>setTimeout(r,120));
    }catch(e){console.warn("Image fetch failed:",e);}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE EDIT
// ─────────────────────────────────────────────────────────────────────────────
function InlineEdit({ value, onSave }) {
  const [v,setV]=useState(value);
  return (
    <div style={{flex:1,display:"flex",gap:6}}>
      <input className="inline-edit-inp" value={v} onChange={e=>setV(e.target.value)} autoFocus onKeyDown={e=>e.key==="Enter"&&onSave(v)}/>
      <button className="inline-save-btn" onClick={()=>onSave(v)}>✓</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CASE HISTORY — fully editable
// ─────────────────────────────────────────────────────────────────────────────
const CHECKLIST_LABELS={backup:"Before/After Backup",caseComment:"Case Comment",combinedTracker:"Combined Tracker",qaChecklist:"QA Checklist",completeJob:"Complete Job",closeSiteComment:"Close Site Comment",closeInboundCase:"Close Inbound Case",emailSales:"Email Sales",trackerChecklist:"Complete Status Tracker",completeStatus:"Tracker Checklist"};
const emptyEditEntry=()=>({id:Date.now()+Math.random(),number:"",note:"",clarification:""});

// A single editable case card (extracted so it has its own state)
function EditableCaseCard({ c, onUpdate, onRequestDelete, onLightbox, openId, setOpenId }) {
  const isSC = c._mode==="siteComment";
  const isOpen = openId === c._id;
  const setIsOpen = (val) => setOpenId(val ? c._id : null);
  const [editMode,setEditMode]=useState(false);
  const [draft,setDraft]=useState(null); // local edit draft
  const [toast,showToast]=useToast();

  const allImages=[...(c.images||[]),...(c.backupImages||[])];
  const checkDone=c.checklist?Object.values(c.checklist).filter(Boolean).length:0;
  const checkTotal=c.checklist?Object.keys(c.checklist).length:8;

  const startEdit=()=>{
    setDraft({...c,
      entries:(c.entries||[]).map(e=>({...e})),
      devices:{...(c.devices||{})},
      checklist:{...(c.checklist||{})},
      images:[...(c.images||[])],
      backupImages:[...(c.backupImages||[])],
      trackerChecklistLink:c.trackerChecklistLink||"",
    });
    setEditMode(true);
    setIsOpen(true);
  };
  const cancelEdit=()=>{setDraft(null);setEditMode(false);};
  const saveEdit=()=>{
    onUpdate(c._id,{...draft});
    setDraft(null);setEditMode(false);
    showToast("Case updated ✅");
  };

  const D = draft; // shorthand
  const setD=(patch)=>setDraft(d=>({...d,...patch}));

  // Entry helpers
  const updateEntry=(id,val)=>setD({entries:D.entries.map(e=>e.id===id?{...e,...val}:e)});
  const deleteEntry=(id)=>setD({entries:D.entries.filter(e=>e.id!==id)});
  const addEntry=()=>setD({entries:[...D.entries,emptyEditEntry()]});

  // Upload to Supabase Storage immediately, return persistent URL
  const uploadImg=async(file,name)=>{
    const ext=file.name?.split(".").pop()||"png";
    return new Promise(resolve=>{
      const reader=new FileReader();
      reader.onload=async(e)=>{
        try{
          const res=await fetch("/api/images/upload",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fileBase64:e.target.result,fileName:`${name}.${ext}`,mimeType:file.type||"image/png"})});
          const data=await res.json();
          if(!res.ok)throw new Error(data.error||"Upload failed");
          resolve({url:data.url,path:data.path,name,id:data.path});
        }catch(err){
          console.warn("Edit upload failed:",err.message);
          resolve({url:URL.createObjectURL(file),name,id:`blob-${Date.now()}`,_unsynced:true});
        }
      };
      reader.onerror=()=>resolve({url:URL.createObjectURL(file),name,id:`blob-${Date.now()}`,_unsynced:true});
      reader.readAsDataURL(file);
    });
  };
  // Image helpers for edit mode
  const addImages=async(files,type)=>{
    const cur=D[type]||[];
    const uploaded=await Promise.all(Array.from(files).map((f,i)=>{
      const name=type==="backupImages"?`backup-screenshot-${cur.length+i+1}`:`screenshot-${cur.length+i+1}`;
      return uploadImg(f,name);
    }));
    setD({[type]:[...cur,...uploaded]});
  };
  const removeImage=(type,id)=>setD({[type]:(D[type]||[]).filter(img=>img.id!==id)});
  const replaceImage=async(type,id,file)=>{
    const existing=(D[type]||[]).find(img=>img.id===id);
    const uploaded=await uploadImg(file,existing?.name||"screenshot");
    setD({[type]:(D[type]||[]).map(img=>img.id===id?uploaded:img)});
  };

  return (
    <div className={cls("case-card",isOpen&&"expanded")}>
      {/* Header */}
      <div className="case-card-header" onClick={()=>setIsOpen(o=>!o)}>
        <div className="case-num-badge">#{c.caseNum||"—"}</div>
        <div style={{flex:1,minWidth:0,marginLeft:4}}>
          <div className="case-meta-main">{c.accountNum||"—"} &nbsp;·&nbsp; {c.amendType||"—"}</div>
          <div className="case-meta-sub">
            <span className={cls("act-badge",isSC?"site":"email")} style={{fontSize:10,padding:"2px 8px",marginRight:6}}>{isSC?"Site Comment":"Inbound Email"}</span>
            {(()=>{
              const cx=c._caseComplexity;
              if(!cx||cx==="minor") return <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(16,185,129,.12)",border:"1px solid rgba(16,185,129,.3)",color:"#10b981",fontWeight:700,fontFamily:"'Poppins',sans-serif",marginRight:4}}>Minor</span>;
              if(cx==="major") return <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.3)",color:"#f59e0b",fontWeight:700,fontFamily:"'Poppins',sans-serif",marginRight:4}}>Major</span>;
              return <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(244,63,94,.12)",border:"1px solid rgba(244,63,94,.3)",color:"#f43f5e",fontWeight:700,fontFamily:"'Poppins',sans-serif",marginRight:4}}>Complex</span>;
            })()}
            {(()=>{
              const bundled = c._bundledWith;
              if(!bundled) return null;
              const nums = Array.isArray(bundled) ? bundled : [bundled];
              if(!nums.length) return null;
              const isMulti=nums.length>1;const col=isMulti?"#f59e0b":"#10b981";const bg=isMulti?"rgba(245,158,11,.14)":"rgba(16,185,129,.14)";const bdr=isMulti?"1px solid rgba(245,158,11,.35)":"1px solid rgba(16,185,129,.35)";
              return <span style={{marginLeft:4,fontSize:10,padding:"2px 9px",borderRadius:20,background:bg,border:bdr,color:col,fontWeight:700,fontFamily:"'Poppins',sans-serif"}}>🔗 Bundled w/ #{nums.join(", #")}</span>;
            })()}
            {c.savedAt}{c.endedAt&&<span style={{marginLeft:8,color:"var(--green)",fontWeight:600}}> · Done {c.endedAt}</span>}
            {(()=>{
              const secs=c._totalElapsed||c._elapsedAtSave||0;
              if(!secs) return null;
              const h=Math.floor(secs/3600),m=Math.floor((secs%3600)/60),s=secs%60;
              const dur=h>0?`${h}h ${m}m ${s}s`:m>0?`${m}m ${s}s`:`${s}s`;
              return <span style={{marginLeft:8,color:"var(--accent)",fontFamily:"monospace",fontWeight:700,fontSize:10}}>⏱ {dur}</span>;
            })()}
            {allImages.length>0&&<span style={{marginLeft:8,opacity:.7}}>{allImages.length} img</span>}
            {c.checklist&&<span style={{marginLeft:8,color:checkDone===checkTotal?"var(--green)":"var(--amber)"}}>✓ {checkDone}/{checkTotal}</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexShrink:0}} onClick={e=>e.stopPropagation()}>
          {!editMode&&<button className="case-expand-btn" onClick={()=>{startEdit();}}>✏️ Edit</button>}
          <button className="case-expand-btn" onClick={()=>setIsOpen(o=>!o)}>
            <span className="case-expand-icon">▼</span>{isOpen?"Collapse":"Details"}
          </button>
        </div>
      </div>

      {/* Body */}
      {isOpen&&(
        <div className="case-body">
          <div className="case-body-inner">

            {editMode&&(
              <div className="edit-mode-banner">
                ✏️ Editing mode — all fields are now editable. Click Save when done.
              </div>
            )}

            {/* ── CASE INFO ── */}
            <div className="case-section">
              <div className="case-section-title">Case Info</div>
              {editMode ? (
                <>
                  <div className="field-row-edit"><label>Case # <span className="req">*</span></label><input className="inp" value={D.caseNum||""} onChange={e=>setD({caseNum:e.target.value})}/></div>
                  <div className="field-row-edit"><label>Account # <span className="req">*</span></label><input className="inp" value={D.accountNum||""} onChange={e=>setD({accountNum:e.target.value})}/></div>
                  {!isSC&&<div className="field-row-edit"><label>Inbound #</label><input className="inp" value={D.inboundNum||""} onChange={e=>setD({inboundNum:e.target.value})}/></div>}
                  <div className="field-row-edit"><label>Amend Type</label><input className="inp" value={D.amendType||""} onChange={e=>setD({amendType:e.target.value})}/></div>
                  <div className="field-row-edit">
                    <label>Case Complexity</label>
                    <select className="inp" value={D._caseComplexity||"minor"} onChange={e=>setD({_caseComplexity:e.target.value})} style={{cursor:"pointer"}}>
                      <option value="minor">Minor</option>
                      <option value="major">Major</option>
                      <option value="complex">Complex</option>
                    </select>
                  </div>
                  <label className={cls("check-label",D.inProgress&&"checked")} style={{marginTop:4,width:"fit-content",fontSize:12}}><input type="checkbox" checked={!!D.inProgress} onChange={e=>setD({inProgress:e.target.checked})}/>In-Progress Salesforce</label>
                </>
              ) : (
                <>
                  <div className="case-field-row"><div className="case-field-label">Case #</div><div className="case-field-val">{c.caseNum||"—"}</div></div>
                  <div className="case-field-row"><div className="case-field-label">Account #</div><div className="case-field-val">{c.accountNum||"—"}</div></div>
                  {!isSC&&<div className="case-field-row"><div className="case-field-label">Inbound #</div><div className="case-field-val">{c.inboundNum||"—"}</div></div>}
                  <div className="case-field-row"><div className="case-field-label">Amend Type</div><div className="case-field-val">{c.amendType||"—"}</div></div>
                  <div className="case-field-row"><div className="case-field-label">Complexity</div><div className="case-field-val">{c._caseComplexity==="major"?"Major":c._caseComplexity==="complex"?"Complex":"Minor"}</div></div>
                  <div className="case-field-row"><div className="case-field-label">In-Progress</div><div className="case-field-val">{c.inProgress?"✅ Yes":"—"}</div></div>
                </>
              )}
            </div>

            {/* ── SITE COMMENTS / ASSUMPTIONS ── */}
            <div className="case-section">
              <div className="edit-section-header">
                <div className="case-section-title" style={{marginBottom:0}}>{isSC?"Site Comments":"Assumptions"}</div>
                {editMode&&<button className="add-entry-btn-sm" onClick={addEntry}>＋ Add {isSC?"Comment":"Assumption"}</button>}
              </div>
              {editMode ? (
                (D.entries||[]).map((e,ei)=>(
                  <div key={e.id} className="edit-entry-card">
                    {(isSC||(D.entries.length>1))&&<button className="entry-del" onClick={()=>deleteEntry(e.id)}><Icon name="trash" size={13} color="var(--red)"/></button>}
                    {isSC&&<div className="field-row-edit"><label>SC Number <span className="req">*</span></label><input className="inp" placeholder="e.g. 25" value={e.number||""} onChange={ev=>updateEntry(e.id,{number:ev.target.value})}/></div>}
                    <div className="field-row-edit"><label>Note</label><textarea className="inp" rows={3} value={e.note||""} onChange={ev=>updateEntry(e.id,{note:ev.target.value})} placeholder="Note..."/></div>
                    <div className="field-row-edit"><label>Clarification</label><textarea className="inp" rows={3} value={e.clarification||""} onChange={ev=>updateEntry(e.id,{clarification:ev.target.value})} placeholder="Clarification..."/></div>
                  </div>
                ))
              ) : (
                (c.entries||[]).filter(e=>e.note||e.clarification||e.number).length===0
                  ? <div style={{color:"var(--muted)",fontSize:12,padding:"8px 0"}}>No entries</div>
                  : (c.entries||[]).filter(e=>e.note||e.clarification||e.number).map((e,ei)=>(
                    <div key={ei} className="case-entry-card">
                      <div className="case-entry-num">{isSC?`Site Comment #${e.number||ei+1}`:`Assumption ${ei+1}`}</div>
                      {e.note&&<div className="case-entry-field"><span className="case-entry-key">Note: </span>{e.note}</div>}
                      {e.clarification&&<div className="case-entry-field"><span className="case-entry-key">Clarification: </span>{e.clarification}</div>}
                    </div>
                  ))
              )}
            </div>

            {/* ── EMAIL DETAILS (inbound) ── */}
            {!isSC&&(
              <div className="case-section">
                <div className="case-section-title">Email Details</div>
                {editMode ? (
                  <>
                    <div className="field-row-edit"><label>Email Address</label><input className="inp" type="email" value={D.emailAddress||""} onChange={e=>setD({emailAddress:e.target.value})}/></div>
                    <div className="field-row-edit"><label>Email Type</label>
                      <div className="radio-group">
                        <label className={cls("radio-label",D.emailType==="clarification"&&"selected-clarif")}><input type="radio" checked={D.emailType==="clarification"} onChange={()=>setD({emailType:"clarification"})}/>Clarification</label>
                        <label className={cls("radio-label",D.emailType==="completed"&&"selected-complete")}><input type="radio" checked={D.emailType==="completed"} onChange={()=>setD({emailType:"completed"})}/>Completed</label>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="case-field-row"><div className="case-field-label">Email Address</div><div className="case-field-val">{c.emailAddress||"—"}</div></div>
                    <div className="case-field-row"><div className="case-field-label">Email Type</div><div className="case-field-val" style={{color:c.emailType==="clarification"?"var(--amber)":"var(--green)",fontWeight:700}}>{c.emailType==="clarification"?"❓ Clarification":"✅ Completed"}</div></div>
                  </>
                )}
              </div>
            )}

            {/* ── DEVICE CHECK ── */}
            <div className="case-section">
              <div className="case-section-title">📱 Device Check</div>
              {editMode ? (
                <div className="device-edit-group">
                  {[["mobile","Mobile"],["tablet","Tablet"],["desktop","Desktop"]].map(([k,l])=>(
                    <label key={k} className={cls("check-label",D.devices?.[k]&&"checked")} style={{fontSize:12}}>
                      <input type="checkbox" checked={!!D.devices?.[k]} onChange={e=>setD({devices:{...D.devices,[k]:e.target.checked}})}/>{l}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="case-device-chips">
                  {[["mobile","Mobile"],["tablet","Tablet"],["desktop","Desktop"]].map(([k,l])=>(
                    <div key={k} className={cls("case-device-chip",c.devices?.[k]?"active":"inactive")}>{l}{c.devices?.[k]?" ✓":" ✗"}</div>
                  ))}
                </div>
              )}
            </div>

            {/* ── FINAL CHECKLIST ── */}
            {(c.checklist||editMode)&&(
              <div className="case-section">
                <div className="case-section-title">✅ Final Checklist{!editMode&&` — ${checkDone}/${checkTotal}`}</div>
                {editMode ? (
                  <div className="checklist-edit-grid">
                    {Object.entries(CHECKLIST_LABELS).map(([k,l])=>(
                      <label key={k} className={cls("checklist-edit-item",D.checklist?.[k]&&"checked")}>
                        <input type="checkbox" checked={!!D.checklist?.[k]} onChange={e=>setD({checklist:{...D.checklist,[k]:e.target.checked}})}/>
                        <span style={{fontSize:11}}>{l}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="case-checklist-grid">
                    {Object.entries(CHECKLIST_LABELS).map(([k,l])=>(
                      <div key={k} className={cls("case-check-item",c.checklist?.[k]?"done":"undone")}>
                        <span>{c.checklist?.[k]?"✅":"⬜"}</span><span style={{fontSize:11}}>{l}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── SCREENSHOTS ── */}
            <div className="case-section">
              <div className="edit-section-header">
                <div className="case-section-title" style={{marginBottom:0}}> Screenshots {editMode?"":`(${allImages.length})`}</div>
              </div>
              {editMode ? (
                <>
                  {/* Main screenshots */}
                  <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",marginBottom:6,textTransform:"uppercase",letterSpacing:".5px"}}>Main Screenshots</div>
                  <div className="img-edit-grid">
                    {(D.images||[]).map(img=>(
                      <div key={img.id} className="img-edit-item">
                        <img src={img.url} alt={img.name}/>
                        <button className="img-edit-del" onClick={()=>removeImage("images",img.id)}>✕</button>
                        <label className="img-edit-replace">
                          🔄 Replace
                          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&replaceImage("images",img.id,e.target.files[0])}/>
                        </label>
                      </div>
                    ))}
                    <label className="img-add-zone">
                      <input type="file" accept="image/*" multiple onChange={e=>addImages(e.target.files,"images")}/>
                      <span style={{fontSize:20}}>＋</span>
                      <span>Add</span>
                    </label>
                  </div>
                  {/* Backup screenshots */}
                  <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",margin:"14px 0 6px",textTransform:"uppercase",letterSpacing:".5px"}}>Backup Screenshots</div>
                  <div className="img-edit-grid">
                    {(D.backupImages||[]).map(img=>(
                      <div key={img.id} className="img-edit-item">
                        <img src={img.url} alt={img.name}/>
                        <button className="img-edit-del" onClick={()=>removeImage("backupImages",img.id)}>✕</button>
                        <label className="img-edit-replace">
                          🔄 Replace
                          <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&replaceImage("backupImages",img.id,e.target.files[0])}/>
                        </label>
                      </div>
                    ))}
                    <label className="img-add-zone">
                      <input type="file" accept="image/*" multiple onChange={e=>addImages(e.target.files,"backupImages")}/>
                      <span style={{fontSize:20}}>＋</span>
                      <span>Add</span>
                    </label>
                  </div>
                </>
              ) : (
                allImages.length===0
                  ? <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
                      <span style={{color:"var(--muted)",fontSize:12}}>No screenshots</span>
                      <button className="h-btn" style={{fontSize:11,padding:"4px 10px",borderColor:"var(--accent)",color:"var(--accent)"}} onClick={startEdit}>＋ Add via Edit</button>
                    </div>
                  : <>
                      <div className="case-imgs">
                        {allImages.map(img=>(<div key={img.id||img.name} className="case-img-thumb" title={img.name} onClick={()=>onLightbox(img.url)}><img src={img.url} alt={img.name}/></div>))}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginTop:8,flexWrap:"wrap"}}>
                        <span style={{fontSize:11,color:"var(--muted)"}}>Click to enlarge</span>
                        <button className="h-btn" style={{fontSize:11,padding:"4px 10px",borderColor:"var(--accent)",color:"var(--accent)"}} onClick={startEdit}>＋ Add / Edit</button>
                        <button className="h-btn" style={{fontSize:11,padding:"4px 10px",borderColor:"var(--green)",color:"var(--green)",fontWeight:700}} onClick={async()=>{
                          try{
                            const bizPart=(c.businessName||"").trim();const folderName=`${c.caseNum||"unknown"}${bizPart?" - "+bizPart:""}`.replace(/[^a-zA-Z0-9 _()-]/g,"").replace(/\s+/g," ").trim();
                            if(window.showDirectoryPicker){
                              try{
                                const rootDir=await getOrPickDir();
                                const caseDir=await rootDir.getDirectoryHandle(folderName,{create:true});
                                for(const img of allImages){
                                  try{
                                    const urlExt=(img.url||"").split("?")[0].split(".").pop().toLowerCase();
                                    const safeExt=["jpg","jpeg","png","gif","webp"].includes(urlExt)?urlExt:"png";
                                    const baseName=(img.name||"screenshot").replace(/\.[^/.]+$/,"");
                                    const fileName=`${baseName}.${safeExt}`;
                                    const r=await fetch(img.url);const blob=await r.blob();
                                    const fh=await caseDir.getFileHandle(fileName,{create:true});
                                    const wr=await fh.createWritable();
                                    await wr.write(blob);await wr.close();
                                  }catch(e){console.warn("Image save failed:",e);}
                                }
                                return;
                              }catch(e){if(e.name==="AbortError")return;}
                            }
                            // Fallback: individual downloads with folder/filename path
                            for(const img of allImages){
                              try{
                                const urlExt=(img.url||"").split("?")[0].split(".").pop().toLowerCase();
                                const safeExt=["jpg","jpeg","png","gif","webp"].includes(urlExt)?urlExt:"png";
                                const baseName=(img.name||"screenshot").replace(/\.[^/.]+$/,"");
                                const r=await fetch(img.url);const blob=await r.blob();
                                const a=document.createElement("a");a.href=URL.createObjectURL(blob);
                                a.download=`${folderName}/${baseName}.${safeExt}`;
                                document.body.appendChild(a);a.click();document.body.removeChild(a);
                                URL.revokeObjectURL(a.href);
                                await new Promise(r=>setTimeout(r,120));
                              }catch(e){console.warn("Image fetch failed:",e);}
                            }
                          }catch(e){console.error("Bulk download failed:",e);}
                        }}>⬇ Bulk Download</button>
                      </div>
                    </>
              )}
            </div>

            {/* ── TRACKER LINK ── */}
            {(true) && (
              <div className="case-section">
                <div className="case-section-title">🔗 Tracker Link</div>
                {editMode ? (
                  <div className="field" style={{marginBottom:0}}>
                    <input
                      className="inp"
                      type="url"
                      placeholder="https://..."
                      value={D.trackerChecklistLink||""}
                      onChange={e=>setD({trackerChecklistLink:e.target.value})}
                      style={{fontSize:12}}
                    />
                  </div>
                ) : (
                  c.trackerChecklistLink ? (
                    <a
                      href={c.trackerChecklistLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display:"inline-flex",alignItems:"center",gap:6,
                        fontSize:13,fontWeight:600,color:"var(--accent)",
                        wordBreak:"break-all",padding:"6px 10px",
                        background:"var(--entry-accent-bg)",
                        border:"1px solid rgba(1,118,211,.2)",
                        borderRadius:8,textDecoration:"none",
                        transition:".15s",maxWidth:"100%",
                      }}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(1,118,211,.18)"}
                      onMouseLeave={e=>e.currentTarget.style.background="var(--entry-accent-bg)"}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      {c.trackerChecklistLink}
                    </a>
                  ) : <span style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",fontFamily:"'Poppins',sans-serif"}}>— No tracker link saved</span>
                )}
              </div>
            )}

            {/* ── ACTIONS ── */}
            <div className="case-actions">
              {editMode ? (
                <>
                  <button className="btn btn-ghost" onClick={cancelEdit}>✕ Cancel</button>
                  <div style={{flex:1}}/>
                  <button className="btn btn-save" onClick={saveEdit}>💾 Save Changes</button>
                </>
              ) : (
                <>
                  <button className="h-btn dl" onClick={()=>downloadCase(c)}>⬇️ Download ZIP</button>
                  <div style={{flex:1}}/>
                  <button className="h-btn" onClick={startEdit} style={{borderColor:"var(--accent)",color:"var(--accent)"}}>✏️ Edit Case</button>
                  <button className="h-btn danger" onClick={()=>onRequestDelete&&onRequestDelete(c._id,c.caseNum)}>🗑 Delete</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}

function CaseHistory({ cases, onUpdate, onDelete }) {
  const [lightboxImg,setLightboxImg]=useState(null);
  const [search,setSearch]=useState("");
  const [filterMode,setFilterMode]=useState("all");
  const [filterDate,setFilterDate]=useState("");
  const [openCaseId,setOpenCaseId]=useState(null);
  const [editingId,setEditingId]=useState(null);
  const [pendingDelete,setPendingDelete]=useState(null); // {id,caseNum}

  const filtered = [...cases].filter(c=>{
    const q=search.toLowerCase();
    const matchQ=!q||c.caseNum?.toLowerCase().includes(q)||c.accountNum?.toLowerCase().includes(q)||c.amendType?.toLowerCase().includes(q)||c.entries?.some(e=>e.note?.toLowerCase().includes(q)||e.clarification?.toLowerCase().includes(q));
    const matchMode=filterMode==="all"||(filterMode==="site"&&c._mode==="siteComment")||(filterMode==="inbound"&&c._mode==="inbound");
    const matchDate=!filterDate||c.savedAt?.includes(filterDate);
    return matchQ&&matchMode&&matchDate;
  });

  const modeBadgeColor = mode => mode==="inbound" ? "var(--inbound,#8a38f5)" : "var(--site-comment,#4760ff)";
  const modeLabel = mode => mode==="inbound" ? "Inbound Email" : "Site Comment";
  const cxLabel = cx => cx==="major"?"Major":cx==="complex"?"Complex":"Minor";

  return (
    <div className="chd-dash">
      <div className="chd-page-head">
        <div>
          <p className="chd-h4">Case History</p>
          <p className="chd-p-muted">Where the Cases stored</p>
        </div>
      </div>
      <div className="chd-divider"/>

      <div className="chd-search-row">
        <input className="chd-search-inp" placeholder="E.G Case #/Assumption/Email/Account # / NOB" value={search} onChange={e=>setSearch(e.target.value)}/>
        <input type="date" className="chd-date-inp" value={filterDate} onChange={e=>setFilterDate(e.target.value)}/>
      </div>
      <div className="chd-radio-row">
        {[["all","All"],["site","Site Comment"],["inbound","Inbound Email"]].map(([v,l])=>(
          <div key={v} className={cls("chd-radio-pill",filterMode===v&&"active")} onClick={()=>setFilterMode(v)}><div className="chd-radio-dot"/>{l}</div>
        ))}
        {(search||filterDate||filterMode!=="all")&&(
          <div className="chd-radio-pill" onClick={()=>{setSearch("");setFilterDate("");setFilterMode("all");}}>✕ Clear</div>
        )}
      </div>

      {filtered.length===0 ? (
        <div className="chd-empty-box">{cases.length===0?"No cases yet — complete and save a Post-Live Amend to see it here.":"No results — try adjusting your search or filters."}</div>
      ) : (
        filtered.map((c,i)=>{
          const key=c._id||i;
          const isOpen=openCaseId===key;
          const isEditing=editingId===key;
          return (
            <div className="chd-accordion" key={key}>
              <div className="chd-accordion-head" onClick={()=>setOpenCaseId(isOpen?null:key)}>
                <div>
                  <div className="chd-title-row">
                    <p className="chd-h6">{c.caseNum||"—"} - {c.accountNum||"—"}</p>
                    <span className="chd-badge" style={{background:modeBadgeColor(c._mode)}}>{modeLabel(c._mode)} - {cxLabel(c._caseComplexity)}</span>
                  </div>
                  <p className="chd-p-muted">{c.amendType||"—"} · {c.savedAt}</p>
                </div>
                <div className="chd-row-actions" onClick={e=>e.stopPropagation()}>
                  <button className="chd-btn-secondary" onClick={()=>downloadCase(c)}>Download ZIP</button>
                  <button className="chd-btn-primary" onClick={()=>{setEditingId(isEditing?null:key);setOpenCaseId(key);}}>{isEditing?"Close Edit":"Edit Case"}</button>
                  <button className="chd-btn-secondary" style={{borderColor:"var(--red)",color:"var(--red)"}} onClick={()=>setPendingDelete({id:c._id,caseNum:c.caseNum})}>Delete</button>
                </div>
              </div>
              {isOpen&&(
                <div className="chd-accordion-body">
                  {isEditing ? (
                    /* Real, fully-featured editor — image upload, entries, checklist, Supabase save */
                    <EditableCaseCard c={c} onUpdate={(id,patch)=>{onUpdate(id,patch);}}
                      onRequestDelete={(id,caseNum)=>setPendingDelete({id,caseNum})}
                      onLightbox={setLightboxImg} openId={key} setOpenId={()=>{}}/>
                  ) : (
                    <div className="chd-info-grid">
                      <div className="chd-info-card">
                        <div className="chd-info-cols">
                          <div style={{display:"flex",flexDirection:"column",gap:8,minWidth:150}}>
                            <p className="chd-label" style={{opacity:.6}}>Account Number</p><p className="chd-p">{c.accountNum||"—"}</p>
                            <p className="chd-label" style={{opacity:.6}}>Case Number</p><p className="chd-p">{c.caseNum||"—"}</p>
                            <p className="chd-label" style={{opacity:.6}}>Amend Type</p><p className="chd-p">{c.amendType||"—"}</p>
                          </div>
                          <div style={{display:"flex",flexDirection:"column",gap:8,minWidth:150}}>
                            <p className="chd-label" style={{opacity:.6}}>Customer Name</p><p className="chd-p">{c.customerName||"—"}</p>
                            <p className="chd-label" style={{opacity:.6}}>Customer Email</p><p className="chd-p">{c.customerEmail||"—"}</p>
                            <p className="chd-label" style={{opacity:.6}}>Business Name</p><p className="chd-p">{c.businessName||"—"}</p>
                          </div>
                        </div>
                        <div style={{height:2,background:"#fff",borderRadius:100}}/>
                        <p className="chd-label" style={{opacity:.6}}>{modeLabel(c._mode)}</p>
                        {(c.entries||[]).filter(e=>e.note||e.clarification).map((e,ei)=>(
                          <p key={ei} className="chd-p-muted" style={{whiteSpace:"pre-wrap"}}>{e.note}{e.clarification?` — ${e.clarification}`:""}</p>
                        ))}
                        {c.trackerChecklistLink&&(
                          <a href={c.trackerChecklistLink} target="_blank" rel="noopener noreferrer" className="chd-p" style={{color:"var(--site-comment,#4760ff)",wordBreak:"break-all"}}>{c.trackerChecklistLink}</a>
                        )}
                      </div>
                      <div className="chd-info-card" style={{flex:1}}>
                        <p className="chd-label" style={{opacity:.6}}>Devices Checklist</p>
                        {Object.keys(c.devices||{}).filter(k=>c.devices[k]).length>0
                          ? Object.entries(c.devices).filter(([,v])=>v).map(([k])=>(<p key={k} className="chd-p">{k}</p>))
                          : <p className="chd-p-muted">—</p>}
                        <div style={{height:2,background:"#fff",borderRadius:100}}/>
                        <p className="chd-label" style={{opacity:.6}}>Screenshots</p>
                        <div className="chd-shots">
                          {[...(c.images||[]),...(c.backupImages||[])].map((img,ii)=>(
                            <div className="chd-shot" key={ii} onClick={()=>setLightboxImg(img.url)}><img src={img.url} alt=""/></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {lightboxImg&&(<div className="lightbox-bg" onClick={()=>setLightboxImg(null)}><img className="lightbox-img" src={lightboxImg} alt="Screenshot"/></div>)}

      {pendingDelete&&(
        <div className="chd-modal-bg">
          <div className="chd-modal-card">
            <p className="chd-h6">Delete Case?</p>
            <p className="chd-p-muted">Case #{pendingDelete.caseNum} will be permanently deleted. This cannot be undone.</p>
            <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:14}}>
              <button className="chd-btn-secondary" onClick={()=>setPendingDelete(null)}>Cancel</button>
              <button className="chd-btn-primary" style={{background:"var(--red)",borderColor:"var(--red)"}} onClick={()=>{onDelete(pendingDelete.id);setPendingDelete(null);}}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────────────────────
function AnnouncementsPage({ announcements, addAnnouncement, updateAnnouncement, removeAnnouncement, user }) {
  const [adding,setAdding]=useState(false);
  const [confirming,setConfirming]=useState(false);
  const [saving,setSaving]=useState(false);
  const [deleteTarget,setDeleteTarget]=useState(null);
  const [editTarget,setEditTarget]=useState(null); // announcement being edited
  const [editForm,setEditForm]=useState({title:"",body:"",badge:"info"});
  const [form,setForm]=useState({title:"",body:"",badge:"info"});
  const [toast,showToast]=useToast();

  const BADGE_OPTS=[["info","ℹ️ Info"],["update","✅ Update"],["urgent","🚨 Urgent"]];

  const startPost=()=>{
    if(!form.title.trim())return showToast("Title required","error");
    setConfirming(true);
  };

  const confirmPost=async()=>{
    setSaving(true);
    try{
      await addAnnouncement({...form,author:user.name,createdAt:new Date().toLocaleString()});
      setForm({title:"",body:"",badge:"info"});
      setAdding(false);setConfirming(false);
      showToast("✅ Announcement posted!");
    }catch(e){
      showToast("❌ Failed to save — check connection","error");
    }finally{setSaving(false);}
  };

  const startEdit=(a)=>{
    setEditTarget(a);
    setEditForm({title:a.title,body:a.body||"",badge:a.badge||"info"});
  };

  const saveEdit=async()=>{
    if(!editForm.title.trim())return showToast("Title required","error");
    setSaving(true);
    try{
      await updateAnnouncement(editTarget.id,{title:editForm.title,body:editForm.body,badge:editForm.badge});
      setEditTarget(null);
      showToast("✅ Announcement updated!");
    }catch(e){
      showToast("❌ Failed to update","error");
    }finally{setSaving(false);}
  };

  const confirmDelete=async()=>{
    if(!deleteTarget)return;
    try{
      await removeAnnouncement(deleteTarget);
      showToast("Removed","info");
    }catch(e){showToast("❌ Failed to delete","error");}
    setDeleteTarget(null);
  };

  const isAuthor=(a)=> a.author && user?.name && a.author===user.name;

  const badgePicker=(val,onChange)=>(
    <div className="radio-group">
      {BADGE_OPTS.map(([v,l])=>(
        <label key={v} className={cls("radio-label",val===v&&"selected-clarif")}>
          <input type="radio" checked={val===v} onChange={()=>onChange(v)}/>{l}
        </label>
      ))}
    </div>
  );

  return (
    <div className="chd-dash">
      <div className="chd-page-head">
        <div><p className="chd-h4">Announcements</p><p className="chd-p-muted">Team updates and notices</p></div>
        <button className="chd-btn-primary" onClick={()=>{setAdding(true);setConfirming(false);}}>＋ New Announcement</button>
      </div>
      <div className="chd-divider"/>

      {/* ── Write form ── */}
      {adding&&!confirming&&(<div className="modal-bg"><div className="edit-modal">
        <h3 style={{marginBottom:16}}>New Announcement</h3>
        <div className="field"><label>Title <span className="req">*</span></label><input className="inp" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Announcement title" autoFocus/></div>
        <div className="field"><label>Message</label><textarea className="inp" rows={4} value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} placeholder="Write your message..."/></div>
        <div className="field"><label>Type</label>{badgePicker(form.badge,v=>setForm(f=>({...f,badge:v})))}</div>
        <div className="modal-btns"><button className="btn btn-ghost" onClick={()=>setAdding(false)}>Cancel</button><button className="btn btn-primary" onClick={startPost}>Review & Post →</button></div>
      </div></div>)}

      {/* ── Confirm before posting ── */}
      {confirming&&(<div className="modal-bg"><div className="modal">
        <div style={{marginBottom:14}}><Icon name="announce" size={40} color="var(--accent)"/></div>
        <h3>Post Announcement?</h3>
        <p style={{color:"var(--muted)",fontSize:13,margin:"10px 0 4px"}}>Title: <strong style={{color:"var(--text)"}}>{form.title}</strong></p>
        {form.body&&<p style={{color:"var(--muted)",fontSize:12,marginBottom:4,maxHeight:80,overflow:"hidden"}}>{form.body}</p>}
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Visible to your whole team.</p>
        <div className="modal-btns">
          <button className="btn btn-ghost" onClick={()=>setConfirming(false)} disabled={saving}>← Go Back</button>
          <button className="btn btn-primary" onClick={confirmPost} disabled={saving}>{saving?"Saving…":"✅ Confirm & Post"}</button>
        </div>
      </div></div>)}

      {/* ── Edit modal (author only) ── */}
      {editTarget&&(<div className="modal-bg"><div className="edit-modal">
        <h3 style={{marginBottom:16}}>✏️ Edit Announcement</h3>
        <div className="field"><label>Title <span className="req">*</span></label><input className="inp" value={editForm.title} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))} autoFocus/></div>
        <div className="field"><label>Message</label><textarea className="inp" rows={4} value={editForm.body} onChange={e=>setEditForm(f=>({...f,body:e.target.value}))}/></div>
        <div className="field"><label>Type</label>{badgePicker(editForm.badge,v=>setEditForm(f=>({...f,badge:v})))}</div>
        <div style={{fontSize:11,color:"var(--muted)",marginBottom:14}}>Only you can edit this — posted by {editTarget.author}</div>
        <div className="modal-btns">
          <button className="btn btn-ghost" onClick={()=>setEditTarget(null)} disabled={saving}>Cancel</button>
          <button className="btn btn-save" onClick={saveEdit} disabled={saving}>{saving?"Saving…":"💾 Save Changes"}</button>
        </div>
      </div></div>)}

      {/* ── Delete confirm ── */}
      {deleteTarget&&(<div className="modal-bg"><div className="modal">
        <div style={{marginBottom:14}}><Icon name="trash" size={40} color="var(--red)"/></div>
        <h3>Delete Announcement?</h3>
        <p style={{color:"var(--muted)",fontSize:13,marginBottom:16}}>This will be permanently removed.</p>
        <div className="modal-btns">
          <button className="btn btn-ghost" onClick={()=>setDeleteTarget(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
        </div>
      </div></div>)}

      {announcements.length===0&&(<div className="chd-empty-box">No announcements — post one to inform your team!</div>)}

      <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%"}}>
        {announcements.map(a=>(
          <div key={a.id} className="chd-ann-card">
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:0}}>
                <p className="chd-h6">{a.title}</p>
                <p className="chd-p-muted">By {a.author} · {a.createdAt}</p>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                <span className="chd-badge" style={{background:a.badge==="urgent"?"var(--red)":a.badge==="update"?"var(--green)":"var(--site-comment,#4760ff)"}}>{a.badge==="urgent"?"Urgent":a.badge==="update"?"Update":"Info"}</span>
                {isAuthor(a)&&(<button className="chd-btn-secondary" onClick={()=>startEdit(a)}>Edit</button>)}
                {isAuthor(a)&&(<button className="chd-btn-secondary" style={{borderColor:"var(--red)",color:"var(--red)"}} onClick={()=>setDeleteTarget(a.id)}>Delete</button>)}
              </div>
            </div>
            {a.body&&<p className="chd-p-muted">{a.body}</p>}
          </div>
        ))}
      </div>
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LINKS PAGE
// ─────────────────────────────────────────────────────────────────────────────
function LinksPage({ links, setLinks, addLink, updateLink, removeLink }) {
  const dragLinkRef=useRef(null);
  const [dragLinkActive,setDragLinkActive]=useState(null);
  const [dragLinkOver,setDragLinkOver]=useState(null);
  const [adding,setAdding]=useState(false);
  const [editing,setEditing]=useState(null); // link object being edited
  const [form,setForm]=useState({title:"",url:"",icon:"🔗"});
  const [editForm,setEditForm]=useState({title:"",url:"",icon:"🔗"});
  const [toast,showToast]=useToast();
  const ICONS=["🔗","📄","📊","🛠️","📧","🌐","📱","💼","📝","⚙️","🔑","📂","🏠","🎯","📌","💡","🔒","🚀","⭐","🧩"];

  const submit=()=>{
    if(!form.title.trim()||!form.url.trim())return showToast("Title and URL required","error");
    let url=form.url.trim();if(!url.startsWith("http"))url="https://"+url;
    addLink({...form,url});
    setForm({title:"",url:"",icon:"🔗"});setAdding(false);showToast("Link added!");
  };

  const startEdit=(l)=>{setEditing(l);setEditForm({title:l.title,url:l.url,icon:l.icon||"🔗"});};
  const saveEdit=()=>{
    if(!editForm.title.trim()||!editForm.url.trim())return showToast("Title and URL required","error");
    let url=editForm.url.trim();if(!url.startsWith("http"))url="https://"+url;
    updateLink(editing.id,{...editForm,url});
    setEditing(null);showToast("Link updated ✅");
  };
  const remove=(id)=>{removeLink(id);showToast("Link removed","info");};

  const iconPicker=(val,onChange)=>(
    <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:4}}>
      {ICONS.map(ic=>(
        <button key={ic} style={{width:36,height:36,borderRadius:8,background:val===ic?"var(--entry-accent-bg)":"var(--card2)",border:val===ic?"1.5px solid var(--accent)":"1.5px solid var(--border)",fontSize:18,cursor:"pointer",transition:".15s"}} onClick={()=>onChange(ic)}>{ic}</button>
      ))}
    </div>
  );

  return (
    <div className="chd-dash">
      <div className="chd-page-head">
        <div><p className="chd-h4">Quick Links</p><p className="chd-p-muted">Custom links shown in the sidebar</p></div>
        <button className="chd-btn-primary" onClick={()=>setAdding(true)}>＋ Add Link</button>
      </div>
      <div className="chd-divider"/>

      {/* Add modal */}
      {adding&&(<div className="modal-bg"><div className="edit-modal">
        <h3 style={{marginBottom:16}}>🔗 Add Quick Link</h3>
        <div className="field"><label>Label <span className="req">*</span></label><input className="inp" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Salesforce" autoFocus/></div>
        <div className="field"><label>URL <span className="req">*</span></label><input className="inp" value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} placeholder="https://..." onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
        <div className="field"><label>Icon</label>{iconPicker(form.icon,ic=>setForm(f=>({...f,icon:ic})))}</div>
        <div className="modal-btns"><button className="btn btn-ghost" onClick={()=>setAdding(false)}>Cancel</button><button className="btn btn-primary" onClick={submit}>Add Link</button></div>
      </div></div>)}

      {/* Edit modal */}
      {editing&&(<div className="modal-bg"><div className="edit-modal">
        <h3 style={{marginBottom:16}}>✏️ Edit Link</h3>
        <div className="field"><label>Label <span className="req">*</span></label><input className="inp" value={editForm.title} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))} autoFocus/></div>
        <div className="field"><label>URL <span className="req">*</span></label><input className="inp" value={editForm.url} onChange={e=>setEditForm(f=>({...f,url:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&saveEdit()}/></div>
        <div className="field"><label>Icon</label>{iconPicker(editForm.icon,ic=>setEditForm(f=>({...f,icon:ic})))}</div>
        <div className="modal-btns"><button className="btn btn-ghost" onClick={()=>setEditing(null)}>Cancel</button><button className="btn btn-save" onClick={saveEdit}>💾 Save Changes</button></div>
      </div></div>)}

      {links.length===0&&(<div className="chd-empty-box">No links yet — add one to have it appear in the sidebar.</div>)}

      <div className="chd-link-grid">
        {links.map((l,i)=>(
          <div key={l.id}>
            {dragLinkOver===i&&dragLinkActive!==i&&(
              <div className="link-drag-skeleton"><Icon name="links" size={14} color="var(--accent)"/>Drop here</div>
            )}
            <div className="chd-link-card"
              draggable
              onDragStart={()=>{dragLinkRef.current=i;setDragLinkActive(i);}}
              onDragOver={e=>{e.preventDefault();if(dragLinkOver!==i)setDragLinkOver(i);}}
              onDrop={()=>{
                const from=dragLinkRef.current;
                if(from!=null&&from!==i){const arr=[...links];const[m]=arr.splice(from,1);arr.splice(i,0,m);setLinks(arr);}
                dragLinkRef.current=null;setDragLinkActive(null);setDragLinkOver(null);
              }}
              onDragEnd={()=>{dragLinkRef.current=null;setDragLinkActive(null);setDragLinkOver(null);}}
              style={{cursor:"grab",userSelect:"none",opacity:dragLinkActive===i?0.25:1,transition:"opacity .12s"}}
            >
              <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
                <span style={{fontSize:20}}>{l.icon}</span>
                <div style={{minWidth:0}}>
                  <p className="chd-h6">{l.title}</p>
                  <p className="chd-p-muted" style={{wordBreak:"break-all"}}>{l.url}</p>
                </div>
              </div>
              <div className="chd-row-actions">
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="chd-btn-secondary" style={{textDecoration:"none"}}>Open</a>
                <button className="chd-btn-secondary" onClick={()=>startEdit(l)}>Edit</button>
                <button className="chd-btn-secondary" style={{borderColor:"var(--red)",color:"var(--red)"}} onClick={()=>remove(l.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE PAGE
// ─────────────────────────────────────────────────────────────────────────────
function ProfilePage({ user, setUser, onLogout, timerLimit, saveTimerLimit, qaLimit=10, saveQaLimit, shiftStartTime="", saveShiftStartTime, shiftStartWarnMins=10, saveShiftStartWarnMins, shiftEndTime="", saveShiftEndTime, shiftWarnMins=10, saveShiftWarnMins, specialRequestors=[], addRequestor, removeRequestor }) {
  const [editing,setEditing]=useState(false);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [toast,showToast]=useToast();
  const avatarInputRef=useRef();
  const [newReq,setNewReq]=useState("");
  const [addingReq,setAddingReq]=useState(false);
  const handleAddRequestor=()=>{
    const name=newReq.trim();
    if(!name)return showToast("Name required","error");
    if(specialRequestors.includes(name)){showToast("Already exists","error");return;}
    addRequestor(name);setNewReq("");setAddingReq(false);showToast(`Added ${name}!`);
  };

  const defNames=(name)=>{
    const n=(name||"User").trim().replace(/\s+/g,"_");
    return {beforeName:`Post_Live_Amend_Before_${n}_Amends`,afterName:`Post_Live_Amend_After_${n}_Amends`,screenshotName:`Post_Live_Amend_Screenshot_${n}_Amends`};
  };

  const defaultMsgs=[{id:"default",label:"Check-in",base:"Hi po Ms. Tina, magpapacheck lang po",fillType:"caseNum"}];
  const [form,setForm]=useState({
    name:user.name||"",email:user.email||"",role:user.role||"",
    beforeName:user.beforeName||defNames(user.name).beforeName,
    afterName:user.afterName||defNames(user.name).afterName,
    screenshotName:user.screenshotName||defNames(user.name).screenshotName,
    avatarUrl:user.avatarUrl||"",
    greetingMessages:(user.greetingMessages||defaultMsgs).map(m=>({...m,base:m.base||(m.template||"").replace("[Case #]","").replace("[Inbound #]","").replace("[Type]","").trim()})),
  });
  const [pwForm,setPwForm]=useState({next:"",confirm:""});
  const [timerInput,setTimerInput]=useState(String(timerLimit||30));
  const [qaTimerInput,setQaTimerInput]=useState(String(qaLimit||10));
  const [shiftStartInput,setShiftStartInput]=useState(shiftStartTime||"");
  const [shiftStartWarnInput,setShiftStartWarnInput]=useState(String(shiftStartWarnMins||10));
  const [shiftEndInput,setShiftEndInput]=useState(shiftEndTime||"");
  const [shiftWarnInput,setShiftWarnInput]=useState(String(shiftWarnMins||10));

  // ── Load latest profile from DB on mount ──
  useEffect(()=>{
    fetch(`/api/profile?email=${encodeURIComponent(user.email)}`)
      .then(r=>r.json())
      .then(data=>{
        if(data && data.email){
          const merged={
            ...user,
            name:       data.name        || user.name,
            role:       data.role        || user.role||"",
            avatarUrl:  data.avatar_url  || user.avatarUrl||"",
            beforeName: data.before_name || user.beforeName||defNames(user.name).beforeName,
            afterName:  data.after_name  || user.afterName||defNames(user.name).afterName,
            screenshotName: data.screenshot_name || user.screenshotName||defNames(user.name).screenshotName,
            greetingMessages: ((data.greeting_messages && data.greeting_messages.length>0) ? data.greeting_messages : (user.greetingMessages||defaultMsgs))
              .map(m=>({...m, base: m.base || (m.template||"").replace("[Case #]","").replace("[Inbound #]","").replace("[Type]","").trim() })),
          };
          setForm(f=>({...f,
            name:merged.name,role:merged.role,avatarUrl:merged.avatarUrl,
            beforeName:merged.beforeName,afterName:merged.afterName,screenshotName:merged.screenshotName,
            greetingMessages:(merged.greetingMessages||defaultMsgs).map(m=>({...m,base:m.base||(m.template||"").replace("[Case #]","").replace("[Inbound #]","").replace("[Type]","").trim()})),
          }));
          // Sync to localStorage so rest of app sees it
          localStorage.setItem("ch_user",JSON.stringify(merged));
          setUser(merged);
        }
      })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[]);

  // ── Save profile to DB ──
  const saveProfile=async()=>{
    if(!form.name.trim())return showToast("Name required","error");
    setSaving(true);
    try{
      const payload={
        email:user.email,
        name:form.name,
        role:form.role,
        before_name:form.beforeName,
        after_name:form.afterName,
        screenshot_name:form.screenshotName,
        avatar_url:form.avatarUrl||null,
        greeting_messages:form.greetingMessages||[],
      };
      const res=await fetch("/api/profile",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await res.json();
      if(!res.ok)return showToast(data.error||"Error saving profile","error");
      // Update local state and localStorage
      const updated={...user,...form,
        beforeName:form.beforeName,afterName:form.afterName,
        screenshotName:form.screenshotName,avatarUrl:form.avatarUrl||user.avatarUrl||"",
        greetingMessages:form.greetingMessages||[]};
      localStorage.setItem("ch_user",JSON.stringify(updated));
      setUser(updated);
      setEditing(false);
      showToast("Profile saved ✅");
    }catch(e){showToast("Error saving profile","error");}
    finally{setSaving(false);}
  };

  // ── Avatar upload ──
  const handleAvatarChange=async(e)=>{
    const file=e.target.files?.[0]; if(!file)return;
    setForm(f=>({...f,avatarUrl:URL.createObjectURL(file)})); // preview
    try{
      const reader=new FileReader();
      reader.onload=async(ev)=>{
        const res=await fetch("/api/images/upload",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({fileBase64:ev.target.result,fileName:`avatar_${user.id}`,mimeType:file.type||"image/jpeg"})});
        const data=await res.json();
        if(res.ok){
          const newUrl=data.url;
          setForm(f=>({...f,avatarUrl:newUrl}));
          // Immediately persist to DB so it isn't lost
          await fetch("/api/profile",{method:"POST",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({email:user.email,avatar_url:newUrl})});
          const updated={...user,avatarUrl:newUrl};
          localStorage.setItem("ch_user",JSON.stringify(updated));
          setUser(updated);
          showToast("Photo updated ✅");
        }else{ showToast("Upload failed","error"); }
      };
      reader.readAsDataURL(file);
    }catch(e){ showToast("Upload error","error"); }
  };

  // ── Change password (still uses Supabase Auth via access token) ──
  const changePw=async()=>{
    if(pwForm.next.length<6)return showToast("Min. 6 characters","error");
    if(pwForm.next!==pwForm.confirm)return showToast("Passwords don't match","error");
    setSaving(true);
    try{
      const accessToken=localStorage.getItem("ch_token");
      const res=await fetch("/api/auth/password",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({accessToken,newPassword:pwForm.next})});
      const data=await res.json();
      if(!res.ok)return showToast(data.error||"Error","error");
      setPwForm({next:"",confirm:""});showToast("Password changed ✅");
    }catch(e){showToast("Error","error");}
    finally{setSaving(false);}
  };

  const initials=(form.name||user.name).split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  return (
    <div>
      <div className="page-header"><div className="page-title">Profile & Settings</div><div className="page-sub">Manage your account, requestors, and preferences</div></div>
      {loading&&<div style={{textAlign:"center",padding:"40px 0",color:"var(--muted)"}}>Loading profile…</div>}
      {!loading&&<>

      {/* ── Info card ── */}
      <div className="profile-card">
        <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:20}}>
          <div className="profile-avatar-large" title="Click to change photo" onClick={()=>avatarInputRef.current?.click()}>
            {form.avatarUrl?<img src={form.avatarUrl} alt="Profile"/>:<span>{initials}</span>}
            <div className="profile-avatar-overlay"><Icon name="camera" size={18} color="#fff"/></div>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{display:"none"}}/>
          </div>
          <div>
            <h3 style={{fontSize:20,fontWeight:800}}>{form.name||user.name}</h3>
            <p style={{color:"var(--muted)",fontSize:13,marginTop:3}}>{user.email}</p>
            {form.role&&<p style={{fontSize:12,color:"var(--accent)",marginTop:3,fontWeight:600}}>{form.role}</p>}
          </div>
          <div style={{marginLeft:"auto"}}><button className="btn btn-ghost" onClick={()=>setEditing(e=>!e)}>{editing?"Cancel":"Edit Profile"}</button></div>
        </div>
        {editing&&(<div style={{borderTop:"1px solid var(--border)",paddingTop:20}}>
          <div className="field"><label>Full Name</label><input className="inp" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
          <div className="field"><label>Role / Title</label><input className="inp" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} placeholder="e.g. Web Specialist"/></div>
          <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving?"Saving...":"Save Changes"}</button>
        </div>)}
      </div>

      {/* ── Check-in Messages card ── */}
      <div className="profile-card">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <h3 style={{fontSize:16,fontWeight:700,margin:0}}>Check-in Messages</h3>
          <button className="btn btn-primary" style={{fontSize:11,padding:"5px 12px"}} onClick={()=>{
            const newMsg={id:Date.now().toString(),label:"New Message",base:"Hi po Ms. Tina, magpapacheck lang po",fillType:"caseNum"};
            setForm(f=>({...f,greetingMessages:[...(f.greetingMessages||[]),newMsg]}));
          }}>＋ Add Message</button>
        </div>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:14}}>Write your message base text. The radio button automatically appends what type to include when copying.</p>
        {(form.greetingMessages||[]).length===0&&(
          <div style={{fontSize:13,color:"var(--muted)",padding:"12px 0"}}>No messages yet. Click <b>＋ Add Message</b> to create one.</div>
        )}
        {(form.greetingMessages||[]).map((m,mi)=>{
          // Auto-build preview from base + fillType
          const buildPreview=(base,ft)=>{
            const b=base||"Hi po Ms. Tina, magpapacheck lang po";
            if(ft==="none")        return b;
            if(ft==="siteComment") return `${b} Site Comment #12345`;
            if(ft==="caseNum")     return `${b} Case #12345`;
            if(ft==="inbound")     return `${b} Inbound #67890`;
            return b;
          };
          const updateMsg=(patch)=>{
            const arr=[...(form.greetingMessages||[])];arr[mi]={...arr[mi],...patch};
            setForm(f=>({...f,greetingMessages:arr}));
          };
          return (
          <div key={m.id} style={{background:"var(--entry-bg)",border:"1.5px solid var(--border)",padding:"14px",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <input className="inp" style={{flex:1,fontWeight:700,fontSize:13}} value={m.label||""} onChange={e=>updateMsg({label:e.target.value})} placeholder="Label (e.g. Site Comment)"/>
              <button className="entry-del" onClick={()=>{
                const arr=(form.greetingMessages||[]).filter((_,i)=>i!==mi);setForm(f=>({...f,greetingMessages:arr}));
              }}><Icon name="trash" size={13} color="var(--red)"/></button>
            </div>
            <div className="field" style={{marginBottom:10}}>
              <label>Message</label>
              <textarea className="inp" rows={3} value={m.base||""} onChange={e=>updateMsg({base:e.target.value})} placeholder="Hi po Ms. Tina, magpapacheck lang po" style={{resize:"vertical",minHeight:68,lineHeight:1.6}}/>
            </div>
            <div className="field" style={{marginBottom:8}}>
              <label style={{marginBottom:6,display:"block"}}>Append number <span style={{fontWeight:400,opacity:.6,textTransform:"none",fontSize:10}}>(optional)</span></label>
              <div className="radio-group">
                {[
                  {v:"none",        l:"None",             cls:""},
                  {v:"siteComment", l:"Site Comment #",   cls:"selected-complete"},
                  {v:"caseNum",     l:"Case #",            cls:"selected-clarif"},
                  {v:"inbound",     l:"Inbound #",         cls:"selected-complete"},
                ].map(({v,l,cls:sc})=>(
                  <label key={v} className={cls("radio-label",m.fillType===v&&sc)}>
                    <input type="radio" name={`fillType-${m.id}`} checked={m.fillType===v} onChange={()=>updateMsg({fillType:v})} style={{display:"none"}}/>
                    {l}
                  </label>
                ))}
              </div>
            </div>
            <div style={{fontSize:11,color:"var(--muted)",marginTop:8,padding:"7px 10px",background:"var(--card)",border:"1px solid var(--border)"}}>
              <span style={{opacity:.6}}>Preview: </span>
              <span style={{color:"var(--accent)",fontWeight:600}}>{buildPreview(m.base,m.fillType)}</span>
            </div>
          </div>
          );
        })}
        <button className="btn btn-primary" style={{marginTop:4}} onClick={saveProfile} disabled={saving}>{saving?"Saving...":"💾 Save Messages"}</button>
      </div>

      {/* ── Special Requestors card ── */}
      <div className="profile-card">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <h3 style={{fontSize:16,fontWeight:700,margin:0}}>Special Requestors</h3>
          <button className="btn btn-primary" style={{fontSize:11,padding:"5px 12px"}} onClick={()=>setAddingReq(true)}>＋ Add Requestor</button>
        </div>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:14}}>Names shown in the Live Summary panel as a reminder during active cases.</p>
        <div className="requestor-grid">
          {(specialRequestors||[]).map((name,i)=>(
            <div key={i} className="requestor-chip">
              <div className="requestor-avatar">{(name||"").split(" ").map(w=>w&&w[0]).filter(Boolean).join("").slice(0,2).toUpperCase()}</div>
              <span>{name}</span>
              <button className="requestor-del" onClick={()=>removeRequestor(name)}>✕</button>
            </div>
          ))}
          {specialRequestors.length===0&&<div style={{color:"var(--muted)",fontSize:13}}>No special requestors yet.</div>}
        </div>
        {addingReq&&(<div className="modal-bg"><div className="modal">
          <div style={{marginBottom:14}}><Icon name="requestors" size={40} color="var(--amber)"/></div>
          <h3>Add Special Requestor</h3>
          <div className="field" style={{textAlign:"left",marginBottom:16}}>
            <label>Full Name</label>
            <input className="inp" placeholder="e.g. John Smith" value={newReq} onChange={e=>setNewReq(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAddRequestor()} autoFocus/>
          </div>
          <div className="modal-btns">
            <button className="btn btn-ghost" onClick={()=>{setAddingReq(false);setNewReq("");}}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddRequestor}>Add</button>
          </div>
        </div></div>)}
      </div>

      {/* ── File naming card ── */}
      <div className="profile-card">
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>Screenshot File Names</h3>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>These names are used when uploading screenshots in Post-Live Amends. Fully independent from your profile name.</p>
        <div className="field">
          <label>Before Screenshot Name</label>
          <input className="inp" value={form.beforeName||""} onChange={e=>setForm(f=>({...f,beforeName:e.target.value}))}/>
          <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>Used in: Step 2 — Before Screenshot</div>
        </div>
        <div className="field">
          <label>After / Main Screenshot Name</label>
          <input className="inp" value={form.afterName||""} onChange={e=>setForm(f=>({...f,afterName:e.target.value}))}/>
          <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>Used in: Step 5 — After Screenshot</div>
        </div>
        <div className="field">
          <label>Backup Screenshot Name</label>
          <input className="inp" value={form.screenshotName||""} onChange={e=>setForm(f=>({...f,screenshotName:e.target.value}))}/>
          <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>Used in: Step 6 — Backup Screenshots</div>
        </div>
        <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving?"Saving...":"💾 Save File Names"}</button>
      </div>

      {/* ── Password card ── */}
      <div className="profile-card">
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:16}}>Change Password</h3>
        <div className="field"><label>New Password</label><input className="inp" type="password" placeholder="Min. 6 characters" value={pwForm.next} onChange={e=>setPwForm(f=>({...f,next:e.target.value}))}/></div>
        <div className="field"><label>Confirm New Password</label><input className="inp" type="password" placeholder="••••••••" value={pwForm.confirm} onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&changePw()}/></div>
        <button className="btn btn-primary" onClick={changePw} disabled={saving}>{saving?"Updating...":"Update Password"}</button>
      </div>

      {/* ── Combined Tracker timer card ── */}
      <div className="profile-card">
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>⏱ Combined Tracker Alert</h3>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Alarm fires after this many minutes of case elapsed time. Default is 30 min.</p>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <input className="inp" type="number" min="1" max="240" style={{width:90,textAlign:"center",fontWeight:700,fontSize:15}}
            value={timerInput} onChange={e=>setTimerInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&(saveTimerLimit(timerInput),showToast("Combined Tracker timer updated ✅"))}/>
          <span style={{fontSize:13,color:"var(--muted)"}}>minutes</span>
          <button className="btn btn-primary" style={{marginLeft:"auto",padding:"8px 18px",fontSize:12}}
            onClick={()=>{saveTimerLimit(timerInput);showToast("Combined Tracker timer updated ✅");}}>Save</button>
        </div>
        <div style={{fontSize:11,color:"var(--muted)",marginTop:8}}>Currently: <strong style={{color:"var(--accent)"}}>{timerLimit} min</strong></div>
      </div>

      {/* ── QA Checklist timer card ── */}
      <div className="profile-card">
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>✅ QA Checklist Alert</h3>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Alarm fires after this many minutes since QA Checklist was started. Default is 10 min.</p>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <input className="inp" type="number" min="1" max="240" style={{width:90,textAlign:"center",fontWeight:700,fontSize:15}}
            value={qaTimerInput} onChange={e=>setQaTimerInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&(saveQaLimit(qaTimerInput),showToast("QA Checklist timer updated ✅"))}/>
          <span style={{fontSize:13,color:"var(--muted)"}}>minutes</span>
          <button className="btn btn-primary" style={{marginLeft:"auto",padding:"8px 18px",fontSize:12}}
            onClick={()=>{saveQaLimit(qaTimerInput);showToast("QA Checklist timer updated ✅");}}>Save</button>
        </div>
        <div style={{fontSize:11,color:"var(--muted)",marginTop:8}}>Currently: <strong style={{color:"var(--accent)"}}>{qaLimit} min</strong></div>
      </div>

      {/* ── Shift Start Alarm card ── */}
      <div className="profile-card">
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>⏰ Shift Start Alarm</h3>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Get alerted before your shift starts so you have time to prepare. Leave blank to disable.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div className="field" style={{marginBottom:0}}>
            <label>Shift Start Time</label>
            <input className="inp" type="time" value={shiftStartInput} onChange={e=>setShiftStartInput(e.target.value)}/>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>e.g. 20:00 for 8:00 PM</div>
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label>Warn me this many minutes before</label>
            <input className="inp" type="number" min="1" max="60" value={shiftStartWarnInput} onChange={e=>setShiftStartWarnInput(e.target.value)}/>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>Default: 10 minutes</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="btn btn-primary" style={{padding:"8px 18px",fontSize:12}} onClick={()=>{
            saveShiftStartTime(shiftStartInput);
            saveShiftStartWarnMins(shiftStartWarnInput);
            showToast("Shift start alarm updated ✅");
          }}>Save</button>
          {shiftStartTime&&<button className="btn btn-ghost" style={{fontSize:12}} onClick={()=>{
            setShiftStartInput(""); saveShiftStartTime(""); showToast("Shift start alarm disabled");
          }}>Disable</button>}
        </div>
        {shiftStartTime&&<div style={{fontSize:11,color:"var(--muted)",marginTop:10}}>
          Active: alarm fires at <strong style={{color:"var(--accent)"}}>{(()=>{
            const [hh,mm]=shiftStartTime.split(":").map(Number);
            const warn=new Date();warn.setHours(hh,mm,0,0);
            warn.setMinutes(warn.getMinutes()-shiftStartWarnMins);
            return warn.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
          })()}</strong> ({shiftStartWarnMins} min before {(()=>{
            const [hh,mm]=shiftStartTime.split(":").map(Number);
            return new Date(0,0,0,hh,mm).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
          })()})
        </div>}
      </div>

      {/* ── Shift End Alarm card ── */}
      <div className="profile-card">
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>⏰ Shift End Alarm</h3>
        <p style={{fontSize:12,color:"var(--muted)",marginBottom:16}}>Set your shift end time and how many minutes before it you want to be alerted. Leave blank to disable.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div className="field" style={{marginBottom:0}}>
            <label>Shift End Time</label>
            <input className="inp" type="time" value={shiftEndInput} onChange={e=>setShiftEndInput(e.target.value)}/>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>e.g. 05:00 for 5:00 AM</div>
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label>Warn me this many minutes before</label>
            <input className="inp" type="number" min="1" max="60" value={shiftWarnInput} onChange={e=>setShiftWarnInput(e.target.value)}/>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>Default: 10 minutes</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="btn btn-primary" style={{padding:"8px 18px",fontSize:12}} onClick={()=>{
            saveShiftEndTime(shiftEndInput);
            saveShiftWarnMins(shiftWarnInput);
            showToast("Shift alarm updated ✅");
          }}>Save</button>
          {shiftEndTime&&<button className="btn btn-ghost" style={{fontSize:12}} onClick={()=>{
            setShiftEndInput(""); saveShiftEndTime(""); showToast("Shift alarm disabled");
          }}>Disable</button>}
        </div>
        {shiftEndTime&&<div style={{fontSize:11,color:"var(--muted)",marginTop:10}}>
          Active: alarm fires at <strong style={{color:"var(--accent)"}}>{(()=>{
            const [hh,mm]=shiftEndTime.split(":").map(Number);
            const warn=new Date();warn.setHours(hh,mm,0,0);
            warn.setMinutes(warn.getMinutes()-shiftWarnMins);
            return warn.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
          })()}</strong> ({shiftWarnMins} min before {(()=>{
            const [hh,mm]=shiftEndTime.split(":").map(Number);
            return new Date(0,0,0,hh,mm).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
          })()})
        </div>}
      </div>

      {/* ── Danger zone ── */}
      <div className="profile-card" style={{borderColor:"rgba(244,63,94,.3)"}}>
        <h3 style={{fontSize:16,fontWeight:700,marginBottom:8,color:"var(--red)"}}>Danger Zone</h3>
        <p style={{color:"var(--muted)",fontSize:13,marginBottom:14}}>Signing out will end your current session.</p>
        <button className="btn btn-danger" onClick={onLogout}>Sign Out</button>
      </div>
      </>}
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH PAGES
// ─────────────────────────────────────────────────────────────────────────────
function AuthLogo() {
  return (
    <div className="auth-logo">
      <div className="auth-logo-icon">
        <svg width="40" height="40" viewBox="0 0 30 30" fill="none">
          <rect x="2" y="2" width="11" height="11" fill="var(--accent)" opacity=".9"/>
          <rect x="17" y="2" width="11" height="11" fill="var(--accent)" opacity=".5"/>
          <rect x="2" y="17" width="11" height="11" fill="var(--accent)" opacity=".5"/>
          <rect x="17" y="17" width="11" height="11" fill="var(--accent)" opacity=".2"/>
        </svg>
      </div>
      <div className="auth-logo-text">Case<span>Hub</span></div>
    </div>
  );
}

function LoginPage({ onLogin, goSignup }) {
  const [form,setForm]=useState({email:"",password:""});
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const submit=async()=>{
    if(!form.email||!form.password){setErr("Please fill all fields");return;}
    setLoading(true);setErr("");
    try{
      const res=await fetch("/api/auth/signin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const data=await res.json();
      if(!res.ok){setErr(data.error||"Sign in failed");return;}
      // Persist session to localStorage
      localStorage.setItem("ch_token",data.access_token);
      localStorage.setItem("ch_refresh",data.refresh_token);
      localStorage.setItem("ch_user",JSON.stringify(data.user));
      onLogin(data.user);
    }catch(e){setErr("Network error — please try again");}
    finally{setLoading(false);}
  };
  return (
    <div className="auth-page">
      <div className="auth-card">
        <AuthLogo/>
        <div className="auth-title">Welcome back</div>
        <div className="auth-sub">Sign in to your CaseHub workspace</div>
        {err&&<div style={{background:"var(--btn-cancel-bg)",border:"1px solid var(--btn-cancel-border)",color:"var(--btn-cancel-text)",borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:16,textAlign:"center"}}>{err}</div>}
        <div className="field"><label>Email</label><input className="inp" type="email" placeholder="you@email.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submit()} disabled={loading}/></div>
        <div className="field"><label>Password</label><input className="inp" type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submit()} disabled={loading}/></div>
        <button className="btn btn-save" style={{width:"100%",justifyContent:"center",marginTop:4}} onClick={submit} disabled={loading}>{loading?"Signing in...":"Sign In →"}</button>
        <div className="auth-divider">or</div>
        <div style={{textAlign:"center",fontSize:13,color:"var(--muted)"}}>Don't have an account? <button className="auth-link" onClick={goSignup}>Sign up</button></div>
      </div>
    </div>
  );
}

function SignupPage({ onSignup, goLogin }) {
  const [form,setForm]=useState({name:"",email:"",password:"",confirm:""});
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const submit=async()=>{
    if(!form.name||!form.email||!form.password){setErr("Please fill all fields");return;}
    if(form.password.length<6){setErr("Password must be at least 6 characters");return;}
    if(form.password!==form.confirm){setErr("Passwords do not match");return;}
    setLoading(true);setErr("");
    try{
      const res=await fetch("/api/auth/signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const data=await res.json();
      if(!res.ok){setErr(data.error||"Sign up failed");return;}
      // Email confirmation required (Supabase default)
      if(data.needsConfirmation){
        setErr(""); 
        setForm(f=>({...f,_confirmed:true,_msg:data.message}));
        return;
      }
      localStorage.setItem("ch_token",data.access_token);
      localStorage.setItem("ch_refresh",data.refresh_token);
      localStorage.setItem("ch_user",JSON.stringify(data.user));
      onSignup(data.user);
    }catch(e){setErr("Network error — please try again");}
    finally{setLoading(false);}
  };
  return (
    <div className="auth-page">
      <div className="auth-card">
        <AuthLogo/>
        <div className="auth-title">Create account</div>
        <div className="auth-sub">Join your CaseHub workspace</div>
        {err&&<div style={{background:"var(--btn-cancel-bg)",border:"1px solid var(--btn-cancel-border)",color:"var(--btn-cancel-text)",borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:16,textAlign:"center"}}>{err}</div>}
        {form._confirmed&&<div style={{background:"rgba(16,185,129,.1)",border:"1px solid var(--green)",color:"var(--green)",borderRadius:8,padding:"14px",fontSize:13,marginBottom:16,textAlign:"center",lineHeight:1.6}}>✅ Account created!<br/><span style={{opacity:.8,fontSize:12}}>{form._msg}</span><br/><button className="auth-link" style={{marginTop:8,display:"block",textAlign:"center"}} onClick={goLogin}>← Back to Sign In</button></div>}
        {!form._confirmed&&<><div className="field"><label>Full Name</label><input className="inp" placeholder="Your name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} disabled={loading}/></div>
        <div className="field"><label>Email</label><input className="inp" type="email" placeholder="you@email.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} disabled={loading}/></div>
        <div className="field"><label>Password</label><input className="inp" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} disabled={loading}/></div>
        <div className="field"><label>Confirm Password</label><input className="inp" type="password" placeholder="••••••••" value={form.confirm} onChange={e=>setForm(f=>({...f,confirm:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submit()} disabled={loading}/></div></>}
        {!form._confirmed&&<button className="btn btn-save" style={{width:"100%",justifyContent:"center",marginTop:4}} onClick={submit} disabled={loading}>{loading?"Creating account...":"Create Account →"}</button>}
        {!form._confirmed&&<><div className="auth-divider">or</div>
        <div style={{textAlign:"center",fontSize:13,color:"var(--muted)"}}>Already have an account? <button className="auth-link" onClick={goLogin}>Sign in</button></div></>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────
// Track when the app JS first loads — used for Time In duration calculation
const APP_LOAD_TIME = Date.now();

function App() {
  const [authPage,setAuthPage]=useState("login");
  const [user,setUser]=useState(null);
  const [sessionChecked,setSessionChecked]=useState(false); // prevents flash of login screen
  const [page,setPage]=useState(()=>{
    if(typeof window!=="undefined"){
      const saved=localStorage.getItem("ch_page");
      if(saved&&["dashboard","postlive","history","announcements","links","profile","build","prelive","sessions","filenames","archives"].includes(saved)) return saved;
    }
    return "dashboard";
  });
  const sidebarDragRef=useRef(null);
  const sidebarElRef=useRef(null);
  const [pendingPage,setPendingPage]=useState(null);
  const [navConfirm,setNavConfirm]=useState(false);
  const dbStatus = useDbStatus();
  const [allCases,setAllCases]=useState([]);
  const [drafts,setDrafts]=useState([]);
  const [archivedDrafts,setArchivedDrafts]=useState([]);
  const [formActive,setFormActive]=useState(false);
  const [globalTimeIn,setGlobalTimeIn]=useState(()=>{
    if(typeof window!=="undefined"){const v=localStorage.getItem("ch_timein");return v?parseInt(v):null;}
    return null;
  });
  const [timedIn,setTimedIn]=useState(()=>{
    if(typeof window!=="undefined") return localStorage.getItem("ch_timed_in")==="1";
    return false;
  });
  // Safety sync — restore timedIn from localStorage in case state was lost
  useEffect(()=>{
    if(typeof window!=="undefined"&&localStorage.getItem("ch_timed_in")==="1") setTimedIn(true);
  },[]);
  const [sessionDbId,setSessionDbId]=useState(()=>{
    if(typeof window!=="undefined") return localStorage.getItem("ch_session_db_id")||null;
    return null;
  });
  const [sessionRefreshKey,setSessionRefreshKey]=useState(0);
  const doTimeIn=()=>{
    // Fresh session — clear any leftover dir handle so first download asks for path
    resetSessionDir();
    const now=Date.now();
    setTimedIn(true);
    setGlobalTimeIn(now);
    if(typeof window!=="undefined"){
      localStorage.setItem("ch_timed_in","1");
      localStorage.setItem("ch_timein",String(now));
    }
    // Time In entry: duration from page open → button click
    const timeInEntry={id:APP_LOAD_TIME,status:"Time In",note:"Session started",startedAt:APP_LOAD_TIME,endedAt:now,endNote:""};
    // Immediately follow with Ongoing entry
    const ongoingEntry={id:now+1,status:"Ongoing",note:"Waiting for amend type",startedAt:now,endedAt:null,endNote:""};
    setSessionLog(prev=>{
      const next=[...prev,timeInEntry,ongoingEntry];
      if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
      return next;
    });
    // Write to DB
    fetch('/api/sessions',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'time_in',email:user?.email})
    }).then(r=>r.json()).then(d=>{
      if(d.id){setSessionDbId(d.id);if(typeof window!=="undefined")localStorage.setItem("ch_session_db_id",d.id);}
    }).catch(()=>{});
  };
  const doTimerReset=()=>{
    const now=Date.now();
    setGlobalTimeIn(now);
    if(typeof window!=="undefined") localStorage.setItem("ch_timein",String(now));
  };
  const doTimeOut=()=>{
    // Clear the saved folder handle — next session will ask for path on first download
    resetSessionDir();
    // Close the current open entry first, then add Time Out entry
    const now=Date.now();
    setSessionLog(prev=>{
      const closed=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,endedAt:now,endNote:""}:e);
      const timeOutEntry={id:now+2,status:"Time Out",note:"Manual time-out",startedAt:now,endedAt:now,endNote:""};
      const finalLog=[...closed,timeOutEntry];
      if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(finalLog));

      // Write time_out to DB, then save all session_cases from the log, then clear local log
      const currentDbId=sessionDbId;
      if(currentDbId){
        fetch('/api/sessions',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'time_out',session_id:currentDbId,email:user?.email})
        }).then(()=>{
          // Save each case/form entry from the session log to DB
          const caseEntries=finalLog.filter(e=>e.status==="Site Comment"||e.status==="Inbound Email");
          return Promise.all(caseEntries.map(e=>
            fetch('/api/sessions',{method:'POST',headers:{'Content-Type':'application/json'},
              body:JSON.stringify({
                action:'log_case',
                session_id:currentDbId,
                email:user?.email,
                case_num:e.caseNum||null,
                case_type:e.status==="Site Comment"?"siteComment":"inbound",
                note:e.note||""
              })
            }).catch(()=>{})
          ));
        }).then(()=>{
          // Refresh session data but keep the user on Post-Live Amends
          setSessionRefreshKey(k=>k+1);
          setPage("postlive");
          if(typeof window!=="undefined") localStorage.setItem("ch_page","postlive");
        }).catch(()=>{
          setSessionRefreshKey(k=>k+1);
        });
      } else {
        // No DB session, still stay on Post-Live Amends
        setSessionRefreshKey(k=>k+1);
        setPage("postlive");
        if(typeof window!=="undefined") localStorage.setItem("ch_page","postlive");
      }

      // Clear local session log after saving
      setTimeout(()=>{
        setSessionLog([]);
        if(typeof window!=="undefined") localStorage.removeItem("ch_session_log");
      },400);

      return finalLog;
    });
    // Stop any active break/open hour when timing out
    setBreakTimer(null); stopAlarmLoop(); setActiveAlarm(null);
    if(typeof window!=="undefined") localStorage.removeItem("ch_break");
    setOpenHourActive(false);
    if(typeof window!=="undefined") localStorage.removeItem("ch_openhour");
    setTimedIn(false);
    setGlobalTimeIn(null);
    if(typeof window!=="undefined"){
      localStorage.removeItem("ch_timed_in");
      localStorage.removeItem("ch_timein");
    }
    setSessionDbId(null);
    if(typeof window!=="undefined") localStorage.removeItem("ch_session_db_id");
  };



  // ── Session Log ──
  const [sessionLog,setSessionLog]=useState(()=>{
    if(typeof window!=="undefined"){
      try{
        const raw=JSON.parse(localStorage.getItem("ch_session_log")||"[]");
        // Filter out malformed entries — valid entries must have id and startedAt (numbers)
        return raw.filter(e=>e&&typeof e==="object"&&typeof e.id==="number"&&typeof e.startedAt==="number"&&typeof e.status==="string");
      }catch{return [];}
    }
    return [];
  });

  // ── Persist session log to DB whenever it changes (debounced 2s) ──
  const saveLogTimer=useRef(null);
  useEffect(()=>{
    if(!sessionDbId||!user?.email||!sessionLog.length) return;
    if(saveLogTimer.current) clearTimeout(saveLogTimer.current);
    saveLogTimer.current=setTimeout(()=>{
      fetch('/api/sessions',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'save_log',session_id:sessionDbId,email:user.email,log_data:sessionLog})
      }).catch(()=>{});
    },2000);
    return()=>{ if(saveLogTimer.current) clearTimeout(saveLogTimer.current); };
  },[sessionLog,sessionDbId]);

  // ── Restore session log from DB if active session exists on mount ──
  useEffect(()=>{
    const dbId=typeof window!=="undefined"?localStorage.getItem("ch_session_db_id"):null;
    const localLog=typeof window!=="undefined"?localStorage.getItem("ch_session_log"):null;
    if(!dbId) return;
    // If local log is empty but DB session exists, try to restore from DB
    const localParsed=localLog?JSON.parse(localLog):[];
    if(localParsed.length>0) return; // Local has data, use it
    fetch(`/api/sessions?action=get_log&session_id=${dbId}`)
      .then(r=>r.json()).then(d=>{
      if(d.log&&d.log.length>0){
        const clean=d.log.filter(e=>e&&typeof e==="object"&&typeof e.id==="number"&&typeof e.startedAt==="number"&&typeof e.status==="string");
        setSessionLog(clean);
        localStorage.setItem("ch_session_log",JSON.stringify(clean));
      }
    }).catch(()=>{});
  },[]);
  // addSessionLog variants:
  //   addSessionLog("Site Comment","","renameOngoing")  — rename last open Ongoing to Site Comment, leave open
  //   addSessionLog("Break","15 min","renameOngoing")   — rename last open Ongoing to Break, leave open
  //   addSessionLog("Ongoing","")                       — close any open entry, add fresh Ongoing
  //   addSessionLog("Time Out","")                      — normal: close last open, add Time Out row
  //   closeWithOutcome("Case Saved"|"Draft Saved"|"Cancelled") — close last open entry, set outcome field
  const addSessionLog=(status,note="",endNote="")=>{
    const now=Date.now();
    setSessionLog(prev=>{
      if(endNote==="renameOngoing"){
        // Find last open Ongoing and rename it to the chosen type (Site Comment, Inbound, Break)
        // Keep the entry OPEN (endedAt stays null) — it becomes the live entry
        const lastOngoingIdx=prev.map(e=>e.status).lastIndexOf("Ongoing");
        if(lastOngoingIdx!==-1&&!prev[lastOngoingIdx].endedAt){
          const updated=prev.map((e,i)=>
            i===lastOngoingIdx ? {...e,status} : e
          );
          if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(updated));
          return updated;
        }
        // No open Ongoing found — open a new entry with this status
        const entry={id:now,status,note,startedAt:now,endedAt:null,outcome:"",endNote:""};
        const next=[...prev,entry];
        if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
        return next;
      }
      // Default: close last open entry, add new one
      const entry={id:now,status,note,startedAt:now,endedAt:null,outcome:"",endNote:""};
      const closed=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,endedAt:now}:e);
      const next=[...closed,entry];
      if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
      return next;
    });
  };
  // Close the last open entry and stamp an outcome label (Case Saved / Draft Saved / Cancelled)
  const closeWithOutcome=(outcome,caseNum="")=>{
    const now=Date.now();
    setSessionLog(prev=>{
      const next=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,endedAt:now,outcome,caseNum:caseNum||e.caseNum||""}:e);
      if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
      return next;
    });
  };
  const closeSessionLog=(endNote="")=>{
    setSessionLog(prev=>{
      const next=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,endedAt:Date.now(),endNote}:e);
      if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
      return next;
    });
  };
  const clearSessionLog=()=>{
    setSessionLog([]);
    if(typeof window!=="undefined") localStorage.removeItem("ch_session_log");
  };
  // Persist formActive so pill shows even after page switch
  const [formInFields,setFormInFieldsRaw]=useState(()=>{
    if(typeof window!=="undefined") return localStorage.getItem("ch_form_in_fields")==="1";
    return false;
  });
  const setFormInFields=(v)=>{
    setFormInFieldsRaw(v);
    if(typeof window!=="undefined"){
      if(v) localStorage.setItem("ch_form_in_fields","1");
      else localStorage.removeItem("ch_form_in_fields");
    }
  };
  const [resumeFormTick,setResumeFormTick]=useState(0);
  const setFormActivePersist=(v)=>{
    setFormActive(v);
    if(typeof window!=="undefined"){
      if(v) localStorage.setItem("ch_form_active","1");
      else {
        localStorage.removeItem("ch_form_active");
        localStorage.removeItem("ch_active_form_mode");
        localStorage.removeItem("ch_active_form_use_draft");
        localStorage.removeItem("ch_form_in_fields");
        localStorage.removeItem("ch_minimised_form");
      }
    }
  };
  useEffect(()=>{
    if(typeof window!=="undefined"&&localStorage.getItem("ch_form_active")==="1"){
      const savedMode=localStorage.getItem("ch_active_form_mode");
      if(savedMode==="siteComment"||savedMode==="inbound") setFormActive(true);
      else localStorage.removeItem("ch_form_active");
    }
  },[]);
  const resumeInProgressForm=()=>{
    setFormActivePersist(true);
    setPage("postlive");
    setFormInFields(true);
    setResumeFormTick(t=>t+1);
    if(typeof window!=="undefined") localStorage.setItem("ch_page","postlive");
  };
  const [sidebarHoverOpen,setSidebarHoverOpen]=useState(false);
  const sidebarIsCollapsed=!sidebarHoverOpen;
  // Scroll sidebar back to top whenever it collapses so reopening always starts at the top
  useEffect(()=>{
    if(sidebarIsCollapsed&&sidebarElRef.current) sidebarElRef.current.scrollTop=0;
  },[sidebarIsCollapsed]);
  const [lightMode,setLightMode]=useState(()=>{
    if(typeof window!=="undefined"){return localStorage.getItem("ch_theme")==="light";}
    return false;
  });
  const [specialRequestors,setSpecialRequestors]=useState([]);
  const [ctLimit,setCtLimit]=useState(()=>{
    if(typeof window!=="undefined"){const v=parseInt(localStorage.getItem("ch_ct_limit"));return isNaN(v)?30:v;}
    return 30;
  });
  const saveCtLimit=(mins)=>{ const v=Math.max(1,Math.min(240,parseInt(mins)||30)); setCtLimit(v); if(typeof window!=="undefined") localStorage.setItem("ch_ct_limit",v); };
  const [qaLimit,setQaLimit]=useState(()=>{
    if(typeof window!=="undefined"){const v=parseInt(localStorage.getItem("ch_qa_limit"));return isNaN(v)?10:v;}
    return 10;
  });
  const saveQaLimit=(mins)=>{ const v=Math.max(1,Math.min(240,parseInt(mins)||10)); setQaLimit(v); if(typeof window!=="undefined") localStorage.setItem("ch_qa_limit",v); };
  // Legacy alias so nothing else breaks
  const timerLimit=ctLimit;
  const saveTimerLimit=saveCtLimit;
  // ── Shift End Alarm: shiftEndTime = "HH:MM" (24h), shiftWarnMins = minutes before end to alarm ──
  const [shiftStartTime,setShiftStartTime]=useState(()=>{
    if(typeof window!=="undefined") return localStorage.getItem("ch_shift_start")||"";
    return "";
  });
  const saveShiftStartTime=(t)=>{
    setShiftStartTime(t);
    if(typeof window!=="undefined") localStorage.setItem("ch_shift_start",t);
  };
  const [shiftStartWarnMins,setShiftStartWarnMins]=useState(()=>{
    if(typeof window!=="undefined"){const v=parseInt(localStorage.getItem("ch_shift_start_warn"));return isNaN(v)?10:v;}
    return 10;
  });
  const saveShiftStartWarnMins=(m)=>{
    const v=Math.max(1,Math.min(60,parseInt(m)||10));
    setShiftStartWarnMins(v);
    if(typeof window!=="undefined") localStorage.setItem("ch_shift_start_warn",v);
  };
  const [shiftEndTime,setShiftEndTime]=useState(()=>{
    if(typeof window!=="undefined") return localStorage.getItem("ch_shift_end")||"";
    return "";
  });
  const saveShiftEndTime=(t)=>{
    setShiftEndTime(t);
    if(typeof window!=="undefined") localStorage.setItem("ch_shift_end",t);
  };
  const [shiftWarnMins,setShiftWarnMins]=useState(()=>{
    if(typeof window!=="undefined"){const v=parseInt(localStorage.getItem("ch_shift_warn"));return isNaN(v)?10:v;}
    return 10;
  });
  const saveShiftWarnMins=(m)=>{
    const v=Math.max(1,Math.min(60,parseInt(m)||10));
    setShiftWarnMins(v);
    if(typeof window!=="undefined") localStorage.setItem("ch_shift_warn",v);
  };

  const [announcements,setAnnouncements]=useState([]); // always loaded from DB
  const [links,setLinks]=useState([]);
  const [dataLoading,setDataLoading]=useState(false);
  const [breakTimer,setBreakTimer]=useState(()=>{
    if(typeof window==="undefined") return null;
    try{
      const v=localStorage.getItem("ch_break");
      if(!v) return null;
      const bt=JSON.parse(v);
      const now=Date.now();
      const secsLeft=Math.ceil((bt.endsAt-now)/1000);
      if(secsLeft<=0) return null;
      return {...bt,secsLeft,warned:now>=bt.warnAt,ended:false};
    }catch{return null;}
  }); // {label,mins,endsAt,warnAt,warned,ended,secsLeft}
  // timerLimit (mins) is the single source of truth — also aliased as alarmMins for legacy compat
  const alarmMins = timerLimit;
  const saveAlarmMins = saveTimerLimit;


  // ── Shift-start alarm: fires shiftStartWarnMins before shift start ──
  useEffect(()=>{
    if(!shiftStartTime) return;
    const schedule=()=>{
      const now=new Date();
      const [hh,mm]=shiftStartTime.split(":").map(Number);
      const start=new Date(now);start.setHours(hh,mm,0,0);
      if(start<=now) start.setDate(start.getDate()+1);
      const alarmAt=new Date(start.getTime()-shiftStartWarnMins*60*1000);
      const delay=alarmAt-now;
      if(delay<=0){ startAlarmLoop("shift_start"); return null; }
      return setTimeout(()=>startAlarmLoop("shift_start"),delay);
    };
    const t=schedule();
    return()=>{ if(t) clearTimeout(t); };
  },[shiftStartTime,shiftStartWarnMins]);

  // ── Shift-end alarm: fires shiftWarnMins before the configured shift end time ──
  useEffect(()=>{
    if(!shiftEndTime) return;
    const schedule=()=>{
      const now=new Date();
      const [hh,mm]=shiftEndTime.split(":").map(Number);
      const end=new Date(now);
      end.setHours(hh,mm,0,0);
      // If end time already passed today, schedule for tomorrow
      if(end<=now) end.setDate(end.getDate()+1);
      const alarmAt=new Date(end.getTime()-shiftWarnMins*60*1000);
      const delay=alarmAt-now;
      if(delay<=0){ startAlarmLoop("shift_end"); return null; }
      return setTimeout(()=>startAlarmLoop("shift_end"),delay);
    };
    const t=schedule();
    return()=>{ if(t) clearTimeout(t); };
  },[shiftEndTime,shiftWarnMins]);

  useEffect(()=>{document.body.classList.toggle("light",lightMode);if(typeof window!=="undefined") localStorage.setItem("ch_theme",lightMode?"light":"dark");},[lightMode]);
  useEffect(()=>{ const h=e=>{const d=document.getElementById("fngen-dropdown");if(d&&!d.closest(".fngen-wrap")?.contains(e.target)) d.classList.remove("open");}; document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h); },[]);

  // ── Alarm state: null | "warn" | "end" | "case" ──
  const [activeAlarm,setActiveAlarm]=useState(null);
  const alarmLoopRef=useRef(null);
  const alarmCtxRef=useRef(null);

  // ── Web Audio looping alarm ──
  function startAlarmLoop(type){
    stopAlarmLoop();
    const loop=()=>{
      try{
        const ctx=new (window.AudioContext||window.webkitAudioContext)();
        alarmCtxRef.current=ctx;
        const isWarn=type==="warn"||type==="shift_start"||type==="shift_end";
        const isCase=type==="case";
        // Gentle chime: two-tone sine wave, soft attack/release, low gain
        const notes=isCase?[523,659,784]:[523,659]; // C5-E5-G5 for case, C5-E5 for warn
        const gap=0.55;
        const gain=0.18; // quiet — not jarring
        const totalDur=notes.length*gap+0.8;
        notes.forEach((freq,i)=>{
          const o=ctx.createOscillator();
          const g=ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value=freq;
          o.type="sine";
          const t=ctx.currentTime+i*gap;
          g.gain.setValueAtTime(0,t);
          g.gain.linearRampToValueAtTime(gain,t+0.06);
          g.gain.setValueAtTime(gain,t+0.35);
          g.gain.linearRampToValueAtTime(0,t+0.55);
          o.start(t); o.stop(t+0.6);
        });
        // schedule next loop
        alarmLoopRef.current=setTimeout(()=>{ ctx.close(); loop(); },totalDur*1000);
      }catch(e){console.warn("Audio error",e);}
    };
    loop();
    setActiveAlarm(type);
  }

  function stopAlarmLoop(){
    if(alarmLoopRef.current){clearTimeout(alarmLoopRef.current);alarmLoopRef.current=null;}
    try{alarmCtxRef.current?.close();}catch(e){}
    alarmCtxRef.current=null;
  }

  function dismissAlarm(){ stopAlarmLoop(); setActiveAlarm(null); }
  function snoozeAlarm(){
    stopAlarmLoop(); setActiveAlarm(null);
    // re-trigger in 5 minutes
    setTimeout(()=>startAlarmLoop("end"),5*60*1000);
  }

  // ── Break timer tick ──
  useEffect(()=>{
    if(!breakTimer)return;
    const tick=setInterval(()=>{
      const now=Date.now();
      setBreakTimer(bt=>{
        if(!bt)return null;
        const secsLeft=Math.ceil((bt.endsAt-now)/1000);
        if(!bt.warned && now>=bt.warnAt){
          startAlarmLoop("warn");
          return {...bt,warned:true};
        }
        if(!bt.ended && secsLeft<=0){
          startAlarmLoop("end");
          // Auto-close the break log entry and push fresh Ongoing
          const nowMs=Date.now();
          setSessionLog(prev=>{
            const closed=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,endedAt:nowMs,outcome:"Break Ended"}:e);
            const freshOngoing={id:nowMs+1,status:"Ongoing",note:"",startedAt:nowMs,endedAt:null,outcome:"",endNote:""};
            const next=[...closed,freshOngoing];
            if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
            return next;
          });
          if(typeof window!=="undefined") localStorage.removeItem("ch_break");
          // Auto-hide the bar after 1.5s — alarm modal stays until user dismisses it
          setTimeout(()=>{
            setBreakTimer(null);
            const t=Date.now();
            setGlobalTimeIn(t);
            if(typeof window!=="undefined") localStorage.setItem("ch_timein",String(t));
          },1500);
          return {...bt,ended:true,secsLeft:0};
        }
        return {...bt,secsLeft:Math.max(0,secsLeft)};
      });
    },500);
    return()=>clearInterval(tick);
  },[breakTimer]);

  const [breakPending,setBreakPending]=useState(null); // {label,mins} waiting confirm
  const [cancelBreakConfirm,setCancelBreakConfirm]=useState(false);
  const [cancelOpenHourConfirm,setCancelOpenHourConfirm]=useState(false);
  function startBreak(label,mins,fullDuration=false){
    const now=Date.now();
    // Sidebar break: subtract session elapsed so the countdown reflects remaining time
    // Form break (fullDuration=true): always use the full break duration
    const sessionElapsedMs=(!fullDuration&&globalTimeIn)?Math.max(0,now-globalTimeIn):0;
    const adjustedMs=Math.max(0,mins*60*1000-sessionElapsedMs);
    const endsAt=now+adjustedMs;
    const warnAt=Math.max(now+1000, endsAt-5*60*1000);
    const bt={label,mins,endsAt,warnAt,warned:false,ended:false,secsLeft:Math.floor(adjustedMs/1000)};
    setBreakTimer(bt);
    if(typeof window!=="undefined") localStorage.setItem("ch_break",JSON.stringify(bt));
    // Rename the current open Ongoing → "Break" (keeps it open, no outcome yet)
    addSessionLog("Break",label,"renameOngoing");
  }
  const [openHourPending,setOpenHourPending]=useState(false);
  const [openHourActive,setOpenHourActive]=useState(()=>{
    if(typeof window!=="undefined") return localStorage.getItem("ch_openhour")==="1";
    return false;
  });
  function startOpenHour(){
    const now=Date.now();
    setOpenHourActive(true);
    if(typeof window!=="undefined") localStorage.setItem("ch_openhour","1");
    // Rename last Ongoing -> Open Hour (keep open, no outcome)
    setSessionLog(prev=>{
      const renamed=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,status:"Open Hour"}:e);
      if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(renamed));
      return renamed;
    });
    setOpenHourPending(false);
  }
  function stopOpenHour(){
    const now=Date.now();
    setOpenHourActive(false);
    if(typeof window!=="undefined") localStorage.removeItem("ch_openhour");
    // Close Open Hour entry, reset timer, add fresh Ongoing
    setSessionLog(prev=>{
      const closed=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,endedAt:now,outcome:"Open Hour Ended"}:e);
      const fresh={id:now+1,status:"Ongoing",note:"",startedAt:now,endedAt:null,outcome:"",endNote:""};
      const next=[...closed,fresh];
      if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
      return next;
    });
    setGlobalTimeIn(now);
    if(typeof window!=="undefined") localStorage.setItem("ch_timein",String(now));
  }
  function stopBreak(){
    // If the timer already auto-ended (bt.ended=true), the session log was already updated
    // by the tick — just clear the timer state without adding another Ongoing entry.
    setBreakTimer(bt=>{
      if(bt?.ended){
        // Already ended — session log already has fresh Ongoing from the tick, skip it
        return null;
      }
      // Manual end mid-break: close the Break entry and add fresh Ongoing
      const now=Date.now();
      setSessionLog(prev=>{
        const closed=prev.map((e,i)=>i===prev.length-1&&!e.endedAt?{...e,endedAt:now,outcome:"Break Ended"}:e);
        const freshOngoing={id:now+1,status:"Ongoing",note:"",startedAt:now,endedAt:null,outcome:"",endNote:""};
        const next=[...closed,freshOngoing];
        if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(next));
        return next;
      });
      // Reset the session timer on manual end only
      setGlobalTimeIn(now);
      if(typeof window!=="undefined") localStorage.setItem("ch_timein",String(now));
      return null;
    });
    stopAlarmLoop(); setActiveAlarm(null);
    if(typeof window!=="undefined") localStorage.removeItem("ch_break");
    setCancelBreakConfirm(false);
  }

  // ── Case 30-min alarm (passed as prop to PostLiveForm) ──
  const playEndAlarm=useCallback((type)=>startAlarmLoop(type==="qa"?"case_qa":"case"),[]);

  // ── GLOBAL alarm — reads ONLY from localStorage, zero React dependency.
  //    startAlarmLoop is captured via ref to avoid any stale closure issues. ──
  const globalCtFiredRef=useRef(new Set());
  const globalQaFiredRef=useRef(new Set());
  const alarmMinsRef=useRef(alarmMins);
  const qaLimitRef=useRef(qaLimit);
  const startAlarmLoopRef=useRef(null);
  useEffect(()=>{ alarmMinsRef.current=alarmMins; },[alarmMins]);
  useEffect(()=>{ qaLimitRef.current=qaLimit; },[qaLimit]);
  useEffect(()=>{ startAlarmLoopRef.current=startAlarmLoop; });

  // Poll ch_alarm_signal from localStorage every 500ms as a guaranteed fallback.
  // The interval below writes this key; this poller reads it and calls setActiveAlarm
  // directly in the App render cycle — bypassing any closure/stale-state issue.
  useEffect(()=>{
    const poller=setInterval(()=>{
      if(typeof window==="undefined") return;
      const sig=localStorage.getItem("ch_alarm_signal");
      if(!sig) return;
      try{
        const {type,ts}=JSON.parse(sig);
        // Only act if the signal is fresh (within the last 3 seconds)
        if(Date.now()-ts>3000){ localStorage.removeItem("ch_alarm_signal"); return; }
        localStorage.removeItem("ch_alarm_signal");
        if(startAlarmLoopRef.current) startAlarmLoopRef.current(type);
      }catch{ localStorage.removeItem("ch_alarm_signal"); }
    },500);
    return()=>clearInterval(poller);
  },[]);

  // showDomAlarm / dismissDomAlarm — directly create/remove alarm DOM node.
  // This BYPASSES React state and render scheduling entirely, so the alarm
  // shows immediately on any page regardless of React's batching or concurrency.
  const showDomAlarm = useCallback((type) => {
    if (document.getElementById("ch-dom-alarm")) return; // already showing
    const ct = alarmMinsRef.current;
    const qa = qaLimitRef.current;
    const title = type === "case"
      ? `Combined Tracker: ${ct} min reached!`
      : `QA Checklist: ${qa} min reached!`;
    const sub = type === "case"
      ? `You've been on this case for ${ct} minutes. Check if it needs to escalate or wrap up.`
      : `QA Checklist has been running for ${qa} minutes. Time to review and finalize.`;
    const icon = type === "case" ? "⏱" : "✅";
    const el = document.createElement("div");
    el.id = "ch-dom-alarm";
    // Match original .alarm-overlay exactly: 50% dark bg, centered
    el.className = "alarm-overlay";
    el.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999999;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease;backdrop-filter:blur(6px);";
    el.innerHTML = `
      <div class="alarm-modal" style="animation:popIn .25s ease,alarmPulse 1.4s ease-in-out infinite;">
        <span class="alarm-icon">${icon}</span>
        <div class="alarm-title">${title}</div>
        <div class="alarm-sub">${sub}</div>
        <div class="alarm-btns">
          <button id="ch-dom-alarm-snooze" class="alarm-snooze">⏰ Snooze 30 min</button>
          <button id="ch-dom-alarm-dismiss" class="alarm-dismiss">✅ I'm Aware</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    const remove = () => document.getElementById("ch-dom-alarm")?.remove();
    document.getElementById("ch-dom-alarm-dismiss")?.addEventListener("click", () => {
      remove(); stopAlarmLoop(); setActiveAlarm(null);
    });
    document.getElementById("ch-dom-alarm-snooze")?.addEventListener("click", () => {
      remove(); stopAlarmLoop(); setActiveAlarm(null);
      // Re-fire after 30 minutes by removing the fired flag after delay
      const tabId = el.dataset?.tabId;
      setTimeout(() => {
        globalCtFiredRef.current.delete(tabId||"");
        globalQaFiredRef.current.delete(tabId||"");
      }, 30 * 60 * 1000);
    });
    // Also fire sound
    if (startAlarmLoopRef.current) startAlarmLoopRef.current(type);
    return el;
  }, []);

  useEffect(()=>{
    const interval=setInterval(()=>{
      if(typeof window==="undefined") return;
      let tabs=[];
      try{
        const raw=localStorage.getItem("ch_live_tabs");
        if(raw) tabs=JSON.parse(raw);
      }catch{ return; }
      if(!tabs.length) return;
      // ── CRITICAL: alarm is ALWAYS based on the FIRST RUNNING tab (startTime!==null),
      //    NOT the currently displayed tab (ch_live_tab_active may point to a queued tab
      //    with startTime===null when user switches view, which was causing early exit). ──
      const activeTab=tabs.find(t=>t.startTime!==null&&t.startTime!==undefined);
      if(!activeTab||!activeTab.startTime) return; // no running tab
      const now=Date.now();
      const fe=Math.floor((now-Number(activeTab.startTime))/1000);
      if(fe<0) return;
      let p2=null;
      const p2Raw=localStorage.getItem(`ch_phase2_start_${activeTab.id}`);
      if(p2Raw){ const v=Math.floor((now-Number(p2Raw))/1000); if(v>0) p2=v; }
      if(fe<=0) globalCtFiredRef.current.delete(activeTab.id);
      if(!p2||p2<=0) globalQaFiredRef.current.delete(activeTab.id);
      const ctLimit=alarmMinsRef.current*60;
      if(ctLimit>0 && fe>0 && fe>=ctLimit && !globalCtFiredRef.current.has(activeTab.id)){
        globalCtFiredRef.current.add(activeTab.id);
        const domEl = showDomAlarm("case");
        if(domEl) domEl.dataset.tabId = activeTab.id;
      }
      const qaLimit2=qaLimitRef.current*60;
      if(qaLimit2>0 && p2!==null && p2>0 && p2>=qaLimit2 && !globalQaFiredRef.current.has(activeTab.id)){
        globalQaFiredRef.current.add(activeTab.id);
        const domElQa = showDomAlarm("case_qa");
        if(domElQa) domElQa.dataset.tabId = activeTab.id;
      }
    },1000);
    return()=>clearInterval(interval);
  },[showDomAlarm]);

  // ── On mount: restore session from localStorage ──
  useEffect(()=>{
    const tryRestore=async()=>{
      const stored=localStorage.getItem("ch_user");
      const refresh=localStorage.getItem("ch_refresh");
      if(!stored||!refresh){setSessionChecked(true);return;}
      try{
        const res=await fetch("/api/auth/refresh",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({refresh_token:refresh})});
        if(res.ok){
          const data=await res.json();
          localStorage.setItem("ch_token",data.access_token);
          localStorage.setItem("ch_refresh",data.refresh_token);
          localStorage.setItem("ch_user",JSON.stringify(data.user));
          setUser(data.user);
        }else{
          // Session expired or invalid — clear and show login
          const errData=await res.json().catch(()=>({}));
          console.warn("Session refresh failed:",errData.error||res.status);
          localStorage.removeItem("ch_token");
          localStorage.removeItem("ch_refresh");
          localStorage.removeItem("ch_user");
        }
      }catch(e){
        // Network error — try using cached user anyway
        try{setUser(JSON.parse(stored));}catch(_){}
      }
      setSessionChecked(true);
    };
    tryRestore();
  },[]);

  // ── Load all data when user is set ──
  useEffect(()=>{
    if(!user)return;
    setDataLoading(true);
    Promise.all([
      fetch(`/api/cases?email=${encodeURIComponent(user.email)}`).then(r=>r.json()).catch(()=>[]),
      fetch("/api/announcements").then(r=>r.json()).catch(()=>[]),
      fetch(`/api/links?email=${encodeURIComponent(user.email)}`).then(r=>r.json()).catch(()=>[]),
      fetch("/api/requestors").then(r=>r.json()).catch(()=>[]),
      fetch(`/api/drafts?email=${encodeURIComponent(user.email)}`).then(r=>r.json()).catch(()=>[]),
      fetch(`/api/profile?email=${encodeURIComponent(user.email)}`).then(r=>r.json()).catch(()=>({})),
      fetch(`/api/archived-drafts?email=${encodeURIComponent(user.email)}`).then(r=>r.json()).catch(()=>[]),
    ]).then(([cases,anns,lnks,reqs,draftList,profile,archivedList])=>{
      const mergeWithCache=(rawCases)=>{
        if(!Array.isArray(rawCases)) return [];
        try{
          const raw=typeof window!=="undefined"?localStorage.getItem("ch_case_extra_cache"):null;
          if(!raw) return rawCases;
          const cache=JSON.parse(raw);
          return rawCases.map(c=>{
            const cached=c.caseNum?cache[c.caseNum]:null;
            if(!cached) return c;
            return{...c,customerName:c.customerName||cached.customerName||"",customerEmail:c.customerEmail||cached.customerEmail||"",businessName:c.businessName||cached.businessName||"",businessSuffix:c.businessSuffix||cached.businessSuffix||"",inboundNum:c.inboundNum||cached.inboundNum||"",inProgress:c.inProgress??cached.inProgress??false,entries:(c.entries&&c.entries.length>0)?c.entries:(cached.entries||c.entries||[]),checklist:c.checklist||cached.checklist||{},devices:c.devices||cached.devices||{},trackerChecklistLink:c.trackerChecklistLink||cached.trackerChecklistLink||"",emailAddress:c.emailAddress||cached.emailAddress||"",emailType:c.emailType||cached.emailType||""};
          });
        }catch(e){return rawCases;}
      };
      setAllCases(mergeWithCache(Array.isArray(cases)?[...cases].reverse():[]));
      setAnnouncements(Array.isArray(anns)?anns:[]);
      setLinks(Array.isArray(lnks)?lnks:[]);
      setSpecialRequestors(Array.isArray(reqs)?reqs:[]);
      setDrafts(Array.isArray(draftList)?draftList:[]);
      setArchivedDrafts(Array.isArray(archivedList)?archivedList:[]);
      // Merge profile data into user object so filenames/avatar are always current
      if(profile && profile.email){
        const merged={...user,
          name:       profile.name         || user.name,
          role:       profile.role         || user.role||"",
          avatarUrl:  profile.avatar_url   || user.avatarUrl||"",
          beforeName: profile.before_name  || user.beforeName||"",
          afterName:  profile.after_name   || user.afterName||"",
          screenshotName: profile.screenshot_name || user.screenshotName||"",
          greetingMessages: (profile.greeting_messages&&profile.greeting_messages.length>0) ? profile.greeting_messages : (user.greetingMessages||[]),
        };
        localStorage.setItem("ch_user",JSON.stringify(merged));
        setUser(merged);
      }
    }).catch(console.error).finally(()=>setDataLoading(false));
  },[user?.email]);

  // ── Cases ──
  const addCase=async(c)=>{
    try{
      // Upload any RAM (blob) images to Supabase Storage before saving the case
      const uploadPending=async(imgs)=>{
        return Promise.all((imgs||[]).map(async(img)=>{
          if(img._inDB||!img._file)return{url:img.url,name:img.name,id:img.id||img.path,path:img.path||img.id};
          const uploaded=await uploadImageToStorage(img._file,img.name);
          return uploaded?{url:uploaded.url,name:uploaded.name,id:uploaded.path,path:uploaded.path}:{url:img.url,name:img.name,id:img.id,path:img.id};
        }));
      };
      const [uploadedImages,uploadedBackup]=await Promise.all([uploadPending(c.images),uploadPending(c.backupImages)]);
      const payload={
        ...c,
        userEmail:user.email,
        images:uploadedImages,
        backupImages:uploadedBackup,
        entries:(c.entries||[]).map(({_file,...rest})=>rest),
        trackerChecklistLink:c.trackerChecklistLink||"",
      };
      const res=await fetch("/api/cases",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const saved=await res.json();
      if(!res.ok){console.error("addCase API error:",saved.error);return;}
      const merged={...payload,...saved,
        customerName:   saved.customerName   || payload.customerName   || "",
        customerEmail:  saved.customerEmail  || payload.customerEmail  || "",
        businessName:   saved.businessName   || payload.businessName   || "",
        businessSuffix: saved.businessSuffix || payload.businessSuffix || "",
        inboundNum:     saved.inboundNum     || payload.inboundNum     || "",
        inProgress:     saved.inProgress     ?? payload.inProgress     ?? false,
        entries:        (saved.entries&&saved.entries.length>0)?saved.entries:(payload.entries||[]),
        checklist:      saved.checklist      || payload.checklist      || {},
        devices:        saved.devices        || payload.devices        || {},
        trackerChecklistLink:saved.trackerChecklistLink||payload.trackerChecklistLink||"",
        emailAddress:   saved.emailAddress   || payload.emailAddress   || "",
        emailType:      saved.emailType      || payload.emailType      || "",
        images:         (saved.images&&saved.images.length>0)?saved.images:(payload.images||[]),
        backupImages:   (saved.backupImages&&saved.backupImages.length>0)?saved.backupImages:(payload.backupImages||[]),
      };
      try{
        const cacheKey="ch_case_extra_cache";
        const raw=typeof window!=="undefined"?localStorage.getItem(cacheKey):null;
        const cache=raw?JSON.parse(raw):{};
        if(merged.caseNum){
          cache[merged.caseNum]={customerName:merged.customerName,customerEmail:merged.customerEmail,businessName:merged.businessName,businessSuffix:merged.businessSuffix,inboundNum:merged.inboundNum,inProgress:merged.inProgress,entries:merged.entries,checklist:merged.checklist,devices:merged.devices,trackerChecklistLink:merged.trackerChecklistLink,emailAddress:merged.emailAddress,emailType:merged.emailType};
          if(typeof window!=="undefined") localStorage.setItem(cacheKey,JSON.stringify(cache));
        }
      }catch(e){}
      setAllCases(a=>[merged,...a]);
      dbStatus.markSaved();
    }catch(e){
      console.error("addCase exception:",e);
    }
  };
  const updateCase=async(id,updated)=>{
    try{
      // EditableCaseCard already uploads immediately, but strip any residual _file refs
      const cleanImgs=(imgs)=>(imgs||[]).map(({_file,url,name,id,path,_inDB})=>({url,name,id,path:path||id,_inDB:_inDB||false}));
      const payload={
        ...updated,
        userEmail:user.email,
        images:cleanImgs(updated.images),
        backupImages:cleanImgs(updated.backupImages),
        entries:(updated.entries||[]).map(({_file,...rest})=>rest),
        trackerChecklistLink:updated.trackerChecklistLink||"",
      };
      const res=await fetch(`/api/cases/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const saved=await res.json();
      if(!res.ok){console.error("updateCase error:",saved.error);return;}
      const merged={...payload,...saved,
        customerName:   saved.customerName   || payload.customerName   || "",
        customerEmail:  saved.customerEmail  || payload.customerEmail  || "",
        businessName:   saved.businessName   || payload.businessName   || "",
        businessSuffix: saved.businessSuffix || payload.businessSuffix || "",
        inboundNum:     saved.inboundNum     || payload.inboundNum     || "",
        inProgress:     saved.inProgress     ?? payload.inProgress     ?? false,
        entries:        (saved.entries&&saved.entries.length>0)?saved.entries:(payload.entries||[]),
        checklist:      saved.checklist      || payload.checklist      || {},
        devices:        saved.devices        || payload.devices        || {},
        trackerChecklistLink:saved.trackerChecklistLink||payload.trackerChecklistLink||"",
        emailAddress:   saved.emailAddress   || payload.emailAddress   || "",
        emailType:      saved.emailType      || payload.emailType      || "",
        images:         (saved.images&&saved.images.length>0)?saved.images:(payload.images||[]),
        backupImages:   (saved.backupImages&&saved.backupImages.length>0)?saved.backupImages:(payload.backupImages||[]),
      };
      try{
        const cacheKey="ch_case_extra_cache";
        const raw=typeof window!=="undefined"?localStorage.getItem(cacheKey):null;
        const cache=raw?JSON.parse(raw):{};
        if(merged.caseNum){
          cache[merged.caseNum]={customerName:merged.customerName,customerEmail:merged.customerEmail,businessName:merged.businessName,businessSuffix:merged.businessSuffix,inboundNum:merged.inboundNum,inProgress:merged.inProgress,entries:merged.entries,checklist:merged.checklist,devices:merged.devices,trackerChecklistLink:merged.trackerChecklistLink,emailAddress:merged.emailAddress,emailType:merged.emailType};
          if(typeof window!=="undefined") localStorage.setItem(cacheKey,JSON.stringify(cache));
        }
      }catch(e){}
      setAllCases(a=>a.map(c=>c._id===id?merged:c));
      dbStatus.markSaved();
    }catch(e){console.error("updateCase exception:",e);}
  };
  const deleteCase=async(id)=>{
    try{await fetch(`/api/cases/${id}`,{method:"DELETE"});}catch(e){console.error(e);}
    setAllCases(a=>a.filter(c=>c._id!==id));
  };

  // ── Drafts ──
  const saveDraft=async(mode,draftData)=>{
    const clean=(imgs)=>(imgs||[]).map(({file,url,name,id,path,type})=>({url,name,id,path:path||id||name,type}));
    const cleanData={...draftData,images:clean(draftData.images||[]),backupImages:clean(draftData.backupImages||[])};
    const res=await fetch("/api/drafts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userEmail:user.email,mode,draftData:cleanData})});
    const saved=await res.json();
    if(!res.ok) throw new Error(saved.error||"Failed to Suspend Case");
    setDrafts(ds=>[...ds.filter(d=>d._mode!==mode),saved]);
  };
  const updateDraft=async(id,updatedData)=>{
    try{
      const res=await fetch(`/api/drafts/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({draftData:updatedData})});
      if(!res.ok) return;
      setDrafts(ds=>ds.map(d=>d._id===id?{...d,...updatedData}:d));
    }catch(e){console.error("updateDraft error:",e);}
  };
  const deleteDraft=async(id,mode,skipDeleteLog=false)=>{
    // Used only when completing/saving a suspended case (skipDeleteLog=true).
    // Direct user-triggered removal now goes through archiveDraft instead.
    const draft=drafts.find(d=>d._id===id||d._mode===mode);
    const deletedCaseNum=draft?.caseNum||"";
    try{await fetch(`/api/drafts/${id}`,{method:"DELETE"});}catch(e){console.error(e);}
    setDrafts(ds=>ds.filter(d=>d._id!==id&&d._mode!==mode));
    if(deletedCaseNum&&!skipDeleteLog){
      setSessionLog(prev=>{
        const updated=prev.map(e=>{
          if((e.caseNum||"")===(deletedCaseNum||"")&&e.outcome==="Suspended"){
            return {...e,outcome:"Deleted"};
          }
          return e;
        });
        if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(updated));
        return updated;
      });
    }
  };

  const archiveDraft=async(id,mode)=>{
    const draft=drafts.find(d=>d._id===id||d._mode===mode);
    if(!draft) return;
    const archivedCaseNum=draft.caseNum||"";
    try{
      // 1. Copy to archived_drafts
      const res=await fetch("/api/archived-drafts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        userEmail:user.email,
        mode,
        draftData:{...draft,_id:undefined,draftAt:undefined},
        savedAt:draft.draftAt||null,
      })});
      const saved=await res.json();
      if(!res.ok) throw new Error(saved.error||"Failed to archive");
      setArchivedDrafts(a=>[saved,...a]);
      // 2. Remove from drafts
      await fetch(`/api/drafts/${id}`,{method:"DELETE"});
      setDrafts(ds=>ds.filter(d=>d._id!==id&&d._mode!==mode));
      // 3. Mark session log entry as Archived
      if(archivedCaseNum){
        setSessionLog(prev=>{
          const updated=prev.map(e=>{
            if((e.caseNum||"")===(archivedCaseNum||"")&&e.outcome==="Suspended"){
              return {...e,outcome:"Archived"};
            }
            return e;
          });
          if(typeof window!=="undefined") localStorage.setItem("ch_session_log",JSON.stringify(updated));
          return updated;
        });
      }
    }catch(e){
      console.error("[archiveDraft]",e);
    }
  };

  // ── Announcements ──
  const addAnnouncement=async(a)=>{
    const res=await fetch("/api/announcements",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)});
    const saved=await res.json();
    if(!res.ok)throw new Error(saved.error||"Failed to save announcement");
    setAnnouncements(p=>[saved,...p]);
  };
  const updateAnnouncement=async(id,updates)=>{
    const res=await fetch(`/api/announcements/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(updates)});
    const saved=await res.json();
    if(!res.ok)throw new Error(saved.error||"Failed to update announcement");
    setAnnouncements(a=>a.map(x=>x.id===id?saved:x));
  };
  const removeAnnouncement=async(id)=>{
    const res=await fetch(`/api/announcements/${id}`,{method:"DELETE"});
    if(!res.ok){const d=await res.json().catch(()=>({}));throw new Error(d.error||"Failed to delete");}
    setAnnouncements(a=>a.filter(x=>x.id!==id));
  };

  // ── Links ──
  const addLink=async(l)=>{
    try{
      const res=await fetch("/api/links",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...l,userEmail:user.email})});
      const saved=await res.json();
      setLinks(p=>[...p,saved]);
    }catch(e){console.error(e);setLinks(p=>[...p,{...l,id:Date.now()}]);}
  };
  const updateLink=async(id,updates)=>{
    try{
      const res=await fetch(`/api/links/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(updates)});
      const saved=await res.json();
      if(res.ok) setLinks(l=>l.map(x=>x.id===id?saved:x));
    }catch(e){console.error(e);}
  };
  const removeLink=async(id)=>{
    try{await fetch(`/api/links/${id}`,{method:"DELETE"});}catch(e){console.error(e);}
    setLinks(l=>l.filter(x=>x.id!==id));
  };

  // ── Requestors ──
  const addRequestor=async(name)=>{
    try{await fetch("/api/requestors",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name})});}catch(e){console.error(e);}
    setSpecialRequestors(s=>[...s,name]);
  };
  const removeRequestor=async(name)=>{
    try{await fetch(`/api/requestors/${encodeURIComponent(name)}`,{method:"DELETE"});}catch(e){console.error(e);}
    setSpecialRequestors(s=>s.filter(x=>x!==name));
  };

 const handleNav = (id) => {
  // 🚫 Only block build/prelive when a form is active on postlive
  // postlive itself must always be navigatable so users can return to their in-progress form
  const restricted = ["build", "prelive"].includes(id);

  if (restricted && formActive && page !== id) {
    return;
  }

  if (id === "postlive") {
    // If a form is active, restore the full form layout (form-mode class)
    // so the user sees their in-progress form, not the chooser.
    if (formActive) {
      setFormInFields(true);
    } else {
      setFormInFields(false);
    }
    setPage("postlive");
    if (typeof window !== "undefined") localStorage.setItem("ch_page", "postlive");
    return;
  }

  if (id === page) return;

  // ✅ allow ALL other pages (dashboard, history, etc.)
  // If a form is active, mark that the user is no longer viewing form fields
  // so the floating "Form In Progress" pill becomes visible on other pages.
  if (formActive) setFormInFields(false);
  setPage(id);
  if (typeof window !== "undefined") localStorage.setItem("ch_page", id);
};

  const logout=()=>{
    // If session is active, time out first
    if(timedIn) doTimeOut();
    localStorage.removeItem("ch_token");
    localStorage.removeItem("ch_refresh");
    localStorage.removeItem("ch_user");
    localStorage.removeItem("ch_form_active");
    localStorage.removeItem("ch_active_form_mode");
    localStorage.removeItem("ch_active_form_use_draft");
    localStorage.removeItem("ch_page");
    localStorage.removeItem("ch_timed_in");
    localStorage.removeItem("ch_timein");
    localStorage.removeItem("ch_break");
    localStorage.removeItem("ch_session_db_id");
    setUser(null);setAuthPage("login");setPage("dashboard");
    setAllCases([]);setDrafts([]);setArchivedDrafts([]);setLinks([]);setAnnouncements([]);setSpecialRequestors([]);
  };

  // ── Show nothing while checking stored session (prevents login flash) ──
  if(!sessionChecked){
    return (
      <>
        <style>{CSS}</style>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"var(--bg)",flexDirection:"column",gap:16}}>
          <div style={{animation:"float 1.5s ease-in-out infinite"}}><Icon name="loading" size={52} color="var(--accent)"/></div>
          <div style={{color:"var(--muted)",fontSize:14,fontFamily:"Poppins,sans-serif"}}>Loading CaseHub...</div>
        </div>
      </>
    );
  }

  // ── Auth screens ──
  if(!user){
    if(authPage==="signup") return <><style>{CSS}</style><SignupPage onSignup={(u)=>setUser(u)} goLogin={()=>setAuthPage("login")}/></>;
    return <><style>{CSS}</style><LoginPage onLogin={(u)=>setUser(u)} goSignup={()=>setAuthPage("signup")}/></>;
  }

  const coreNav=[
    {group:"Work"},
    {id:"dashboard",label:"Dashboard",icon:"dashboard"},
    {id:"postlive",label:"Post-Live Amends",icon:"postlive"},
    {id:"history",label:"Case History",icon:"history"},
    {id:"sessions",label:"Session Logs",icon:"history"},
    {id:"archives",label:"Archived Cases",icon:"archive"},
    {group:"Tools"},
    {id:"announcements",label:"Updates & Announcement",icon:"announce"},
    {id:"links",label:"Quick Links",icon:"links"},
    {id:"filenames",label:"File Name Generator",icon:"draft"},
    {id:"profile",label:"Profile & Settings",icon:"user"},
  ];

  const initials=(user.name||user.email||"U").split(" ").map(w=>w&&w[0]).filter(Boolean).join("").slice(0,2).toUpperCase();

  return (
    <>
      <style>{CSS}</style>
      <div className={cls("shell",sidebarIsCollapsed&&"sidebar-collapsed")}>
        <div className="sidebar-wrap" onMouseEnter={()=>setSidebarHoverOpen(true)} onMouseLeave={()=>setSidebarHoverOpen(false)}>
        <aside ref={sidebarElRef} className="chd-sidebar">
          <div className="chd-sb-logo">CH</div>

          {(() => {
            const groups=[]; let current=null;
            coreNav.forEach(item=>{
              if(item.group){ current={label:item.group, items:[]}; groups.push(current); }
              else current.items.push(item);
            });
            return groups.map((g,gi)=>(
              <div className="chd-sb-group" key={gi}>
                {g.items.map(n=>{
                  const isRestricted = ["build","prelive"].includes(n.id);
                  const isDisabled = isRestricted && formActive && page !== n.id;
                  return (
                    <button key={n.id} className={cls("chd-sb-item", page===n.id && "active")}
                      onClick={()=> !isDisabled && handleNav(n.id)} disabled={isDisabled}
                      style={{opacity:isDisabled?0.4:1,cursor:isDisabled?"not-allowed":"pointer"}}>
                      <Icon name={n.icon} size={22} color={page===n.id?"var(--text)":"var(--muted)"}/>
                      {n.id==="history"&&allCases.length>0&&<span className="chd-sb-badge">{allCases.length}</span>}
                      {n.id==="announcements"&&announcements.length>0&&<span className="chd-sb-badge">{announcements.length}</span>}
                      {n.id==="archives"&&archivedDrafts.length>0&&<span className="chd-sb-badge">{archivedDrafts.length}</span>}
                      {n.id==="postlive"&&formActive&&page!=="postlive"&&<span className="chd-sb-dot"/>}
                      <span className="chd-sb-tip">{n.label}</span>
                    </button>
                  );
                })}
              </div>
            ));
          })()}

          {links.length>0&&(
            <div className="chd-sb-group">
              <p className="chd-sb-grouplabel">Links</p>
              {links.map((l,i)=>{
                const ref=sidebarDragRef;
                return(
                  <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="chd-sb-item"
                    draggable
                    onDragStart={()=>{ref.current=i;}}
                    onDragOver={e=>e.preventDefault()}
                    onDrop={()=>{
                      const from=ref.current;
                      if(from==null||from===i)return;
                      const arr=[...links];const[m]=arr.splice(from,1);arr.splice(i,0,m);
                      setLinks(arr);ref.current=null;
                    }}
                    onDragEnd={()=>{ref.current=null;}}
                    style={{cursor:"grab"}}>
                    <span style={{fontSize:18}}>{l.icon}</span>
                    <span className="chd-sb-tip">{l.title}</span>
                  </a>
                );
              })}
            </div>
          )}

          <div className="chd-sb-bottom">
            {[{label:"15 min",icon:"coffee",mins:15},{label:"30 min",icon:"meditate",mins:30},{label:"Lunch (1hr)",icon:"lunch",mins:60}].map(({label,icon,mins})=>{
              const isActiveBreak = breakTimer&&breakTimer.mins===mins;
              const isOtherBreak = breakTimer&&breakTimer.mins!==mins;
              const disabledByForm = formInFields && !isActiveBreak;
              const disabled = isOtherBreak || disabledByForm;
              return (
                <button key={mins} className={cls("chd-sb-item",isActiveBreak&&"active")} disabled={disabled}
                  style={{opacity:disabled?.35:1,cursor:disabled?"not-allowed":"pointer"}}
                  onClick={()=>isActiveBreak?setCancelBreakConfirm(true):setBreakPending({label,mins})}>
                  <Icon name={icon} size={20} color={isActiveBreak?"var(--text)":"var(--muted)"}/>
                  <span className="chd-sb-tip">{label}{isActiveBreak?" (active)":""}</span>
                </button>
              );
            })}
            {timedIn&&!breakTimer&&(
              <button className="chd-sb-item" style={{opacity:formInFields?.35:1,cursor:formInFields?"not-allowed":"pointer"}} disabled={!!formInFields} onClick={()=>!formInFields&&setOpenHourPending(true)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span className="chd-sb-tip">Open Hour/Meeting</span>
              </button>
            )}
            <button className="chd-sb-item" onClick={()=>setLightMode(l=>!l)}>
              <span style={{fontSize:18}}>{lightMode?"🌙":"☀️"}</span>
              <span className="chd-sb-tip">{lightMode?"Dark Mode":"Light Mode"}</span>
            </button>
            <button className="chd-sb-item" onClick={dbStatus.recheck} title={dbStatus.latency?`${dbStatus.latency}ms`:undefined}>
              <div className={cls("db-dot", dbStatus.status)} style={{position:"static"}}/>
              <span className="chd-sb-tip">
                {dbStatus.status==="connected"&&`DB Connected${dbStatus.latency?` · ${dbStatus.latency}ms`:""}`}
                {dbStatus.status==="connecting"&&"Connecting…"}
                {dbStatus.status==="error"&&"DB Offline — tap to retry"}
              </span>
            </button>
            <button className="chd-sb-logout" onClick={()=>logout()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span className="chd-sb-tip">Log Out</span>
            </button>
          </div>
        </aside>
        </div>

        <main className={cls("main-area", formInFields&&page==="postlive"&&"form-mode")} style={{paddingBottom: formInFields&&page==="postlive" ? 0 : (breakTimer?80:32)}}>
          {dataLoading&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"80vh",flexDirection:"column",gap:16}}><div style={{animation:"float 1.5s ease-in-out infinite"}}><Icon name="loading" size={48} color="var(--accent)"/></div><div style={{color:"var(--muted)",fontSize:13,fontFamily:"Poppins,sans-serif"}}>Loading your workspace...</div></div>}

          {!dataLoading&&page==="dashboard"&&<Dashboard savedCases={allCases} setPage={setPage} specialRequestors={specialRequestors} addRequestor={addRequestor} removeRequestor={removeRequestor} user={user} announcements={announcements} archivedDrafts={archivedDrafts}/>}
          {!dataLoading&&page==="build"&&<div className="soon-wrap"><div className="soon-badge"><Icon name="casebox" size={80} color="var(--muted)"/></div><div className="soon-title">Build</div><div className="soon-sub">Coming soon — hang tight!</div></div>}
          {!dataLoading&&page==="prelive"&&<div className="soon-wrap"><div className="soon-badge"><Icon name="prelive" size={80} color="var(--muted)"/></div><div className="soon-title">Pre-Live Amends</div><div className="soon-sub">Coming soon — hang tight!</div></div>}
          {!dataLoading&&<div style={{display:page==="postlive"?"block":"none"}}>
            <PostLivePage onSaveCase={addCase} onUpdateCase={updateCase} onUpdateDraft={updateDraft} onFormActive={setFormActivePersist} onFormInFields={setFormInFields} onMinimise={()=>{setPage("postlive"); if(typeof window!=="undefined") localStorage.setItem("ch_page","postlive");}} allSavedCases={allCases} dbDrafts={drafts} onSaveDraft={saveDraft} onDeleteDraft={deleteDraft} onArchiveDraft={archiveDraft} user={user} onTimerEnd={playEndAlarm} specialRequestors={specialRequestors} alarmMins={alarmMins} qaAlarmMins={qaLimit} globalTimeIn={globalTimeIn} timedIn={timedIn} breakActive={!!breakTimer||openHourActive} breakTimer={breakTimer||null} openHourActive={openHourActive} onTimeIn={doTimeIn} onTimeOut={doTimeOut} onTimerReset={doTimerReset} sessionDbId={sessionDbId} sessionLog={sessionLog} addSessionLog={addSessionLog} setSessionLog={setSessionLog} closeWithOutcome={closeWithOutcome} closeSessionLog={closeSessionLog} clearSessionLog={clearSessionLog} onStartBreak={startBreak} onStartBreakFull={(label,mins)=>startBreak(label,mins,true)} onStopBreak={()=>setCancelBreakConfirm(true)} onStartOpenHour={startOpenHour} onStopOpenHour={()=>setCancelOpenHourConfirm(true)} resumeTick={resumeFormTick}/>
          </div>}
          {!dataLoading&&page==="history"&&<CaseHistory cases={allCases} onUpdate={updateCase} onDelete={deleteCase}/>}
          {!dataLoading&&page==="announcements"&&<AnnouncementsPage announcements={announcements} addAnnouncement={addAnnouncement} updateAnnouncement={updateAnnouncement} removeAnnouncement={removeAnnouncement} user={user}/>}
          {!dataLoading&&page==="links"&&<LinksPage links={links} setLinks={setLinks} addLink={addLink} updateLink={updateLink} removeLink={removeLink}/>}
          {!dataLoading&&page==="profile"&&<ProfilePage user={user} setUser={setUser} onLogout={logout} timerLimit={timerLimit} saveTimerLimit={saveTimerLimit} qaLimit={qaLimit} saveQaLimit={saveQaLimit} shiftStartTime={shiftStartTime} saveShiftStartTime={saveShiftStartTime} shiftStartWarnMins={shiftStartWarnMins} saveShiftStartWarnMins={saveShiftStartWarnMins} shiftEndTime={shiftEndTime} saveShiftEndTime={saveShiftEndTime} shiftWarnMins={shiftWarnMins} saveShiftWarnMins={saveShiftWarnMins} specialRequestors={specialRequestors} addRequestor={addRequestor} removeRequestor={removeRequestor}/>}
          {!dataLoading&&page==="sessions"&&<SessionLogPage user={user} refreshKey={sessionRefreshKey}/>}
          {!dataLoading&&page==="archives"&&<ArchivePage archivedDrafts={archivedDrafts} onDelete={async(id)=>{try{await fetch(`/api/archived-drafts/${id}`,{method:"DELETE"});setArchivedDrafts(a=>a.filter(x=>x._id!==id));}catch(e){console.error(e);}}}/>}
          {!dataLoading&&page==="filenames"&&<FileNameGeneratorPage/>}
        </main>
      </div>

      {/* ── Break Timer Bar — hidden when user is inside a form (TimerBar above already shows it) ── */}
      {breakTimer&&!formInFields&&(()=>{
        const pct=breakTimer.ended?100:Math.round((1-(breakTimer.secsLeft/(breakTimer.mins*60)))*100);
        const st=breakTimer.ended?"ended":breakTimer.warned?"warn":"";
        const mm=Math.floor((breakTimer.secsLeft||0)/60);
        const ss=String((breakTimer.secsLeft||0)%60).padStart(2,"0");
        return (
          <div className={cls("break-bar",st)}>
            <span style={{fontSize:18}}>{breakTimer.label.split(" ")[0]}</span>
            <div>
              <div className="break-label">{breakTimer.label.split(" ").slice(1).join(" ")}</div>
              <div style={{fontSize:10,color:"var(--muted)"}}>
                {breakTimer.ended?"✅ Break over!":breakTimer.warned?"⚠️ 5 min warning!":"On break"}
              </div>
            </div>
            <div className="break-time">{breakTimer.ended?"Done!":mm+":"+ss}</div>
            <div className="break-progress" style={{flex:1}}>
              <div className="break-progress-fill" style={{width:pct+"%"}}/>
            </div>
            <button className="break-stop" onClick={()=>setCancelBreakConfirm(true)}>✕ End</button>
          </div>
        );
      })()}

      {/* ── Break Modals (at root level so they overlay the full screen) ── */}
      {breakPending&&(<div className="modal-bg"><div className="modal">
        <div style={{marginBottom:14}}><Icon name="coffee" size={40} color="var(--accent)"/></div>
        <h3>Start {breakPending.label} Break?</h3>
        <p style={{color:"var(--muted)",fontSize:13,marginBottom:20}}>A break entry will be added to your session log.</p>
        <div className="modal-btns">
          <button className="btn btn-ghost" onClick={()=>setBreakPending(null)}>Cancel</button>
          <button className="btn btn-save" onClick={()=>{startBreak(breakPending.label,breakPending.mins);setBreakPending(null);}}>Start Break</button>
        </div>
      </div></div>)}
      {openHourPending&&(<div className="modal-bg"><div className="modal">
        <div style={{marginBottom:14,fontSize:36}}>🕐</div>
        <h3>Start Open Hour?</h3>
        <p style={{color:"var(--muted)",fontSize:13,marginBottom:20,lineHeight:1.6}}>The current ongoing entry will be renamed to <strong>Open Hour</strong> in your session log. Your session timer will reset when you end it.</p>
        <div className="modal-btns">
          <button className="btn btn-ghost" onClick={()=>setOpenHourPending(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={startOpenHour}>Start Open Hour</button>
        </div>
      </div></div>)}
      {cancelBreakConfirm&&(<div className="modal-bg"><div className="modal">
        <div style={{marginBottom:14}}><Icon name="close" size={40} color="var(--red)"/></div>
        <h3>End Break Early?</h3>
        <p style={{color:"var(--muted)",fontSize:13,marginBottom:20}}>Are you sure you want to end your break now?</p>
        <div className="modal-btns">
          <button className="btn btn-ghost" onClick={()=>setCancelBreakConfirm(false)}>Keep Break</button>
          <button className="btn btn-danger" onClick={stopBreak}>End Break</button>
        </div>
      </div></div>)}

      {cancelOpenHourConfirm&&(<div className="modal-bg"><div className="modal">
        <div style={{marginBottom:14}}><Icon name="close" size={40} color="var(--red)"/></div>
        <h3>End Open Hour?</h3>
        <p style={{color:"var(--muted)",fontSize:13,marginBottom:20}}>Your session timer will reset and a fresh Ongoing entry will start. Are you sure?</p>
        <div className="modal-btns">
          <button className="btn btn-ghost" onClick={()=>setCancelOpenHourConfirm(false)}>Keep Going</button>
          <button className="btn btn-danger" onClick={()=>{setCancelOpenHourConfirm(false);stopOpenHour();}}>End Open Hour</button>
        </div>
      </div></div>)}

      {/* ── Alarm Overlay — portal to document.body so it renders OUTSIDE all CSS
           stacking contexts and shows on EVERY page, tab, and screen ── */}
      {activeAlarm&&typeof document!=="undefined"&&createPortal(
        <div className="alarm-overlay">
          <div className="alarm-modal">
            <span className="alarm-icon">{<Icon name={activeAlarm==="case"?"timer":activeAlarm==="shift_start"?"clock":activeAlarm==="shift_end"?"bell":activeAlarm==="warn"?"timer":"bell"} size={56} color="var(--accent)"/>}</span>
            <div className="alarm-title">
              {activeAlarm==="warn"?"5 Minutes Left!"
               :activeAlarm==="case"?`Combined Tracker: ${timerLimit} min reached!`
               :activeAlarm==="case_qa"?`QA Checklist: ${qaLimit} min reached!`
               :activeAlarm==="shift_start"?"Shift Starting Soon!"
               :activeAlarm==="shift_end"?"Shift Ending Soon!"
               :"Break Over!"}
            </div>
            <div className="alarm-sub">
              {activeAlarm==="warn"?"Your break is almost up — wrap it up!"
               :activeAlarm==="case"?`You've been on this case for ${timerLimit} minutes. Check if it needs to escalate or wrap up.`
               :activeAlarm==="case_qa"?`QA Checklist has been running for ${qaLimit} minutes. Time to review and finalize.`
               :activeAlarm==="shift_start"?`Your shift starts in ${shiftStartWarnMins} minute${shiftStartWarnMins!==1?"s":""} — get ready to clock in!`
               :activeAlarm==="shift_end"?`Your shift ends in ${shiftWarnMins} minute${shiftWarnMins!==1?"s":""} — wrap up your current case!`
               :"Your break has ended. Time to get back to work!"}
            </div>
            <div className="alarm-btns">
              {(activeAlarm==="case"||activeAlarm==="case_qa"||activeAlarm==="shift_start"||activeAlarm==="shift_end")&&<button className="alarm-snooze" onClick={snoozeAlarm}><Icon name="snooze" size={14} style={{marginRight:6}}/>Snooze 5 min</button>}
              <button className="alarm-dismiss" onClick={dismissAlarm}>✅ {activeAlarm==="warn"?"Got it!":"I'm Aware"}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Nav no longer shows discard warning — form state preserved on page switch */}

      {/* ── Open Hour bar ── */}
      {openHourActive&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:1200,background:"linear-gradient(90deg,#7c3aed,#6d28d9)",padding:"10px 24px",display:"flex",alignItems:"center",gap:16,boxShadow:"0 -4px 24px rgba(124,58,237,.4)"}}>
          <div style={{fontSize:22,flexShrink:0}}>🕐</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>Open Hour Active</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.75)"}}>Helping a customer outside normal amends</div>
          </div>
          <button onClick={()=>setCancelOpenHourConfirm(true)} style={{padding:"8px 18px",background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:8,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Poppins',sans-serif",backdropFilter:"blur(4px)"}}>End Open Hour</button>
        </div>
      )}

      {/* ── Floating in-progress pill — shows everywhere except inside form fields ── */}
      <div className="form-progress-pill"
        onClick={resumeInProgressForm}
        style={{
          opacity:formActive&&!formInFields?1:0,
          pointerEvents:formActive&&!formInFields?"auto":"none",
          transform:formActive&&!formInFields?"translateY(0)":"translateY(16px)",
          transition:"opacity .25s, transform .25s",
        }}>
        <div className="form-progress-pill-dot"/>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:2}}>
          <div style={{fontSize:12,fontWeight:700,lineHeight:1}}>Form In Progress</div>
          <div style={{fontSize:10,opacity:.85,lineHeight:1}}>Click to resume</div>
        </div>
        <Icon name="back" size={14} color="#fff" style={{transform:"rotate(180deg)",marginLeft:2,flexShrink:0}}/>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION LOG PAGE
// ─────────────────────────────────────────────────────────────────────────────
function SessionLogPage({ user, refreshKey=0 }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [openDay, setOpenDay] = useState(null);
  const [deleteDay, setDeleteDay] = useState(null); // {dateKey, sessionIds}
  const [toast, showToast] = useToast();

  const load = async (filterDate) => {
    setLoading(true);
    try {
      const q = filterDate
        ? `?email=${encodeURIComponent(user.email)}&date=${filterDate}`
        : `?email=${encodeURIComponent(user.email)}`;
      const res = await fetch(`/api/sessions${q}`);
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch { setSessions([]); }
    setLoading(false);
  };

  useEffect(() => { load(date); }, [date, refreshKey]);

  const fmtTime = (ts) => ts ? new Date(ts).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) : '—';
  const fmtDur = (start, end) => {
    if (!start) return '—';
    const ms = (end ? new Date(end) : new Date()) - new Date(start);
    const m = Math.floor(ms/60000), h = Math.floor(m/60);
    return h > 0 ? `${h}h ${m%60}m` : `${m}m`;
  };
  const fmtDayLabel = (d) => new Date(d).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});

  // Figma groups rows by calendar day rather than by individual time-in/out session
  const dayGroups = (() => {
    const map = {};
    sessions.forEach(s => {
      if (!s.time_in) return;
      const dateKey = new Date(s.time_in).toDateString();
      if (!map[dateKey]) map[dateKey] = { dateKey, sessions: [], firstIn: s.time_in, lastOut: s.time_out };
      map[dateKey].sessions.push(s);
      if (new Date(s.time_in) < new Date(map[dateKey].firstIn)) map[dateKey].firstIn = s.time_in;
      if (!map[dateKey].lastOut || (s.time_out && new Date(s.time_out) > new Date(map[dateKey].lastOut))) map[dateKey].lastOut = s.time_out;
    });
    return Object.values(map)
      .map(g => ({ ...g, cases: g.sessions.flatMap(s => s.session_cases || []) }))
      .filter(g => !search || g.cases.some(c => (c.case_num||"").toLowerCase().includes(search.toLowerCase())))
      .sort((a,b)=> new Date(b.firstIn) - new Date(a.firstIn));
  })();

  const modeBadgeColor = mode => mode==="inbound" ? "var(--inbound,#8a38f5)" : "var(--site-comment,#4760ff)";
  const modeLabel = mode => mode==="inbound" ? "Inbound Email" : "Site Comment";

  const confirmDeleteDay = async () => {
    if (!deleteDay) return;
    try {
      await Promise.all(deleteDay.sessionIds.map(id => fetch(`/api/sessions?id=${id}`,{method:'DELETE'})));
      setSessions(s => s.filter(x => !deleteDay.sessionIds.includes(x.id)));
      showToast("Session deleted","success");
    } catch { showToast("Failed to delete","error"); }
    setDeleteDay(null);
  };

  return (
    <div className="chd-dash">
      <div className="chd-page-head">
        <div><p className="chd-h4">Session Logs</p><p className="chd-p-muted">Check your Time History</p></div>
      </div>
      <div className="chd-divider"/>

      <div className="chd-search-row">
        <input className="chd-search-inp" placeholder="E.G Case # / Account #" value={search} onChange={e=>setSearch(e.target.value)}/>
        <input type="date" className="chd-date-inp" value={date} onChange={e=>setDate(e.target.value)}/>
      </div>

      {loading && <div className="chd-empty-box">Loading sessions…</div>}
      {!loading && dayGroups.length===0 && <div className="chd-empty-box">No sessions found for this date.</div>}

      {dayGroups.map(g => {
        const isOpen = openDay === g.dateKey;
        return (
          <div className="chd-accordion" key={g.dateKey}>
            <div className="chd-accordion-head" onClick={()=>setOpenDay(isOpen?null:g.dateKey)}>
              <div>
                <div className="chd-title-row">
                  <p className="chd-h6">{fmtDayLabel(g.firstIn)}</p>
                  <span className="chd-badge" style={{background:"var(--text)"}}>{g.cases.length} Case{g.cases.length!==1?"s":""}</span>
                </div>
                <p className="chd-p-muted"><b>Total:</b> {fmtDur(g.firstIn,g.lastOut)} | {fmtTime(g.firstIn)} - {fmtTime(g.lastOut)}</p>
              </div>
              <div className="chd-row-actions" onClick={e=>e.stopPropagation()}>
                <button className="chd-btn-secondary" style={{borderColor:"var(--red)",color:"var(--red)"}}
                  onClick={()=>setDeleteDay({dateKey:g.dateKey, sessionIds:g.sessions.map(s=>s.id)})}>
                  Delete Session
                </button>
              </div>
            </div>
            {isOpen && (
              <div className="chd-accordion-body">
                {g.cases.length===0 ? (
                  <div className="chd-empty-box">No cases logged this day.</div>
                ) : (
                  <div style={{overflowX:"auto"}}>
                    <table className="chd-table">
                      <thead><tr>{["Case Type","Case Number","Combine Tracker","Status"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                      <tbody>
                        {g.cases.map((c,ci)=>(
                          <tr key={c.id||ci}>
                            <td><span className="chd-badge" style={{background:modeBadgeColor(c.case_type)}}>{modeLabel(c.case_type)}</span></td>
                            <td>{c.case_num||"—"}</td>
                            <td>{fmtDur(c.started_at,c.ended_at)}</td>
                            <td style={{fontWeight:700,color:c.ended_at?"var(--green)":"var(--red)"}}>{c.ended_at?"Completed":"Suspended"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {(g.sessions.flatMap(s=>s.session_breaks||[])).length>0 && (
                  <div style={{marginTop:14}}>
                    <p className="chd-label" style={{opacity:.6,marginBottom:8}}>Breaks</p>
                    {g.sessions.flatMap(s=>s.session_breaks||[]).map((b,i)=>(
                      <div key={b.id||i} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 12px",background:"var(--card2)",borderRadius:8,marginBottom:6}}>
                        <span style={{flex:1}} className="chd-p">{b.break_type}</span>
                        <span className="chd-p-muted">{fmtTime(b.started_at)} → {fmtTime(b.ended_at)}</span>
                        <span className="chd-p-muted">{fmtDur(b.started_at,b.ended_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {deleteDay&&(
        <div className="chd-modal-bg">
          <div className="chd-modal-card">
            <p className="chd-h6">Delete this session?</p>
            <p className="chd-p-muted">All time-in/out records for this day will be permanently deleted.</p>
            <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:14}}>
              <button className="chd-btn-secondary" onClick={()=>setDeleteDay(null)}>Cancel</button>
              <button className="chd-btn-primary" style={{background:"var(--red)",borderColor:"var(--red)"}} onClick={confirmDeleteDay}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE NAME GENERATOR PAGE
// ─────────────────────────────────────────────────────────────────────────────
// ── File Name Generator: shared context so CopyCell/Section/DynList are stable top-level components ──
const FngCtx = createContext({});

function CopyCell({val,id}){
  const {copy,copied}=useContext(FngCtx);
  const done=copied===id;
  return (
    <div
      onClick={()=>val&&copy(val,id)}
      title={val?"Click to copy":""}
      style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        gap:8,padding:'6px 14px',marginBottom:4,minHeight:34,borderRadius:7,
        background: done?'rgba(16,185,129,.12)':'var(--entry-bg)',
        border: done?'1px solid var(--green)':'1px solid var(--border)',
        cursor: val?'pointer':'default',
        transition:'background .15s,border .15s',
        userSelect:'none',
      }}
      onMouseEnter={e=>{if(val&&!done){e.currentTarget.style.background='var(--card2)';e.currentTarget.style.borderColor='var(--accent)';}}}
      onMouseLeave={e=>{if(!done){e.currentTarget.style.background='var(--entry-bg)';e.currentTarget.style.borderColor='var(--border)';}}}
    >
      <span style={{flex:1,fontSize:12,fontFamily:'monospace',color:val?'var(--text)':'var(--muted)',wordBreak:'break-all'}}>{val||'—'}</span>
      {val&&<span style={{fontSize:10,fontWeight:700,flexShrink:0,color:done?'var(--green)':'var(--muted)',opacity:done?1:.5,transition:'.15s'}}>{done?'✓ Copied':'⌘ Copy'}</span>}
    </div>
  );
}

function FngSection({title,vals,sk,children}){
  const {copyAll,copiedAll}=useContext(FngCtx);
  return (
    <div style={{marginBottom:20}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8,borderBottom:'1px solid var(--border)',paddingBottom:6}}>
        <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',color:'var(--muted)',fontFamily:"'Poppins',sans-serif"}}>{title}</div>
        {(vals||[]).filter(Boolean).length>0&&<button onClick={()=>copyAll(vals,sk)} style={{padding:'3px 10px',fontSize:10,background:copiedAll===sk?'var(--green)':'var(--card2)',color:copiedAll===sk?'#fff':'var(--muted)',border:'1px solid var(--border)',cursor:'pointer',fontWeight:700,borderRadius:6,transition:'.15s',flexShrink:0}}>{copiedAll===sk?'✓ Copied All':'Copy All'}</button>}
      </div>
      {children}
    </div>
  );
}

function DynList({field,placeholder}){
  const {form,setItem,removeItem,addItem}=useContext(FngCtx);
  return (
    <div>
      {form[field].map((val,i)=>(
        <div key={i} style={{display:'flex',gap:6,marginBottom:6,alignItems:'center'}}>
          <input className="inp" style={{fontSize:12,flex:1}} placeholder={`${placeholder} ${i+1}`} value={val} onChange={e=>setItem(field,i,e.target.value)}/>
          <button onClick={()=>removeItem(field,i)} style={{background:'var(--btn-cancel-bg)',border:'1px solid var(--btn-cancel-border)',color:'var(--btn-cancel-text)',borderRadius:6,padding:'5px 9px',fontSize:12,cursor:'pointer',flexShrink:0}} title="Remove">✕</button>
        </div>
      ))}
      <button onClick={()=>addItem(field)} style={{background:'none',border:'2px dashed var(--border)',borderRadius:7,color:'var(--muted)',padding:'7px 14px',fontSize:12,fontWeight:600,cursor:'pointer',width:'100%',transition:'.15s',fontFamily:"'Poppins',sans-serif"}} onMouseOver={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)';}} onMouseOut={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--muted)';}}>+ Add {placeholder}</button>
    </div>
  );
}

// ── Sidebar shift timer — proper component so hooks are valid ──
function SidebarShiftTimer({globalTimeIn, shiftEndTime}){
  const [elapsed,setElapsed]=useState(Math.floor((Date.now()-globalTimeIn)/1000));
  useEffect(()=>{
    const t=setInterval(()=>setElapsed(Math.floor((Date.now()-globalTimeIn)/1000)),1000);
    return()=>clearInterval(t);
  },[globalTimeIn]);
  const h=Math.floor(elapsed/3600);
  const m=Math.floor((elapsed%3600)/60);
  const s=elapsed%60;
  const startLabel=new Date(globalTimeIn).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
  const endLabel=shiftEndTime?(()=>{
    const [hh,mm]=shiftEndTime.split(":").map(Number);
    const end=new Date();
    end.setHours(hh,mm,0,0);
    return end.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
  })():null;
  const pct=shiftEndTime?(()=>{
    const [hh,mm]=shiftEndTime.split(":").map(Number);
    const end=new Date();end.setHours(hh,mm,0,0);
    if(end<=new Date()) end.setDate(end.getDate()+1);
    const total=end.getTime()-globalTimeIn;
    const spent=Date.now()-globalTimeIn;
    return Math.min(100,Math.round((spent/total)*100));
  })():null;
  const isWarn=pct!==null&&pct>=80;
  return (
    <div className="sidebar-shift-timer" style={{borderColor:isWarn?"var(--amber)":"var(--border)"}}>
      <div className="sidebar-shift-row">
        <span className="sidebar-shift-label" style={{color:isWarn?"var(--amber)":"var(--muted)"}}>
          {isWarn?"⚠ Shift ending soon":"⏱ Shift Time"}
        </span>
        <span className="sidebar-shift-meta">
          <span>{startLabel}</span>
          {endLabel&&<><span>→</span><span>{endLabel}</span></>}
        </span>
      </div>
      <div className="sidebar-shift-elapsed" style={{color:isWarn?"var(--amber)":"var(--green)",marginBottom:pct!==null?7:0}}>
        {String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}
      </div>
      {pct!==null&&(
        <div style={{height:3,background:"var(--border)",borderRadius:99,overflow:"hidden",marginTop:2}}>
          <div style={{height:"100%",width:`${pct}%`,background:isWarn?"var(--amber)":"var(--green)",borderRadius:99,transition:"width 1s linear"}}/>
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// ArchivePage — view and permanently delete archived suspended cases
// ─────────────────────────────────────────────────────────────────────────────
function ArchivePage({ archivedDrafts=[], onDelete }) {
  const [expandedId,setExpandedId]=useState(null);
  const [confirmDelete,setConfirmDelete]=useState(null);

  const modeBadgeColor = mode => mode==="inbound" ? "var(--inbound,#8a38f5)" : "var(--site-comment,#4760ff)";
  const modeLabel = mode => mode==="inbound" ? "Inbound Email" : "Site Comment";

  return (
    <div className="chd-dash">
      <div className="chd-page-head">
        <div><p className="chd-h4">Archived Cases</p><p className="chd-p-muted">{archivedDrafts.length} archived case{archivedDrafts.length!==1?"s":""} — view-only</p></div>
      </div>
      <div className="chd-divider"/>

      {archivedDrafts.length===0 ? (
        <div className="chd-empty-box">No archived cases yet. When you archive a suspended case it will appear here.</div>
      ) : (
        archivedDrafts.map((d,i)=>{
          const isOpen=expandedId===d._id;
          const nums=(Array.isArray(d._bundledWith)?d._bundledWith:(d._bundledWith?[d._bundledWith]:[])).filter(Boolean);
          return (
            <div className="chd-accordion" key={d._id||i}>
              <div className="chd-accordion-head" onClick={()=>setExpandedId(isOpen?null:d._id)}>
                <div>
                  <div className="chd-title-row">
                    <p className="chd-h6">{d.caseNum||"—"} - {d.accountNum||"—"}</p>
                    <span className="chd-badge" style={{background:modeBadgeColor(d._mode)}}>{modeLabel(d._mode)}</span>
                    {nums.length>0&&<span className="chd-badge" style={{background:"var(--amber)"}}>w/ #{nums.join(", #")}</span>}
                  </div>
                  <p className="chd-p-muted">{d.amendType||"No amend type"} · Archived {d.archivedAt}</p>
                </div>
                <div className="chd-row-actions" onClick={e=>e.stopPropagation()}>
                  <button className="chd-btn-secondary" style={{borderColor:"var(--red)",color:"var(--red)"}} onClick={()=>setConfirmDelete(d._id)}>Delete Forever</button>
                </div>
              </div>
              {isOpen&&(
                <div className="chd-accordion-body">
                  <div className="chd-info-card" style={{marginTop:10}}>
                    {(d.entries||[]).filter(e=>e.note||e.number||e.clarification).length>0 ? (
                      (d.entries||[]).filter(e=>e.note||e.number||e.clarification).map((e,ei)=>(
                        <p key={ei} className="chd-p-muted" style={{whiteSpace:"pre-wrap"}}>{e.note}{e.clarification?` — ${e.clarification}`:""}</p>
                      ))
                    ) : <p className="chd-p-muted">No entries recorded.</p>}
                    {d.emailAddress&&<p className="chd-p-muted">Email: {d.emailAddress}</p>}
                    {d.trackerChecklistLink&&(
                      <a href={d.trackerChecklistLink} target="_blank" rel="noreferrer" className="chd-p" style={{color:"var(--site-comment,#4760ff)"}}>Tracker Link</a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {confirmDelete&&(
        <div className="chd-modal-bg">
          <div className="chd-modal-card">
            <p className="chd-h6">Permanently Delete?</p>
            <p className="chd-p-muted">This archived case will be permanently deleted and cannot be recovered.</p>
            <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:14}}>
              <button className="chd-btn-secondary" onClick={()=>setConfirmDelete(null)}>Cancel</button>
              <button className="chd-btn-primary" style={{background:"var(--red)",borderColor:"var(--red)"}} onClick={()=>{onDelete&&onDelete(confirmDelete);setConfirmDelete(null);}}>Yes, Delete Forever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FileNameGeneratorPage({ onFill=null, activeTabData=null }) {
  const san = (s) => (s||'').toLowerCase().replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-');
  const nn  = (i) => String(i+1).padStart(2,'0');

  const EMPTY = { bizFilename:'', bizAlt:'', accountNum:'', pages:[''], badges:[''], teamMembers:[''], menuNames:[''], pdfNames:[''] };

  const DEFAULT_FORMAT = {
    logo:'{nob}-logo', favicon:'{nob}-favicon', blogLogo:'{nob}-blog-logo',
    asst:'Asst_{nob}_logo', introWhy:'{nob}-intro-why-choose',
    recentReviews:'{nob}-recent-reviews', videoSplash:'{nob}-video',
    videoSplashPage:'{nob}-video-{page}-{nn}', waveZip:'{nob}-wave',
    waveAssist:'{nob}-wave-assistant', heroCust:'{nob}-hero-{page}',
    heroBi:'{nob}-hero-{page}', heroSlider:'{nob}-hero-slider-{nn}',
    galleryNon:'{nob}-gallery-{nn}', gallerySpec:'{nob}-{page}-gallery-{nn}',
    before:'{nob}-before-{nn}', after:'{nob}-after-{nn}',
    badge:'{nob}-badge-{badge}', team:'{nob}-{member}',
    menu:'{nob}-menu-{nn}', menuNamed:'{nob}-menu-{menu}-{nn}',
    pageContent:'{nob}-{page}-{nn}', callout:'{nob}-callout-{page}-{nn}',
    pdf:'{nob}-{pdf}-pdf',
  };

  const [form,setForm]             = useState(()=>{
    if(typeof window==="undefined") return EMPTY;
    try{
      // Always start from the persisted FNG form (user's own saved values)
      const saved    =localStorage.getItem("ch_fng_form");
      const base     =saved?{...EMPTY,...JSON.parse(saved)}:EMPTY;
      // Check the active/last-saved case
      const active   =localStorage.getItem("ch_minimised_form");
      const lastSaved=localStorage.getItem("ch_last_saved_case");
      const src=active||lastSaved;
      if(src){
        const fd=JSON.parse(src);
        const biz=fd.businessName||"";
        const acc=fd.accountNum||"";
        const bizFull=(fd.businessName||"")+(fd.businessSuffix?' '+fd.businessSuffix:'');
        // Check if active case differs from what was last autofilled
        const lastRaw=localStorage.getItem("ch_fng_last_source");
        const last=lastRaw?JSON.parse(lastRaw):null;
        const sourceChanged=!last||last.businessName!==biz||last.accountNum!==acc;
        if(sourceChanged){
          // Active case changed — update fields that the user hasn't manually changed
          const prevFilled=last||{bizFilename:"",bizAlt:"",accountNum:""};
          return {
            ...base,
            bizFilename: base.bizFilename!==prevFilled.bizFilename ? base.bizFilename : biz,
            bizAlt:      base.bizAlt!==prevFilled.bizAlt           ? base.bizAlt      : (bizFull||biz),
            accountNum:  base.accountNum!==prevFilled.accountNum   ? base.accountNum  : acc,
          };
        }
      }
      return base;
    }catch{ return EMPTY; }
  });
  // ── When opened from the form header, apply the current tab's data immediately.
  //    activeTabData = { businessName, businessSuffix, accountNum, caseNum } from the active tab.
  //    This overwrites only the auto-fillable fields, never the user's manually-typed values.
  const activeTabDataRef = useRef(null);
  useEffect(()=>{
    if(!activeTabData) return;
    const {businessName="",businessSuffix="",accountNum=""} = activeTabData;
    const bizFull=businessName+(businessSuffix?' '+businessSuffix:'');
    const prev=activeTabDataRef.current;
    // Only apply if the source actually changed (different case/business)
    if(prev&&prev.businessName===businessName&&prev.accountNum===accountNum) return;
    activeTabDataRef.current=activeTabData;
    setForm(f=>({
      ...f,
      bizFilename: businessName||f.bizFilename,
      bizAlt:      (bizFull||businessName)||f.bizAlt,
      accountNum:  accountNum||f.accountNum,
    }));
  },[activeTabData]);

  const [tab,setTab]               = useState('logo');
  const [copied,setCopied]         = useState(null);
  const [copiedAll,setCopiedAll]   = useState(null);
  const [editingFormat,setEditingFormat] = useState(false);
  const [format,setFormat]         = useState(()=>{
    if(typeof window==="undefined") return DEFAULT_FORMAT;
    try{
      const v=localStorage.getItem("ch_fng_format");
      const saved=v?{...DEFAULT_FORMAT,...JSON.parse(v)}:DEFAULT_FORMAT;
      // Migrate old hero formats that used {nn} to new {page} format
      let migrated=false;
      const migrateHero=(key,defaultVal)=>{
        if(saved[key]&&saved[key].includes('{nn}')&&!saved[key].includes('{page}')){
          saved[key]=defaultVal; migrated=true;
        }
      };
      migrateHero('heroCust',DEFAULT_FORMAT.heroCust);
      migrateHero('heroBi',DEFAULT_FORMAT.heroBi);
      if(migrated) localStorage.setItem("ch_fng_format",JSON.stringify(saved));
      return saved;
    }catch{ return DEFAULT_FORMAT; }
  });
  const [draftFmt,setDraftFmt]     = useState(DEFAULT_FORMAT);
  const [toast,showToast]          = useToast();

  // Persist form to localStorage so it survives page navigation
  useEffect(()=>{
    if(typeof window==="undefined") return;
    localStorage.setItem("ch_fng_form",JSON.stringify(form));
  },[form]);

  // Tracks the values WE last auto-filled, so we can tell whether the user has since
  // customized a field manually (in which case we must not overwrite it on the next sync).
  const lastAutoFillRef = useRef({ bizFilename:null, bizAlt:null, accountNum:null });

  // Auto-fill from the active tab's live data exposed via onFill prop (passed from PostLivePage),
  // falling back to localStorage for context when used standalone (e.g. full-page FNG).
  // Only updates a field when it's empty OR still equals what we last auto-filled,
  // so manual edits in the generator are never overwritten by form changes.
  useEffect(()=>{
    if(typeof window==="undefined") return;
    const applyFill=(biz,acc,bizFull)=>{
      const newBizFn  = biz||"";
      const newBizAlt = bizFull||biz||"";
      const newAcc    = acc||"";
      if(!newBizFn && !newBizAlt && !newAcc) return;
      const last=lastAutoFillRef.current;
      setForm(f=>{
        const next={...f};
        if(newBizFn && (f.bizFilename===''||f.bizFilename===last.bizFilename)) next.bizFilename=newBizFn;
        if(newBizAlt && (f.bizAlt===''||f.bizAlt===last.bizAlt)) next.bizAlt=newBizAlt;
        if(newAcc && (f.accountNum===''||f.accountNum===last.accountNum)) next.accountNum=newAcc;
        return next;
      });
      lastAutoFillRef.current={bizFilename:newBizFn,bizAlt:newBizAlt,accountNum:newAcc};
    };
    const sync=()=>{
      // Try live form data from localStorage (written every keystroke by the active PostLiveForm)
      const activeSrc = localStorage.getItem("ch_minimised_form");
      const lastSaved = localStorage.getItem("ch_last_saved_case");
      const src = activeSrc || lastSaved;
      if(!src) return;
      try{
        const fd = JSON.parse(src);
        const biz    = fd.businessName||"";
        const acc    = fd.accountNum||"";
        const bizFull= biz+(fd.businessSuffix?' '+fd.businessSuffix:'');
        applyFill(biz, acc, bizFull);
      }catch{}
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("ch_case_saved", sync);
    return ()=>{
      window.removeEventListener("storage", sync);
      window.removeEventListener("ch_case_saved", sync);
    };
  },[]);

  const nob = san(form.bizFilename);
  const nobFull = san(form.bizAlt) || nob; // bizAlt = NOB + suffix e.g. 'fire-force-llc'

  // Default fallbacks for every token — so any token used in any format always resolves
  const defaultVars = {
    page:   san(form.pages.filter(Boolean)[0]||''),
    badge:  san(form.badges.filter(Boolean)[0]||''),
    member: san(form.teamMembers.filter(Boolean)[0]||''),
    menu:   san(form.menuNames.filter(Boolean)[0]||''),
    pdf:    san(form.pdfNames.filter(Boolean)[0]||''),
    nn:     '01',
  };

  const applyFmt = (tpl,vars={}) => {
    if(!nob) return '';
    // Merge: explicit vars override defaults
    const resolved = {...defaultVars, ...vars};
    let s=tpl;
    s=s.replace(/{nob}/g, nob);
    s=s.replace(/{nobfull}/g, nobFull||nob);
    Object.entries(resolved).forEach(([k,v])=>{ s=s.replace(new RegExp(`\{${k}\}`,'g'), san(v)||k); });
    return s;
  };

  const copy=(val,key)=>{ if(!val)return; navigator.clipboard?.writeText(val).then(()=>{setCopied(key);setTimeout(()=>setCopied(null),1800);}); };
  const copyAll=(vals,key)=>{ const t=vals.filter(Boolean).join('\n'); if(!t)return; navigator.clipboard?.writeText(t).then(()=>{setCopiedAll(key);setTimeout(()=>setCopiedAll(null),2000);showToast('Copied all!','success');}); };

  const addItem  = (f) => setForm(x=>({...x,[f]:[...x[f],'']}));
  const removeItem=(f,i)=>setForm(x=>{const a=[...x[f]];a.splice(i,1);return {...x,[f]:a.length?a:['']};});
  const setItem  = (f,i,v)=>setForm(x=>{const a=[...x[f]];a[i]=v;return {...x,[f]:a};});

  const handleXlsx = async (file) => {
    try {
      if(!window.XLSX){ await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);}); }
      const ab=await file.arrayBuffer();
      const wb=window.XLSX.read(ab,{type:'array'});
      const ws=wb.Sheets['INPUTS']||wb.Sheets[wb.SheetNames[0]];
      const rows=window.XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      if(!rows.length){showToast('Empty sheet','error');return;}
      const bizFilename=(rows[0]?.[1]||'').toString().trim();
      const bizAlt=(rows[0]?.[3]||'').toString().trim();
      const accountNum=(rows[1]?.[1]||'').toString().trim();
      const headers=(rows[3]||[]).map(h=>(h||'').toString().toLowerCase().trim());
      const col=(names)=>{for(const n of names){const i=headers.indexOf(n);if(i>=0)return i;}return -1;};
      const getCol=(c)=>c<0?[]:rows.slice(4).map(r=>(r[c]||'').toString().trim()).filter(Boolean);
      const pageC=col(['page names','pages','page']);
      const badgeC=col(['badge names','badges','badge']);
      const teamC=col(['team member','team members','team','staff']);
      const menuC=col(['menu names','menus','menu']);
      const pdfC=col(['pdf','pdf names','pdfs']);
      setForm({bizFilename,bizAlt,accountNum,
        pages:getCol(pageC).length?getCol(pageC):[''],
        badges:getCol(badgeC).length?getCol(badgeC):[''],
        teamMembers:getCol(teamC).length?getCol(teamC):[''],
        menuNames:getCol(menuC).length?getCol(menuC):[''],
        pdfNames:getCol(pdfC).length?getCol(pdfC):[''],
      });
      showToast('Imported ✅','success');
    }catch(e){console.error(e);showToast('Failed to read file','error');}
  };

  // CopyCell, Section, DynList are defined outside this component to keep stable refs (prevents input focus loss on keystroke)

  const tabs=[
    {id:'logo',label:'Logo & Misc'},{id:'hero',label:'Hero'},
    {id:'gallery',label:'Gallery'},{id:'beforeafter',label:'Before/After'},
    {id:'video',label:'Video Splash'},{id:'badges',label:'Badges'},
    {id:'team',label:'Team'},{id:'menu',label:'Menu'},
    {id:'content',label:'Content Image'},{id:'callout',label:'Callout Icon'},
    {id:'pdf',label:'PDF'},{id:'slider',label:'Hero Slider'},
  ];

  const N=40;
  const logoVals=[applyFmt(format.logo),applyFmt(format.favicon),applyFmt(format.blogLogo),applyFmt(format.asst),applyFmt(format.introWhy),applyFmt(format.recentReviews),applyFmt(format.videoSplash),applyFmt(format.waveZip),applyFmt(format.waveAssist)];
  const heroPages=form.pages.filter(Boolean);
  const heroCustVals=heroPages.length ? heroPages.map(p=>applyFmt(format.heroCust,{page:san(p)})) : [applyFmt(format.heroCust,{page:'home'})];
  const heroBiVals=heroPages.length ? heroPages.map(p=>applyFmt(format.heroBi,{page:san(p)})) : [applyFmt(format.heroBi,{page:'home'})];
  const galNonVals=Array.from({length:N},(_,i)=>applyFmt(format.galleryNon,{nn:nn(i)}));
  const galSpecVals=form.pages.filter(Boolean).flatMap(p=>Array.from({length:20},(_,i)=>applyFmt(format.gallerySpec,{page:san(p),nn:nn(i)})));
  const baVals=Array.from({length:N},(_,i)=>[applyFmt(format.before,{nn:nn(i)}),applyFmt(format.after,{nn:nn(i)})]).flat();
  const videoMultiVals=form.pages.filter(Boolean).flatMap(p=>Array.from({length:20},(_,i)=>applyFmt(format.videoSplashPage,{page:san(p),nn:nn(i)})));
  const badgeVals=form.badges.filter(Boolean).map(b=>applyFmt(format.badge,{badge:san(b)}));
  const teamVals=form.teamMembers.filter(Boolean).map(m=>applyFmt(format.team,{member:san(m)}));
  const menuNumVals=Array.from({length:10},(_,i)=>applyFmt(format.menu,{nn:nn(i)}));
  const menuNamedVals=form.menuNames.filter(Boolean).flatMap(m=>Array.from({length:10},(_,i)=>applyFmt(format.menuNamed,{menu:san(m),nn:nn(i)})));
  const contentVals=form.pages.filter(Boolean).flatMap(p=>Array.from({length:20},(_,i)=>applyFmt(format.pageContent,{page:san(p),nn:nn(i)})));
  const calloutVals=form.pages.filter(Boolean).flatMap(p=>Array.from({length:10},(_,i)=>applyFmt(format.callout,{page:san(p),nn:nn(i)})));
  const pdfVals=form.pdfNames.filter(Boolean).map(p=>applyFmt(format.pdf,{pdf:san(p)}));
  const sliderVals=Array.from({length:20},(_,i)=>applyFmt(format.heroSlider,{nn:nn(i)}));

  return (
    <FngCtx.Provider value={{copy,copied,copyAll,copiedAll,form,setItem,removeItem,addItem}}>
    <div>
      <div className="chd-page-head">
        <div>
          <p className="chd-h4">File Name Generator</p>
          <p className="chd-p-muted">Unlimited inputs · Copy All per section · Import from Excel</p>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <label className="chd-btn-secondary" style={{display:'inline-flex',alignItems:'center',gap:7,cursor:'pointer'}}>
            Import Excel<input type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}} onChange={e=>{if(e.target.files[0])handleXlsx(e.target.files[0]);e.target.value='';}}/>
          </label>
          <button className="chd-btn-secondary" onClick={()=>{setDraftFmt({...format});setEditingFormat(true);}}>Edit Format</button>
          <button className="chd-btn-secondary" style={{borderColor:"var(--red)",color:"var(--red)"}} onClick={()=>{setForm(EMPTY);if(typeof window!=="undefined")localStorage.removeItem("ch_fng_form");}}>Clear All</button>
          {onFill&&<button className="chd-btn-primary" onClick={()=>onFill({bizFilename:form.bizFilename,bizAlt:form.bizAlt,accountNum:form.accountNum})}>Auto-fill Active Form</button>}
        </div>
      </div>
      <div className="chd-divider"/>

      {editingFormat&&(
        <div className="modal-bg">
          <div style={{background:'var(--glass-bg)',border:'1px solid var(--glass-border)',backdropFilter:'var(--glass-blur)',borderRadius:14,padding:28,width:'100%',maxWidth:600,maxHeight:'88vh',overflowY:'auto',boxShadow:'var(--glass-shadow)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <h3 style={{margin:0,fontSize:16}}>✏️ Edit Filename Format Templates</h3>
              <button onClick={()=>setEditingFormat(false)} style={{background:'none',border:'none',color:'var(--muted)',fontSize:22,cursor:'pointer',lineHeight:1}}>×</button>
            </div>
            <div style={{fontSize:11,color:'var(--muted)',marginBottom:16,padding:'8px 12px',background:'var(--entry-bg)',borderRadius:8,border:'1px solid var(--border)',lineHeight:2}}>
              Tokens: <code style={{color:'var(--accent)'}}>{'{nob}'}</code> name (no suffix) · <code style={{color:'var(--accent)'}}>{'{nobfull}'}</code> name+suffix · <code style={{color:'var(--accent)'}}>{'{nn}'}</code> number · <code style={{color:'var(--accent)'}}>{'{page}'}</code> page · <code style={{color:'var(--accent)'}}>{'{member}'}</code> team · <code style={{color:'var(--accent)'}}>{'{badge}'}</code> badge · <code style={{color:'var(--accent)'}}>{'{menu}'}</code> menu · <code style={{color:'var(--accent)'}}>{'{pdf}'}</code> pdf
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {Object.entries(draftFmt).map(([key,val])=>(
                <div key={key} className="field" style={{marginBottom:0}}>
                  <label style={{textTransform:'uppercase',letterSpacing:'.5px',fontSize:9}}>{key.replace(/([A-Z])/g,' $1').trim()}</label>
                  <input className="inp" style={{fontFamily:'monospace',fontSize:11}} value={val} onChange={e=>setDraftFmt(f=>({...f,[key]:e.target.value}))}/>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button onClick={()=>{setFormat(draftFmt);if(typeof window!=="undefined") localStorage.setItem("ch_fng_format",JSON.stringify(draftFmt));setEditingFormat(false);showToast('Format saved ✅','success');}} className="btn btn-save" style={{flex:1,justifyContent:'center'}}>Save Format</button>
              <button onClick={()=>{setFormat(DEFAULT_FORMAT);setDraftFmt(DEFAULT_FORMAT);if(typeof window!=="undefined") localStorage.removeItem("ch_fng_format");showToast('Reset to default','info');}} className="btn btn-ghost" style={{fontSize:12}}>Reset</button>
              <button onClick={()=>setEditingFormat(false)} className="btn btn-cancel" style={{fontSize:12}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{background:'#fff',border:'1px solid var(--border)',padding:'20px 22px',marginBottom:20,borderRadius:12,boxShadow:'var(--shadow-sm)'}}>
        <p className="chd-h6" style={{marginBottom:14}}>Business Information</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:18}}>
          <div className="field" style={{marginBottom:0}}>
            <label style={{display:"flex",alignItems:"center",gap:6}}>
              Business Name — NOB {form.bizFilename&&<span style={{fontSize:9,fontWeight:700,color:"var(--green)",background:"rgba(16,185,129,.12)",border:"1px solid rgba(16,185,129,.3)",borderRadius:20,padding:"1px 7px"}}>auto-filled</span>}
            </label>
            <input className="inp" placeholder="e.g. Fire Force" value={form.bizFilename} onChange={e=>setForm(f=>({...f,bizFilename:e.target.value}))}/>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>Used as <code style={{color:'var(--accent)'}}>&#123;nob&#125;</code> — no LLC/Corp/Inc</div>
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label style={{display:"flex",alignItems:"center",gap:6}}>NOB + Suffix (Alt Text) {form.bizAlt&&<span style={{fontSize:9,fontWeight:700,color:"var(--green)",background:"rgba(16,185,129,.12)",border:"1px solid rgba(16,185,129,.3)",borderRadius:20,padding:"1px 7px"}}>auto-filled</span>}</label>
            <input className="inp" placeholder="e.g. Fire Force LLC" value={form.bizAlt} onChange={e=>setForm(f=>({...f,bizAlt:e.target.value}))}/>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>Used as <code style={{color:'var(--accent)'}}>&#123;nobfull&#125;</code> — includes suffix</div>
          </div>
          <div className="field" style={{marginBottom:0}}>
            <label style={{display:"flex",alignItems:"center",gap:6}}>Account Number {form.accountNum&&<span style={{fontSize:9,fontWeight:700,color:"var(--green)",background:"rgba(16,185,129,.12)",border:"1px solid rgba(16,185,129,.3)",borderRadius:20,padding:"1px 7px"}}>auto-filled</span>}</label>
            <input className="inp" placeholder="e.g. ACC-9876" value={form.accountNum} onChange={e=>setForm(f=>({...f,accountNum:e.target.value}))}/>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16}}>
          <div><div style={{fontSize:10,fontWeight:700,color:'var(--muted)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.8px'}}>Page Names</div><DynList field="pages" placeholder="Page"/></div>
          <div><div style={{fontSize:10,fontWeight:700,color:'var(--muted)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.8px'}}>Badge Names</div><DynList field="badges" placeholder="Badge"/></div>
          <div><div style={{fontSize:10,fontWeight:700,color:'var(--muted)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.8px'}}>Team Members</div><DynList field="teamMembers" placeholder="Staff"/></div>
          <div><div style={{fontSize:10,fontWeight:700,color:'var(--muted)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.8px'}}>Menu Names</div><DynList field="menuNames" placeholder="Menu"/></div>
          <div><div style={{fontSize:10,fontWeight:700,color:'var(--muted)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.8px'}}>PDF Names</div><DynList field="pdfNames" placeholder="PDF"/></div>
        </div>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className={cls("chd-radio-pill",tab===t.id&&"active")}>{t.label}</button>
        ))}
      </div>

      <div style={{background:'#fff',border:'1px solid var(--border)',padding:'20px 22px',borderRadius:12,boxShadow:'var(--shadow-sm)'}}>
        {tab==='logo'&&(<>
          <FngSection title="Logo" vals={[applyFmt(format.logo)]} sk="logo"><CopyCell val={applyFmt(format.logo)} id="logo"/></FngSection>
          <FngSection title="Favicon" vals={[applyFmt(format.favicon)]} sk="favicon"><CopyCell val={applyFmt(format.favicon)} id="favicon"/></FngSection>
          <FngSection title="Blog Logo" vals={[applyFmt(format.blogLogo)]} sk="blogLogo"><CopyCell val={applyFmt(format.blogLogo)} id="blogLogo"/></FngSection>
          <FngSection title="Assistant Logo" vals={[applyFmt(format.asst)]} sk="asst"><CopyCell val={applyFmt(format.asst)} id="asst"/></FngSection>
          <FngSection title="Intro / Why Choose" vals={[applyFmt(format.introWhy)]} sk="introWhy"><CopyCell val={applyFmt(format.introWhy)} id="introWhy"/></FngSection>
          <FngSection title="Recent Reviews" vals={[applyFmt(format.recentReviews)]} sk="recentReviews"><CopyCell val={applyFmt(format.recentReviews)} id="recentReviews"/></FngSection>
          <FngSection title="Video Splash" vals={[applyFmt(format.videoSplash)]} sk="videoSplash"><CopyCell val={applyFmt(format.videoSplash)} id="videoSplash"/></FngSection>
          <FngSection title="Wave Zip" vals={[applyFmt(format.waveZip)]} sk="waveZip"><CopyCell val={applyFmt(format.waveZip)} id="waveZip"/></FngSection>
          <FngSection title="Wave-Assistant Zip" vals={[applyFmt(format.waveAssist)]} sk="waveAssist"><CopyCell val={applyFmt(format.waveAssist)} id="waveAssist"/></FngSection>
          <div style={{marginTop:12}}><button onClick={()=>copyAll(logoVals,'logo-all')} className="btn btn-ghost" style={{width:'100%',justifyContent:'center',fontSize:12}}>{copiedAll==='logo-all'?'✓ Copied All':'Copy All Logo & Misc'}</button></div>
        </>)}
        {tab==='hero'&&(<>
          <FngSection title="Hero — AI Artwork / Customer Supplied" vals={heroCustVals} sk="hero-cust">
            {nob&&heroPages.length ? heroPages.map((p,pi)=>(
              <div key={pi} style={{marginBottom:8}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:4}}>{p}</div>
                <CopyCell val={applyFmt(format.heroCust,{page:san(p)})} id={`hc-${pi}`}/>
              </div>
            )) : <CopyCell val={heroCustVals[0]} id="hc-0"/>}
            {!nob&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter business name and page names above.</div>}
          </FngSection>
          <FngSection title="Hero — Business Images" vals={heroBiVals} sk="hero-bi">
            {nob&&heroPages.length ? heroPages.map((p,pi)=>(
              <div key={pi} style={{marginBottom:8}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:4}}>{p}</div>
                <CopyCell val={applyFmt(format.heroBi,{page:san(p)})} id={`hbi-${pi}`}/>
              </div>
            )) : <CopyCell val={heroBiVals[0]} id="hbi-0"/>}
            {!nob&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter business name and page names above.</div>}
          </FngSection>
        </>)}
        {tab==='gallery'&&(<>
          <FngSection title="Gallery (Nondescript)" vals={galNonVals} sk="gal-non">{galNonVals.map((v,i)=><CopyCell key={i} val={v} id={`gn-${i}`}/>)}</FngSection>
          <FngSection title="Gallery (Specific / Categorized by Page)" vals={galSpecVals} sk="gal-spec">
            {nob&&form.pages.filter(Boolean).map((p,pi)=>(
              <div key={pi} style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:4}}>{p}</div>
                {Array.from({length:20},(_,i)=><CopyCell key={i} val={applyFmt(format.gallerySpec,{page:san(p),nn:nn(i)})} id={`gs-${pi}-${i}`}/>)}
              </div>
            ))}
            {!nob&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter business name and page names above.</div>}
          </FngSection>
        </>)}
        {tab==='beforeafter'&&(
          <FngSection title="Before / After" vals={baVals} sk="ba">
            {Array.from({length:N},(_,i)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:4}}>
                <CopyCell val={applyFmt(format.before,{nn:nn(i)})} id={`bef-${i}`}/>
                <CopyCell val={applyFmt(format.after,{nn:nn(i)})} id={`aft-${i}`}/>
              </div>
            ))}
          </FngSection>
        )}
        {tab==='video'&&(<>
          <FngSection title="Video Splash (Single)" vals={[applyFmt(format.videoSplash)]} sk="vid-s"><CopyCell val={applyFmt(format.videoSplash)} id="vid-s"/></FngSection>
          <FngSection title="Video Splash — Multiple Images (by Page)" vals={videoMultiVals} sk="vid-multi">
            {nob&&form.pages.filter(Boolean).map((p,pi)=>(
              <div key={pi} style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:4}}>{p}</div>
                {Array.from({length:20},(_,i)=><CopyCell key={i} val={applyFmt(format.videoSplashPage,{page:san(p),nn:nn(i)})} id={`vm-${pi}-${i}`}/>)}
              </div>
            ))}
            {!nob&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter business name + page names above.</div>}
          </FngSection>
        </>)}
        {tab==='badges'&&(
          <FngSection title="Badge Images" vals={badgeVals} sk="badges">
            {form.badges.filter(Boolean).map((b,i)=>(<div key={i} style={{marginBottom:8}}><div style={{fontSize:11,color:'var(--muted)',marginBottom:3}}>{b}</div><CopyCell val={applyFmt(format.badge,{badge:san(b)})} id={`badge-${i}`}/></div>))}
            {!form.badges.filter(Boolean).length&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter badge names above.</div>}
          </FngSection>
        )}
        {tab==='team'&&(
          <FngSection title="Team Member Photos" vals={teamVals} sk="team">
            {form.teamMembers.filter(Boolean).map((m,i)=>(<div key={i} style={{marginBottom:8}}><div style={{fontSize:11,color:'var(--muted)',marginBottom:3}}>{m}</div><CopyCell val={applyFmt(format.team,{member:san(m)})} id={`tm-${i}`}/></div>))}
            {!form.teamMembers.filter(Boolean).length&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter team member names above.</div>}
          </FngSection>
        )}
        {tab==='menu'&&(<>
          <FngSection title="Menu (Single — numbered)" vals={menuNumVals} sk="menu-num">{menuNumVals.map((v,i)=><CopyCell key={i} val={v} id={`mn-${i}`}/>)}</FngSection>
          <FngSection title="Menu (Multiple — by name)" vals={menuNamedVals} sk="menu-named">
            {form.menuNames.filter(Boolean).map((m,mi)=>(
              <div key={mi} style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:4}}>{m}</div>
                {Array.from({length:10},(_,i)=><CopyCell key={i} val={applyFmt(format.menuNamed,{menu:san(m),nn:nn(i)})} id={`mnn-${mi}-${i}`}/>)}
              </div>
            ))}
            {!form.menuNames.filter(Boolean).length&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter menu names above.</div>}
          </FngSection>
        </>)}
        {tab==='content'&&(
          <FngSection title="Body / Content Image (by Page)" vals={contentVals} sk="content">
            {form.pages.filter(Boolean).map((p,pi)=>(
              <div key={pi} style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:4}}>{p}</div>
                {Array.from({length:20},(_,i)=><CopyCell key={i} val={applyFmt(format.pageContent,{page:san(p),nn:nn(i)})} id={`ci-${pi}-${i}`}/>)}
              </div>
            ))}
            {!form.pages.filter(Boolean).length&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter page names above.</div>}
          </FngSection>
        )}
        {tab==='callout'&&(
          <FngSection title="Callout / Coupon Icon (by Page)" vals={calloutVals} sk="callout">
            {form.pages.filter(Boolean).map((p,pi)=>(
              <div key={pi} style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',marginBottom:4}}>{p}</div>
                {Array.from({length:10},(_,i)=><CopyCell key={i} val={applyFmt(format.callout,{page:san(p),nn:nn(i)})} id={`co-${pi}-${i}`}/>)}
              </div>
            ))}
            {!form.pages.filter(Boolean).length&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter page names above.</div>}
          </FngSection>
        )}
        {tab==='pdf'&&(
          <FngSection title="PDF Files" vals={pdfVals} sk="pdf">
            {form.pdfNames.filter(Boolean).map((p,i)=>(<div key={i} style={{marginBottom:8}}><div style={{fontSize:11,color:'var(--muted)',marginBottom:3}}>{p}</div><CopyCell val={applyFmt(format.pdf,{pdf:san(p)})} id={`pdf-${i}`}/></div>))}
            {!form.pdfNames.filter(Boolean).length&&<div style={{fontSize:13,color:'var(--muted)'}}>Enter PDF names above.</div>}
          </FngSection>
        )}
        {tab==='slider'&&(
          <FngSection title="Hero Slider" vals={sliderVals} sk="slider">{sliderVals.map((v,i)=><CopyCell key={i} val={v} id={`sl-${i}`}/>)}</FngSection>
        )}
      </div>
      <Toast msg={toast.msg} type={toast.type}/>
    </div>
    </FngCtx.Provider>
  );
}

// Disable SSR entirely — prevents all hydration mismatches from dynamic content
function CaseHubPage(){ return <App/>; }
const CaseHubPageNoSSR = dynamic(()=>Promise.resolve(CaseHubPage),{ssr:false});
export default CaseHubPageNoSSR;