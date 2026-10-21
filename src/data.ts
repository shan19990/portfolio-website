export const profile = {
  name: 'Shankhanil Ghosh',
  title: 'Generative AI & Full-Stack Engineer',
  summary: 'Generative AI and Full-Stack Engineer with 4+ years of experience building intelligent applications using Python, Java, React, and modern AI frameworks. Hands-on experience with LLM integration, prompt engineering, RAG pipelines, AI-powered automation, and scalable backend systems. Proven ability to develop end-to-end solutions that combine AI capabilities with robust software engineering practices.',
  currentRole: 'Application Reliability Engineer',
  employer: 'Tata Consultancy Services',
  experience: '4+ years',
  location: 'Kolkata, India',
  email: 'shankhanil.ghosh123@gmail.com',
  phone: '+91 8910204493',
  github: 'https://github.com/shan19990',
  linkedin: 'https://www.linkedin.com/in/shankhanil-ghosh-56b85b293/',
  resumePath: '/assets/resume.pdf',
};

export type Project = {
  id: string;
  name: string;
  category: string;
  description: string;
  technologies: string[];
  features: string[];
  employer?: string;
  website?: string;
  github?: string;
  dates?: string;
  metric?: string;
};

export const projects: Project[] = [
  {
    id: 'fileops',
    name: 'FileOps — AI File Organizer',
    category: 'AI & LLM',
    description: 'An AI-powered desktop file management system that automatically classifies, organizes, and searches local files.',
    technologies: ['Python', 'Streamlit', 'OpenAI GPT-5', 'MCP', 'ChromaDB', 'RAG'],
    dates: 'July 2026 – Present',
    github: 'https://github.com/shan19990/FileOps',
    features: ['Local MCP server for secure filesystem operations', 'Recursive file discovery and metadata extraction', 'PDF, DOCX, and TXT extraction', 'Image analysis with the OpenAI Vision API', 'RAG pipeline indexes metadata and extracted content for natural-language search and contextual Q&A across thousands of files', 'Hierarchical AI classification and automated file organization', 'Real-time processing progress, preview, and filesystem operations from a Streamlit interface'],
  },
  {
    id: 'butterloft',
    name: 'Butterloft',
    category: 'Web Development',
    description: 'An end-to-end direct-to-consumer bakery platform.',
    technologies: ['Razorpay', 'Google Analytics'],
    dates: 'December 2025 – Present',
    features: ['Product catalog, pricing, order lifecycle, and customer engagement', 'Conversion-focused responsive storefront', 'Secure Razorpay checkout, automated order confirmations, and real-time notifications', 'SKU management, shipping label generation, and courier integration', 'Production deployment with custom domain, email infrastructure, and production-grade configuration', 'Google Analytics for user behavior, traffic sources, and conversion funnels'],
    website: 'https://www.butterloft.in/',
    metric: 'Supports 10K+ concurrent users.',
  },
  {
    id: 'durgapuja',
    name: 'DurgaPuja',
    category: 'Personal Projects',
    description: 'A full-stack Durga Puja pandal discovery and route-planning platform for Kolkata.',
    technologies: ['React', 'Django', 'DigitalOcean'],
    dates: 'October 2024 – November 2025',
    features: ['Interactive map-based pandal locations and personalized travel itineraries', 'OTP, Google, and Twitter authentication', 'Pandal discovery by location, popularity, and user preferences', 'Google Analytics for engagement, peak traffic patterns, and feature usage', 'Deployment to a DigitalOcean droplet with domain and email integration via GoDaddy', 'Supported 10K+ concurrent users'],
    website: 'https://durgapujo.in',
  },
  {
    id: 'quickforms',
    name: 'QuickForms',
    category: 'Tools & Automation',
    description: 'A full-stack form management platform.',
    technologies: [],
    dates: 'July 2024',
    github: 'https://github.com/shan19990/google_form_clone/',
    features: ['Dynamic form creation and real-time response tracking', 'Admin analytics dashboard with data visualization', 'CSV and Excel exports for response analysis and reporting', 'Optimized backend queries and data handling for concurrent submissions'],
  },
  {
    id: 'rental-estimator',
    name: 'AI-Powered Rental Estimator',
    category: 'AI & LLM',
    description: 'A web platform that predicts rental prices using location, amenities, and seasonal demand.',
    technologies: ['Custom-trained machine learning model'],
    dates: 'June 2024',
    features: ['Property listings for hosts', 'Rental price prediction based on location, amenities, and seasonal demand', 'Custom-trained model forecasts rental income', 'Interface for property listings and prediction visualization'],
  },
  {
    id: 'incident-investigation',
    name: 'Agentic AI Incident Investigation',
    category: 'AI & LLM',
    description: 'An agentic AI platform that orchestrates diagnostic tools to investigate incidents and recommend evidence-backed resolutions.',
    technologies: ['Agentic AI'],
    employer: 'Tata Consultancy Services',
    features: ['Dynamically selects and orchestrates diagnostic tools', 'Historical incident retrieval', 'Log, metrics, and dependency analysis', 'Root-cause analysis', 'Evidence-backed resolution recommendations'],
  },
  {
    id: 'service-now',
    name: 'ServiceNow AI & Automation',
    category: 'Tools & Automation',
    description: 'AI-assisted ServiceNow ticket data quality and routing automation for ServiceNow and Ultimatix.',
    technologies: ['ServiceNow', 'Ultimatix'],
    employer: 'Tata Consultancy Services',
    features: ['Data Quality Validation Bot improves resolution-note quality and data reliability, and enables high-quality ML/LLM training datasets', 'Ticket Auto-Assignment Bot automates routing and improves OLA compliance through concurrency, API optimization, and database tuning', 'Validation and quality scoring detects incomplete, duplicate, and non-compliant ticket data'],
    metric: 'Processing 1,000 tickets was reduced from 30 minutes to 10 minutes.',
  },
  {
    id: 'tcs-toolkit',
    name: 'Enterprise AI & Automation Toolkit',
    category: 'Tools & Automation',
    description: 'AI agents and workflow tools delivered for enterprise incident and application reliability work.',
    technologies: ['Generative AI', 'Java', 'Python'],
    employer: 'Tata Consultancy Services',
    features: ['Log Extractor parses unstructured system and application logs to identify critical events, anomalies, and recurring failure patterns', 'TextToSQL converts natural-language queries to SQL using predefined database schemas', 'ProActDoc documents proactive incident responses, remediation actions, mitigated risks, and outcomes', 'MIMMailer drafts structured Major Incident update emails from incident transcripts and summaries', 'Gamification platform modules: incident management, learning and development, innovation tracking, and performance acceleration', 'DDQube automates client onboarding and configuration management', 'Converted the ARE ICRM framework from Java to Python and integrated Generative AI features'],
  },
];

export const skillGroups: Record<string, string[]> = {
  Languages: ['Python', 'Java', 'JavaScript', 'SQL', 'Bash/Shell Scripting'],
  'Backend Frameworks': ['Django', 'Flask', 'Spring Boot', 'REST APIs', 'Microservices'],
  Frontend: ['React.js', 'HTML5', 'CSS3', 'Tailwind CSS', 'Bootstrap'],
  'AI & LLM': ['Generative AI', 'LangChain', 'LangGraph', 'LlamaIndex', 'OpenAI API', 'RAG', 'Prompt Engineering', 'Vector Databases'],
  Databases: ['PostgreSQL', 'MySQL', 'Oracle', 'SQLite', 'Redis', 'ChromaDB'],
  'Cloud & AWS': ['AWS EC2', 'Lambda', 'S3', 'CloudWatch', 'API Gateway', 'IAM', 'SNS', 'SQS', 'EventBridge'],
  'DevOps & Infrastructure': ['Docker', 'Git', 'GitHub Actions', 'CI/CD', 'Linux', 'Gunicorn', 'Nginx'],
  Tools: ['Postman', 'DBeaver', 'VS Code', 'PyCharm'],
};

export type SkillEvidence = { projectId: string; note: string };

// Only connections stated in the resume are listed here.
export const skillUsage: Record<string, SkillEvidence[]> = {
  Python: [
    { projectId: 'fileops', note: 'Core language of the AI file organizer, with a Streamlit interface.' },
    { projectId: 'tcs-toolkit', note: 'Converted the ARE ICRM framework from Java to Python.' },
  ],
  Java: [{ projectId: 'tcs-toolkit', note: 'Original ARE ICRM framework, later converted to Python.' }],
  SQL: [
    { projectId: 'tcs-toolkit', note: 'TextToSQL turns natural-language questions into SQL over predefined schemas.' },
    { projectId: 'service-now', note: 'Database tuning for the ticket auto-assignment bot.' },
  ],
  Django: [{ projectId: 'durgapuja', note: 'Backend of the pandal discovery and route-planning platform.' }],
  'React.js': [{ projectId: 'durgapuja', note: 'Frontend with interactive map-based pandal locations.' }],
  'REST APIs': [{ projectId: 'service-now', note: 'API optimization in the ticket auto-assignment bot.' }],
  'Generative AI': [{ projectId: 'tcs-toolkit', note: 'Integrated into the ICRM framework; powers MIMMailer, ProActDoc and TextToSQL.' }],
  'OpenAI API': [{ projectId: 'fileops', note: 'GPT-5 classification and Vision API image analysis.' }],
  RAG: [{ projectId: 'fileops', note: 'Indexes metadata and content for natural-language search and Q&A across thousands of files.' }],
  'Vector Databases': [{ projectId: 'fileops', note: 'ChromaDB stores the RAG index.' }],
  ChromaDB: [{ projectId: 'fileops', note: 'Vector store behind the RAG pipeline.' }],
};

export const experience = [
  {
    company: 'Tata Consultancy Services',
    role: 'Application Reliability Engineer',
    dates: 'November 2021 – Present',
    details: ['Application Reliability Engineering Portal', 'Agentic AI incident investigation platform orchestrating historical incident retrieval, log, metrics, and dependency analysis for root-cause analysis and evidence-backed resolutions', 'ServiceNow Data Quality Validation Bot improves resolution-note quality and data reliability for ML/LLM training datasets', 'AI ticket Auto-Assignment Bot for ServiceNow and Ultimatix reduced processing for 1,000 tickets from 30 minutes to 10 minutes', 'AI validation and scoring identifies incomplete, duplicate, and non-compliant ticket data', 'ServiceNow Gamification platform for incident management, learning and development, innovation tracking, and performance acceleration', 'DDQube client onboarding and configuration management', 'Log Extractor, TextToSQL, ProActDoc, and MIMMailer', 'Converted the ARE ICRM framework from Java to Python and integrated Generative AI'],
  },
  {
    company: 'Minivet System LLP · Internship',
    role: 'Junior Software Developer',
    dates: 'January 2019 – July 2019',
    details: ['User authentication', 'Product management and order processing', 'Payment integration', 'Database optimization', 'Frontend and backend integration'],
  },
];

export const education = [
  { degree: "Bachelor's in Technology", institution: 'University of Engineering and Management Kolkata', result: 'GPA: 7.73' },
  { degree: 'High Secondary Education', institution: 'Army Public School Barrackpore', result: 'Score: 81%' },
];

export type AppId = 'terminal' | 'about' | 'projects' | 'skills' | 'experience' | 'education' | 'resume' | 'contact' | 'settings' | 'recycle' | 'pc' | 'viewer';
export const appInfo: Record<AppId, { title: string; icon: string; hint: string }> = {
  terminal: { title: 'Terminal', icon: '›_', hint: 'A command-line introduction' },
  about: { title: 'About Me', icon: '◉', hint: 'Profile and education' },
  projects: { title: 'Projects Explorer', icon: '▣', hint: 'Browse projects and tools' },
  skills: { title: 'Skills', icon: '⌘', hint: 'Technologies and tools' },
  experience: { title: 'Experience', icon: '▤', hint: 'Professional timeline' },
  education: { title: 'Education', icon: '▱', hint: 'Education and credentials' },
  resume: { title: 'Resume.pdf', icon: '▧', hint: 'Open or download resume' },
  contact: { title: 'Contact', icon: '✉', hint: 'Get in touch' },
  settings: { title: 'Settings', icon: '⚙', hint: 'Wallpaper, theme, accent and font' },
  recycle: { title: 'Recycle Bin', icon: '♲', hint: 'Nothing stored here' },
  pc: { title: 'This PC', icon: '▣', hint: 'Browse portfolio files and folders' },
  viewer: { title: 'Text Viewer', icon: '≡', hint: 'Read documents opened from This PC' },
};

export const desktopApps: AppId[] = ['pc', 'about', 'projects', 'experience', 'skills', 'resume', 'terminal', 'contact', 'settings', 'recycle'];
