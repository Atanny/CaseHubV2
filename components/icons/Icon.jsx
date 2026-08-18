export default function Icon({ name, size=16, color="currentColor", style={} }) {
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

