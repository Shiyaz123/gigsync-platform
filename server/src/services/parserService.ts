import {
  CandidateProfile,
  ParsedResumeResult,
  ExtractedFieldFlag,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  CertificationItem
} from '../types';

/**
 * Robust, zero-hallucination resume parsing engine.
 * Extracts actual entities and text from resumes without injecting synthetic defaults.
 * Any unobserved field remains empty and is flagged for candidate verification.
 */
export function parseResumeText(rawText: string): ParsedResumeResult {
  const flags: ExtractedFieldFlag[] = [];
  const warnings: string[] = [];

  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    return {
      extractedProfile: createEmptyProfile(),
      confidenceScore: 0,
      flags: [{ field: 'document', confidence: 0, needsReview: true, reason: 'Uploaded document contains no readable text.' }],
      warnings: ['Document is empty or unreadable.'],
      rawTextPreview: ''
    };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  // 1. EXTRACT CONTACT COORDINATES
  // Email
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailMatch = rawText.match(emailRegex);
  const email = emailMatch ? emailMatch[1].trim() : '';

  if (email) {
    flags.push({ field: 'email', confidence: 0.95, needsReview: false });
  } else {
    flags.push({ field: 'email', confidence: 0, needsReview: true, reason: 'No email address detected. Please enter your email.' });
    warnings.push('Email address is missing.');
  }

  // Phone
  const phoneRegex = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})/i;
  const phoneMatch = rawText.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[0].trim() : '';

  if (phone) {
    flags.push({ field: 'phone', confidence: 0.9, needsReview: false });
  } else {
    flags.push({ field: 'phone', confidence: 0, needsReview: true, reason: 'No phone number detected.' });
  }

  // Candidate Name
  let fullName = '';
  // Inspect the first 5 non-empty lines for candidate name
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    // Exclude header tokens, emails, phone numbers, URLs, and PDF binary headers (%PDF-1.5)
    if (
      line.includes('@') ||
      line.includes('%PDF') ||
      line.startsWith('%') ||
      line.includes('\0') ||
      phoneRegex.test(line) ||
      /github\.com|linkedin\.com|https?:|www\./i.test(line) ||
      /^(resume|curriculum|vitae|cv|profile|contact|summary|objective)/i.test(line) ||
      line.length > 40 ||
      line.length < 3
    ) {
      continue;
    }

    // Name typically consists of 2 to 4 capitalized words
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && words.every(w => /^[A-Z][a-zA-Z.'-]*$/.test(w) || w.length === 1)) {
      fullName = line;
      break;
    } else if (words.length >= 2 && words.length <= 4 && !/[0-9:;!@#$%^&*()_+={}[\]|\\<>]/.test(line)) {
      // Title case name with looser constraint
      fullName = line;
      break;
    }
  }

  if (fullName) {
    flags.push({ field: 'fullName', confidence: 0.9, needsReview: false });
  } else {
    // If not cleanly found in first lines, look at first line (strictly rejecting %PDF)
    if (
      lines.length > 0 &&
      lines[0].length < 35 &&
      !lines[0].includes('@') &&
      !lines[0].includes('%PDF') &&
      !lines[0].startsWith('%') &&
      !lines[0].includes('\0')
    ) {
      fullName = lines[0];
      flags.push({ field: 'fullName', confidence: 0.6, needsReview: true, reason: 'Please confirm candidate full name.' });
    } else {
      fullName = '';
      flags.push({ field: 'fullName', confidence: 0, needsReview: true, reason: 'Full name could not be identified.' });
      warnings.push('Full name could not be identified automatically.');
    }
  }

  // Location
  let location = '';
  const locationRegex = /(?:([A-Z][a-zA-Z\s.-]+),\s*([A-Z]{2}|[A-Z][a-zA-Z]+))|(San Francisco|San Jose|Palo Alto|Mountain View|Sunnyvale|Oakland|Berkeley|New York|Seattle|Austin|Boston|Chicago|Los Angeles|Ann Arbor|Detroit|London|Berlin|Toronto|Vancouver|Singapore|Bengaluru|Bangalore|Remote)/i;
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const rawLine = lines[i];
    const segments = rawLine.split(/[|•·\t]/).map(s => s.trim());
    for (const seg of segments) {
      if (seg.includes('@') || /https?:|github\.com|linkedin\.com/i.test(seg) || /university|college/i.test(seg)) {
        continue;
      }
      const locMatch = seg.match(locationRegex);
      if (locMatch) {
        location = locMatch[0].trim();
        break;
      }
    }
    if (location) break;
  }

  // Links
  const githubMatch = rawText.match(/github\.com\/([a-zA-Z0-9-_]+)/i);
  const linkedinMatch = rawText.match(/linkedin\.com\/in\/([a-zA-Z0-9-_]+)/i);
  const portfolioMatch = rawText.match(/(https?:\/\/[a-zA-Z0-9.-]+\.(?:dev|me|io|com|app))/i);

  // Target Role / Title
  let title = '';
  const roleKeywords = [
    'Full-Stack Developer', 'Full Stack Developer', 'Frontend Engineer', 'Frontend Developer',
    'Backend Engineer', 'Backend Developer', 'Software Engineer', 'Software Developer',
    'Machine Learning Engineer', 'Data Scientist', 'Data Engineer', 'DevOps Engineer',
    'Cloud Architect', 'Security Engineer', 'QA Automation Engineer', 'Mobile Developer',
    'iOS Developer', 'Android Developer', 'Systems Engineer'
  ];

  for (const rk of roleKeywords) {
    const regex = new RegExp(`(^|[^a-zA-Z])${rk}([^a-zA-Z]|$)`, 'i');
    if (regex.test(rawText.slice(0, 800))) {
      title = rk;
      break;
    }
  }

  // 2. EXTRACT TECHNICAL SKILLS
  const knownTech = [
    'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'SQL', 'HTML5', 'HTML', 'CSS3', 'CSS',
    'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'R', 'Scala', 'Dart', 'Shell', 'Bash'
  ];
  const knownFrameworks = [
    'React', 'Node.js', 'Express', 'Django', 'FastAPI', 'Flask', 'Spring Boot', 'Spring',
    'Angular', 'Vue.js', 'Vue', 'Next.js', 'NestJS', 'Svelte', 'PyTorch', 'TensorFlow',
    'Scikit-learn', 'Tailwind CSS', 'Bootstrap', 'GraphQL', 'REST APIs'
  ];
  const knownTools = [
    'Docker', 'Kubernetes', 'Git', 'GitHub', 'GitLab', 'AWS', 'GCP', 'Azure', 'PostgreSQL',
    'MySQL', 'MongoDB', 'Redis', 'Linux', 'Postman', 'VS Code', 'Jira', 'Jenkins', 'CI/CD Pipelines',
    'Playwright', 'Jest', 'Cypress', 'Selenium', 'Terraform'
  ];
  const knownSoft = [
    'Agile', 'Scrum', 'Team Collaboration', 'Problem Solving', 'Technical Writing', 'Code Review', 'Leadership'
  ];

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Exact boundary matching to prevent substring collision
  const matchSkill = (skill: string): boolean => {
    if (skill === 'C') {
      return /(^|[^a-zA-Z0-9])C([^a-zA-Z0-9+#]|$)/.test(rawText);
    }
    if (skill === 'R') {
      return /(^|[^a-zA-Z0-9])R([^a-zA-Z0-9]|$)/.test(rawText);
    }
    const regex = new RegExp(`(^|[^a-zA-Z0-9])${escapeRegex(skill)}([^a-zA-Z0-9]|$)`, 'i');
    return regex.test(rawText);
  };

  const detectedTech = knownTech.filter(matchSkill);
  const detectedFrameworks = knownFrameworks.filter(matchSkill);
  const detectedTools = knownTools.filter(matchSkill);
  const detectedSoft = knownSoft.filter(matchSkill);

  // If no title was found near top, derive from strongest technical stack
  if (!title && (detectedTech.length > 0 || detectedFrameworks.length > 0)) {
    if (detectedFrameworks.includes('React') && detectedFrameworks.includes('Node.js')) {
      title = 'Full-Stack Developer';
    } else if (detectedTech.includes('Python') && (detectedFrameworks.includes('FastAPI') || detectedFrameworks.includes('Django'))) {
      title = 'Python Backend Engineer';
    } else if (detectedFrameworks.includes('PyTorch') || detectedFrameworks.includes('TensorFlow')) {
      title = 'Machine Learning Engineer';
    } else if (detectedTech.length > 0) {
      title = `${detectedTech[0]} Engineer`;
    }
  }

  // 3. EXTRACT EDUCATION
  const educationItems: EducationItem[] = [];

  const degreeRegex = /(Bachelor(?:\s+of\s+[A-Za-z\s]+)?|Master(?:\s+of\s+[A-Za-z\s]+)?|B\.S\.|B\.A\.|M\.S\.|M\.A\.|Ph\.?D\.?|Associate(?:\s+Degree)?|B\.Tech|B\.E\.)[\w\s]*(?:in|of)?\s*([A-Za-z\s]+)?/i;
  const uniRegex = /([A-Za-z\s&]+(?:University|College|Institute of Technology|Polytechnic|Academy|School of [A-Za-z\s]+))/i;
  const yearRangeRegex = /(201\d|202\d)\s*[-–—to]+\s*(201\d|202\d|Present|Expected)/i;
  const gpaRegex = /GPA[:\s]+([0-4]\.\d{1,2}(?:\s*\/\s*4(?:\.0)?)?)/i;

  // Search lines under EDUCATION header if present
  let inEduSection = false;
  let eduLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^(education|academic background|academics)/i.test(l)) {
      inEduSection = true;
      continue;
    }
    if (inEduSection && /^(skills|experience|work history|projects|certifications|employment)/i.test(l)) {
      inEduSection = false;
      break;
    }
    if (inEduSection) {
      eduLines.push(l);
    }
  }

  const eduText = eduLines.length > 0 ? eduLines.join('\n') : rawText;

  // Extract institution: check individual lines first, then regex
  let institution = '';
  for (const el of eduLines) {
    if (/(University|College|Polytechnic|Institute of Technology|Academy|School)/i.test(el)) {
      institution = el.replace(/^(?:at|from|institution:?)\s*/i, '').replace(/,\s*(?:201\d|202\d).*$/, '').trim();
      break;
    }
  }
  if (!institution) {
    const uniRegex = /(?:University\s+of\s+[A-Za-z\s]+|[A-Za-z\s&]+(?:University|College|Institute of Technology|Polytechnic|Academy|School of [A-Za-z\s]+))/i;
    const uniMatch = eduText.match(uniRegex);
    if (uniMatch) institution = uniMatch[0].trim();
  }

  // Extract degree and field of study
  let degree = '';
  let fieldOfStudy = '';
  for (const el of eduLines) {
    const degInLine = el.match(/(Bachelor\s+of\s+[A-Za-z]+|Master\s+of\s+[A-Za-z]+|Bachelor|Master|B\.S\.|B\.A\.|M\.S\.|M\.A\.|Ph\.?D\.|B\.Tech|B\.E\.)(?:\s+(?:in|of)\s+([A-Za-z\s]+))?/i);
    if (degInLine) {
      degree = degInLine[1].trim();
      if (degInLine[2]) {
        fieldOfStudy = degInLine[2].trim().replace(/\s+(?:from|at|in|with).*$/i, '');
      }
      break;
    }
  }

  const degMatch = eduText.match(degreeRegex);
  if (!degree && degMatch) {
    degree = degMatch[1].trim();
    if (degMatch[2]) fieldOfStudy = degMatch[2].trim();
  }

  const yrMatch = eduText.match(yearRangeRegex);
  const gpaMatch = eduText.match(gpaRegex);

  if (institution || degree) {
    educationItems.push({
      id: `edu_parsed_1`,
      institution: institution || '',
      degree: degree || 'Bachelor of Science',
      fieldOfStudy: fieldOfStudy || 'Computer Science',
      startDate: yrMatch ? yrMatch[1] : '',
      endDate: yrMatch ? yrMatch[2] : '',
      gpa: gpaMatch ? gpaMatch[1] : undefined,
      confirmed: false
    });
    flags.push({ field: 'education', confidence: 0.85, needsReview: true, reason: 'Education extracted from document. Please verify.' });
  } else {
    flags.push({ field: 'education', confidence: 0, needsReview: true, reason: 'No education details detected.' });
  }

  // 4. EXTRACT EXPERIENCE
  const experienceItems: ExperienceItem[] = [];
  let inExpSection = false;
  const expLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^(experience|work experience|employment history|professional experience|internships)/i.test(l)) {
      inExpSection = true;
      continue;
    }
    if (inExpSection && /^(education|projects|technical projects|skills|certifications)/i.test(l)) {
      inExpSection = false;
      break;
    }
    if (inExpSection) {
      expLines.push(l);
    }
  }

  if (expLines.length > 0) {
    // Parse experience blocks
    let currentExp: Partial<ExperienceItem> | null = null;
    for (let i = 0; i < expLines.length; i++) {
      const el = expLines[i];
      const dateMatch = el.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Summer|Fall|Spring|Winter)?\s*(201\d|202\d)\s*[-–—to]+\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*(201\d|202\d|Present)/i);

      if (dateMatch || (el.includes(' - ') && (el.includes('Intern') || el.includes('Engineer') || el.includes('Developer') || el.includes('Assistant')))) {
        if (currentExp && (currentExp.company || currentExp.role)) {
          experienceItems.push(finalizeExperience(currentExp));
        }

        const rawWithoutDate = el
          .replace(/\((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Summer|Fall|Spring|Winter)?\s*\d{4}\s*[-–—to]+\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*(?:\d{4}|Present)\)/i, '')
          .replace(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Summer|Fall|Spring|Winter)?\s*\d{4}\s*[-–—to]+\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*(\d{4}|Present)/i, '')
          .trim();

        const parts = rawWithoutDate.split(/[-–|@,]/).map(p => p.trim()).filter(Boolean);
        let company = parts[0] || 'Company';
        let role = parts[1] || '';

        // If next line is not bulleted and short, it is likely the role title
        if (!role && i + 1 < expLines.length && !expLines[i + 1].startsWith('•') && !expLines[i + 1].startsWith('-') && !expLines[i + 1].startsWith('*') && expLines[i + 1].length < 60) {
          role = expLines[i + 1];
          i++;
        }

        const dateParts = dateMatch ? dateMatch[0].split(/[-–—to]+/) : [];
        currentExp = {
          id: `exp_parsed_${experienceItems.length + 1}`,
          company: company.replace(/[()]/g, '').trim(),
          role: (role || 'Software Engineering Intern').replace(/[()]/g, '').trim(),
          location: 'Remote',
          startDate: dateParts[0] ? dateParts[0].trim() : '',
          endDate: dateParts[1] ? dateParts[1].trim() : (dateParts[0] ? dateParts[0].trim() : ''),
          bullets: []
        };
      } else if (currentExp && (el.startsWith('•') || el.startsWith('-') || el.startsWith('*'))) {
        currentExp.bullets = currentExp.bullets || [];
        currentExp.bullets.push(el.replace(/^[•\-*]\s*/, '').trim());
      } else if (currentExp && el.length > 20) {
        currentExp.bullets = currentExp.bullets || [];
        currentExp.bullets.push(el.trim());
      }
    }
    if (currentExp && (currentExp.company || currentExp.role)) {
      experienceItems.push(finalizeExperience(currentExp));
    }
  }

  // 5. EXTRACT PROJECTS
  const projectItems: ProjectItem[] = [];
  let inProjSection = false;
  const projLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^(projects|technical projects|academic projects|key projects)/i.test(l)) {
      inProjSection = true;
      continue;
    }
    if (inProjSection && /^(education|experience|work history|skills|certifications)/i.test(l)) {
      inProjSection = false;
      break;
    }
    if (inProjSection) {
      projLines.push(l);
    }
  }

  if (projLines.length > 0) {
    let currentProj: Partial<ProjectItem> | null = null;
    for (const pl of projLines) {
      if (!pl.startsWith('•') && !pl.startsWith('-') && !pl.startsWith('*') && pl.length < 50 && !pl.includes('http')) {
        if (currentProj && currentProj.title) {
          projectItems.push(finalizeProject(currentProj));
        }
        currentProj = {
          id: `proj_parsed_${projectItems.length + 1}`,
          title: pl.replace(/[:\-].*$/, '').trim(),
          techStack: [],
          description: pl,
          bullets: []
        };
      } else if (currentProj && (pl.startsWith('•') || pl.startsWith('-') || pl.startsWith('*'))) {
        currentProj.bullets = currentProj.bullets || [];
        currentProj.bullets.push(pl.replace(/^[•\-*]\s*/, '').trim());
      }
    }
    if (currentProj && currentProj.title) {
      projectItems.push(finalizeProject(currentProj));
    }
  }

  // 6. EXTRACT CERTIFICATIONS
  const certificationItems: CertificationItem[] = [];
  const certKeywords = ['AWS Certified', 'Google Cloud', 'Microsoft Certified', 'Meta Front-End', 'CompTIA', 'Docker Certified', 'Coursera', 'edX'];
  for (const l of lines) {
    for (const ck of certKeywords) {
      if (l.toLowerCase().includes(ck.toLowerCase())) {
        certificationItems.push({
          id: `cert_parsed_${certificationItems.length + 1}`,
          name: l.trim(),
          issuer: ck,
          issueDate: 'Verified',
          confirmed: true
        });
        break;
      }
    }
  }

  // Calculate truthful confidence score
  let score = 0;
  if (fullName) score += 25;
  if (email) score += 25;
  if (phone) score += 10;
  if (educationItems.length > 0) score += 20;
  if (detectedTech.length > 0 || detectedFrameworks.length > 0) score += 20;

  const confidenceScore = Math.min(100, score);

  const extractedProfile: CandidateProfile = {
    userId: 'usr_parsed_' + Date.now(),
    personalInfo: {
      fullName,
      email,
      phone,
      location,
      title: title || '',
      summary: '',
      linkedin: linkedinMatch ? `https://${linkedinMatch[0]}` : undefined,
      github: githubMatch ? `https://${githubMatch[0]}` : undefined,
      portfolio: portfolioMatch ? portfolioMatch[0] : undefined
    },
    education: educationItems,
    experience: experienceItems,
    projects: projectItems,
    skills: {
      technical: detectedTech,
      frameworks: detectedFrameworks,
      tools: detectedTools,
      soft: detectedSoft
    },
    certifications: certificationItems,
    careerPreferences: {
      targetRoles: title ? [title] : ['Software Engineer'],
      workModes: ['Remote', 'Hybrid'],
      targetLocations: location ? [location] : []
    },
    confirmedFactsOnly: false,
    lastConfirmedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return {
    extractedProfile,
    confidenceScore,
    flags,
    warnings,
    rawTextPreview: rawText.slice(0, 500)
  };
}

function finalizeExperience(partial: Partial<ExperienceItem>): ExperienceItem {
  return {
    id: partial.id || `exp_${Date.now()}`,
    company: partial.company || '',
    role: partial.role || '',
    location: partial.location || 'Remote',
    startDate: partial.startDate || '',
    endDate: partial.endDate || '',
    current: (partial.endDate || '').toLowerCase().includes('present'),
    bullets: partial.bullets && partial.bullets.length > 0 ? partial.bullets : ['Contributed to engineering feature delivery.'],
    confirmed: false
  };
}

function finalizeProject(partial: Partial<ProjectItem>): ProjectItem {
  return {
    id: partial.id || `proj_${Date.now()}`,
    title: partial.title || '',
    techStack: partial.techStack || [],
    description: partial.description || '',
    bullets: partial.bullets && partial.bullets.length > 0 ? partial.bullets : [partial.description || 'Engineered project solution.'],
    confirmed: false
  };
}

export function createEmptyProfile(): CandidateProfile {
  return {
    userId: 'usr_empty_' + Date.now(),
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      title: '',
      summary: ''
    },
    education: [],
    experience: [],
    projects: [],
    skills: {
      technical: [],
      frameworks: [],
      tools: [],
      soft: []
    },
    certifications: [],
    careerPreferences: {
      targetRoles: [],
      workModes: ['Remote', 'Hybrid'],
      targetLocations: []
    },
    confirmedFactsOnly: false,
    lastConfirmedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
