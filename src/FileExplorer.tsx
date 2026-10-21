import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { buildFileSystem, HOME_PATH, isFolderLike, nodesAlongPath, resolveNode, ROOT_PATH } from './filesystem';
import type { FsDoc, FsNode, FsPath } from './filesystem';
import type { AppId } from './data';

type ViewMode = 'grid' | 'details';
type SortKey = 'name' | 'type';
type History = { stack: FsPath[]; index: number };
type NavTarget = { label: string; icon: ReactNode; path?: FsPath; app?: AppId };

const svg = (children: ReactNode, size = 16) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
const ToolIcon = {
  back: svg(<path d="M19 12H5m6-6-6 6 6 6" />),
  forward: svg(<path d="M5 12h14m-6-6 6 6-6 6" />),
  up: svg(<path d="M12 19V5m-6 6 6-6 6 6" />),
  refresh: svg(<><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></>),
  search: svg(<><circle cx="11" cy="11" r="6" /><path d="m20 20-4.2-4.2" /></>),
  grid: svg(<><rect x="4" y="4" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" /></>),
  details: svg(<path d="M4 6h16M4 12h16M4 18h16" />),
  chevron: svg(<path d="m9 6 6 6-6 6" />, 12),
  sortAsc: svg(<path d="M12 5v14m-5-5 5 5 5-5" />, 14),
  sortDesc: svg(<path d="M12 19V5m-5 5 5-5 5 5" />, 14),
};

function FsGlyph({ icon, size = 40 }: { icon: FsNode['icon']; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 48 48', 'aria-hidden': true } as const;
  switch (icon) {
    case 'drive': return <svg {...common}><rect x="5" y="14" width="38" height="20" rx="4" fill="#8da2bd" /><rect x="5" y="14" width="38" height="8" rx="4" fill="#aebfd4" /><circle cx="36" cy="28" r="2" fill="#4cc38a" /><rect x="10" y="26" width="14" height="3" rx="1.5" fill="#566a85" /></svg>;
    case 'project': return <svg {...common}><path d="M5 12a4 4 0 0 1 4-4h9l4 4h16a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" fill="#5f8fd6" /><path d="M5 18a4 4 0 0 1 4-4h30a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" fill="#86b2ee" /><path d="m21 23-5 5 5 5m6-10 5 5-5 5" stroke="#1f3b66" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>;
    case 'user': return <svg {...common}><path d="M5 12a4 4 0 0 1 4-4h9l4 4h16a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" fill="#c9922f" /><path d="M5 18a4 4 0 0 1 4-4h30a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" fill="#f2c15a" /><circle cx="24" cy="25" r="4" fill="#8a5d16" /><path d="M16 36c1-5 4-7 8-7s7 2 8 7z" fill="#8a5d16" /></svg>;
    case 'txt': return <svg {...common}><path d="M12 5h17l9 9v27a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="#dfe7f2" /><path d="M29 5v7a2 2 0 0 0 2 2h7z" fill="#aab9cd" /><path d="M16 23h16M16 29h16M16 35h10" stroke="#6f819a" strokeWidth="2.4" strokeLinecap="round" /></svg>;
    case 'pdf': return <svg {...common}><path d="M12 5h17l9 9v27a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="#f4f6fa" /><path d="M29 5v7a2 2 0 0 0 2 2h7z" fill="#c4ccd9" /><rect x="10" y="25" width="28" height="12" rx="2" fill="#d6473f" /><text x="24" y="34.2" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#fff" fontFamily="Segoe UI, sans-serif">PDF</text></svg>;
    case 'md': return <svg {...common}><path d="M12 5h17l9 9v27a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="#dfe7f2" /><path d="M29 5v7a2 2 0 0 0 2 2h7z" fill="#aab9cd" /><rect x="10" y="25" width="28" height="12" rx="2" fill="#4f7fc8" /><text x="24" y="34.2" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#fff" fontFamily="Segoe UI, sans-serif">MD</text></svg>;
    case 'app': return <svg {...common}><rect x="8" y="8" width="32" height="32" rx="8" fill="#6f87ad" /><path d="M18 30 30 18m0 0h-8m8 0v8" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>;
    default: return <svg {...common}><path d="M5 12a4 4 0 0 1 4-4h9l4 4h16a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" fill="#c9922f" /><path d="M5 18a4 4 0 0 1 4-4h30a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" fill="#f2c15a" /></svg>;
  }
}

const sameStart = (path: FsPath, prefix: FsPath) => prefix.length <= path.length && prefix.every((id, index) => path[index] === id);
const sameExact = (a: FsPath, b: FsPath) => a.length === b.length && sameStart(a, b);

const navTargets: { section?: string; items: NavTarget[] }[] = [
  { items: [{ label: 'Home', icon: <FsGlyph icon="user" size={18} />, path: HOME_PATH }] },
  {
    section: 'Quick Access',
    items: [
      { label: 'Desktop', icon: <FsGlyph icon="folder" size={18} />, path: [...HOME_PATH, 'desktop'] },
      { label: 'Projects', icon: <FsGlyph icon="project" size={18} />, path: [...HOME_PATH, 'projects'] },
      { label: 'Experience', icon: <FsGlyph icon="folder" size={18} />, path: [...HOME_PATH, 'work-experience'] },
      { label: 'Skills', icon: <FsGlyph icon="folder" size={18} />, app: 'skills' },
      { label: 'Education', icon: <FsGlyph icon="folder" size={18} />, path: [...HOME_PATH, 'education'] },
      { label: 'Resume', icon: <FsGlyph icon="pdf" size={18} />, app: 'resume' },
      { label: 'Contact', icon: <FsGlyph icon="folder" size={18} />, app: 'contact' },
    ],
  },
  { items: [{ label: 'This PC', icon: <FsGlyph icon="drive" size={18} />, path: ROOT_PATH }] },
];

export function FileExplorer({ openApp, openProject, openDoc }: { openApp: (id: AppId) => void; openProject: (id: string) => void; openDoc: (doc: FsDoc) => void }) {
  const [version, setVersion] = useState(0);
  const [history, setHistory] = useState<History>({ stack: [HOME_PATH], index: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<ViewMode>('grid');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  const root = useMemo(() => buildFileSystem(), [version]);
  const requested = history.stack[history.index] || HOME_PATH;
  const path = resolveNode(root, requested) ? requested : HOME_PATH;
  const current = resolveNode(root, path) || root;
  const crumbs = nodesAlongPath(root, path);

  const items = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = (current.children || [])
      .filter(node => !node.hidden)
      .filter(node => !term || `${node.name} ${node.typeLabel} ${node.description}`.toLowerCase().includes(term));
    const direction = sortAsc ? 1 : -1;
    const compare = (a: FsNode, b: FsNode) => {
      const folderOrder = Number(isFolderLike(b)) - Number(isFolderLike(a));
      if (folderOrder) return folderOrder;
      const byType = sortKey === 'type' ? a.typeLabel.localeCompare(b.typeLabel, undefined, { sensitivity: 'base' }) : 0;
      if (byType) return byType * direction;
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }) * (sortKey === 'name' ? direction : 1);
    };
    return list.map((node, index) => ({ node, index })).sort((a, b) => compare(a.node, b.node) || a.index - b.index).map(entry => entry.node);
  }, [current, query, sortKey, sortAsc]);

  const folders = items.filter(isFolderLike);
  const files = items.filter(node => !isFolderLike(node));

  useEffect(() => {
    if (!selected) return;
    rootRef.current?.querySelector(`[data-fx-id="${selected}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  const navigate = (target: FsPath) => {
    if (!resolveNode(root, target)) return;
    setHistory(previous => ({ stack: [...previous.stack.slice(0, previous.index + 1), target], index: previous.index + 1 }));
    setSelected(null); setQuery('');
  };
  const go = (delta: number) => {
    const next = history.index + delta;
    if (next < 0 || next >= history.stack.length) return;
    setHistory({ ...history, index: next }); setSelected(null); setQuery('');
  };
  const up = () => { if (path.length) navigate(path.slice(0, -1)); };
  const refresh = () => setVersion(value => value + 1);

  const open = (node: FsNode) => {
    const action = node.action;
    if (action) {
      if (action.type === 'app') openApp(action.app);
      else if (action.type === 'project') openProject(action.projectId);
      else openDoc(action.doc);
    } else if (node.children) navigate([...path, node.id]);
  };
  const openTarget = (target: NavTarget) => { if (target.app) openApp(target.app); else if (target.path) navigate(target.path); };
  const targetActive = (target: NavTarget) => Boolean(target.path) && (target.path!.length <= HOME_PATH.length ? sameExact(path, target.path!) : sameStart(path, target.path!));

  const sortBy = (key: SortKey) => { if (sortKey === key) setSortAsc(value => !value); else { setSortKey(key); setSortAsc(true); } };

  const onKeyDown = (event: ReactKeyboardEvent) => {
    const typing = (event.target as HTMLElement).tagName === 'INPUT' || (event.target as HTMLElement).tagName === 'SELECT';
    if (event.key === 'Escape' && query) { setQuery(''); return; }
    if (event.altKey && event.key === 'ArrowLeft') { event.preventDefault(); go(-1); return; }
    if (event.altKey && event.key === 'ArrowRight') { event.preventDefault(); go(1); return; }
    if (event.key === 'F5') { event.preventDefault(); refresh(); return; }
    if (typing) return;
    if (event.key === 'Enter') {
      const node = items.find(item => item.id === selected);
      if (node) { event.preventDefault(); open(node); }
    } else if (event.key === 'Backspace') { event.preventDefault(); go(-1); }
    else if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key) && items.length) {
      event.preventDefault();
      const currentIndex = items.findIndex(item => item.id === selected);
      const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
      const next = currentIndex < 0 ? 0 : Math.max(0, Math.min(items.length - 1, currentIndex + step));
      setSelected(items[next].id);
    }
  };

  const itemProps = (node: FsNode) => ({
    'data-fx-id': node.id,
    role: 'option' as const,
    'aria-selected': selected === node.id,
    title: `${node.name} — ${node.typeLabel}`,
    onClick: (event: React.MouseEvent) => {
      event.stopPropagation(); setSelected(node.id);
      if (window.matchMedia('(max-width: 700px)').matches) open(node);
    },
    onDoubleClick: (event: React.MouseEvent) => { event.stopPropagation(); open(node); },
  });

  const section = (title: string, nodes: FsNode[]) => nodes.length > 0 && <section className="fx-section" key={title}>
    <h3>{title} <span>{nodes.length}</span></h3>
    <div className="fx-grid" role="listbox" aria-label={title}>
      {nodes.map(node => <button key={node.id} className={`fx-item ${selected === node.id ? 'fx-selected' : ''}`} {...itemProps(node)}><FsGlyph icon={node.icon} /><span className="fx-name">{node.name}</span></button>)}
    </div>
  </section>;

  const arrow = (key: SortKey) => sortKey === key ? <i className="fx-sort-arrow">{sortAsc ? ToolIcon.sortAsc : ToolIcon.sortDesc}</i> : null;
  const noResults = items.length === 0;

  return <div className="fx" ref={rootRef} tabIndex={0} onKeyDown={onKeyDown} onClick={() => setSelected(null)}>
    <div className="fx-toolbar" onClick={event => event.stopPropagation()}>
      <div className="fx-nav">
        <button className="fx-tool" onClick={() => go(-1)} disabled={history.index === 0} title="Back (Alt+Left)" aria-label="Back">{ToolIcon.back}</button>
        <button className="fx-tool" onClick={() => go(1)} disabled={history.index >= history.stack.length - 1} title="Forward (Alt+Right)" aria-label="Forward">{ToolIcon.forward}</button>
        <button className="fx-tool" onClick={up} disabled={path.length === 0} title="Up one level" aria-label="Up one level">{ToolIcon.up}</button>
        <button className="fx-tool" onClick={refresh} title="Refresh (F5)" aria-label="Refresh">{ToolIcon.refresh}</button>
      </div>
      <nav className="fx-address" aria-label="Address bar">
        {crumbs.map((node, index) => <span className="fx-crumb-wrap" key={`${node.id}-${index}`}>
          {index > 0 && <span className="fx-sep">{ToolIcon.chevron}</span>}
          <button className={`fx-crumb ${index === crumbs.length - 1 ? 'fx-crumb-current' : ''}`} onClick={() => navigate(path.slice(0, index))} aria-current={index === crumbs.length - 1 ? 'page' : undefined}>{node.name}</button>
        </span>)}
      </nav>
      <label className="fx-search">{ToolIcon.search}<input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${current.name}`} aria-label={`Search ${current.name}`} />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}</label>
    </div>
    <div className="fx-commandbar" onClick={event => event.stopPropagation()}>
      <label className="fx-sort">Sort
        <select value={sortKey} onChange={event => { setSortKey(event.target.value as SortKey); setSortAsc(true); }}><option value="name">Name</option><option value="type">Type</option></select>
        <button className="fx-tool" onClick={() => setSortAsc(value => !value)} title={sortAsc ? 'Ascending' : 'Descending'} aria-label={sortAsc ? 'Sort ascending' : 'Sort descending'}>{sortAsc ? ToolIcon.sortAsc : ToolIcon.sortDesc}</button>
      </label>
      <div className="fx-views" role="group" aria-label="View">
        <button className={`fx-tool ${view === 'grid' ? 'fx-on' : ''}`} onClick={() => setView('grid')} title="Icons" aria-label="Icon view" aria-pressed={view === 'grid'}>{ToolIcon.grid}</button>
        <button className={`fx-tool ${view === 'details' ? 'fx-on' : ''}`} onClick={() => setView('details')} title="Details" aria-label="Details view" aria-pressed={view === 'details'}>{ToolIcon.details}</button>
      </div>
    </div>
    <div className="fx-body">
      <aside className="fx-sidebar" onClick={event => event.stopPropagation()} aria-label="Navigation">
        {navTargets.map((group, index) => <div className="fx-nav-group" key={index}>
          {group.section && <div className="fx-nav-title">{group.section}</div>}
          {group.items.map(target => <button key={target.label} className={`fx-nav-item ${targetActive(target) ? 'fx-nav-active' : ''}`} onClick={() => openTarget(target)} aria-current={targetActive(target) ? 'page' : undefined}>{target.icon}<span>{target.label}</span></button>)}
        </div>)}
      </aside>
      <main className="fx-content">
        {noResults ? <div className="fx-empty">{query ? <><strong>No items match “{query}”.</strong><span>Clear the search to see everything in {current.name}.</span></> : <><strong>This folder is empty.</strong><span>There is nothing to show in {current.name}.</span></>}</div>
          : view === 'grid' ? <>{section('Folders', folders)}{section('Files', files)}</>
            : <div className="fx-details" role="listbox" aria-label={current.name}>
              <div className="fx-row fx-head"><button onClick={() => sortBy('name')}>Name {arrow('name')}</button><button onClick={() => sortBy('type')}>Type {arrow('type')}</button><span>Description</span></div>
              {items.map(node => <button key={node.id} className={`fx-row fx-item-row ${selected === node.id ? 'fx-selected' : ''}`} {...itemProps(node)}><span className="fx-cell-name"><FsGlyph icon={node.icon} size={20} />{node.name}</span><span className="fx-cell-type">{node.typeLabel}</span><span className="fx-cell-desc">{node.description}</span></button>)}
            </div>}
      </main>
    </div>
    <footer className="fx-status" onClick={event => event.stopPropagation()}><span>{items.length} {items.length === 1 ? 'item' : 'items'}</span>{selected && items.some(item => item.id === selected) && <span>1 item selected</span>}</footer>
  </div>;
}

export function ViewerApp({ doc }: { doc: FsDoc | null }) {
  if (!doc) return <div className="app-padding"><h2>No document open</h2><p className="muted">Open a text file from This PC to read it here.</p></div>;
  const lines = doc.body.split('\n');
  return <article className="viewer"><header><strong>{doc.title}</strong><span>{doc.format === 'markdown' ? 'Markdown' : 'Plain text'}</span></header>
    {doc.format === 'markdown'
      ? <div className="viewer-md">{lines.map((line, index) => line.startsWith('## ') ? <h2 key={index}>{line.slice(3)}</h2> : line.startsWith('# ') ? <h1 key={index}>{line.slice(2)}</h1> : line.startsWith('- ') ? <p className="viewer-li" key={index}>{line.slice(2)}</p> : line.trim() ? <p key={index}>{line}</p> : null)}</div>
      : <pre className="viewer-text">{doc.body}</pre>}
  </article>;
}
