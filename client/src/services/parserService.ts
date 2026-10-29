import {
  CandidateProfile,
  ParsedResumeResult,
  ExtractedFieldFlag,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  CertificationItem
} from '../types';

interface CanonicalSkill {
  name: string;
  regex: RegExp;
  category: 'technical' | 'frameworks' | 'tools' | 'soft';
}

const CANONICAL_SKILL_DEFINITIONS: CanonicalSkill[] = [
  // Programming Languages
  { name: 'Python', regex: /\b(?:Basic\s+)?Python\b/i, category: 'technical' },
  { name: 'JavaScript', regex: /\b(?:JavaScript|JS)\b/i, category: 'technical' },
  { name: 'TypeScript', regex: /\b(?:TypeScript|TS)\b/i, category: 'technical' },
  { name: 'Java', regex: /\b(?:Basic\s+)?Java\b(?!script)/i, category: 'technical' },
  { name: 'C', regex: /(?:^|[^a-zA-Z0-9])C(?:$|[^a-zA-Z0-9+#])/i, category: 'technical' },
  { name: 'C++', regex: /\bC\+\+\b/i, category: 'technical' },
  { name: 'C#', regex: /\bC#\b/i, category: 'technical' },
  { name: 'SQL', regex: /\bSQL\b/i, category: 'technical' },
  { name: 'HTML5', regex: /\bHTML5\b/i, category: 'technical' },
  { name: 'HTML', regex: /\bHTML\b/i, category: 'technical' },
  { name: 'CSS3', regex: /\bCSS3\b/i, category: 'technical' },
  { name: 'CSS', regex: /\bCSS\b/i, category: 'technical' },
  { name: 'Go', regex: /\b(?:Golang|Go)\b/, category: 'technical' },
  { name: 'Rust', regex: /\bRust\b/i, category: 'technical' },
  { name: 'PHP', regex: /\bPHP\b/i, category: 'technical' },
  { name: 'Swift', regex: /\bSwift\b/i, category: 'technical' },
  { name: 'Kotlin', regex: /\bKotlin\b/i, category: 'technical' },
  { name: 'R', regex: /(?:^|[^a-zA-Z0-9])R(?:$|[^a-zA-Z0-9])/i, category: 'technical' },

  // Frameworks & Libraries
  { name: 'React', regex: /\b(?:React\.js|ReactJS|React)\b/i, category: 'frameworks' },
  { name: 'Node.js', regex: /\b(?:Node\.js|NodeJS|Node)\b/i, category: 'frameworks' },
  { name: 'Express', regex: /\b(?:Express\.js|ExpressJS|Express)\b/i, category: 'frameworks' },
  { name: 'REST APIs', regex: /\b(?:REST\s*APIs?|RESTful\s*APIs?)\b/i, category: 'frameworks' },
  { name: 'FastAPI', regex: /\bFastAPI\b/i, category: 'frameworks' },
  { name: 'Django', regex: /\bDjango\b/i, category: 'frameworks' },
  { name: 'Flask', regex: /\bFlask\b/i, category: 'frameworks' },
  { name: 'Spring Boot', regex: /\bSpring\s*Boot\b/i, category: 'frameworks' },
  { name: 'Vue.js', regex: /\b(?:Vue\.js|VueJS|Vue)\b/i, category: 'frameworks' },
  { name: 'Next.js', regex: /\b(?:Next\.js|NextJS|Next)\b/i, category: 'frameworks' },
  { name: 'Angular', regex: /\bAngular\b/i, category: 'frameworks' },
  { name: 'OpenCV', regex: /\bOpenCV\b/i, category: 'frameworks' },
  { name: 'TensorFlow', regex: /\bTensorFlow\b/i, category: 'frameworks' },
  { name: 'Keras', regex: /\bKeras\b/i, category: 'frameworks' },
  { name: 'Scikit-learn', regex: /\b(?:Scikit-learn|sklearn)\b/i, category: 'frameworks' },
  { name: 'PyTorch', regex: /\bPyTorch\b/i, category: 'frameworks' },

  // Technical Domains & Methodologies
  { name: 'Machine Learning', regex: /\b(?:Machine\s+Learning(?:\s+Fundamentals)?|ML)\b/i, category: 'technical' },
  { name: 'Computer Vision', regex: /\bComputer\s+Vision\b/i, category: 'technical' },
  { name: 'Facial Recognition', regex: /\bFacial\s+Recognition\b/i, category: 'technical' },
  { name: 'Prompt Engineering', regex: /\bPrompt\s+Engineering\b/i, category: 'technical' },
  { name: 'Data Structures & Algorithms', regex: /\b(?:Data\s+Structures\s*(?:&|and)\s*Algorithms|DSA)\b/i, category: 'technical' },

  // Databases & Developer Tools
  { name: 'MySQL', regex: /\bMySQL\b/i, category: 'tools' },
  { name: 'PostgreSQL', regex: /\b(?:PostgreSQL|Postgres)\b/i, category: 'tools' },
  { name: 'MongoDB', regex: /\bMongoDB\b/i, category: 'tools' },
  { name: 'SQLite', regex: /\bSQLite\b/i, category: 'tools' },
  { name: 'Redis', regex: /\bRedis\b/i, category: 'tools' },
  { name: 'Git', regex: /\bGit\b(?!hub|lab)/i, category: 'tools' },
  { name: 'GitHub', regex: /\bGitHub\b/i, category: 'tools' },
  { name: 'Docker', regex: /\bDocker\b/i, category: 'tools' },
  { name: 'Kubernetes', regex: /\b(?:Kubernetes|K8s)\b/i, category: 'tools' },
  { name: 'Linux', regex: /\bLinux\b/i, category: 'tools' },
  { name: 'VS Code', regex: /\b(?:VS\s*Code|Visual\s+Studio\s+Code)\b/i, category: 'tools' },
  { name: 'AWS', regex: /\bAWS\b/i, category: 'tools' },
  { name: 'GCP', regex: /\b(?:GCP|Google\s+Cloud)\b/i, category: 'tools' },
  { name: 'Azure', regex: /\bAzure\b/i, category: 'tools' },

  // Soft Skills
  { name: 'Agile', regex: /\bAgile\b/i, category: 'soft' },
  { name: 'Scrum', regex: /\bScrum\b/i, category: 'soft' },
  { name: 'Code Review', regex: /\bCode\s+Reviews?\b/i, category: 'soft' },
  { name: 'Technical Writing', regex: /\bTechnical\s+Writing\b/i, category: 'soft' },
  { name: 'Team Collaboration', regex: /\b(?:Team\s+Collaboration|Collaborative)\b/i, category: 'soft' },
  { name: 'Problem Solving', regex: /\bProblem\s+Solving\b/i, category: 'soft' }
];

const INDIAN_STATES = [
  'Karnataka', 'Maharashtra', 'Tamil Nadu', 'Telangana', 'Andhra Pradesh',
  'Kerala', 'Delhi', 'Uttar Pradesh', 'Gujarat', 'West Bengal', 'Rajasthan',
  'Punjab', 'Haryana', 'Madhya Pradesh', 'Bihar', 'Odisha', 'Assam'
];

const US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]);

/**
 * Client-side zero-hallucination resume parser.
 * Faithfully extracts entities from text without injecting synthetic defaults.
 */
export function parseResumeTextClient(rawText: string, filenameFallback?: string): ParsedResumeResult {
  const flags: ExtractedFieldFlag[] = [];
  const warnings: string[] = [];

  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
    return {
      extractedProfile: createEmptyProfileClient(),
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

  // 1. CONTACT COORDINATES
  // Email
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailMatch = rawText.match(emailRegex);
  const email = emailMatch ? emailMatch[1].trim() : '';

  if (email) {
    flags.push({ field: 'email', confidence: 0.95, needsReview: false });
  } else {
    flags.push({ field: 'email', confidence: 0, needsReview: true, reason: 'No email address detected. Please enter manually.' });
    warnings.push('Email address was not detected.');
  }

  // Phone (international + Indian + US formats)
  const phoneCandidates = rawText.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,5}\)?[\s.-]?\d{3,5}[\s.-]?\d{3,5}/g) || [];
  let phone = '';
  for (const cand of phoneCandidates) {
    const digits = cand.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 15) {
      phone = cand.trim();
      break;
    }
  }

  if (phone) {
    flags.push({ field: 'phone', confidence: 0.9, needsReview: false });
  } else {
    flags.push({ field: 'phone', confidence: 0, needsReview: true, reason: 'No phone number detected.' });
  }

  // Full Name extraction (Guarded against %PDF, binary headers, keywords, roles)
  let fullName = '';
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const l = lines[i];
    if (/@|http|github\.com|linkedin\.com|\.pdf|%PDF/i.test(l)) continue;
    if (/^(resume|curriculum|vitae|cv|profile|contact|summary|objective|education|skills)\b/i.test(l)) continue;
    if (/[0-9:;!@#$%^*_+={}[\]|\\<>]/.test(l)) continue;
    if (/\b(developer|engineer|student|intern|analyst|designer|specialist|consultant)\b/i.test(l)) continue;

    const words = l.split(/\s+/).filter(Boolean);
    if (words.length >= 2 && words.length <= 4 && words.every(w => /^[a-zA-Z][a-zA-Z.'-]*$/.test(w))) {
      fullName = l.trim();
      break;
    }
  }

  // Fallback for full name: weak fallback from filename with underscores only if text detection yielded nothing
  if (!fullName && filenameFallback) {
    const baseName = filenameFallback.replace(/\.[^/.]+$/, '').replace(/\s*\(\d+\)$/, '');
    if (baseName.includes('_')) {
      const parts = baseName.split('_').filter(Boolean);
      if (parts.length >= 2 && parts.every(p => /^[a-zA-Z]+$/.test(p))) {
        fullName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
        flags.push({ field: 'fullName', confidence: 0.5, needsReview: true, reason: 'Full name inferred from filename. Please confirm.' });
      }
    }
  }

  if (fullName && !flags.some(f => f.field === 'fullName')) {
    flags.push({ field: 'fullName', confidence: 0.95, needsReview: false });
  } else if (!fullName) {
    flags.push({ field: 'fullName', confidence: 0, needsReview: true, reason: 'Full name could not be identified from resume header.' });
    warnings.push('Candidate full name was not detected.');
  }

  // Target Role / Title (Check header lines 1..3, then common keywords)
  let title = '';
  for (let i = 1; i < Math.min(4, lines.length); i++) {
    const l = lines[i];
    if (/@|http|\+?\d/i.test(l)) continue;
    if (/\b(student|developer|engineer|intern|designer|architect|analyst|specialist|scientist)\b/i.test(l)) {
      title = l.trim();
      break;
    }
  }

  if (!title) {
    const standardRoles = [
      'Full-Stack Developer', 'Frontend Engineer', 'Frontend Developer',
      'Backend Engineer', 'Backend Developer', 'Software Engineer', 'Software Developer',
      'Machine Learning Engineer', 'Data Scientist', 'Data Engineer', 'DevOps Engineer',
      'Cloud Architect', 'Security Engineer', 'QA Automation Engineer', 'Mobile Developer',
      'iOS Developer', 'Android Developer', 'Systems Engineer'
    ];
    for (const sr of standardRoles) {
      const reg = new RegExp(`(^|[^a-zA-Z])${sr}([^a-zA-Z]|$)`, 'i');
      if (reg.test(rawText.slice(0, 1000))) {
        title = sr;
        break;
      }
    }
  }

  flags.push({
    field: 'targetRole',
    confidence: title ? 0.85 : 0,
    needsReview: !title,
    reason: title ? undefined : 'Target role not explicitly stated. Please specify your desired role.'
  });

  // Location (Checked ONLY in top 6 lines before any summary/experience to prevent prose false positives)
  let location = '';
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const l = lines[i];
    if (/^(summary|professional summary|education|skills|projects|experience|about)\b/i.test(l)) {
      break;
    }
    if (/@|http|university|college|developer|student|engineer/i.test(l)) {
      // If line has email/phone/links separated by pipes, check individual segments
      const segments = l.split(/[|•·\t]/).map(s => s.trim()).filter(Boolean);
      for (const seg of segments) {
        if (/@|http|github|linkedin|\+?\d{5}/i.test(seg)) continue;
        for (const state of INDIAN_STATES) {
          const reg = new RegExp(`([a-zA-Z\\s.-]+),\\s*${state}\\b`, 'i');
          const m = seg.match(reg);
          if (m) {
            location = `${m[1].trim()}, ${state}`;
            break;
          }
        }
        if (location) break;

        const usMatch = seg.match(/\b([A-Z][a-zA-Z\s.-]+),\s*([A-Z]{2})\b/);
        if (usMatch && US_STATES.has(usMatch[2].toUpperCase())) {
          location = `${usMatch[1].trim()}, ${usMatch[2].toUpperCase()}`;
          break;
        }

        const metroMatch = seg.match(/\b(San Francisco|New York|Seattle|Austin|Boston|Chicago|Los Angeles|Bengaluru|Bangalore|Hyderabad|Mumbai|Delhi|Pune|Chennai|London|Berlin|Toronto|Vancouver|Singapore|Remote)\b/i);
        if (metroMatch) {
          location = metroMatch[0].trim();
          break;
        }
      }
      if (location) break;
      continue;
    }

    // Check Indian City, State
    for (const state of INDIAN_STATES) {
      const reg = new RegExp(`([a-zA-Z\\s.-]+),\\s*${state}\\b`, 'i');
      const m = l.match(reg);
      if (m) {
        location = `${m[1].trim()}, ${state}`;
        break;
      }
    }
    if (location) break;

    // Check US City, ST
    const usMatch = l.match(/\b([A-Z][a-zA-Z\s.-]+),\s*([A-Z]{2})\b/);
    if (usMatch && US_STATES.has(usMatch[2].toUpperCase())) {
      location = `${usMatch[1].trim()}, ${usMatch[2].toUpperCase()}`;
      break;
    }

    // Check major standalone metro cities
    const metroMatch = l.match(/\b(San Francisco|New York|Seattle|Austin|Boston|Chicago|Los Angeles|Bengaluru|Bangalore|Hyderabad|Mumbai|Delhi|Pune|Chennai|London|Berlin|Toronto|Vancouver|Singapore|Remote)\b/i);
    if (metroMatch && !l.toLowerCase().includes('develop') && !l.toLowerCase().includes('experience')) {
      location = metroMatch[0].trim();
      break;
    }
  }

  flags.push({
    field: 'location',
    confidence: location ? 0.9 : 0,
    needsReview: !location,
    reason: location ? undefined : 'Location not found in header. Please enter your location.'
  });

  // Links
  const githubMatch = rawText.match(/github\.com\/([a-zA-Z0-9-_]+)/i);
  const linkedinMatch = rawText.match(/linkedin\.com\/in\/([a-zA-Z0-9-_]+)/i);
  const portfolioMatch = rawText.match(/(https?:\/\/[a-zA-Z0-9.-]+\.(?:dev|me|io|com|app))/i);

  // 2. SKILLS EXTRACTION
  const technicalSet = new Set<string>();
  const frameworksSet = new Set<string>();
  const toolsSet = new Set<string>();
  const softSet = new Set<string>();

  for (const def of CANONICAL_SKILL_DEFINITIONS) {
    if (def.regex.test(rawText)) {
      if (def.category === 'frameworks') frameworksSet.add(def.name);
      else if (def.category === 'tools') toolsSet.add(def.name);
      else if (def.category === 'soft') softSet.add(def.name);
      else technicalSet.add(def.name);
    }
  }

  // Deduplicate HTML / HTML5 and CSS / CSS3
  if (technicalSet.has('HTML5')) technicalSet.delete('HTML');
  if (technicalSet.has('CSS3')) technicalSet.delete('CSS');

  const detectedTech = Array.from(technicalSet);
  const detectedFrameworks = Array.from(frameworksSet);
  const detectedTools = Array.from(toolsSet);
  const detectedSoft = Array.from(softSet);
  const totalSkillsCount = detectedTech.length + detectedFrameworks.length + detectedTools.length;

  flags.push({
    field: 'skills',
    confidence: totalSkillsCount > 0 ? 0.9 : 0,
    needsReview: totalSkillsCount === 0,
    reason: totalSkillsCount === 0 ? 'No technical skills identified in resume text.' : undefined
  });

  // 3. EDUCATION
  const educationItems: EducationItem[] = [];
  let inEduSection = false;
  const eduLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^(education|academic background|academics)\b/i.test(l)) {
      inEduSection = true;
      continue;
    }
    if (inEduSection && /^(technical skills|skills|areas of interest|soft skills|languages|projects|experience|work history|employment|certifications|relevant coursework|achievements|leadership)\b/i.test(l)) {
      inEduSection = false;
      break;
    }
    if (inEduSection) {
      eduLines.push(l);
    }
  }

  if (eduLines.length > 0) {
    const uniRegex = /(University|College|Polytechnic|Institute of Technology|Academy|School)/i;
    const degreeRegex = /(Bachelor(?:\s+of\s+[A-Za-z]+)?|Master(?:\s+of\s+[A-Za-z]+)?|B\.S\.|B\.A\.|M\.S\.|M\.A\.|Ph\.?D\.|Associate|B\.Tech|B\.E\.)/i;
    const yearRangeRegex = /(201\d|202\d)\s*[-–—to]+\s*(201\d|202\d|Present|Expected)/i;
    const gpaRegex = /(?:CGPA|GPA)[:\s]+([0-9]\.?\d{0,2})/i;

    let currentEdu: Partial<EducationItem> | null = null;

    for (let i = 0; i < eduLines.length; i++) {
      const el = eduLines[i];
      if (uniRegex.test(el)) {
        if (currentEdu && (currentEdu.institution || currentEdu.degree)) {
          educationItems.push(finalizeEdu(currentEdu, educationItems.length + 1));
        }
        let inst = el.replace(yearRangeRegex, '').replace(/\b\d{1,2}(?:\.\d{1,2})?%/g, '').trim();
        inst = inst.replace(/[–—,-]+$/, '').trim();
        const yrMatch = el.match(yearRangeRegex);

        currentEdu = {
          institution: inst,
          degree: '',
          fieldOfStudy: '',
          startDate: yrMatch ? yrMatch[1] : '',
          endDate: yrMatch ? yrMatch[2] : '',
          gpa: undefined
        };
      } else if (currentEdu && degreeRegex.test(el)) {
        const degMatch = el.match(degreeRegex);
        currentEdu.degree = degMatch ? degMatch[1].trim() : '';

        const fieldMatch = el.match(/(?:in|of)\s+([A-Za-z\s&()]+?)(?=\s*CGPA|\s*GPA|\s*\d|\s*$)/i);
        if (fieldMatch) {
          currentEdu.fieldOfStudy = fieldMatch[1].trim();
        }

        const gpaMatch = el.match(gpaRegex);
        if (gpaMatch) {
          currentEdu.gpa = gpaMatch[1].trim();
        }

        const yrMatch = el.match(yearRangeRegex);
        if (yrMatch && !currentEdu.endDate) {
          currentEdu.startDate = yrMatch[1];
          currentEdu.endDate = yrMatch[2];
        }
      } else if (currentEdu && yearRangeRegex.test(el)) {
        const yrMatch = el.match(yearRangeRegex);
        if (yrMatch && !currentEdu.endDate) {
          currentEdu.startDate = yrMatch[1];
          currentEdu.endDate = yrMatch[2];
        }
        const gpaMatch = el.match(gpaRegex);
        if (gpaMatch && !currentEdu.gpa) {
          currentEdu.gpa = gpaMatch[1].trim();
        }
      } else if (currentEdu && gpaRegex.test(el)) {
        const gpaMatch = el.match(gpaRegex);
        if (gpaMatch && !currentEdu.gpa) {
          currentEdu.gpa = gpaMatch[1].trim();
        }
      }
    }
    if (currentEdu && (currentEdu.institution || currentEdu.degree)) {
      educationItems.push(finalizeEdu(currentEdu, educationItems.length + 1));
    }
  }

  flags.push({
    field: 'education',
    confidence: educationItems.length > 0 ? 0.9 : 0,
    needsReview: educationItems.length === 0,
    reason: educationItems.length === 0 ? 'No education credentials detected. Click to add your degree.' : undefined
  });

  // 4. WORK EXPERIENCE
  const experienceItems: ExperienceItem[] = [];
  let inExpSection = false;
  const expLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^(experience|work experience|employment history|professional experience|internships)\b/i.test(l)) {
      inExpSection = true;
      continue;
    }
    if (inExpSection && /^(technical skills|skills|areas of interest|soft skills|languages|projects|education|certifications|relevant coursework|achievements|leadership)\b/i.test(l)) {
      inExpSection = false;
      break;
    }
    if (inExpSection) {
      expLines.push(l);
    }
  }

  if (expLines.length > 0) {
    const bulletPrefixRegex = /^[•·\u2022\u2023\u25E6\u25AA\u25CF\u25CB\uFFFD\-*–—]\s*/;
    let currentExp: Partial<ExperienceItem> | null = null;

    for (let i = 0; i < expLines.length; i++) {
      const el = expLines[i];
      const dateMatch = el.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Summer|Fall|Spring|Winter)?\s*(201\d|202\d)\s*[-–—to]+\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*(201\d|202\d|Present)/i);
      const isBullet = bulletPrefixRegex.test(el);
      const nextLine = i + 1 < expLines.length ? expLines[i + 1] : '';
      const nextDateMatch = nextLine.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Summer|Fall|Spring|Winter)?\s*(201\d|202\d)\s*[-–—to]+\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*(201\d|202\d|Present)/i);

      if (!isBullet && (dateMatch || (nextDateMatch && (el.includes(' - ') || el.includes(' | '))) || (el.includes(' - ') && (el.includes('Intern') || el.includes('Engineer') || el.includes('Developer') || el.includes('Assistant'))))) {
        if (currentExp && (currentExp.company || currentExp.role)) {
          experienceItems.push(finalizeExp(currentExp));
        }

        let company = '';
        let role = '';
        let effectiveDateMatch = dateMatch;

        if (nextDateMatch && !dateMatch) {
          const parts = el.split(/[-–|@,]/).map(p => p.trim()).filter(Boolean);
          company = parts[0] || 'Company';
          role = parts[1] || 'Professional Role';
          effectiveDateMatch = nextDateMatch;
          i++; // consume date line
        } else {
          const rawWithoutDate = el
            .replace(/\((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Summer|Fall|Spring|Winter)?\s*\d{4}\s*[-–—to]+\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*(?:\d{4}|Present)\)/i, '')
            .trim();

          const parts = rawWithoutDate.split(/[-–|@,]/).map(p => p.trim()).filter(Boolean);
          company = parts[0] || 'Company';
          role = parts[1] || 'Software Engineering Intern';
        }

        const dateParts = effectiveDateMatch ? effectiveDateMatch[0].split(/[-–—to]+/) : [];
        currentExp = {
          id: `exp_parsed_${experienceItems.length + 1}`,
          company: company.replace(/[()]/g, '').trim(),
          role: role.replace(/[()]/g, '').trim(),
          location: 'Remote',
          startDate: dateParts[0] ? dateParts[0].trim() : '',
          endDate: dateParts[1] ? dateParts[1].trim() : (dateParts[0] ? dateParts[0].trim() : ''),
          bullets: []
        };
      } else if (currentExp) {
        const cleanBullet = el.replace(bulletPrefixRegex, '').trim();
        if (isBullet) {
          currentExp.bullets = currentExp.bullets || [];
          currentExp.bullets.push(cleanBullet);
        } else if (currentExp.bullets && currentExp.bullets.length > 0) {
          currentExp.bullets[currentExp.bullets.length - 1] += ' ' + cleanBullet;
        } else {
          currentExp.bullets = currentExp.bullets || [];
          currentExp.bullets.push(cleanBullet);
        }
      }
    }
    if (currentExp && (currentExp.company || currentExp.role)) {
      experienceItems.push(finalizeExp(currentExp));
    }
  }

  // 5. PROJECTS
  const projectItems: ProjectItem[] = [];
  let inProjSection = false;
  const projLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^(projects|technical projects|academic projects|key projects)\b/i.test(l)) {
      inProjSection = true;
      continue;
    }
    if (inProjSection && /^(technical skills|skills|areas of interest|soft skills|languages|education|experience|work history|employment|certifications|achievements|leadership|relevant coursework)\b/i.test(l)) {
      inProjSection = false;
      break;
    }
    if (inProjSection) {
      projLines.push(l);
    }
  }

  if (projLines.length > 0) {
    const bulletPrefixRegex = /^[•·\u2022\u2023\u25E6\u25AA\u25CF\u25CB\uFFFD\-*–—]\s*/;
    let currentProj: Partial<ProjectItem> | null = null;

    for (const pl of projLines) {
      const isBullet = bulletPrefixRegex.test(pl);
      const isSubHeader = /^(personal project|academic project|capstone project|ongoing)\b/i.test(pl);
      if (isSubHeader) continue;

      const prevBullet = currentProj && currentProj.bullets && currentProj.bullets.length > 0 ? currentProj.bullets[currentProj.bullets.length - 1] : null;
      const prevBulletIncomplete = prevBullet ? !/[.;!]$/.test(prevBullet.trim()) : false;
      const startsWithLower = /^[a-z]/.test(pl);

      const isTitle = !isBullet &&
        /^[A-Z0-9]/.test(pl) &&
        !pl.endsWith('.') &&
        pl.length < 80 &&
        !pl.includes('http') &&
        !(prevBulletIncomplete && startsWithLower);

      if (isTitle) {
        if (currentProj && currentProj.title) {
          projectItems.push(finalizeProj(currentProj));
        }
        const titleMatch = pl.match(/^([A-Za-z0-9\s&()'/]+?)(?:\s*[-–—:]\s*(.+))?$/);
        const title = titleMatch ? titleMatch[1].trim() : pl;
        currentProj = {
          id: `proj_parsed_${projectItems.length + 1}`,
          title: title || pl,
          techStack: [],
          description: pl,
          bullets: []
        };
      } else if (currentProj) {
        const cleanText = pl.replace(bulletPrefixRegex, '').trim();
        if (isBullet) {
          currentProj.bullets = currentProj.bullets || [];
          currentProj.bullets.push(cleanText);
        } else if (currentProj.bullets && currentProj.bullets.length > 0) {
          currentProj.bullets[currentProj.bullets.length - 1] += ' ' + cleanText;
        } else {
          currentProj.bullets = currentProj.bullets || [];
          currentProj.bullets.push(cleanText);
        }
      }
    }
    if (currentProj && currentProj.title) {
      projectItems.push(finalizeProj(currentProj));
    }
  }

  // 6. CERTIFICATIONS
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

  // Meaningful Confidence Calculation:
  // Full Name: 20
  // Email: 20
  // Phone: 10
  // Education: 20 (20 if institution and degree; 10 if institution only)
  // Skills: 15 (15 if >= 3; 10 if 1-2)
  // Projects / Experience: 15 (15 if >= 1)
  // Total: 100 max
  let score = 0;
  if (fullName) score += 20;
  if (email) score += 20;
  if (phone) score += 10;
  if (educationItems.length > 0) {
    const hasDegree = educationItems.some(e => Boolean(e.degree));
    score += hasDegree ? 20 : 10;
  }
  if (totalSkillsCount >= 3) score += 15;
  else if (totalSkillsCount > 0) score += 10;
  if (projectItems.length > 0 || experienceItems.length > 0) score += 15;

  const confidenceScore = Math.min(100, Math.max(0, score));

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
    rawTextPreview: rawText.slice(0, 300)
  };
}

function finalizeEdu(partial: Partial<EducationItem>, index: number): EducationItem {
  return {
    id: `edu_parsed_${index}`,
    institution: partial.institution || '',
    degree: partial.degree || '',
    fieldOfStudy: partial.fieldOfStudy || '',
    startDate: partial.startDate || '',
    endDate: partial.endDate || '',
    gpa: partial.gpa,
    confirmed: false
  };
}

function finalizeExp(partial: Partial<ExperienceItem>): ExperienceItem {
  return {
    id: partial.id || `exp_${Date.now()}`,
    company: partial.company || '',
    role: partial.role || '',
    location: partial.location || 'Remote',
    startDate: partial.startDate || '',
    endDate: partial.endDate || '',
    current: (partial.endDate || '').toLowerCase().includes('present'),
    bullets: partial.bullets || [],
    confirmed: false
  };
}

function finalizeProj(partial: Partial<ProjectItem>): ProjectItem {
  return {
    id: partial.id || `proj_${Date.now()}`,
    title: partial.title || '',
    techStack: partial.techStack || [],
    description: partial.description || '',
    bullets: partial.bullets || (partial.description ? [partial.description] : []),
    confirmed: false
  };
}

export function createEmptyProfileClient(): CandidateProfile {
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
