import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, PointerEvent as ReactPointerEvent } from 'react';
import { appInfo, desktopApps, education, experience, profile, projects, skillGroups, skillUsage } from './data';
import type { AppId, Project } from './data';
import { FileExplorer, ViewerApp } from './FileExplorer';
import { JourneyApp } from './Journey';
import type { FsDoc } from './filesystem';

type Win = { id: AppId; x: number; y: number; w: number; h: number; z: number; minimized: boolean; maximized: boolean };
const iconTint: Partial<Record<AppId, string>> = { terminal: 'terminal', projects: 'folder', about: 'profile', skills: 'violet', experience: 'blue', contact: 'mail', resume: 'pdf', settings: 'settings', pc: 'computer', journey: 'sprite-icon' };
type SearchResult = { label: string; detail: string; id: AppId; project?: Project };

export type Settings = { theme: string; wallpaper: string; solid: string; image: string; accent: string; font: string; textSize: number; caption: boolean; widgets: boolean };
export const defaultSettings: Settings = { theme: 'dark', wallpaper: 'kolkata', solid: '#1f2a3a', image: '', accent: '', font: 'system', textSize: 1, caption: true, widgets: true };
type SetSettings = (patch: Partial<Settings> | 'reset') => void;
const loadSettings = (): Settings => {
  try {
    const saved = JSON.parse(localStorage.getItem('portfolio-settings') || 'null');
    if (saved) return { ...defaultSettings, ...saved };
  } catch { /* ignore corrupt settings */ }
  return { ...defaultSettings, theme: localStorage.getItem('portfolio-theme') || 'dark' };
};
const fontStacks: Record<string, string> = {
  system: "'Segoe UI Variable', 'Segoe UI', sans-serif",
  humanist: "'Trebuchet MS', 'Gill Sans', sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  wide: "Verdana, Geneva, sans-serif",
  mono: "'DM Mono', Consolas, monospace",
};

function App() {
  const [windows, setWindows] = useState<Win[]>([]);
  const [topZ, setTopZ] = useState(0);
  const [active, setActive] = useState<AppId>('projects');
  const [selected, setSelected] = useState<AppId | null>(null);
  const [settings, setSettingsState] = useState<Settings>(loadSettings);
  const theme = settings.theme;
  const setSettings = useCallback<SetSettings>(patch => setSettingsState(previous => patch === 'reset' ? { ...defaultSettings } : { ...previous, ...patch }), []);
  const setTheme = (value: string) => setSettings({ theme: value });
  const [startOpen, setStartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [context, setContext] = useState<{ x: number; y: number } | null>(null);
  const [mobileApp, setMobileApp] = useState<AppId | null>(null);
  const [recent, setRecent] = useState<AppId[]>([]);
  const [projectFilter, setProjectFilter] = useState('');
  const [viewerDoc, setViewerDoc] = useState<FsDoc | null>(null);
  const [pinned, setPinned] = useState<AppId[]>(() => {
    try { const saved = JSON.parse(localStorage.getItem('portfolio-pinned') || 'null'); if (Array.isArray(saved)) return saved.filter((id: string) => id in appInfo) as AppId[]; } catch { /* ignore */ }
    return ['terminal', 'projects', 'about', 'skills', 'contact'];
  });
  const [taskMenu, setTaskMenu] = useState<{ id: AppId; x: number } | null>(null);
  const togglePin = useCallback((id: AppId) => setPinned(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]), []);
  useEffect(() => { try { localStorage.setItem('portfolio-pinned', JSON.stringify(pinned)); } catch { /* ignore */ } }, [pinned]);
  const [clock, setClock] = useState(new Date());
  const [bootProgress, setBootProgress] = useState(0);
  const [bootComplete, setBootComplete] = useState(false);

  useEffect(() => {
    const updateReadabilityScale = () => {
      const scale = Math.min(2, 1 / Math.max(0.5, window.devicePixelRatio || 1)) * settings.textSize;
      document.documentElement.style.setProperty('--readability-scale', String(scale));
    };
    updateReadabilityScale();
    window.addEventListener('resize', updateReadabilityScale);
    return () => window.removeEventListener('resize', updateReadabilityScale);
  }, [settings.textSize]);

  useEffect(() => {
    if (bootComplete) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const interval = window.setInterval(() => {
      setBootProgress(progress => Math.min(100, progress + (reducedMotion ? 20 : 2)));
    }, 45);
    return () => window.clearInterval(interval);
  }, [bootComplete]);

  useEffect(() => {
    if (bootProgress < 100) return;
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 80 : 500;
    const timeout = window.setTimeout(() => setBootComplete(true), delay);
    return () => window.clearTimeout(timeout);
  }, [bootProgress]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    try { localStorage.setItem('portfolio-settings', JSON.stringify(settings)); } catch { /* storage full or unavailable */ }
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.font = settings.font;
    root.style.setProperty('--ui-font', fontStacks[settings.font] || fontStacks.system);
    if (settings.accent) {
      root.style.setProperty('--accent-strong', settings.accent);
      root.style.setProperty('--accent', `color-mix(in srgb, ${settings.accent} 65%, ${settings.theme === 'dark' ? 'white' : 'black'})`);
    } else {
      root.style.removeProperty('--accent-strong');
      root.style.removeProperty('--accent');
    }
  }, [settings]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setStartOpen(false); setSearchOpen(false); setContext(null);
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setSearchOpen(true); setStartOpen(false);
      } else if (event.key === 'F1') {
        event.preventDefault(); setStartOpen(value => !value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openApp = useCallback((id: AppId) => {
    setRecent(previous => [id, ...previous.filter(item => item !== id)].slice(0, 4));
    setMobileApp(window.matchMedia('(max-width: 700px)').matches ? id : null);
    setWindows(previous => {
      const existing = previous.find(item => item.id === id);
      const nextZ = Math.max(0, ...previous.map(item => item.z)) + 1;
      if (existing) return previous.map(item => item.id === id ? { ...item, minimized: false, z: nextZ } : item);
      const n = previous.length;
      const vw = window.innerWidth;
      const vh = window.innerHeight - 58;
      // ~56% of the usable screen area (72% wide x 78% tall)
      const w = Math.max(320, Math.round(vw * 0.72));
      const h = Math.max(220, Math.round(vh * 0.78));
      const x = Math.max(0, Math.min(Math.round((vw - w) / 2) + (n % 5) * 28 - 56, vw - w));
      const y = Math.max(0, Math.min(Math.round((vh - h) / 2) + (n % 4) * 24 - 36, vh - h));      return [...previous, { id, x, y, w, h, z: nextZ, minimized: false, maximized: false }];
    });
    setTopZ(value => value + 1);
    setActive(id); setStartOpen(false); setSearchOpen(false); setContext(null);
  }, []);

  const openDoc = useCallback((doc: FsDoc) => { setViewerDoc(doc); openApp('viewer'); }, [openApp]);
  const openProject = useCallback((id: string) => { setProjectFilter(id); openApp('projects'); }, [openApp]);

  const updateWindow = (id: AppId, transform: (item: Win) => Win) => setWindows(previous => previous.map(item => item.id === id ? transform(item) : item));
  const focusWindow = (id: AppId) => {
    const nextZ = topZ + 1; setTopZ(nextZ); setActive(id);
    updateWindow(id, item => ({ ...item, minimized: false, z: nextZ }));
  };
  const closeWindow = (id: AppId) => setWindows(previous => previous.filter(item => item.id !== id));
  const minimizeWindow = (id: AppId) => updateWindow(id, item => ({ ...item, minimized: true }));
  const toggleMaximize = (id: AppId) => updateWindow(id, item => ({ ...item, maximized: !item.maximized }));
  const resetDesktop = () => { setWindows([]); setTopZ(0); setMobileApp(null); setStartOpen(false); setSearchOpen(false); setContext(null); };

  const appSearchResults = useMemo<SearchResult[]>(() => {
    const term = search.trim().toLowerCase();
    if (!term) return desktopApps.map(id => ({ label: appInfo[id].title, detail: appInfo[id].hint, id }));
    const apps: SearchResult[] = desktopApps.filter(id => `${appInfo[id].title} ${appInfo[id].hint}`.toLowerCase().includes(term)).map(id => ({ label: appInfo[id].title, detail: 'Application', id }));
    const projs: SearchResult[] = projects.filter(project => `${project.name} ${project.description} ${project.technologies.join(' ')} ${project.employer || ''}`.toLowerCase().includes(term)).map(project => ({ label: project.name, detail: `Project · ${project.category}`, id: 'projects', project }));
    const skills: SearchResult[] = Object.values(skillGroups).flat().filter(skill => skill.toLowerCase().includes(term)).slice(0, 4).map(skill => ({ label: skill, detail: 'Technology', id: 'skills' }));
    const employers: SearchResult[] = experience.filter(item => `${item.company} ${item.role}`.toLowerCase().includes(term)).map(item => ({ label: item.company, detail: item.role, id: 'experience' }));
    const schools: SearchResult[] = education.filter(item => `${item.degree} ${item.institution}`.toLowerCase().includes(term)).map(item => ({ label: item.institution, detail: item.degree, id: 'education' }));
    return [...apps, ...projs, ...skills, ...employers, ...schools].slice(0, 10);
  }, [search]);

  const chooseSearch = (id: AppId, project?: Project) => {
    if (project) setProjectFilter(project.id);
    openApp(id);
  };

  return (
    <main className="desktop" data-wallpaper={settings.wallpaper} onPointerDown={() => { setContext(null); setTaskMenu(null); }} onContextMenu={event => { if ((event.target as HTMLElement).closest('.window,.taskbar,.desktop-icon,.widget-panel,.start-menu,.search-panel')) return; event.preventDefault(); setContext({ x: event.clientX, y: event.clientY }); }}>
      <div className="wallpaper" aria-hidden="true" style={settings.wallpaper === 'solid' ? { background: settings.solid } : settings.wallpaper === 'image' && settings.image ? { background: `center / cover no-repeat url("${settings.image}")` } : undefined}>
        {settings.caption && <div className="wallpaper-caption">Kolkata. Code. Pujo. Repeat.</div>}
        {(settings.wallpaper === 'kolkata' || settings.wallpaper === 'puja') && <div className="riverfront"><span className="bridge-tower" /><span className="bridge-line" /><span className="bridge-deck" /><span className="river-reflection" /></div>}
      </div>
      <div className="desktop-icons" aria-label="Desktop shortcuts">
        {desktopApps.map(id => (
          <button key={id} className={`desktop-icon ${selected === id ? 'selected' : ''}`} onClick={event => { event.stopPropagation(); setSelected(id); if (window.matchMedia('(max-width: 700px)').matches) openApp(id); }} onDoubleClick={event => { event.stopPropagation(); openApp(id); }} onKeyDown={event => { if (event.key === 'Enter') openApp(id); }} aria-label={`${appInfo[id].title} shortcut. Double-click to open.`}>
            <AppIcon id={id} /><span>{appInfo[id].title}</span>
          </button>
        ))}
      </div>
      {settings.widgets && <aside className="widget-panel">
        <section className="widget clock-widget"><div className="widget-heading">Kolkata · India</div><div className="big-clock">{clock.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}</div><div className="widget-sub">{clock.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' })}</div></section>
        <section className="widget"><div className="widget-heading">A little about me <span>↗</span></div><strong>{profile.title}</strong><p>{profile.experience} · {profile.location}</p></section>
        <section className="widget puja-card"><div className="widget-heading">Make it yours</div><p>Change the wallpaper, theme, accent colour and font.</p><button className="text-button" onClick={() => openApp('settings')}>Open Settings <span>→</span></button></section>
      </aside>}

      <section className="window-layer" aria-label="Open applications">
        {windows.map(item => !item.minimized && (
          <WindowFrame key={item.id} win={item} active={active === item.id} focus={() => focusWindow(item.id)} close={() => closeWindow(item.id)} minimize={() => minimizeWindow(item.id)} maximize={() => toggleMaximize(item.id)} update={transform => updateWindow(item.id, transform)} pinned={pinned.includes(item.id)} togglePin={() => togglePin(item.id)}>
            <AppContent id={item.id} openApp={openApp} openProject={openProject} openDoc={openDoc} viewerDoc={viewerDoc} settings={settings} setSettings={setSettings} projectFilter={projectFilter} setProjectFilter={setProjectFilter} clearProjectFilter={() => setProjectFilter('')} />
          </WindowFrame>
        ))}
      </section>
      <button className="widget-shortcut" title="Open Contact" aria-label="Open Contact" onClick={() => openApp('contact')}>✉ <span>Say hello</span></button>

      {context && <div className="context-menu" style={{ left: Math.min(context.x, window.innerWidth - 205), top: Math.min(context.y, window.innerHeight - 230) }} onPointerDown={event => event.stopPropagation()}>
        <button onClick={resetDesktop}>⟳ <span>Restore default desktop</span></button><button onClick={() => setStartOpen(true)}>⊞ <span>Open Start</span></button><button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>◐ <span>Switch to {theme === 'dark' ? 'light' : 'dark'} theme</span></button><button onClick={() => openApp('settings')}>⚙ <span>Personalize…</span></button>
      </div>}
      {startOpen && <div className="start-menu panel-popover" onPointerDown={event => event.stopPropagation()}>
        <button className="start-search" onClick={() => { setStartOpen(false); setSearchOpen(true); }}><span>⌕</span><span>Search for apps, projects, skills...</span></button>
        <div className="start-section-title">Pinned <button onClick={() => { setStartOpen(false); setSearchOpen(true); }}>All apps →</button></div>
        <div className="pinned-grid">{desktopApps.filter(id => !['pc', 'recycle'].includes(id)).map(id => <button key={id} onClick={() => openApp(id)}><AppIcon id={id} /><span>{appInfo[id].title}</span></button>)}</div>
        <div className="start-section-title recent-heading">Recent <button className="plain-button" onClick={() => setRecent([])}>Clear</button></div>
        {recent.length ? recent.map(id => <button key={id} className="recent-app" onClick={() => openApp(id)}><AppIcon id={id} />{appInfo[id].title}<span>Recently opened</span></button>) : <p className="muted small-pad">Recently opened apps will appear here.</p>}
        <div className="start-footer"><div><span className="avatar-small">SG</span><span>{profile.name}</span></div><button title="Return to default desktop" onClick={resetDesktop}>⏻</button></div>
      </div>}
      {searchOpen && <div className="search-panel panel-popover" onPointerDown={event => event.stopPropagation()}>
        <div className="search-box"><span>⌕</span><input autoFocus placeholder="Search apps, projects, skills, employers..." value={search} onChange={event => setSearch(event.target.value)} /><button onClick={() => setSearchOpen(false)} aria-label="Close search">×</button></div>
        <div className="search-results">{appSearchResults.length ? appSearchResults.map((result, index) => <button key={`${result.label}-${index}`} onClick={() => chooseSearch(result.id, result.project)}><span className="result-icon">{result.project ? '▣' : '⌕'}</span><span><strong>{result.label}</strong><small>{result.detail}</small></span><span className="result-open">↗</span></button>) : <div className="empty-state">No matching apps or portfolio details.</div>}</div>
        <div className="search-hint">Search applications, projects, technologies, roles, and education.</div>
      </div>}

      {mobileApp && <div className="mobile-app-screen"><div className="mobile-app-header"><button onClick={() => setMobileApp(null)}>‹ <span>Home</span></button><strong>{appInfo[mobileApp].title}</strong><button onClick={() => { closeWindow(mobileApp); setMobileApp(null); }} aria-label="Close app" title="Close app">✕</button></div><AppContent id={mobileApp} openApp={openApp} openProject={openProject} openDoc={openDoc} viewerDoc={viewerDoc} settings={settings} setSettings={setSettings} projectFilter={projectFilter} setProjectFilter={setProjectFilter} clearProjectFilter={() => setProjectFilter('')} /></div>}

      <footer className="taskbar"       onPointerDown={event => { event.stopPropagation(); if (!(event.target as HTMLElement).closest('.task-menu')) setTaskMenu(null); }}>
        <div className="taskbar-left"><span className="location-chip">⌖ <span>{profile.location}</span></span></div>
        <div className="taskbar-center"><button className={`task-icon start-button ${startOpen ? 'task-active' : ''}`} onClick={() => { setStartOpen(value => !value); setSearchOpen(false); }} aria-label="Start menu" title="Start">⊞</button><button className={`task-icon search-task ${searchOpen ? 'task-active' : ''}`} onClick={() => { setSearchOpen(value => !value); setStartOpen(false); }} aria-label="Search" title="Search">⌕</button><span className="task-divider" />{[...pinned, ...windows.map(item => item.id).filter(id => !pinned.includes(id))].map(id => { const running = windows.some(item => item.id === id); const minimized = windows.find(item => item.id === id)?.minimized; return <button key={id} className={`task-icon ${running ? 'running' : ''} ${active === id && !minimized ? 'task-active' : ''}`} title={`${appInfo[id].title}${pinned.includes(id) ? ' (pinned)' : ''} — right-click to ${pinned.includes(id) ? 'unpin' : 'pin'}`} aria-label={appInfo[id].title} onClick={() => openApp(id)} onContextMenu={event => { event.preventDefault(); const r = event.currentTarget.getBoundingClientRect(); setTaskMenu({ id, x: r.left + r.width / 2 }); }}><AppIcon id={id} compact /></button>; })}
          {taskMenu && <div className="task-menu" style={{ left: Math.max(8, Math.min(taskMenu.x - 80, window.innerWidth - 168)) }}><button onClick={() => { openApp(taskMenu.id); setTaskMenu(null); }}>Open {appInfo[taskMenu.id].title}</button>{windows.some(item => item.id === taskMenu.id) && <button onClick={() => { closeWindow(taskMenu.id); setTaskMenu(null); }}>✕ Close window</button>}<button onClick={() => { togglePin(taskMenu.id); setTaskMenu(null); }}>{pinned.includes(taskMenu.id) ? '📌 Unpin from taskbar' : '📌 Pin to taskbar'}</button></div>}</div>
        <div className="taskbar-right"><span className="tray-indicator" title="Network indicator (visual only)">◉</span><span className="tray-indicator" title="Volume indicator (visual only)">◖))</span><button className="tray-button theme-button" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☼' : '☾'}</button><div className="tray-clock">{clock.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}<small>{clock.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })}</small></div></div>
      </footer>
      {!bootComplete && <section className={`boot-screen ${bootProgress === 100 ? 'boot-leaving' : ''}`} aria-label="Portfolio desktop startup">
        <div className="boot-content">
          <div className="boot-logo" aria-hidden="true"><span /><span /><span /><span /></div>
          <p className="boot-kicker">PERSONAL DESKTOP</p>
          <h1>{profile.name}</h1>
          <p className="boot-subtitle">Your portfolio workspace</p>
          <div className="boot-progress-copy"><span>{bootProgress < 36 ? 'Starting desktop shell' : bootProgress < 82 ? 'Preparing your workspace' : bootProgress < 100 ? 'Almost ready' : 'Ready'}</span><span>{bootProgress}%</span></div>
          <div className="boot-progress-track" role="progressbar" aria-label="Desktop startup progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={bootProgress}><span style={{ width: `${bootProgress}%` }} /></div>
          <button className="boot-skip" onClick={() => { setBootProgress(100); setBootComplete(true); }}>Skip startup</button>
        </div>
        <div className="boot-footer"><span>✦</span> Kolkata. Code. Pujo. Repeat.</div>
      </section>}
    </main>
  );
}

function AppIcon({ id, compact = false }: { id: AppId; compact?: boolean }) {
  return <span className={`app-icon ${iconTint[id] || 'blue'} ${compact ? 'compact-icon' : ''}`} aria-hidden="true">{id === 'journey' ? <img src="/sprite/icon.png" alt="" draggable={false} /> : appInfo[id].icon}</span>;
}

function WindowFrame({ win, active, focus, close, minimize, maximize, update, pinned, togglePin, children }: { pinned: boolean; togglePin: () => void; win: Win; active: boolean; focus: () => void; close: () => void; minimize: () => void; maximize: () => void; update: (transform: (item: Win) => Win) => void; children: React.ReactNode }) {
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const resize = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const onPointerMove = (event: PointerEvent) => {
    if (drag.current) {
      const d = drag.current;
      update(item => ({ ...item, x: Math.max(-item.w + 120, Math.min(window.innerWidth - 100, d.left + event.clientX - d.x)), y: Math.max(0, Math.min(window.innerHeight - 120, d.top + event.clientY - d.y)) }));
    } else if (resize.current) {
      const r = resize.current;
      update(item => ({ ...item, w: Math.max(320, Math.min(window.innerWidth - item.x, r.w + event.clientX - r.x)), h: Math.max(220, Math.min(window.innerHeight - item.y - 58, r.h + event.clientY - r.y)) }));
    }
  };
  const endPointer = () => { drag.current = null; resize.current = null; window.removeEventListener('pointermove', onPointerMove); window.removeEventListener('pointerup', endPointer); };
  const startDrag = (event: ReactPointerEvent) => {
    if ((event.target as HTMLElement).closest('button,input,select,textarea,a,[role="button"]') || win.maximized) return;
    event.preventDefault(); focus(); drag.current = { x: event.clientX, y: event.clientY, left: win.x, top: win.y };
    window.addEventListener('pointermove', onPointerMove); window.addEventListener('pointerup', endPointer);
  };
  const startResize = (event: ReactPointerEvent) => {
    event.preventDefault(); event.stopPropagation(); focus(); resize.current = { x: event.clientX, y: event.clientY, w: win.w, h: win.h };
    window.addEventListener('pointermove', onPointerMove); window.addEventListener('pointerup', endPointer);
  };
  return <section className={`window ${active ? 'window-active' : ''} ${win.maximized ? 'maximized' : ''}`} style={{ left: win.maximized ? 6 : win.x, top: win.maximized ? 6 : win.y, width: win.maximized ? 'calc(100vw - 12px)' : win.w, height: win.maximized ? 'calc(100dvh - 66px)' : win.h, zIndex: win.z }} onPointerDown={focus} aria-label={`${appInfo[win.id].title} window`}>
    <header className="titlebar" onPointerDown={startDrag} onDoubleClick={event => { if (!(event.target as HTMLElement).closest('button')) maximize(); }}><span className="titlebar-icon"><AppIcon id={win.id} compact /></span><span className="window-title">{appInfo[win.id].title}</span><div className="window-controls"><button className={pinned ? 'pin-on' : ''} onClick={togglePin} title={pinned ? 'Unpin from taskbar' : 'Pin to taskbar'} aria-label={pinned ? 'Unpin from taskbar' : 'Pin to taskbar'} aria-pressed={pinned}>📌</button><button onClick={minimize} title="Minimize" aria-label="Minimize">−</button><button onClick={maximize} title={win.maximized ? 'Restore' : 'Maximize'} aria-label={win.maximized ? 'Restore' : 'Maximize'}>{win.maximized ? '❐' : '□'}</button><button className="close-control" onClick={close} title="Close" aria-label="Close">×</button></div></header>
    <div className="window-body">{children}</div>{!win.maximized && <div className="resize-handle" onPointerDown={startResize} aria-label="Resize window" />}
  </section>;
}

function AppContent({ id, openApp, openProject, openDoc, viewerDoc, settings, setSettings, projectFilter, setProjectFilter, clearProjectFilter }: { id: AppId; openApp: (id: AppId) => void; openProject: (id: string) => void; openDoc: (doc: FsDoc) => void; viewerDoc: FsDoc | null; settings: Settings; setSettings: SetSettings; projectFilter: string; setProjectFilter: (id: string) => void; clearProjectFilter: () => void }) {
  switch (id) {
    case 'terminal': return <Terminal openApp={openApp} theme={settings.theme} setTheme={theme => setSettings({ theme })} />;
    case 'about': return <About openApp={openApp} />;
    case 'projects': return <ProjectsApp projectFilter={projectFilter} clearProjectFilter={clearProjectFilter} />;
    case 'skills': return <SkillsApp openApp={openApp} setProjectFilter={setProjectFilter} />;
    case 'experience': return <ExperienceApp />;
    case 'education': return <EducationApp />;
    case 'resume': return <ResumeApp />;
    case 'contact': return <ContactApp />;
    case 'settings': return <SettingsApp settings={settings} setSettings={setSettings} />;
    case 'recycle': return <div className="app-padding empty-recycle"><div className="large-emoji">♲</div><h2>Nothing to see here.</h2><p>This Recycle Bin is just for show. It never stores or deletes real files.</p></div>;
    case 'pc': return <FileExplorer openApp={openApp} openProject={openProject} openDoc={openDoc} />;
    case 'viewer': return <ViewerApp doc={viewerDoc} />;
    case 'journey': return <JourneyApp openApp={openApp} />;
  }
}

type TerminalLine = { text: string; kind?: string; link?: AppId };
function Terminal({ openApp, theme, setTheme }: { openApp: (id: AppId) => void; theme: string; setTheme: (value: string) => void }) {
  const [lines, setLines] = useState<TerminalLine[]>([{ text: 'Shankhanil Ghosh', kind: 'terminal-name' }, { text: 'Generative AI & Full-Stack Engineer', kind: 'terminal-role' }, { text: '4+ years of professional experience', kind: 'terminal-muted' }, { text: 'Building intelligent applications with Python, Java, React, and modern AI frameworks.', kind: 'terminal-muted' }, { text: 'Type "help" to explore this portfolio.', kind: 'terminal-hint' }]);
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const projectLines: TerminalLine[] = [
    { text: `${projects.length} projects and tools:`, kind: 'terminal-hint' },
    ...projects.map(project => ({ text: `• ${project.name} — ${project.category}${project.dates ? ` · ${project.dates}` : ''}`, kind: 'terminal-muted' })),
    { text: 'Open Projects Explorer', link: 'projects' },
  ];
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [lines]);
  const execute = (event: FormEvent) => {
    event.preventDefault();
    const command = value.trim();
    if (!command) return;
    const normalized = command.toLowerCase();
    setHistory(previous => [...previous, command]); setHistoryIndex(history.length + 1); setValue('');
    if (normalized === 'clear') { setLines([]); return; }
    const output: TerminalLine[] = [{ text: `PS C:\\Users\\shankhanil> ${command}`, kind: 'command' }];
    const commandMap: Record<string, TerminalLine[]> = {
      help: [{ text: 'Available: help · whoami · about · projects · skills · experience · education · contact · resume · date · theme · settings · clear', kind: 'terminal-muted' }, { text: 'Try: open projects | open skills | open experience | open contact' }],
      whoami: [{ text: `${profile.name} — ${profile.title}`, kind: 'terminal-name' }, { text: `${profile.currentRole} at ${profile.employer} · ${profile.location}` }],
      about: [{ text: profile.summary, kind: 'terminal-muted' }, { text: 'Opening About Me…', link: 'about' }],
      projects: projectLines,
      skills: [{ text: `${Object.values(skillGroups).flat().length} listed technologies across ${Object.keys(skillGroups).length} categories.`, link: 'skills' }],
      experience: [{ text: 'View the professional timeline.', link: 'experience' }],
      education: [{ text: education.map(item => `${item.degree} — ${item.institution}`).join(' · '), link: 'education' }],
      contact: [{ text: `${profile.email} · ${profile.phone}`, link: 'contact' }],
      resume: [{ text: 'Resume PDF is not present in the supplied project files.', kind: 'terminal-hint' }, { text: 'Open Resume Viewer for download and preview status.', link: 'resume' }],
      date: [{ text: new Date().toString() }],
      theme: [{ text: `Theme switched to ${theme === 'dark' ? 'light' : 'dark'}.` }],
      settings: [{ text: 'Opening Settings…', link: 'settings' }],
    };
    if (normalized === 'theme') setTheme(theme === 'dark' ? 'light' : 'dark');
    if (normalized.startsWith('open ')) {
      const appName = normalized.slice(5);
      if (['project', 'projects', 'project explorer', 'projects explorer'].includes(appName)) output.push(...projectLines);
      else {
        const match = (Object.keys(appInfo) as AppId[]).find(id => id === appName || appInfo[id].title.toLowerCase() === appName);
        if (match) output.push({ text: `Opening ${appInfo[match].title}…`, link: match });
        else output.push({ text: `No app named "${appName}". Type "help" for supported commands.`, kind: 'terminal-error' });
      }
    } else if (commandMap[normalized]) output.push(...commandMap[normalized]);
    else output.push({ text: `Command not recognized: ${command}. Type "help" to see what I can do.`, kind: 'terminal-error' });
    setLines(previous => [...previous, ...output]);
  };
  return <div className="terminal-app"><div className="terminal-toolbar"><span className="traffic-dot red" /><span className="traffic-dot yellow" /><span className="traffic-dot green" /><span>PowerShell · Portfolio session</span></div><div className="terminal-content" onClick={() => document.getElementById('terminal-input')?.focus()}>{lines.map((line, index) => line.link ? <button key={index} className={`terminal-line terminal-link ${line.kind || ''}`} onClick={() => openApp(line.link!)}>{line.text} <span>↗</span></button> : <div key={index} className={`terminal-line ${line.kind || ''}`}>{line.text}</div>)}<form className="terminal-prompt" onSubmit={execute}><label htmlFor="terminal-input">PS C:\Users\shankhanil&gt;</label><input id="terminal-input" value={value} onChange={event => setValue(event.target.value)} onKeyDown={event => { if (event.key === 'ArrowUp') { event.preventDefault(); const next = history[Math.max(0, historyIndex - 1)]; if (next) { setHistoryIndex(Math.max(0, historyIndex - 1)); setValue(next); } } if (event.key === 'ArrowDown') { event.preventDefault(); const nextIndex = Math.min(history.length, historyIndex + 1); setHistoryIndex(nextIndex); setValue(history[nextIndex] || ''); } }} autoComplete="off" spellCheck={false} aria-label="Enter a simulated portfolio command" /><span className="cursor" /></form><div ref={bottomRef} /></div></div>;
}

function About({ openApp }: { openApp: (id: AppId) => void }) {
  const [tab, setTab] = useState('Overview');
  return <div className="app-padding"><div className="profile-banner"><div className="profile-avatar">SG</div><div><span className="eyebrow">PORTFOLIO PROFILE</span><h2>{profile.name}</h2><p>{profile.title}</p></div></div><div className="tab-row">{['Overview', 'Personal info', 'What I build', 'Education'].map(item => <button key={item} className={tab === item ? 'tab-active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
    {tab === 'Overview' && <div className="content-section"><div className="eyebrow">HELLO, I'M SHANKHANIL</div><h3>Engineering useful things with AI and full-stack craft.</h3><p>{profile.summary}</p><div className="mini-facts"><div><span>Based in</span><strong>{profile.location}</strong></div><div><span>Experience</span><strong>{profile.experience}</strong></div><div><span>Focus</span><strong>Generative AI · Full-stack</strong></div></div></div>}
    {tab === 'Personal info' && <div className="info-list">{[['Location', profile.location], ['Email', profile.email], ['Phone', profile.phone], ['Current role', profile.currentRole], ['Employer', profile.employer]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>}
    {tab === 'What I build' && <div className="content-section"><h3>Curiosity, from idea to dependable product.</h3><div className="interest-grid">{[['✦', 'AI & LLM applications', 'Agentic workflows, retrieval, and practical Generative AI.'], ['⌘', 'Full-stack products', 'Thoughtful interfaces backed by reliable services and APIs.'], ['▤', 'Automation', 'Tools that make complex workflows easier to understand and operate.']].map(card => <div className="interest-card" key={card[1]}><span>{card[0]}</span><strong>{card[1]}</strong><p>{card[2]}</p></div>)}</div></div>}
    {tab === 'Education' && <EducationList />}
    <div className="action-row"><button className="primary-button" onClick={() => openApp('resume')}>▧ View Resume</button>{profile.github && <a className="secondary-button" href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a>}{profile.linkedin && <a className="secondary-button" href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}<a className="secondary-button" href={gmailComposeUrl(profile.email)} target="_blank" rel="noreferrer">✉ Email Me</a></div>
  </div>;
}

function EducationList() { return <div className="education-list">{education.map(item => <div className="education-card" key={item.degree}><span className="education-icon">▱</span><div><h3>{item.degree}</h3><p>{item.institution}</p><strong>{item.result}</strong></div></div>)}<p className="muted small-note">No certifications were listed in the supplied project information.</p></div>; }

function gmailComposeUrl(to: string, subject = '', body = '') {
  const params = new URLSearchParams({ view: 'cm', fs: '1', to });
  if (subject) params.set('su', subject);
  if (body) params.set('body', body);
  return `https://mail.google.com/mail/?${params.toString()}`;
}

function ProjectsApp({ projectFilter, clearProjectFilter }: { projectFilter: string; clearProjectFilter: () => void }) {
  const [category, setCategory] = useState('All Projects');
  const [query, setQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [layout, setLayout] = useState('grid');
  useEffect(() => {
    if (!selectedProject) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedProject(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedProject]);
  const visible = projects.filter(project => (category === 'All Projects' || category === 'Featured' ? category !== 'Featured' || ['fileops', 'butterloft', 'incident-investigation'].includes(project.id) : project.category === category) && (`${project.name} ${project.description} ${project.technologies.join(' ')}`.toLowerCase().includes(query.toLowerCase())) && (!projectFilter || project.id === projectFilter));
  useEffect(() => { if (projectFilter) { setCategory('All Projects'); setSelectedProject(projects.find(item => item.id === projectFilter) || null); clearProjectFilter(); } }, [projectFilter, clearProjectFilter]);
  return <div className="explorer-app"><aside className="explorer-sidebar"><div className="sidebar-label">QUICK ACCESS</div>{['All Projects', 'Featured', 'AI & LLM', 'Web Development', 'Tools & Automation', 'Personal Projects'].map((item, index) => <button key={item} className={category === item ? 'sidebar-active' : ''} onClick={() => setCategory(item)}><span>{['⌂', '★', '✦', '▣', '⚙', '✿'][index]}</span>{item}</button>)}<div className="sidebar-bottom"><span>PROJECTS</span><strong>{projects.length} items</strong></div></aside>
    <div className="explorer-main"><div className="breadcrumbs">Home <span>›</span> Projects <span>›</span> {category}</div><div className="explorer-toolbar"><div><h2>{category}</h2><p>{visible.length} thoughtful builds and tools</p></div><div className="explorer-tools"><label className="explorer-search"><span>⌕</span><input placeholder="Search projects" value={query} onChange={event => setQuery(event.target.value)} /></label><button className={`view-toggle ${layout === 'grid' ? 'selected-toggle' : ''}`} onClick={() => setLayout('grid')} title="Grid view">▦</button><button className={`view-toggle ${layout === 'list' ? 'selected-toggle' : ''}`} onClick={() => setLayout('list')} title="List view">☷</button></div></div>
      <div className={`project-grid ${layout === 'list' ? 'list-layout' : ''}`}>{visible.map(project => <button className="project-card" key={project.id} onClick={() => setSelectedProject(project)}><div className={`project-visual visual-${project.id}`}><span>{project.category === 'AI & LLM' ? '✦' : project.category === 'Tools & Automation' ? '⌘' : '▣'}</span><small>{project.category}</small><div className="visual-lines"><i /><i /><i /></div></div><div className="project-card-content"><div className="project-title-row"><strong>{project.name}</strong><span>↗</span></div>{project.dates && <div className="project-dates">{project.dates}</div>}<p>{project.description}</p><div className="tag-row">{project.technologies.slice(0, 4).map(tag => <span key={tag}>{tag}</span>)}</div></div></button>)}{!visible.length && <div className="empty-state">No projects match this filter.</div>}</div>
    </div>
    {selectedProject && <div className="modal-backdrop" onPointerDown={event => { if (event.target === event.currentTarget) setSelectedProject(null); }}><article className="project-detail"><button className="modal-close" onClick={() => setSelectedProject(null)} aria-label="Close project details">×</button><div className="eyebrow">{selectedProject.category}{selectedProject.employer ? ` · ${selectedProject.employer}` : ''}{selectedProject.dates ? ` · ${selectedProject.dates}` : ''}</div><h2>{selectedProject.name}</h2><p className="detail-lead">{selectedProject.description}</p>{selectedProject.metric && <div className="metric-note">◈ {selectedProject.metric}</div>}<h3>Key features</h3><ul>{selectedProject.features.map(item => <li key={item}>{item}</li>)}</ul>{selectedProject.technologies.length > 0 && <><h3>Technology</h3><div className="tag-row">{selectedProject.technologies.map(tag => <span key={tag}>{tag}</span>)}</div></>}<div className="action-row">{selectedProject.website && <a className="primary-button" href={selectedProject.website} target="_blank" rel="noreferrer">Visit website ↗</a>}{selectedProject.github && <a className="secondary-button" href={selectedProject.github} target="_blank" rel="noreferrer">GitHub ↗</a>}{!selectedProject.website && !selectedProject.github && <span className="muted small-note">No public project link was included in the resume.</span>}</div></article></div>}
    </div>;
}

function SkillsApp({ openApp, setProjectFilter }: { openApp: (id: AppId) => void; setProjectFilter: (id: string) => void }) {
  const [category, setCategory] = useState('Languages');
  const [query, setQuery] = useState('');
  const [skill, setSkill] = useState('');
  const categories = Object.keys(skillGroups);
  const shown = (skillGroups[category] || []).filter(item => item.toLowerCase().includes(query.toLowerCase()));
  const evidence = skill ? skillUsage[skill] || [] : [];
  const openProject = (id: string) => { setProjectFilter(id); openApp('projects'); };
  const projectName = (id: string) => projects.find(item => item.id === id)?.name || id;
  const usedCount = (item: string) => (skillUsage[item] || []).length;
  const projectSkills = projects.map(project => ({ project, skills: Object.keys(skillUsage).filter(name => skillUsage[name].some(entry => entry.projectId === project.id)) })).filter(entry => entry.skills.length);
  return <div className="app-padding skills-app"><div className="skills-header"><div><div className="eyebrow">TOOLKIT</div><h2>Skills & technologies</h2><p>Select a skill to see where I used it. Skills marked ● have a documented project.</p></div><label className="explorer-search"><span>⌕</span><input placeholder="Find a skill" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
    <div className="skill-layout"><nav className="skill-categories">{categories.map((item, index) => <button className={category === item ? 'sidebar-active' : ''} key={item} onClick={() => { setCategory(item); setSkill(''); }}><span>{['⌘', '▤', '▣', '✦', '◉', '☁', '⚙', '⊙'][index]}</span>{item}</button>)}</nav>
      <div className="skill-content"><div className="eyebrow">{category.toUpperCase()}</div><div className="skills-cloud">{shown.map(item => <button key={item} className={`skill-chip ${skill === item ? 'skill-selected' : ''}`} onClick={() => setSkill(skill === item ? '' : item)}>{item}<span>{usedCount(item) ? '●' : '○'}</span></button>)}{!shown.length && <p className="muted">No skills found in this category.</p>}</div>
        <div className="skill-matrix"><div className="eyebrow">WHERE SKILLS SHOW UP</div>{projectSkills.map(({ project, skills }) => <button key={project.id} className="matrix-row" onClick={() => openProject(project.id)}><strong>{project.name}</strong><span className="tag-row">{skills.map(name => <span key={name} className={skill === name ? 'tag-hit' : ''}>{name}</span>)}</span></button>)}</div></div>
      <aside className="skill-evidence"><div className="eyebrow">WHERE I USED IT</div>{skill ? <><h3>{skill}</h3>{evidence.length ? evidence.map(entry => <button key={entry.projectId} className="evidence-card" onClick={() => openProject(entry.projectId)}><strong>{projectName(entry.projectId)} <span>↗</span></strong><p>{entry.note}</p></button>) : <p className="muted">No specific project for this skill is called out in my resume.</p>}</> : <p className="muted">Pick a skill on the left to see the projects and work where I applied it.</p>}</aside></div>
    <p className="muted small-note">Usage links come from the projects and experience described in my resume.</p></div>;
}

function ExperienceApp() {
  const [expanded, setExpanded] = useState(0);
  return <div className="app-padding experience-app"><div className="eyebrow">CAREER TIMELINE</div><h2>Experience</h2><p className="muted">Selected roles and the work behind them.</p><div className="timeline">{experience.map((item, index) => <article className="timeline-item" key={item.company}><span className="timeline-dot" /><button className="timeline-head" onClick={() => setExpanded(expanded === index ? -1 : index)}><span><strong>{item.role}</strong><small>{item.company} · {item.dates}</small></span><span>{expanded === index ? '−' : '+'}</span></button>{expanded === index && <ul>{item.details.map(detail => <li key={detail}>{detail}</li>)}</ul>}</article>)}</div><button className="secondary-button" onClick={() => setExpanded(expanded === 0 ? 1 : 0)}>Switch timeline item</button></div>;
}

function EducationApp() { return <div className="app-padding"><div className="eyebrow">LEARNING & GROWTH</div><h2>Education</h2><p className="muted">Academic foundations in computer science.</p><EducationList /><div className="notice-card">Certifications are omitted because none were included in the supplied information.</div></div>; }

function ResumeApp() {
  const resumePath = profile.resumePath;
  const [exists, setExists] = useState<boolean | null>(null);
  useEffect(() => { let live = true; fetch(resumePath, { method: 'HEAD' }).then(response => { if (live) setExists(response.ok); }).catch(() => { if (live) setExists(false); }); return () => { live = false; }; }, []);
  return <div className="resume-app"><div className="resume-toolbar"><div><span className="pdf-icon">PDF</span><span><strong>Shankhanil_Ghosh_Resume.pdf</strong><small>{exists ? 'Supplied resume' : 'Resume file not present'}</small></span></div>{exists && <div><a className="secondary-button" href={resumePath} target="_blank" rel="noreferrer">Open in new tab ↗</a><a className="primary-button" href={resumePath} download>Download</a></div>}</div>{exists ? <iframe title="Resume PDF preview" src={resumePath} /> : <div className="resume-fallback"><div className="resume-paper"><span className="pdf-icon">PDF</span><h2>Resume preview unavailable</h2><p>The supplied project folder did not contain a resume PDF. Add your actual file as <code>public/assets/resume.pdf</code> to enable preview and download.</p></div></div>}</div>;
}

function ContactApp() {
  const [fields, setFields] = useState({ name: '', email: '', subject: '', message: '' });
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!fields.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) || !fields.message.trim()) { setError('Add your name, a valid email, and a message to continue.'); return; }
    const subject = fields.subject.trim() || `Portfolio message from ${fields.name.trim()}`;
    const body = `Name: ${fields.name.trim()}\nEmail: ${fields.email.trim()}\n\n${fields.message.trim()}`;
    window.open(gmailComposeUrl(profile.email, subject, body), '_blank', 'noopener,noreferrer');
    setError('');
  };
  return <div className="contact-app app-padding"><div className="contact-intro"><div className="eyebrow">LET'S CONNECT</div><h2>Have something in mind?</h2><p>Send a note, or reach out through the details below.</p></div><div className="contact-grid"><div className="contact-details">{[['✉', 'Email', profile.email, gmailComposeUrl(profile.email)], ['☎', 'Phone', profile.phone, `tel:${profile.phone.replace(/ /g, '')}`], ['⌖', 'Location', profile.location, '']].map(([icon, label, value, href]) => <div className="contact-detail" key={label}><span>{icon}</span><div><small>{label}</small>{href ? <a href={href} target={label === 'Email' ? '_blank' : undefined} rel={label === 'Email' ? 'noreferrer' : undefined}>{value}</a> : <strong>{value}</strong>}</div></div>)}{profile.github && <a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a>}{profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}<p className="muted small-note">GitHub and LinkedIn links are hidden until configured.</p></div><form className="contact-form" onSubmit={submit}><label>Your name<input required value={fields.name} onChange={event => setFields({ ...fields, name: event.target.value })} /></label><label>Your email<input type="email" required value={fields.email} onChange={event => setFields({ ...fields, email: event.target.value })} /></label><label>Subject <span className="muted">(optional)</span><input value={fields.subject} onChange={event => setFields({ ...fields, subject: event.target.value })} /></label><label>Message<textarea required rows={3} value={fields.message} onChange={event => setFields({ ...fields, message: event.target.value })} /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" type="submit">Continue in Gmail ↗</button><p className="muted small-note">This form opens a Gmail draft addressed to {profile.email}; no message is sent or stored by this site.</p></form></div></div>;
}

const wallpapers: [string, string][] = [['kolkata', 'Kolkata dusk'], ['puja', 'Puja glow'], ['aurora', 'Aurora'], ['ocean', 'Ocean'], ['forest', 'Forest'], ['midnight', 'Midnight'], ['solid', 'Solid colour'], ['image', 'Your image']];
const accents = ['#6e9de0', '#8b7bd8', '#d9728f', '#e08a4f', '#3fae8f', '#c9a227'];
const fontLabels: [string, string][] = [['system', 'Segoe UI'], ['humanist', 'Trebuchet'], ['serif', 'Georgia'], ['wide', 'Verdana'], ['mono', 'Mono']];

function SettingsApp({ settings, setSettings }: { settings: Settings; setSettings: SetSettings }) {
  const [imageError, setImageError] = useState('');
  const swatchStyle = (id: string) => id === 'solid' ? { background: settings.solid } : id === 'image' && settings.image ? { background: `center / cover url("${settings.image}")` } : undefined;
  const upload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setImageError('Please choose an image file.'); return; }
    if (file.size > 2_000_000) { setImageError('Image is too large — please choose one under 2 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setImageError(''); setSettings({ image: String(reader.result), wallpaper: 'image' }); };
    reader.readAsDataURL(file);
  };
  return <div className="app-padding settings-app">
    <div className="eyebrow">PERSONALIZE</div><h2>Settings</h2><p className="muted">Make the desktop yours. Changes apply instantly and are saved in this browser.</p>
    <div className="settings-grid">
      <section className="settings-card"><h3>Theme</h3><div className="seg-row">{[['dark', '☾ Dark'], ['light', '☼ Light']].map(([id, label]) => <button key={id} className={settings.theme === id ? 'seg-active' : ''} onClick={() => setSettings({ theme: id })}>{label}</button>)}</div></section>
      <section className="settings-card"><h3>Accent colour</h3><div className="swatch-row"><button className={`color-dot ${!settings.accent ? 'dot-active' : ''}`} style={{ background: 'conic-gradient(#6e9de0, #d9728f, #e08a4f, #3fae8f, #6e9de0)' }} onClick={() => setSettings({ accent: '' })} title="Default" aria-label="Default accent" />{accents.map(color => <button key={color} className={`color-dot ${settings.accent === color ? 'dot-active' : ''}`} style={{ background: color }} onClick={() => setSettings({ accent: color })} aria-label={`Accent ${color}`} />)}<label className="color-picker" title="Custom colour"><input type="color" value={settings.accent || '#6e9de0'} onChange={event => setSettings({ accent: event.target.value })} />Custom</label></div></section>
      <section className="settings-card settings-wide"><h3>Wallpaper</h3><div className="wp-grid">{wallpapers.map(([id, label]) => <button key={id} className={`wp-option ${settings.wallpaper === id ? 'wp-active' : ''}`} onClick={() => setSettings({ wallpaper: id })}><span className="wp-swatch" data-wp={id} style={swatchStyle(id)} />{label}</button>)}</div>
        {settings.wallpaper === 'solid' && <label className="settings-row">Colour <input type="color" value={settings.solid} onChange={event => setSettings({ solid: event.target.value })} /></label>}
        {settings.wallpaper === 'image' && <div className="settings-row"><label className="secondary-button file-button">Upload image<input type="file" accept="image/*" onChange={event => upload(event.target.files?.[0])} /></label><input className="settings-input" placeholder="…or paste an image URL" value={settings.image.startsWith('data:') ? '' : settings.image} onChange={event => setSettings({ image: event.target.value })} />{imageError && <span className="form-error">{imageError}</span>}</div>}
      </section>
      <section className="settings-card"><h3>Font</h3><div className="seg-row seg-wrap">{fontLabels.map(([id, label]) => <button key={id} style={{ fontFamily: fontStacks[id] }} className={settings.font === id ? 'seg-active' : ''} onClick={() => setSettings({ font: id })}>{label}</button>)}</div></section>
      <section className="settings-card"><h3>Text size <span className="muted">{Math.round(settings.textSize * 100)}%</span></h3><input className="settings-range" type="range" min="0.85" max="1.5" step="0.05" value={settings.textSize} onChange={event => setSettings({ textSize: Number(event.target.value) })} aria-label="Text size" /></section>
      <section className="settings-card settings-wide"><h3>Desktop</h3><label className="toggle-row"><input type="checkbox" checked={settings.widgets} onChange={event => setSettings({ widgets: event.target.checked })} /> Show widgets</label><label className="toggle-row"><input type="checkbox" checked={settings.caption} onChange={event => setSettings({ caption: event.target.checked })} /> Show wallpaper caption</label></section>
    </div>
    <div className="action-row"><button className="secondary-button" onClick={() => setSettings('reset')}>Reset to defaults</button></div>
  </div>;
}

export default App;
