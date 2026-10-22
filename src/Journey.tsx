import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { education, experience, profile, projects, skillGroups } from './data';
import type { AppId } from './data';

const SPRITES = {
  center: '05_look_center',
  left: '03_look_left',
  farLeft: '01_look_far_left',
  leftUp: '02_look_left_up',
  leftDown: '04_look_left_down',
  right: '07_look_right',
  rightUp: '08_look_right_up',
  rightDown: '06_look_right_down',
  up: '09_look_up',
  down: '10_look_down',
} as const;
type Look = keyof typeof SPRITES;

const spriteUrl = (name: string) => `/sprite/avatar/${name}.png`;
const MISS_FRAMES = Array.from({ length: 10 }, (_, index) => `/sprite/miss_click/${String(index + 1).padStart(2, '0')}_crossed_arms.png`);
const MISS_FRAME_MS = 110;

// Picks which of the existing avatar sprites faces the pointer, from its offset to the avatar.
function pickLook(dx: number, dy: number, reach: number): Look {
  const dist = Math.hypot(dx, dy);
  if (dist < reach * 0.08) return 'center';
  const angle = Math.atan2(-dy, dx) * 180 / Math.PI; // 0 = right, 90 = up
  const sector = ((Math.round(angle / 45) % 8) + 8) % 8;
  const far = Math.abs(dx) > reach * 0.55;
  switch (sector) {
    case 0: return 'right';
    case 1: return 'rightUp';
    case 2: return 'up';
    case 3: return 'leftUp';
    case 4: return far ? 'farLeft' : 'left';
    case 5: return 'leftDown';
    case 6: return 'down';
    default: return 'rightDown';
  }
}

type Story = { id: string; title: string; image: string; x: number; y: number; delay: number; app?: AppId; appLabel?: string };

// Positions are percentages of the stage, arranged in a ring around the avatar.
const STORIES: Story[] = [
  { id: 'about', title: 'About Me', image: '01_about_me', x: 21, y: 30, delay: 0, app: 'about', appLabel: 'Open About Me' },
  { id: 'education', title: 'Education', image: '02_education', x: 40, y: 20, delay: .4, app: 'education', appLabel: 'Open Education' },
  { id: 'career', title: 'Career', image: '03_career', x: 60, y: 20, delay: .8, app: 'experience', appLabel: 'Open Experience' },
  { id: 'projects', title: 'Projects', image: '04_projects', x: 79, y: 30, delay: 1.2, app: 'projects', appLabel: 'Open Projects Explorer' },
  { id: 'skills', title: 'Skills', image: '05_skills', x: 20, y: 70, delay: 1.6, app: 'skills', appLabel: 'Open Skills' },
  { id: 'facts', title: 'Fun Facts', image: '06_fun_facts', x: 38, y: 81, delay: 2 },
  { id: 'goals', title: 'Goals', image: '07_goals', x: 62, y: 81, delay: 2.4 },
  { id: 'contact', title: 'Contact', image: '08_contact', x: 80, y: 70, delay: 2.8, app: 'contact', appLabel: 'Open Contact' },
];

function StoryBody({ id }: { id: string }): ReactNode {
  switch (id) {
    case 'about':
      return <>
        <p className="journey-lead">{profile.name} · {profile.title}</p>
        <p>{profile.summary}</p>
        <p className="journey-muted">{profile.currentRole} at {profile.employer} · {profile.location}</p>
      </>;
    case 'education':
      return <ul className="journey-list">{education.map(item => <li key={item.degree}><strong>{item.degree}</strong><span>{item.institution}</span><em>{item.result}</em></li>)}</ul>;
    case 'career':
      return <div className="journey-stack">{experience.map(job => <section key={job.company}>
        <strong>{job.role}</strong>
        <span className="journey-muted">{job.company} · {job.dates}</span>
        <ul>{job.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
      </section>)}</div>;
    case 'projects':
      return <ul className="journey-list">{projects.map(project => <li key={project.id}><strong>{project.name}</strong><span>{project.description}</span></li>)}</ul>;
    case 'skills':
      return <div className="journey-skills">{Object.entries(skillGroups).map(([group, items]) => <section key={group}><strong>{group}</strong><div>{items.map(item => <span key={item}>{item}</span>)}</div></section>)}</div>;
    case 'facts': {
      const withMetric = projects.find(project => project.metric);
      return <ul className="journey-list">
        <li><strong>{profile.experience}</strong><span>of professional experience in software and AI.</span></li>
        <li><strong>{projects.length} projects</strong><span>across work and personal builds, listed in the Projects Explorer.</span></li>
        {withMetric && <li><strong>{withMetric.name}</strong><span>{withMetric.metric}</span></li>}
        <li><strong>Based in</strong><span>{profile.location}</span></li>
      </ul>;
    }
    case 'goals':
      return <p className="journey-muted">Goals haven't been added to this portfolio yet. They can be added in <code>src/Journey.tsx</code> when you're ready.</p>;
    case 'contact':
      return <ul className="journey-list">
        <li><strong>Email</strong><span><a href={`mailto:${profile.email}`}>{profile.email}</a></span></li>
        <li><strong>Phone</strong><span>{profile.phone}</span></li>
        <li><strong>GitHub</strong><span><a href={profile.github} target="_blank" rel="noreferrer">{profile.github}</a></span></li>
        <li><strong>LinkedIn</strong><span><a href={profile.linkedin} target="_blank" rel="noreferrer">{profile.linkedin}</a></span></li>
      </ul>;
    default:
      return null;
  }
}

// Wave sprites are mirrored and drawn behind board.png. For peeking frames, `edge` is the
// x of the sprite's cut edge (original orientation) that gets tucked under the board's right post.
const WAVE_FRAMES: { h: number; edge: number | null }[] = [
  { h: 290, edge: 237 }, { h: 290, edge: 218 }, { h: 290, edge: 198 }, { h: 290, edge: 189 }, { h: 290, edge: 176 },
  { h: 290, edge: 164 }, { h: 290, edge: 166 }, { h: 290, edge: 172 }, { h: 290, edge: 177 }, { h: 290, edge: null },
  ...Array.from({ length: 10 }, () => ({ h: 310, edge: null })),
];
const SCROLL_FRAMES = WAVE_FRAMES;
const SCROLL_FRAME_MS = 120;
const WAVE_W = 277;
const WAVE_SCALE = 1.5;
const WAVE_EDGE_X = 480;
const WAVE_STAND_LEFT = 8;
const WAVE_BOTTOM_GAP = 30;
const BOARD_H = 941;
const WRAP_W = 2100;

export function JourneyApp({ openApp }: { openApp: (id: AppId) => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const avatar = useRef<HTMLImageElement>(null);
  const missTimer = useRef<number | null>(null);
  const [look, setLook] = useState<Look>('center');
  const [missFrame, setMissFrame] = useState<number | null>(null);
  const [open, setOpen] = useState<Story | null>(null);
  const [scrollFrame, setScrollFrame] = useState(0);

  useEffect(() => {
    Object.values(SPRITES).forEach(name => { const image = new Image(); image.src = spriteUrl(name); });
    MISS_FRAMES.forEach(src => { const image = new Image(); image.src = src; });
    WAVE_FRAMES.forEach((_, i) => { const image = new Image(); image.src = `/sprite/wave/${String(i + 1).padStart(2, '0')}_wave.png`; });
    new Image().src = '/sprite/board.png';
    return () => { if (missTimer.current) window.clearInterval(missTimer.current); };
  }, []);

  const track = (clientX: number, clientY: number) => {
    if (missTimer.current) return;
    const box = avatar.current?.getBoundingClientRect();
    const area = stage.current?.getBoundingClientRect();
    if (!box || !area) return;
    setLook(pickLook(clientX - (box.left + box.width / 2), clientY - (box.top + box.height * 0.3), area.width / 2));
  };

  useEffect(() => {
    const onMove = (event: PointerEvent) => track(event.clientX, event.clientY);
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setScrollFrame(SCROLL_FRAMES.length - 1); return; }
    setScrollFrame(0);
    const timer = window.setInterval(() => setScrollFrame(frame => {
      if (frame >= SCROLL_FRAMES.length - 1) { window.clearInterval(timer); return frame; }
      return frame + 1;
    }), SCROLL_FRAME_MS);
    return () => window.clearInterval(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const playMiss = () => {
    if (missTimer.current) window.clearInterval(missTimer.current);
    let frame = 0;
    setMissFrame(0);
    missTimer.current = window.setInterval(() => {
      frame += 1;
      if (frame >= MISS_FRAMES.length) {
        window.clearInterval(missTimer.current!);
        missTimer.current = null;
        setMissFrame(null);
      } else {
        setMissFrame(frame);
      }
    }, MISS_FRAME_MS);
  };

  const onStagePointerDown = (event: ReactPointerEvent) => {
    if ((event.target as HTMLElement).closest('.journey-backdrop')) return;
    const hit = (event.target as HTMLElement).closest<HTMLElement>('[data-story]');
    const story = hit && STORIES.find(item => item.id === hit.dataset.story);
    if (story) { setOpen(story); return; }
    playMiss();
  };

  const avatarSrc = missFrame !== null ? MISS_FRAMES[missFrame] : spriteUrl(SPRITES[look]);

  return <div className="journey" ref={stage} onPointerDown={onStagePointerDown}>
    <img className="journey-bg" src="/sprite/landscape.png" alt="Pixel-art view of the Kolkata riverfront park" draggable={false} />
    {STORIES.map(story => <button key={story.id} data-story={story.id} className="journey-story" style={{ left: `${story.x}%`, top: `${story.y}%`, '--float-delay': `${story.delay}s` } as CSSProperties} aria-label={`${story.title} story`} title={story.title}>
      <img src={`/sprite/stories/${story.image}.png`} alt="" draggable={false} />
    </button>)}
    <div className="journey-avatar-wrap">
      <img ref={avatar} className="journey-avatar" src={avatarSrc} alt={missFrame !== null ? 'Avatar crossing arms: nothing to open there' : 'Pixel avatar of Shankhanil following your cursor'} draggable={false} />
    </div>
    <div className="journey-hint">{missFrame !== null ? 'Nothing there — try one of the islands.' : 'Click an island to open its story.'}</div>
    {open && <div className="journey-backdrop" onClick={event => { if (event.target === event.currentTarget) setOpen(null); }}>
      <div className="journey-board" role="dialog" aria-modal="true" aria-label={open.title} data-ready={scrollFrame >= 9}>
        {(() => {
          const f = WAVE_FRAMES[scrollFrame];
          const left = f.edge === null ? WAVE_STAND_LEFT : WAVE_EDGE_X - f.edge * WAVE_SCALE;
          const top = BOARD_H - WAVE_BOTTOM_GAP - f.h * WAVE_SCALE;
          return <img className="journey-scroll" src={`/sprite/wave/${String(scrollFrame + 1).padStart(2, '0')}_wave.png`} alt="" draggable={false}
            style={{ left: `${left / WRAP_W * 100}%`, top: `${top / BOARD_H * 100}%`, width: `${WAVE_W * WAVE_SCALE / WRAP_W * 100}%`, height: `${f.h * WAVE_SCALE / BOARD_H * 100}%` }} />;
        })()}
        <img className="journey-board-img" src="/sprite/board.png" alt="" draggable={false} />
        <div className="journey-board-content">
          <button className="journey-close" onClick={() => setOpen(null)} aria-label="Close story">X</button>
          <div className="journey-modal-body" tabIndex={0} role="region" aria-label={`${open.title} story`}><StoryBody id={open.id} /></div>
          {open.app && <footer><button onClick={() => { const id = open.app!; setOpen(null); openApp(id); }}>{open.appLabel}</button></footer>}
        </div>
      </div>
    </div>}
  </div>;
}
