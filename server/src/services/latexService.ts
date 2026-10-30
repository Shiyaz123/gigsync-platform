import { CandidateProfile } from '../types';

function isNAOrEmpty(val: any): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return true;
    if (/^(n\/?a|na|not\s+applicable|none|nil|-|\.)$/i.test(trimmed)) return true;
  }
  if (Array.isArray(val)) {
    return val.filter(item => !isNAOrEmpty(item)).length === 0;
  }
  return false;
}

function cleanText(val: string | undefined | null): string {
  if (!val || isNAOrEmpty(val)) return '';
  return val.trim();
}

function cleanList(arr: string[] | undefined | null): string[] {
  if (!arr || !Array.isArray(arr)) return [];
  return arr.map(s => (typeof s === 'string' ? s.trim() : '')).filter(s => s && !isNAOrEmpty(s));
}

/**
 * Escapes characters that have special meaning in LaTeX.
 * Prevents compilation errors and LaTeX code injection attacks.
 */
export function escapeLatex(text: string | undefined | null): string {
  if (!text || isNAOrEmpty(text)) return '';
  return text
    .replace(/[\\%$&_#{}^~]/g, match => {
      switch (match) {
        case '\\': return '\\textbackslash{}';
        case '%': return '\\%';
        case '$': return '\\$';
        case '&': return '\\&';
        case '_': return '\\_';
        case '#': return '\\#';
        case '{': return '\\{';
        case '}': return '\\}';
        case '~': return '\\textasciitilde{}';
        case '^': return '\\textasciicircum{}';
        default: return match;
      }
    })
    .replace(/[<>]/g, '');
}

export function formatEduLatex(degree?: string, branch?: string): string {
  let d = cleanText(degree).replace(/[\s,–—-]+$/g, '').replace(/\s+(?:in|of)\s*$/i, '').trim();
  let b = cleanText(branch).replace(/^[\s,–—-]+/g, '').replace(/^(?:in|of)\s+/i, '').trim();
  if (!d && !b) return '';
  if (d && !b) return escapeLatex(d);
  if (!d && b) return escapeLatex(b);
  if (d.toLowerCase().includes(b.toLowerCase())) return escapeLatex(d);
  return `${escapeLatex(d)} in ${escapeLatex(b)}`;
}

export function cleanProjectLatex(proj: any) {
  let title = cleanText(proj.title).replace(/\s*(?:[-–—|/]\s*)?(?:link|github|code|live\s*demo|view)\s*$/i, '').trim();
  let desc = cleanText(proj.description).replace(/\s*(?:[-–—|/]\s*)?(?:link|github|code|live\s*demo|view)\s*$/i, '').trim();
  let subtitle = desc;
  const split = title.match(/^([A-Za-z0-9\s&()'/]+?)\s*[-–—:]\s*(.+)$/);
  if (split && !subtitle) {
    title = split[1].trim();
    subtitle = split[2].trim();
  }
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (norm(title) === norm(subtitle)) {
    subtitle = '';
  }
  return {
    title,
    subtitle,
    techStack: cleanList([...(proj.technologies || []), ...(proj.techStack || [])]),
    bullets: cleanList([...(proj.keyFeatures || []), ...(proj.bullets || [])]).filter(b => norm(b) !== norm(subtitle))
  };
}

/**
 * Generates compilable LaTeX code based on selected template and profile.
 */
export function generateLatexResume(
  profile: CandidateProfile,
  templateId: 'modern' | 'academic' | 'executive' | 'minimalist' = 'modern'
): string {
  if (templateId === 'academic') {
    return generateAcademicLatex(profile);
  } else if (templateId === 'executive') {
    return generateExecutiveLatex(profile);
  } else if (templateId === 'minimalist') {
    return generateMinimalistLatex(profile);
  }

  // Default: Modern Tech Template
  return generateModernLatex(profile);
}

function getSkillsSummary(profile: CandidateProfile): { label: string; skills: string }[] {
  const cat = profile.categorizedSkills || profile.skills?.categories;
  const result: { label: string; skills: string }[] = [];

  if (cat) {
    if (cleanList(cat.programmingLanguages).length > 0) {
      result.push({ label: 'Languages', skills: cleanList(cat.programmingLanguages).map(escapeLatex).join(', ') });
    }
    if (cleanList(cat.backendAndApis).length > 0) {
      result.push({ label: 'Backend & APIs', skills: cleanList(cat.backendAndApis).map(escapeLatex).join(', ') });
    }
    if (cleanList(cat.databases).length > 0) {
      result.push({ label: 'Databases', skills: cleanList(cat.databases).map(escapeLatex).join(', ') });
    }
    if (cleanList(cat.frontend).length > 0) {
      result.push({ label: 'Frontend', skills: cleanList(cat.frontend).map(escapeLatex).join(', ') });
    }
    if (cleanList(cat.toolsAndDevelopment).length > 0) {
      result.push({ label: 'Tools & Platforms', skills: cleanList(cat.toolsAndDevelopment).map(escapeLatex).join(', ') });
    }
    if (cleanList(cat.testing).length > 0) {
      result.push({ label: 'Testing', skills: cleanList(cat.testing).map(escapeLatex).join(', ') });
    }
    if (cleanList(cat.csFundamentals).length > 0) {
      result.push({ label: 'CS Fundamentals', skills: cleanList(cat.csFundamentals).map(escapeLatex).join(', ') });
    }
    if (cleanList(cat.aiAndMl).length > 0) {
      result.push({ label: 'AI / ML', skills: cleanList(cat.aiAndMl).map(escapeLatex).join(', ') });
    }
  }

  if (result.length === 0) {
    const tech = cleanList(profile.skills?.technical);
    const frameworks = cleanList(profile.skills?.frameworks);
    const tools = cleanList(profile.skills?.tools);
    if (tech.length > 0) result.push({ label: 'Languages', skills: tech.map(escapeLatex).join(', ') });
    if (frameworks.length > 0) result.push({ label: 'Frameworks & Libraries', skills: frameworks.map(escapeLatex).join(', ') });
    if (tools.length > 0) result.push({ label: 'Tools & Platforms', skills: tools.map(escapeLatex).join(', ') });
  }

  return result;
}

// --------------------------------------------------------------------------
// 1. Modern Tech Template
// --------------------------------------------------------------------------
function generateModernLatex(profile: CandidateProfile): string {
  const p = profile.personalInfo;
  const skills = getSkillsSummary(profile);

  const eduItems = (profile.education || [])
    .filter(e => !isNAOrEmpty(e.institution))
    .map(e => {
      const year = cleanText(e.graduationYear || e.endDate);
      const degreeText = formatEduLatex(e.degree, e.branch || e.fieldOfStudy);
      const gpa = cleanText(e.cgpa || e.gpa);
      return `\\noindent\\textbf{${escapeLatex(e.institution)}} \\hfill ${escapeLatex(year)}\\\\
\\textit{${degreeText}}${gpa ? ` \\hfill \\textbf{GPA:} ${escapeLatex(gpa)}` : ''}\\\\
\\vspace{3pt}`;
    }).join('\n');

  const expItems = (profile.experience || [])
    .filter(e => !isNAOrEmpty(e.company) || !isNAOrEmpty(e.role))
    .map(e => {
      const dur = cleanText(e.duration) || `${cleanText(e.startDate)} -- ${e.current ? 'Present' : cleanText(e.endDate)}`;
      const bullets = cleanList([...(e.responsibilities || []), ...(e.bullets || [])]);
      return `\\noindent\\textbf{${escapeLatex(e.company)}} \\hfill ${escapeLatex(dur)}\\\\
\\textit{${escapeLatex(e.role)}}${cleanText(e.location) ? ` \\hfill \\textit{${escapeLatex(e.location)}}` : ''}\\\\
\\vspace{-4pt}
\\begin{itemize}[leftmargin=15pt, itemsep=1pt, parsep=0pt]
${bullets.map(b => `  \\item ${escapeLatex(b)}`).join('\n')}
\\end{itemize}
\\vspace{3pt}`;
    }).join('\n');

  const projItems = (profile.projects || [])
    .filter(pr => !isNAOrEmpty(pr.title))
    .map(pr => {
      const { title, subtitle, bullets, techStack } = cleanProjectLatex(pr);
      if (!title) return '';
      return `\\noindent\\textbf{${escapeLatex(title)}}${techStack.length > 0 ? ` $|$ \\textit{${techStack.map(escapeLatex).join(', ')}}` : ''}\\\\
${subtitle ? `\\textit{${escapeLatex(subtitle)}}\\\\` : ''}
\\vspace{-4pt}
\\begin{itemize}[leftmargin=15pt, itemsep=1pt, parsep=0pt]
${bullets.map(b => `  \\item ${escapeLatex(b)}`).join('\n')}
\\end{itemize}
\\vspace{3pt}`;
    }).filter(Boolean).join('\n');

  const achList = cleanList(profile.achievements);
  const leadList = cleanList(profile.mentorshipAndLeadership);
  const pubList = (profile.publications || []).filter(pub => !isNAOrEmpty(pub.title));
  const certList = (profile.certifications || []).filter(c => !isNAOrEmpty(c.name));

  return `% ==============================================================================
% GigSync Resume - Modern Tech Template
% ==============================================================================
\\documentclass[letterpaper,10pt]{article}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{xcolor}

\\definecolor{primary}{RGB}{37, 99, 235}
\\definecolor{darkgray}{RGB}{30, 41, 59}

\\hypersetup{colorlinks=true, linkcolor=primary, urlcolor=primary}
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.0in}
\\addtolength{\\topmargin}{-0.6in}
\\addtolength{\\textheight}{1.2in}

\\titleformat{\\section}{\\large\\bfseries\\color{primary}}{}{0em}{}[\\color{darkgray}\\titlerule]
\\titlespacing*{\\section}{0pt}{8pt}{4pt}

\\begin{document}

\\begin{center}
  {\\Huge \\textbf{${escapeLatex(p.fullName)}}}\\\\
  \\vspace{3pt}
  ${cleanText(p.title) ? `{\\large \\color{darkgray} ${escapeLatex(p.title)}}\\\\ \\vspace{2pt}` : ''}
  \\small ${[cleanText(p.location), cleanText(p.phone), cleanText(p.email)].filter(Boolean).map(escapeLatex).join(' $|$ ')}
  ${cleanText(p.linkedin) ? ` $|$ \\href{${escapeLatex(p.linkedin)}}{LinkedIn}` : ''}
  ${cleanText(p.github) ? ` $|$ \\href{${escapeLatex(p.github)}}{GitHub}` : ''}
\\end{center}

\\vspace{-6pt}

${cleanText(p.summary) ? `\\section{Professional Summary}
${escapeLatex(p.summary)}
` : ''}

${skills.length > 0 ? `\\section{Technical Skills}
\\begin{itemize}[leftmargin=15pt, itemsep=1pt, parsep=0pt]
${skills.map(s => `  \\item \\textbf{${escapeLatex(s.label)}:} ${s.skills}`).join('\n')}
\\end{itemize}
` : ''}

${expItems ? `\\section{Work Experience}
${expItems}
` : ''}

${projItems ? `\\section{Projects}
${projItems}
` : ''}

${eduItems ? `\\section{Education}
${eduItems}
` : ''}

${achList.length > 0 ? `\\section{Achievements}
\\begin{itemize}[leftmargin=15pt, itemsep=1pt, parsep=0pt]
${achList.map(a => `  \\item ${escapeLatex(a)}`).join('\n')}
\\end{itemize}
` : ''}

${leadList.length > 0 ? `\\section{Mentorship \\& Leadership}
\\begin{itemize}[leftmargin=15pt, itemsep=1pt, parsep=0pt]
${leadList.map(l => `  \\item ${escapeLatex(l)}`).join('\n')}
\\end{itemize}
` : ''}

${certList.length > 0 ? `\\section{Certifications}
\\begin{itemize}[leftmargin=15pt, itemsep=1pt, parsep=0pt]
${certList.map(c => `  \\item \\textbf{${escapeLatex(c.name)}} -- ${escapeLatex(c.organization || c.issuer)}${c.completionDate || c.issueDate ? ` (${escapeLatex(c.completionDate || c.issueDate)})` : ''}`).join('\n')}
\\end{itemize}
` : ''}

${pubList.length > 0 ? `\\section{Publications}
\\begin{itemize}[leftmargin=15pt, itemsep=1pt, parsep=0pt]
${pubList.map(pub => `  \\item \\textbf{${escapeLatex(pub.title)}}${pub.publisher ? ` -- \\textit{${escapeLatex(pub.publisher)}}` : ''}${pub.date ? ` (${escapeLatex(pub.date)})` : ''}`).join('\n')}
\\end{itemize}
` : ''}

\\end{document}
`;
}

// --------------------------------------------------------------------------
// 2. Classic Academic Template
// --------------------------------------------------------------------------
function generateAcademicLatex(profile: CandidateProfile): string {
  const p = profile.personalInfo;
  const skills = getSkillsSummary(profile);
  const contact = [cleanText(p.location), cleanText(p.phone), cleanText(p.email), cleanText(p.linkedin), cleanText(p.github)]
    .filter(Boolean)
    .map(escapeLatex)
    .join(' $\\cdot$ ');

  const eduItems = (profile.education || [])
    .filter(e => !isNAOrEmpty(e.institution))
    .map(e => `\\noindent\\textbf{${escapeLatex(e.institution)}} \\hfill ${escapeLatex(e.graduationYear || e.endDate)}\\\\
\\textit{${formatEduLatex(e.degree, e.branch || e.fieldOfStudy)}}${cleanText(e.cgpa || e.gpa) ? ` \\hfill \\textbf{GPA:} ${escapeLatex(e.cgpa || e.gpa)}` : ''}\\\\
\\vspace{2pt}`).join('\n');

  const pubItems = (profile.publications || [])
    .filter(pub => !isNAOrEmpty(pub.title))
    .map(pub => `\\noindent\\textbf{${escapeLatex(pub.title)}}. ${pub.publisher ? `\\textit{${escapeLatex(pub.publisher)}}, ` : ''}${cleanText(pub.date) || ''}\\\\
\\vspace{2pt}`).join('\n');

  return `% ==============================================================================
% GigSync Resume - Classic Academic Template
% ==============================================================================
\\documentclass[11pt,letterpaper]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{titlesec}
\\usepackage{hyperref}

\\titleformat{\\section}{\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{10pt}{5pt}
\\pagestyle{empty}

\\begin{document}

\\begin{center}
  {\\textbf{\\Large ${escapeLatex(p.fullName)}}}\\\\[3pt]
  ${contact}
\\end{center}

\\vspace{-4pt}

${eduItems ? `\\section{Education}
${eduItems}
` : ''}

${pubItems ? `\\section{Publications \\& Research}
${pubItems}
` : ''}

${skills.length > 0 ? `\\section{Technical Qualifications}
${skills.map(s => `\\textbf{${escapeLatex(s.label)}:} ${s.skills}\\\\`).join('\n')}
` : ''}

${(profile.experience || []).filter(e => !isNAOrEmpty(e.company)).length > 0 ? `\\section{Experience}
${profile.experience.filter(e => !isNAOrEmpty(e.company)).map(e => `\\textbf{${escapeLatex(e.company)}} -- \\textit{${escapeLatex(e.role)}} \\hfill ${escapeLatex(e.duration || `${e.startDate} -- ${e.endDate}`)}\\\\
${cleanList([...(e.responsibilities || []), ...(e.bullets || [])]).map(b => `$\\bullet$ ${escapeLatex(b)}\\\\`).join('\n')}
\\vspace{2pt}`).join('\n')}
` : ''}

${(profile.projects || []).filter(pr => !isNAOrEmpty(pr.title)).length > 0 ? `\\section{Projects}
${profile.projects.filter(pr => !isNAOrEmpty(pr.title)).map(pr => {
  const { title, subtitle, bullets } = cleanProjectLatex(pr);
  if (!title) return '';
  return `\\textbf{${escapeLatex(title)}}${subtitle ? ` --- \\textit{${escapeLatex(subtitle)}}` : ''}\\\\
${bullets.map(b => `$\\bullet$ ${escapeLatex(b)}\\\\`).join('\n')}
\\vspace{2pt}`;
}).filter(Boolean).join('\n')}
` : ''}

\\end{document}
`;
}

// --------------------------------------------------------------------------
// 3. Executive Template
// --------------------------------------------------------------------------
function generateExecutiveLatex(profile: CandidateProfile): string {
  const p = profile.personalInfo;
  const skills = getSkillsSummary(profile);

  return `% ==============================================================================
% GigSync Resume - Executive Template
% ==============================================================================
\\documentclass[letterpaper,10.5pt]{article}
\\usepackage[margin=0.65in]{geometry}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{xcolor}

\\definecolor{executive}{RGB}{15, 23, 42}
\\titleformat{\\section}{\\large\\bfseries\\color{executive}\\uppercase}{}{0em}{}[\\color{executive}\\titlerule]
\\titlespacing*{\\section}{0pt}{10pt}{4pt}

\\begin{document}

\\begin{flushleft}
  {\\Huge \\textbf{\\color{executive}${escapeLatex(p.fullName)}}}\\\\
  \\vspace{2pt}
  ${cleanText(p.title) ? `{\\large \\textbf{${escapeLatex(p.title)}}}\\\\` : ''}
  \\small ${[cleanText(p.location), cleanText(p.phone), cleanText(p.email), cleanText(p.linkedin)].filter(Boolean).map(escapeLatex).join(' $|$ ')}
\\end{flushleft}

\\vspace{-6pt}

${cleanText(p.summary) ? `\\section{Executive Profile}
${escapeLatex(p.summary)}
` : ''}

${skills.length > 0 ? `\\section{Core Competencies}
\\begin{itemize}[leftmargin=15pt, itemsep=1pt, parsep=0pt]
${skills.map(s => `  \\item \\textbf{${escapeLatex(s.label)}:} ${s.skills}`).join('\n')}
\\end{itemize}
` : ''}

${(profile.experience || []).filter(e => !isNAOrEmpty(e.company)).length > 0 ? `\\section{Executive \\& Professional Experience}
${profile.experience.filter(e => !isNAOrEmpty(e.company)).map(e => `\\noindent\\textbf{${escapeLatex(e.role)}} $|$ \\textbf{${escapeLatex(e.company)}} \\hfill ${escapeLatex(e.duration || `${e.startDate} -- ${e.endDate}`)}\\\\
\\begin{itemize}[leftmargin=15pt, itemsep=1pt, parsep=0pt]
${cleanList([...(e.responsibilities || []), ...(e.bullets || [])]).map(b => `  \\item ${escapeLatex(b)}`).join('\n')}
\\end{itemize}
\\vspace{3pt}`).join('\n')}
` : ''}

${(profile.projects || []).filter(pr => !isNAOrEmpty(pr.title)).length > 0 ? `\\section{Key Initiatives \\& Projects}
${profile.projects.filter(pr => !isNAOrEmpty(pr.title)).map(pr => {
  const { title, subtitle, bullets } = cleanProjectLatex(pr);
  if (!title) return '';
  return `\\noindent\\textbf{${escapeLatex(title)}}${subtitle ? ` --- \\textit{${escapeLatex(subtitle)}}` : ''}\\\\
\\begin{itemize}[leftmargin=15pt, itemsep=1pt, parsep=0pt]
${bullets.map(b => `  \\item ${escapeLatex(b)}`).join('\n')}
\\end{itemize}
\\vspace{3pt}`;
}).filter(Boolean).join('\n')}
` : ''}

${(profile.education || []).filter(e => !isNAOrEmpty(e.institution)).length > 0 ? `\\section{Education \\& Credentials}
${profile.education.filter(e => !isNAOrEmpty(e.institution)).map(e => `\\noindent\\textbf{${formatEduLatex(e.degree, e.branch || e.fieldOfStudy)}}, ${escapeLatex(e.institution)} \\hfill ${escapeLatex(e.graduationYear || e.endDate)}\\\\`).join('\n')}
` : ''}

\\end{document}
`;
}

// --------------------------------------------------------------------------
// 4. Minimalist Template
// --------------------------------------------------------------------------
function generateMinimalistLatex(profile: CandidateProfile): string {
  const p = profile.personalInfo;
  const skills = getSkillsSummary(profile);

  return `% ==============================================================================
% GigSync Resume - Minimalist Template (Ultra Clean ATS)
% ==============================================================================
\\documentclass[letterpaper,10pt]{article}
\\usepackage[margin=0.5in]{geometry}
\\usepackage{titlesec}
\\usepackage{enumitem}

\\titleformat{\\section}{\\bfseries\\normalsize\\uppercase}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{6pt}{3pt}
\\pagestyle{empty}

\\begin{document}

\\noindent{\\Large \\textbf{${escapeLatex(p.fullName)}}}${cleanText(p.title) ? ` --- \\textit{${escapeLatex(p.title)}}` : ''}\\\\
\\noindent\\small ${[cleanText(p.location), cleanText(p.phone), cleanText(p.email), cleanText(p.linkedin), cleanText(p.github)].filter(Boolean).map(escapeLatex).join(' | ')}\\\\
\\vspace{-4pt}

${cleanText(p.summary) ? `\\section{Summary}
${escapeLatex(p.summary)}
` : ''}

${skills.length > 0 ? `\\section{Technical Skills}
\\begin{itemize}[leftmargin=10pt, itemsep=0.5pt, parsep=0pt]
${skills.map(s => `  \\item \\textbf{${escapeLatex(s.label)}:} ${s.skills}`).join('\n')}
\\end{itemize}
` : ''}

${(profile.experience || []).filter(e => !isNAOrEmpty(e.company)).length > 0 ? `\\section{Experience}
${profile.experience.filter(e => !isNAOrEmpty(e.company)).map(e => `\\noindent\\textbf{${escapeLatex(e.role)}}, ${escapeLatex(e.company)} \\hfill ${escapeLatex(e.duration || `${e.startDate} -- ${e.endDate}`)}\\\\
\\begin{itemize}[leftmargin=10pt, itemsep=0.5pt, parsep=0pt]
${cleanList([...(e.responsibilities || []), ...(e.bullets || [])]).map(b => `  \\item ${escapeLatex(b)}`).join('\n')}
\\end{itemize}
\\vspace{2pt}`).join('\n')}
` : ''}

${(profile.projects || []).filter(pr => !isNAOrEmpty(pr.title)).length > 0 ? `\\section{Projects}
${profile.projects.filter(pr => !isNAOrEmpty(pr.title)).map(pr => {
  const { title, subtitle, bullets } = cleanProjectLatex(pr);
  if (!title) return '';
  return `\\noindent\\textbf{${escapeLatex(title)}}${subtitle ? ` --- \\textit{${escapeLatex(subtitle)}}` : ''}\\\\
\\begin{itemize}[leftmargin=10pt, itemsep=0.5pt, parsep=0pt]
${bullets.map(b => `  \\item ${escapeLatex(b)}`).join('\n')}
\\end{itemize}
\\vspace{2pt}`;
}).filter(Boolean).join('\n')}
` : ''}

${(profile.education || []).filter(e => !isNAOrEmpty(e.institution)).length > 0 ? `\\section{Education}
${profile.education.filter(e => !isNAOrEmpty(e.institution)).map(e => `\\noindent\\textbf{${escapeLatex(e.institution)}} --- ${formatEduLatex(e.degree, e.branch || e.fieldOfStudy)} \\hfill ${escapeLatex(e.graduationYear || e.endDate)}\\\\`).join('\n')}
` : ''}

\\end{document}
`;
}
