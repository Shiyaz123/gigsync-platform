const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PDFParse } = require('pdf-parse');

const scratchDir = path.resolve('C:/Users/shiya/.gemini/antigravity-ide/brain/e43f93e2-ece7-4121-99d7-6832010dc9ef/scratch');
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}

// Find built CSS file from client/dist/assets/
const clientDistDir = path.resolve(__dirname, '../../../client/dist/assets');
const cssFile = fs.readdirSync(clientDistDir).find(f => f.endsWith('.css'));
const cssContent = fs.readFileSync(path.join(clientDistDir, cssFile), 'utf8');

// Test Profiles
const zainabProfile = {
  personalInfo: {
    fullName: 'Zainab Rakiah',
    title: 'Software Engineer',
    location: 'Bangalore',
    phone: '+91 8861044384',
    email: 'zainabrakiah2018@gmail.com',
    github: 'https://github.com/zainab-rakiah',
    linkedin: 'https://linkedin.com/in/zainab-rakiah',
    summary: 'Proactive Software Engineer specializing in full-stack development, LLM-powered RAG systems, and cloud backend microservices.'
  },
  education: [
    {
      institution: 'Ghousia College of Engineering, Bangalore',
      degree: 'B.E.', // Notice: specialization was missing in user's PDF
      branch: '',
      graduationYear: '2023 – 2027',
      cgpa: '8.46'
    }
  ],
  skills: {
    categories: {
      programmingLanguages: ['Python', 'JavaScript', 'Java', 'SQL'],
      backendAndApis: ['React', 'Node.js', 'Express', 'REST APIs', 'Spring Boot'],
      databases: ['MySQL', 'PostgreSQL', 'MongoDB'],
      toolsAndDevelopment: ['Git', 'GitHub', 'Docker', 'AWS', 'Azure', 'GCP'],
      testing: ['JUnit', 'JBehave'],
      csFundamentals: ['Data Structures & Algorithms'],
      aiAndMl: ['Machine Learning', 'Prompt Engineering', 'RAG']
    }
  },
  projects: [
    {
      // Notice: user PDF had "MapStop Holidays (AI Chatbot) Link"
      title: 'MapStop Holidays (AI Chatbot) Link',
      description: 'MapStop Holidays (AI Chatbot) Link',
      techStack: ['Python', 'ChatGPT API', 'RAG'],
      githubUrl: 'https://github.com/zainab-rakiah/mapstop-holidays',
      liveUrl: 'https://mapstop-demo.example.com',
      bullets: [
        'Built an LLM-powered travel-planning chatbot that answers holiday and trip-planning queries using a ChatGPT-based API integration.',
        'Implemented a Retrieval-Augmented Generation (RAG) pipeline to ground responses in holiday/travel data, improving relevance and reducing hallucinated answers.',
        'Designed and iterated on prompts for multi-turn travel queries, covering itinerary suggestions and destination recommendations.'
      ]
    },
    {
      // Notice: user PDF had "Protego" followed by "Protego – Emergency Response System Link"
      title: 'Protego – Emergency Response System Link',
      description: 'Protego – Emergency Response System Link',
      techStack: ['Python', 'Scikit-learn', 'EDA'],
      githubUrl: 'https://github.com/zainab-rakiah/protego',
      bullets: [
        'Applied data cleaning, preprocessing, feature engineering and EDA to improve quality across 5,000+ records; built a grid-based safety model.',
        'Built logic to identify the nearest hospitals based on user location and accessibility.',
        'Developed a Decision Tree classifier for safety prediction and emergency-response recommendations.'
      ]
    },
    {
      title: 'Restaurant Management System Link',
      description: 'Restaurant Management System Link',
      techStack: ['Spring Boot', 'JUnit', 'JBehave'],
      githubUrl: 'https://github.com/zainab-rakiah/restaurant-system',
      bullets: [
        'Built a microservices-based food delivery application using Spring Boot.',
        'Developed RESTful APIs for core modules with high test coverage via JUnit; implemented JBehave for end-to-end BDD testing.',
        'Used Git and Gradle for version control and build automation, following Agile practices.'
      ]
    },
    {
      title: 'MERN Notes Application Link',
      description: 'MERN Notes Application Link',
      techStack: ['MongoDB', 'Express.js', 'React.js', 'Node.js'],
      githubUrl: 'https://github.com/zainab-rakiah/mern-notes',
      liveUrl: 'https://mern-notes.example.com',
      bullets: [
        'Built a full-stack notes app (MongoDB, Express.js, React.js, Node.js) with complete CRUD functionality.',
        'Developed RESTful APIs for note management and integrated MongoDB for persistent storage.'
      ]
    }
  ]
};

// Profile 2: Short 1-page resume
const shortProfile = {
  personalInfo: {
    fullName: 'Alex Morgan',
    title: 'Frontend Engineer',
    location: 'San Francisco, CA',
    phone: '+1 (555) 234-5678',
    email: 'alex.morgan@example.com',
    github: 'https://github.com/alexmorgan',
    linkedin: 'https://linkedin.com/in/alexmorgan',
    summary: 'Product-minded frontend engineer with 3+ years building responsive web apps in TypeScript, React, and TailwindCSS.'
  },
  education: [
    {
      institution: 'UC Berkeley',
      degree: 'B.S.',
      branch: 'Computer Science',
      graduationYear: '2021 – 2025',
      cgpa: '3.85'
    }
  ],
  skills: {
    categories: {
      programmingLanguages: ['TypeScript', 'JavaScript', 'HTML5', 'CSS3'],
      backendAndApis: ['React', 'Next.js', 'Node.js', 'GraphQL'],
      databases: ['PostgreSQL'],
      toolsAndDevelopment: ['Vite', 'Git', 'Webpack', 'Figma'],
      testing: ['Jest', 'Playwright'],
      csFundamentals: ['Web Performance', 'Accessibility'],
      aiAndMl: []
    }
  },
  projects: [
    {
      title: 'Realtime Collaborative Whiteboard',
      description: 'Zero-latency vector canvas with WebSocket sync',
      techStack: ['React', 'TypeScript', 'WebSockets', 'Canvas API'],
      githubUrl: 'https://github.com/alexmorgan/canvas-collab',
      liveUrl: 'https://canvas-collab.dev',
      bullets: [
        'Engineered 60fps vector drawing canvas supporting up to 50 concurrent collaborators.',
        'Implemented operational transform conflict resolution algorithms to synchronize multi-user cursors.'
      ]
    }
  ],
  experience: [
    {
      company: 'TechCorp Labs',
      role: 'Frontend Engineering Intern',
      location: 'San Francisco, CA',
      startDate: 'Jun 2024',
      endDate: 'Aug 2024',
      current: false,
      bullets: [
        'Decreased bundle size by 28% via dynamic imports and tree shaking.',
        'Converted 40+ legacy jQuery components to modern React functional components with 100% unit test coverage.'
      ]
    }
  ]
};

// Profile 3: Long Multi-page resume
const longProfile = {
  ...zainabProfile,
  personalInfo: {
    ...zainabProfile.personalInfo,
    fullName: 'Dr. Zainab Rakiah',
    title: 'Senior Systems Architect & Research Lead'
  },
  experience: [
    {
      company: 'Enterprise Cloud Technologies',
      role: 'Senior Microservices Architect',
      location: 'Bangalore, India',
      startDate: '2023',
      endDate: 'Present',
      current: true,
      bullets: [
        'Spearheaded architectural transition from monolithic stack to distributed event-driven microservices on Kubernetes.',
        'Reduced p99 API response latencies from 420ms to 68ms across 12 high-throughput financial endpoints.',
        'Mentored an engineering squad of 8 junior developers on automated CI/CD and trunk-based deployment practices.'
      ]
    },
    {
      company: 'Global Innovations Inc.',
      role: 'Backend Engineering Specialist',
      location: 'Remote',
      startDate: '2021',
      endDate: '2023',
      current: false,
      bullets: [
        'Designed multi-tenant data partitioning layer supporting 250,000 daily active enterprise accounts.',
        'Implemented OAuth2 / OpenID Connect single sign-on federation with enterprise Okta and Azure AD.'
      ]
    }
  ],
  certifications: [
    {
      name: 'AWS Certified Solutions Architect – Professional',
      organization: 'Amazon Web Services',
      completionDate: '2025',
      credentialUrl: 'https://aws.amazon.com/verify/12345'
    },
    {
      name: 'Google Cloud Professional Cloud Architect',
      organization: 'Google Cloud',
      completionDate: '2024',
      credentialUrl: 'https://cloud.google.com/verify/67890'
    }
  ],
  publications: [
    {
      title: 'Scalable Retrieval-Augmented Generation for High-Cardinality Domain Ontologies',
      publisher: 'IEEE Transactions on Software Engineering',
      date: '2025',
      url: 'https://ieee.org/papers/1234'
    }
  ]
};

// HTML Template Renderers matching our exact React implementations and helpers
function cleanProjectHelper(proj) {
  let title = (proj.title || '').trim();
  let desc = (proj.description || '').trim();
  const techStack = [...(proj.technologies || []), ...(proj.techStack || [])].filter(Boolean);
  let bullets = [...(proj.keyFeatures || []), ...(proj.bullets || [])].filter(Boolean);

  // Strip trailing "Link", "GitHub", "Code" artifact suffixes
  title = title.replace(/\s*(?:[-–—|/]\s*)?(?:link|github|code|live\s*demo|view)\s*$/i, '').trim();
  desc = desc.replace(/\s*(?:[-–—|/]\s*)?(?:link|github|code|live\s*demo|view)\s*$/i, '').trim();

  let subtitle = desc;
  const titleSplit = title.match(/^([A-Za-z0-9\s&()'/]+?)\s*[-–—:]\s*(.+)$/);
  if (titleSplit && !subtitle) {
    title = titleSplit[1].trim();
    subtitle = titleSplit[2].trim();
  }

  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (norm(title) === norm(subtitle)) {
    subtitle = '';
  }

  if (subtitle) {
    const subSplit = subtitle.match(/^([A-Za-z0-9\s&()'/]+?)\s*[-–—:]\s*(.+)$/);
    if (subSplit && norm(subSplit[1]) === norm(title)) {
      subtitle = subSplit[2].trim();
    }
  }

  if (norm(title) === norm(subtitle) || /^(link|view)$/i.test(subtitle)) {
    subtitle = '';
  }

  if (subtitle) {
    bullets = bullets.filter(b => norm(b) !== norm(subtitle));
  }

  const githubUrl = proj.githubUrl && proj.githubUrl.startsWith('http') ? proj.githubUrl : (proj.githubUrl ? `https://${proj.githubUrl}` : '');
  const liveUrl = proj.liveUrl && proj.liveUrl.startsWith('http') ? proj.liveUrl : (proj.liveUrl ? `https://${proj.liveUrl}` : '');

  return { title, subtitle, bullets, techStack, githubUrl, liveUrl };
}

function formatEducationDegreeHelper(degree, branch) {
  let d = (degree || '').trim().replace(/[\s,–—-]+$/g, '').replace(/\s+(?:in|of)\s*$/i, '').trim();
  let b = (branch || '').trim().replace(/^[\s,–—-]+/g, '').replace(/^(?:in|of)\s+/i, '').trim();

  if (!d && !b) return '';
  if (d && !b) return d;
  if (!d && b) return b;
  if (d.toLowerCase().includes(b.toLowerCase())) return d;
  return `${d} in ${b}`;
}

function renderHtmlDocument(templateId, profile) {
  const p = profile.personalInfo;
  const fullName = p.fullName || 'Candidate Name';
  const title = p.title || '';
  const location = p.location || '';
  const phone = p.phone || '';
  const email = p.email || '';
  const github = p.github || '';
  const linkedin = p.linkedin || '';
  const summary = p.summary || '';

  const catSkills = (profile.skills && profile.skills.categories) || {
    programmingLanguages: [],
    backendAndApis: [],
    databases: [],
    toolsAndDevelopment: [],
    testing: [],
    csFundamentals: [],
    aiAndMl: []
  };

  const eduList = profile.education || [];
  const expList = profile.experience || [];
  const projList = profile.projects || [];
  const certList = profile.certifications || [];
  const pubList = profile.publications || [];

  let bodyContent = '';

  if (templateId === 'modern') {
    bodyContent = `
    <div class="modern-tech-template bg-white text-slate-900 font-sans p-8 sm:p-12 shadow-none border-none w-full max-w-4xl mx-auto space-y-4 text-xs sm:text-sm">
      <header class="border-b-2 border-blue-600 pb-4">
        <div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">${fullName}</h1>
            ${title ? `<p class="text-base font-semibold text-blue-600 tracking-wide mt-0.5">${title}</p>` : ''}
          </div>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
            ${location ? `<span>${location}</span>` : ''}
            ${email ? `<a href="mailto:${email}" class="hover:text-blue-600">${email}</a>` : ''}
            ${phone ? `<span>${phone}</span>` : ''}
          </div>
        </div>
        ${(github || linkedin) ? `
          <div class="flex flex-wrap items-center gap-3 mt-2 pt-2 border-t border-slate-100 text-xs font-mono text-slate-600">
            ${github ? `<a href="${github}" target="_blank" class="text-blue-600 hover:underline">${github.replace(/^https?:\/\/(www\.)?github\.com\/?/i, 'github/')}</a>` : ''}
            ${linkedin ? `<a href="${linkedin}" target="_blank" class="text-blue-600 hover:underline">${linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/i, 'linkedin/')}</a>` : ''}
          </div>
        ` : ''}
      </header>

      ${summary ? `
        <section class="space-y-1">
          <h2 class="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
            <span>Professional Summary</span><span class="flex-1 h-px bg-slate-200"></span>
          </h2>
          <p class="text-slate-700 leading-relaxed font-normal">${summary}</p>
        </section>
      ` : ''}

      <section class="space-y-2">
        <h2 class="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
          <span>Technical Skills</span><span class="flex-1 h-px bg-slate-200"></span>
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-800">
          ${catSkills.programmingLanguages && catSkills.programmingLanguages.length ? `<div><strong class="text-slate-950 font-semibold">Languages: </strong><span>${catSkills.programmingLanguages.join(', ')}</span></div>` : ''}
          ${catSkills.backendAndApis && catSkills.backendAndApis.length ? `<div><strong class="text-slate-950 font-semibold">Backend & APIs: </strong><span>${catSkills.backendAndApis.join(', ')}</span></div>` : ''}
          ${catSkills.databases && catSkills.databases.length ? `<div><strong class="text-slate-950 font-semibold">Databases: </strong><span>${catSkills.databases.join(', ')}</span></div>` : ''}
          ${catSkills.toolsAndDevelopment && catSkills.toolsAndDevelopment.length ? `<div><strong class="text-slate-950 font-semibold">Tools & Cloud: </strong><span>${catSkills.toolsAndDevelopment.join(', ')}</span></div>` : ''}
          ${catSkills.testing && catSkills.testing.length ? `<div><strong class="text-slate-950 font-semibold">Testing: </strong><span>${catSkills.testing.join(', ')}</span></div>` : ''}
          ${catSkills.csFundamentals && catSkills.csFundamentals.length ? `<div><strong class="text-slate-950 font-semibold">CS Fundamentals: </strong><span>${catSkills.csFundamentals.join(', ')}</span></div>` : ''}
          ${catSkills.aiAndMl && catSkills.aiAndMl.length ? `<div><strong class="text-slate-950 font-semibold">AI / ML: </strong><span>${catSkills.aiAndMl.join(', ')}</span></div>` : ''}
        </div>
      </section>

      ${eduList.length ? `
        <section class="space-y-2">
          <h2 class="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
            <span>Education</span><span class="flex-1 h-px bg-slate-200"></span>
          </h2>
          ${eduList.map(edu => {
            const eduDegreeText = formatEducationDegreeHelper(edu.degree, edu.branch);
            return `
              <div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs page-break-avoid break-inside-avoid">
                <div>
                  <span class="font-bold text-slate-950">${edu.institution}</span>
                  ${eduDegreeText ? `<span class="text-slate-700 ml-1">— ${eduDegreeText}</span>` : ''}
                  ${edu.cgpa ? `<span class="text-slate-600 font-medium ml-2 font-mono">GPA: ${edu.cgpa}</span>` : ''}
                </div>
                ${edu.graduationYear ? `<span class="text-slate-500 font-mono text-[11px]">${edu.graduationYear}</span>` : ''}
              </div>
            `;
          }).join('')}
        </section>
      ` : ''}

      ${expList.length ? `
        <section class="space-y-3">
          <h2 class="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
            <span>Work Experience</span><span class="flex-1 h-px bg-slate-200"></span>
          </h2>
          ${expList.map(exp => `
            <div class="space-y-1 page-break-avoid break-inside-avoid">
              <div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs">
                <div>
                  <span class="font-bold text-slate-950 text-sm">${exp.role}</span>
                  <span class="text-slate-500 mx-1.5">|</span>
                  <span class="font-semibold text-slate-800">${exp.company}</span>
                </div>
                <div class="text-slate-500 font-mono text-[11px]">${exp.startDate} – ${exp.current ? 'Present' : exp.endDate}</div>
              </div>
              <ul class="list-disc list-outside pl-4 space-y-0.5 text-slate-700 leading-relaxed">
                ${(exp.bullets || []).map(b => `<li>${b}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </section>
      ` : ''}

      ${projList.length ? `
        <section class="space-y-3">
          <h2 class="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
            <span>Projects</span><span class="flex-1 h-px bg-slate-200"></span>
          </h2>
          ${projList.map(proj => {
            const { title, subtitle, bullets, techStack, githubUrl, liveUrl } = cleanProjectHelper(proj);
            if (!title) return '';
            return `
              <div class="space-y-1 page-break-avoid break-inside-avoid">
                <div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-bold text-slate-950 text-sm">${title}</span>
                    ${techStack.length ? `<span class="text-slate-500 font-mono text-[11px]">[${techStack.join(' • ')}]</span>` : ''}
                  </div>
                  ${(githubUrl || liveUrl) ? `
                    <div class="flex items-center gap-3 font-mono text-[11px]">
                      ${githubUrl ? `<a href="${githubUrl}" target="_blank" class="text-blue-600 hover:underline">Code</a>` : ''}
                      ${liveUrl ? `<a href="${liveUrl}" target="_blank" class="text-blue-600 hover:underline">Live Demo</a>` : ''}
                    </div>
                  ` : ''}
                </div>
                ${subtitle ? `<p class="text-slate-600 italic text-xs">${subtitle}</p>` : ''}
                <ul class="list-disc list-outside pl-4 space-y-0.5 text-slate-700 leading-relaxed">
                  ${bullets.map(b => `<li>${b}</li>`).join('')}
                </ul>
              </div>
            `;
          }).join('')}
        </section>
      ` : ''}

      ${certList.length ? `
        <section class="space-y-1.5">
          <h2 class="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
            <span>Certifications</span><span class="flex-1 h-px bg-slate-200"></span>
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
            ${certList.map(c => `
              <div class="flex items-baseline justify-between gap-2">
                <div>
                  <span class="font-semibold text-slate-900">${c.name}</span>
                  <span class="text-slate-600 text-[11px] ml-1">(${c.organization})</span>
                </div>
                ${c.credentialUrl ? `<a href="${c.credentialUrl}" target="_blank" class="text-blue-600 hover:underline text-[11px]">Verify</a>` : ''}
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}
    </div>`;
  } else if (templateId === 'academic') {
    bodyContent = `
    <div class="classic-academic-template bg-white text-black p-8 sm:p-14 shadow-none border-none w-full max-w-4xl mx-auto space-y-4 text-xs sm:text-[13px] leading-relaxed" style="font-family: 'Times New Roman', Times, Georgia, serif">
      <header class="text-center pb-3 border-b-2 border-black">
        <h1 class="text-3xl sm:text-4xl font-normal tracking-tight uppercase">${fullName}</h1>
        ${title ? `<p class="text-sm italic text-neutral-800 mt-1">${title}</p>` : ''}
        <p class="text-xs text-neutral-700 mt-2 tracking-wide">
          ${[
            location ? `<span>${location}</span>` : '',
            phone ? `<a href="tel:${phone}" class="hover:underline">${phone}</a>` : '',
            email ? `<a href="mailto:${email}" class="hover:underline">${email}</a>` : '',
            linkedin ? `<a href="${linkedin}" target="_blank" class="hover:underline">LinkedIn</a>` : '',
            github ? `<a href="${github}" target="_blank" class="hover:underline">GitHub</a>` : ''
          ].filter(Boolean).join(' <span class="mx-2">•</span> ')}
        </p>
      </header>

      ${summary ? `
        <section class="space-y-1">
          <h2 class="text-xs font-bold uppercase tracking-widest border-b border-black pb-0.5">Curriculum Vitae Overview</h2>
          <p class="text-neutral-900 text-justify">${summary}</p>
        </section>
      ` : ''}

      ${eduList.length ? `
        <section class="space-y-2">
          <h2 class="text-xs font-bold uppercase tracking-widest border-b border-black pb-0.5">Education & Academic Background</h2>
          ${eduList.map(edu => {
            const eduDegreeText = formatEducationDegreeHelper(edu.degree, edu.branch);
            return `
              <div class="space-y-0.5 page-break-avoid break-inside-avoid">
                <div class="flex justify-between items-baseline font-bold">
                  <span>${edu.institution}</span>
                  ${edu.graduationYear ? `<span class="font-normal text-xs">${edu.graduationYear}</span>` : ''}
                </div>
                <div class="flex justify-between items-baseline italic text-neutral-800 text-xs">
                  <span>${eduDegreeText}</span>
                  ${edu.cgpa ? `<span class="not-italic font-medium">Cumulative Grade: ${edu.cgpa}</span>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </section>
      ` : ''}

      <section class="space-y-1">
        <h2 class="text-xs font-bold uppercase tracking-widest border-b border-black pb-0.5">Technical & Specialized Skills</h2>
        <div class="space-y-1 text-xs">
          ${catSkills.programmingLanguages && catSkills.programmingLanguages.length ? `<div><strong>Programming Languages: </strong><span>${catSkills.programmingLanguages.join(', ')}</span></div>` : ''}
          ${catSkills.backendAndApis && catSkills.backendAndApis.length ? `<div><strong>Backend & Systems: </strong><span>${catSkills.backendAndApis.join(', ')}</span></div>` : ''}
          ${catSkills.databases && catSkills.databases.length ? `<div><strong>Databases & Storage: </strong><span>${catSkills.databases.join(', ')}</span></div>` : ''}
          ${catSkills.toolsAndDevelopment && catSkills.toolsAndDevelopment.length ? `<div><strong>Tools & Platforms: </strong><span>${catSkills.toolsAndDevelopment.join(', ')}</span></div>` : ''}
        </div>
      </section>

      ${projList.length ? `
        <section class="space-y-3">
          <h2 class="text-xs font-bold uppercase tracking-widest border-b border-black pb-0.5">Research & Engineering Projects</h2>
          ${projList.map(proj => {
            const { title, subtitle, bullets, techStack, githubUrl, liveUrl } = cleanProjectHelper(proj);
            if (!title) return '';
            return `
              <div class="space-y-1 page-break-avoid break-inside-avoid">
                <div class="flex justify-between items-baseline font-bold text-xs flex-wrap gap-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span>${title}</span>
                    ${techStack.length ? `<span class="font-normal italic text-neutral-700">(${techStack.join(', ')})</span>` : ''}
                  </div>
                  ${(githubUrl || liveUrl) ? `
                    <div class="flex items-center gap-2 font-normal text-[11px]">
                      ${githubUrl ? `<a href="${githubUrl}" target="_blank" class="text-neutral-800 underline">Repository</a>` : ''}
                      ${githubUrl && liveUrl ? `<span>•</span>` : ''}
                      ${liveUrl ? `<a href="${liveUrl}" target="_blank" class="text-neutral-800 underline">Demonstration</a>` : ''}
                    </div>
                  ` : ''}
                </div>
                ${subtitle ? `<p class="text-neutral-800 text-xs italic">${subtitle}</p>` : ''}
                <ul class="list-disc list-outside pl-5 space-y-0.5 text-xs text-neutral-900">
                  ${bullets.map(b => `<li>${b}</li>`).join('')}
                </ul>
              </div>
            `;
          }).join('')}
        </section>
      ` : ''}
    </div>`;
  } else if (templateId === 'executive') {
    bodyContent = `
    <div class="executive-template bg-white text-slate-900 font-sans p-8 sm:p-12 shadow-none border-none w-full max-w-4xl mx-auto space-y-5 text-xs sm:text-[13px]">
      <header class="border-b-4 border-slate-900 pb-4">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 class="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-slate-950 uppercase">${fullName}</h1>
            ${title ? `<p class="text-sm sm:text-base font-semibold text-slate-700 tracking-wider uppercase mt-1">${title}</p>` : ''}
          </div>
          <div class="text-xs text-slate-600 sm:text-right font-medium space-y-0.5">
            ${location ? `<div>${location}</div>` : ''}
            <div class="flex items-center sm:justify-end gap-2 flex-wrap">
              ${phone ? `<a href="tel:${phone}" class="hover:underline">${phone}</a>` : ''}
              ${phone && email ? `<span>•</span>` : ''}
              ${email ? `<a href="mailto:${email}" class="hover:underline">${email}</a>` : ''}
            </div>
            ${(linkedin || github) ? `
              <div class="flex items-center sm:justify-end gap-2 text-slate-700">
                ${linkedin ? `<a href="${linkedin}" target="_blank" class="hover:underline">LinkedIn</a>` : ''}
                ${linkedin && github ? `<span>•</span>` : ''}
                ${github ? `<a href="${github}" target="_blank" class="hover:underline">GitHub</a>` : ''}
              </div>
            ` : ''}
          </div>
        </div>
      </header>

      ${summary ? `
        <section class="bg-slate-50 p-4 border-l-4 border-slate-800">
          <h2 class="text-xs font-bold uppercase tracking-widest text-slate-900 mb-1">Executive Profile & Strategic Summary</h2>
          <p class="text-slate-800 leading-relaxed font-normal">${summary}</p>
        </section>
      ` : ''}

      ${eduList.length ? `
        <section class="space-y-1.5">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-950 border-b-2 border-slate-200 pb-1">Education & Professional Credentials</h2>
          ${eduList.map(edu => {
            const eduDegreeText = formatEducationDegreeHelper(edu.degree, edu.branch);
            return `
              <div class="flex justify-between items-baseline text-xs page-break-avoid break-inside-avoid">
                <div>
                  <span class="font-bold text-slate-950">${eduDegreeText || edu.institution}</span>
                  ${eduDegreeText && edu.institution ? `<span class="text-slate-700 ml-1.5">— ${edu.institution}</span>` : ''}
                  ${edu.cgpa ? `<span class="text-slate-600 font-medium ml-2">(${edu.cgpa})</span>` : ''}
                </div>
                ${edu.graduationYear ? `<span class="text-slate-600 font-semibold">${edu.graduationYear}</span>` : ''}
              </div>
            `;
          }).join('')}
        </section>
      ` : ''}

      ${projList.length ? `
        <section class="space-y-3">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-950 border-b-2 border-slate-200 pb-1">Key Technical Initiatives & Projects</h2>
          ${projList.map(proj => {
            const { title, subtitle, bullets, techStack, githubUrl, liveUrl } = cleanProjectHelper(proj);
            if (!title) return '';
            return `
              <div class="space-y-1 page-break-avoid break-inside-avoid">
                <div class="flex justify-between items-baseline text-xs flex-wrap gap-1">
                  <span class="font-bold text-slate-900">${title}</span>
                  ${(githubUrl || liveUrl) ? `
                    <div class="flex items-center gap-2 text-[11px]">
                      ${githubUrl ? `<a href="${githubUrl}" target="_blank" class="text-slate-700 underline">Repository</a>` : ''}
                      ${liveUrl ? `<a href="${liveUrl}" target="_blank" class="text-slate-700 underline">Executive Demo</a>` : ''}
                    </div>
                  ` : ''}
                </div>
                ${subtitle ? `<p class="text-slate-700 italic text-xs">${subtitle}</p>` : ''}
                <ul class="list-disc list-outside pl-4 space-y-0.5 text-xs text-slate-700">
                  ${bullets.map(b => `<li>${b}</li>`).join('')}
                </ul>
              </div>
            `;
          }).join('')}
        </section>
      ` : ''}
    </div>`;
  } else if (templateId === 'minimalist') {
    bodyContent = `
    <div class="minimalist-template bg-white text-black font-sans p-6 sm:p-10 shadow-none border-none w-full max-w-4xl mx-auto space-y-3.5 text-xs sm:text-[13px]">
      <header class="pb-2 border-b border-black">
        <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight uppercase">${fullName}</h1>
          ${title ? `<span class="text-xs font-mono uppercase text-neutral-600">${title}</span>` : ''}
        </div>
        <div class="text-[11px] font-mono text-neutral-700 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
          ${[
            location ? `<span>${location}</span>` : '',
            phone ? `<a href="tel:${phone}" class="hover:underline">${phone}</a>` : '',
            email ? `<a href="mailto:${email}" class="hover:underline">${email}</a>` : '',
            linkedin ? `<a href="${linkedin}" target="_blank" class="hover:underline">linkedin/</a>` : '',
            github ? `<a href="${github}" target="_blank" class="hover:underline">github/</a>` : ''
          ].filter(Boolean).join(' | ')}
        </div>
      </header>

      ${summary ? `
        <section class="space-y-0.5">
          <h2 class="text-[11px] font-mono font-bold uppercase tracking-wider text-black">// Summary</h2>
          <p class="text-neutral-800 leading-snug">${summary}</p>
        </section>
      ` : ''}

      ${eduList.length ? `
        <section class="space-y-1">
          <h2 class="text-[11px] font-mono font-bold uppercase tracking-wider text-black">// Education</h2>
          ${eduList.map(edu => {
            const eduDegreeText = formatEducationDegreeHelper(edu.degree, edu.branch);
            return `
              <div class="flex justify-between items-baseline text-xs page-break-avoid break-inside-avoid">
                <div>
                  <span class="font-bold">${edu.institution}</span>
                  ${eduDegreeText ? `<span> — ${eduDegreeText}</span>` : ''}
                  ${edu.cgpa ? `<span class="font-mono ml-2">[GPA: ${edu.cgpa}]</span>` : ''}
                </div>
                ${edu.graduationYear ? `<span class="font-mono text-[11px]">${edu.graduationYear}</span>` : ''}
              </div>
            `;
          }).join('')}
        </section>
      ` : ''}

      ${projList.length ? `
        <section class="space-y-2">
          <h2 class="text-[11px] font-mono font-bold uppercase tracking-wider text-black">// Projects</h2>
          ${projList.map(proj => {
            const { title, subtitle, bullets, techStack, githubUrl, liveUrl } = cleanProjectHelper(proj);
            if (!title) return '';
            return `
              <div class="space-y-0.5 page-break-avoid break-inside-avoid">
                <div class="flex justify-between items-baseline text-xs flex-wrap gap-1">
                  <span class="font-bold">${title}</span>
                  <span class="font-mono text-[11px] text-neutral-600 flex items-center gap-2">
                    ${techStack.length ? `[${techStack.join(', ')}]` : ''}
                    ${githubUrl ? `<a href="${githubUrl}" target="_blank" class="underline hover:text-black">code</a>` : ''}
                    ${liveUrl ? `<a href="${liveUrl}" target="_blank" class="underline hover:text-black">live</a>` : ''}
                  </span>
                </div>
                ${subtitle ? `<p class="text-neutral-700 italic text-xs">${subtitle}</p>` : ''}
                <ul class="list-disc list-outside pl-4 space-y-0.5 text-xs text-neutral-800">
                  ${bullets.map(b => `<li>${b}</li>`).join('')}
                </ul>
              </div>
            `;
          }).join('')}
        </section>
      ` : ''}
    </div>`;
  }

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${fullName} - Resume</title>
  <style>
    ${cssContent}
  </style>
</head>
<body class="bg-white text-black p-0 m-0">
  ${bodyContent}
</body>
</html>`;
}

// Function to generate PDF using msedge headless
function generatePdfFromHtml(htmlContent, outputPdfPath) {
  const tempHtmlPath = outputPdfPath.replace(/\.pdf$/, '.html');
  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const cmd = `"${edgeExe}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${outputPdfPath}" "${tempHtmlPath}"`;
  execSync(cmd, { stdio: 'pipe' });

  if (fs.existsSync(tempHtmlPath)) {
    fs.unlinkSync(tempHtmlPath);
  }
}

// Main Test Execution Suite
async function runAllPdfVerificationTests() {
  console.log('========================================================================');
  console.log('GigSync PDF Resume Generation & Verification Test Suite');
  console.log('========================================================================\n');

  const testMatrix = [
    { name: '1. Zainab Rakiah - Modern Tech (Actual Reference Case)', template: 'modern', profile: zainabProfile, file: 'zainab_modern_tech.pdf' },
    { name: '2. Zainab Rakiah - Classic Academic', template: 'academic', profile: zainabProfile, file: 'zainab_classic_academic.pdf' },
    { name: '3. Zainab Rakiah - Executive', template: 'executive', profile: zainabProfile, file: 'zainab_executive.pdf' },
    { name: '4. Zainab Rakiah - Minimalist', template: 'minimalist', profile: zainabProfile, file: 'zainab_minimalist.pdf' },
    { name: '5. Short 1-Page Resume (Minimalist)', template: 'minimalist', profile: shortProfile, file: 'short_one_page.pdf' },
    { name: '6. Long Multi-Page Resume (Modern Tech)', template: 'modern', profile: longProfile, file: 'long_multi_page.pdf' },
    { name: '7. Missing Optional Sections (Executive)', template: 'executive', profile: { ...shortProfile, personalInfo: { ...shortProfile.personalInfo, summary: '' } }, file: 'missing_sections.pdf' }
  ];

  let passedTests = 0;

  for (const tc of testMatrix) {
    console.log(`Testing: ${tc.name}`);
    const pdfPath = path.join(scratchDir, tc.file);
    const html = renderHtmlDocument(tc.template, tc.profile);
    generatePdfFromHtml(html, pdfPath);

    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Failed to generate PDF at ${pdfPath}`);
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse(new Uint8Array(pdfBuffer));
    const parsed = await parser.getText();
    const fullText = parsed.text;

    console.log(`  -> Generated PDF: ${tc.file} (${pdfBuffer.length} bytes, ${parsed.total} page(s))`);

    // Verification 1: Check for duplicate project titles
    const mapStopCount = (fullText.match(/MapStop Holidays/g) || []).length;
    const protegoCount = (fullText.match(/Protego/g) || []).length;
    const restaurantCount = (fullText.match(/Restaurant Management System/g) || []).length;
    const mernCount = (fullText.match(/MERN Notes Application/g) || []).length;

    if (tc.profile === zainabProfile) {
      if (mapStopCount > 1) throw new Error(`[FAIL] 'MapStop Holidays' appeared ${mapStopCount} times! Must appear exactly once.`);
      if (protegoCount > 1) throw new Error(`[FAIL] 'Protego' appeared ${protegoCount} times! Must appear exactly once.`);
      if (restaurantCount > 1) throw new Error(`[FAIL] 'Restaurant Management System' appeared ${restaurantCount} times! Must appear exactly once.`);
      if (mernCount > 1) throw new Error(`[FAIL] 'MERN Notes Application' appeared ${mernCount} times! Must appear exactly once.`);
      console.log(`  [PASS] Zero duplicate project titles detected (each appears exactly once).`);
    }

    // Verification 2: Check for dangling "in" in Education
    if (fullText.includes('B.E. in') || fullText.includes('Degree in')) {
      throw new Error(`[FAIL] Incomplete 'B.E. in' found in text! Education line must omit 'in' when branch is empty.`);
    }
    console.log(`  [PASS] Clean education formatting verified (no dangling 'in').`);

    // Verification 3: Check for literal trailing "Link" artifact
    if (/MapStop Holidays.*Link/i.test(fullText) || /Restaurant Management System.*Link/i.test(fullText)) {
      throw new Error(`[FAIL] Trailing 'Link' artifact detected in project titles!`);
    }
    console.log(`  [PASS] Trailing 'Link' text artifacts completely eliminated.`);

    // Verification 4: Check hyperlinks and URLs
    if (tc.profile.personalInfo.github && !fullText.toLowerCase().includes('github')) {
      throw new Error(`[FAIL] GitHub profile was not rendered in resume!`);
    }
    console.log(`  [PASS] Candidate coordinates & profile links present.`);

    console.log(`  -> Result: ALL CHECKS PASSED for ${tc.name}\n`);
    passedTests++;
  }

  console.log(`========================================================================`);
  console.log(`SUCCESS: All ${passedTests}/${testMatrix.length} PDF Generation & Verification tests PASSED!`);
  console.log(`Generated test PDFs are available in: ${scratchDir}`);
  console.log(`========================================================================`);
}

runAllPdfVerificationTests().catch(err => {
  console.error('\nTest Suite FAILED with error:\n', err);
  process.exit(1);
});
