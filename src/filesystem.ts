import { appInfo, desktopApps, education, experience, profile, projects, skillGroups } from './data';
import type { AppId } from './data';

export type FsIcon = 'drive' | 'folder' | 'project' | 'user' | 'txt' | 'pdf' | 'md' | 'app';
export type FsDoc = { title: string; format: 'text' | 'markdown'; body: string };
export type FsAction =
  | { type: 'app'; app: AppId }
  | { type: 'project'; projectId: string }
  | { type: 'doc'; doc: FsDoc };

export type FsNode = {
  id: string;
  name: string;
  icon: FsIcon;
  typeLabel: string;
  description: string;
  children?: FsNode[];
  action?: FsAction;
  hidden?: boolean;
};

export type FsPath = string[];

const projectFolderNames: Record<string, string> = {
  fileops: 'FileOps',
  butterloft: 'Butterloft',
  durgapuja: 'DurgaPuja',
  quickforms: 'QuickForms',
  'rental-estimator': 'RentalEstimator',
  'incident-investigation': 'AgenticIncidentInvestigation',
  'service-now': 'ServiceNowAIAutomation',
  'tcs-toolkit': 'EnterpriseAIToolkit',
};

const fileSafe = (value: string) => value.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const projectNode = (projectId: string): FsNode | null => {
  const project = projects.find(item => item.id === projectId);
  if (!project) return null;
  return {
    id: `project-${project.id}`,
    name: projectFolderNames[project.id] || fileSafe(project.name),
    icon: 'project',
    typeLabel: 'Project',
    description: project.description,
    action: { type: 'project', projectId: project.id },
  };
};

const projectNodes = (filter: (project: (typeof projects)[number]) => boolean) =>
  projects.filter(filter).map(project => projectNode(project.id)).filter((node): node is FsNode => Boolean(node));

const bulletList = (items: string[]) => items.map(item => `- ${item}`).join('\n');

const aboutDoc: FsDoc = {
  title: 'About_Me.txt',
  format: 'text',
  body: [
    profile.name,
    `${profile.title} · ${profile.location}`,
    '',
    profile.summary,
    '',
    `Current role: ${profile.currentRole}, ${profile.employer}`,
    `Experience: ${profile.experience}`,
    `Email: ${profile.email}`,
  ].join('\n'),
};

const readmeDoc: FsDoc = {
  title: 'README.md',
  format: 'markdown',
  body: [
    `# ${profile.name} — Portfolio`,
    `This portfolio is laid out like a desktop. Everything here is built from my resume: ${projects.length} projects, ${experience.length} roles, ${education.length} education entries and ${Object.values(skillGroups).flat().length} listed technologies.`,
    '## Exploring this PC',
    '- Double-click a folder to open it, and use the address bar, Back, Forward and Up to move around.',
    '- Double-click a project to read its full details.',
    '- Work Experience holds one folder per employer, with the role and responsibilities.',
    '- Technical Skills opens the Skills app, where you can see which projects used each skill.',
    '- Resume.pdf opens the resume viewer, and Contact opens the contact form.',
    '## Elsewhere on the desktop',
    '- Terminal: type help for commands such as open projects.',
    '- Settings: change the wallpaper, theme, accent colour and font.',
    '## Note',
    'This is a browser-based virtual file system. It does not access any files on your computer.',
  ].join('\n'),
};

const experienceNode = (item: (typeof experience)[number], index: number): FsNode => {
  const company = item.company.split(' · ')[0];
  const employment = item.company.split(' · ')[1];
  const doc: FsDoc = {
    title: 'Role_and_Responsibilities.txt',
    format: 'text',
    body: [`${item.role}`, `${company}${employment ? ` (${employment})` : ''}`, item.dates, '', bulletList(item.details)].join('\n'),
  };
  return {
    id: `experience-${index}`,
    name: company,
    icon: 'folder',
    typeLabel: 'File folder',
    description: `${item.role} · ${item.dates}`,
    children: [
      { id: `experience-${index}-role`, name: doc.title, icon: 'txt', typeLabel: 'Text Document', description: `${item.role}, ${item.dates}`, action: { type: 'doc', doc } },
      ...projectNodes(project => project.employer === company),
    ],
  };
};

const educationNodes = (): FsNode[] => education.map((item, index) => {
  const doc: FsDoc = { title: `${fileSafe(item.degree)}.txt`, format: 'text', body: [item.degree, item.institution, item.result].join('\n') };
  return { id: `education-${index}`, name: doc.title, icon: 'txt', typeLabel: 'Text Document', description: `${item.institution} · ${item.result}`, action: { type: 'doc', doc } };
});

const desktopNodes = (): FsNode[] => desktopApps.filter(app => app !== 'pc').map(app => ({
  id: `desktop-${app}`,
  name: `${appInfo[app].title}`,
  icon: 'app',
  typeLabel: 'Shortcut',
  description: appInfo[app].hint,
  action: { type: 'app', app },
}));

export const buildFileSystem = (): FsNode => {
  const home: FsNode = {
    id: 'shankhanil',
    name: 'Shankhanil',
    icon: 'user',
    typeLabel: 'File folder',
    description: 'Portfolio home folder',
    children: [
      { id: 'desktop', name: 'Desktop', icon: 'folder', typeLabel: 'File folder', description: 'Shortcuts to the desktop applications', hidden: true, children: desktopNodes() },
      { id: 'projects', name: 'Projects', icon: 'folder', typeLabel: 'File folder', description: `${projects.length} projects`, children: projectNodes(() => true) },
      { id: 'work-experience', name: 'Work Experience', icon: 'folder', typeLabel: 'File folder', description: 'Employment history', children: experience.map(experienceNode) },
      { id: 'technical-skills', name: 'Technical Skills', icon: 'folder', typeLabel: 'File folder', description: 'Opens the Skills app', action: { type: 'app', app: 'skills' } },
      { id: 'education', name: 'Education', icon: 'folder', typeLabel: 'File folder', description: 'Academic background', children: educationNodes() },
      { id: 'personal', name: 'Personal', icon: 'folder', typeLabel: 'File folder', description: 'Personal projects', children: projectNodes(project => project.category === 'Personal Projects') },
      { id: 'contact', name: 'Contact', icon: 'folder', typeLabel: 'File folder', description: 'Opens the Contact app', action: { type: 'app', app: 'contact' } },
      { id: 'about-me', name: 'About_Me.txt', icon: 'txt', typeLabel: 'Text Document', description: 'Profile summary', action: { type: 'doc', doc: aboutDoc } },
      { id: 'resume', name: 'Resume.pdf', icon: 'pdf', typeLabel: 'PDF Document', description: 'Opens the resume viewer', action: { type: 'app', app: 'resume' } },
      { id: 'readme', name: 'README.md', icon: 'md', typeLabel: 'Markdown Document', description: 'How to explore this portfolio', action: { type: 'doc', doc: readmeDoc } },
    ],
  };
  return {
    id: 'this-pc',
    name: 'This PC',
    icon: 'folder',
    typeLabel: 'System folder',
    description: 'Virtual file system',
    children: [{
      id: 'c-drive', name: 'Local Disk (C:)', icon: 'drive', typeLabel: 'Local Disk', description: 'Virtual portfolio drive',
      children: [{ id: 'users', name: 'Users', icon: 'folder', typeLabel: 'File folder', description: 'User profiles', children: [home] }],
    }],
  };
};

export const HOME_PATH: FsPath = ['c-drive', 'users', 'shankhanil'];
export const ROOT_PATH: FsPath = [];

export const resolveNode = (root: FsNode, path: FsPath): FsNode | null => {
  let node: FsNode = root;
  for (const id of path) {
    const next = node.children?.find(child => child.id === id);
    if (!next) return null;
    node = next;
  }
  return node;
};

export const nodesAlongPath = (root: FsNode, path: FsPath): FsNode[] => {
  const nodes: FsNode[] = [root];
  let node: FsNode = root;
  for (const id of path) {
    const next = node.children?.find(child => child.id === id);
    if (!next) break;
    nodes.push(next);
    node = next;
  }
  return nodes;
};

export const isFolderLike = (node: FsNode) => node.icon === 'folder' || node.icon === 'drive' || node.icon === 'project' || node.icon === 'user';
