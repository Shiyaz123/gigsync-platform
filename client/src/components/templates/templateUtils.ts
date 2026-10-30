import { CandidateProfile, TechnicalSkillsCategories } from '../../types';

/**
 * Checks if a value is blank, undefined, null, or indicates "Not Applicable".
 * Explicitly treats "N/A", "NA", "Not Applicable", "none", "nil", and "-" as empty values.
 */
export function isNAOrEmpty(val: any): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return true;
    if (/^(n\/?a|na|not\s+applicable|none|nil|-|\.)$/i.test(trimmed)) return true;
  }
  if (Array.isArray(val)) {
    return val.filter(item => !isNAOrEmpty(item)).length === 0;
  }
  if (typeof val === 'object') {
    return Object.values(val).every(v => isNAOrEmpty(v));
  }
  return false;
}

/**
 * Returns trimmed text or empty string if value is N/A or blank.
 */
export function cleanText(val: string | undefined | null): string {
  if (!val || isNAOrEmpty(val)) return '';
  return val.trim();
}

/**
 * Filters a string list, discarding blank and N/A values.
 */
export function cleanList(arr: string[] | undefined | null): string[] {
  if (!arr || !Array.isArray(arr)) return [];
  return arr
    .map(s => (typeof s === 'string' ? s.trim() : ''))
    .filter(s => s && !isNAOrEmpty(s));
}

/**
 * Extracts and consolidates technical skills by 8 standardized categories,
 * gracefully incorporating legacy profile skills if categories are unset.
 */
export function getCategorizedSkills(profile: CandidateProfile): TechnicalSkillsCategories {
  const cat = profile.categorizedSkills || profile.skills?.categories || {
    programmingLanguages: [],
    backendAndApis: [],
    databases: [],
    testing: [],
    toolsAndDevelopment: [],
    frontend: [],
    csFundamentals: [],
    aiAndMl: []
  };

  const res: TechnicalSkillsCategories = {
    programmingLanguages: cleanList(cat.programmingLanguages),
    backendAndApis: cleanList(cat.backendAndApis),
    databases: cleanList(cat.databases),
    testing: cleanList(cat.testing),
    toolsAndDevelopment: cleanList(cat.toolsAndDevelopment),
    frontend: cleanList(cat.frontend),
    csFundamentals: cleanList(cat.csFundamentals),
    aiAndMl: cleanList(cat.aiAndMl)
  };

  // If categorized skills are completely empty, intelligently map legacy skills
  const totalCategorized = Object.values(res).reduce((acc, curr) => acc + curr.length, 0);
  if (totalCategorized === 0) {
    const tech = cleanList(profile.skills?.technical);
    const frameworks = cleanList(profile.skills?.frameworks);
    const tools = cleanList(profile.skills?.tools);

    tech.forEach(skill => {
      const lower = skill.toLowerCase();
      if (/python|javascript|typescript|c\+\+|java|c#|go|rust|ruby|php|kotlin|swift|r|scala|bash/i.test(lower)) {
        res.programmingLanguages.push(skill);
      } else if (/ai|ml|machine\s*learning|deep\s*learning|nlp|pytorch|tensorflow|scikit|llm|rag/i.test(lower)) {
        res.aiAndMl.push(skill);
      } else if (/data\s*structures|algorithms|system\s*design|os|networking|oop/i.test(lower)) {
        res.csFundamentals.push(skill);
      } else {
        res.programmingLanguages.push(skill);
      }
    });

    frameworks.forEach(skill => {
      const lower = skill.toLowerCase();
      if (/react|vue|angular|svelte|next|tailwind|css|html/i.test(lower)) {
        res.frontend.push(skill);
      } else if (/node|express|fastapi|django|flask|spring|asp\.net|graphql|rest/i.test(lower)) {
        res.backendAndApis.push(skill);
      } else {
        res.backendAndApis.push(skill);
      }
    });

    tools.forEach(skill => {
      const lower = skill.toLowerCase();
      if (/sql|postgres|mysql|mongodb|redis|dynamodb|sqlite|oracle|cassandra/i.test(lower)) {
        res.databases.push(skill);
      } else if (/jest|pytest|cypress|selenium|playwright|junit|mocha/i.test(lower)) {
        res.testing.push(skill);
      } else {
        res.toolsAndDevelopment.push(skill);
      }
    });
  }

  return res;
}

/**
 * Standard 13 Section IDs
 */
export const DEFAULT_SECTION_ORDER = [
  'personalInfo',
  'summary',
  'education',
  'skills',
  'experience',
  'projects',
  'achievements',
  'leadership',
  'certifications',
  'publications',
  'extracurricular',
  'languages',
  'interests'
];

export const DEFAULT_SECTION_NAMES: Record<string, string> = {
  personalInfo: 'Personal Information',
  summary: 'Professional Summary',
  education: 'Education',
  skills: 'Technical Skills',
  experience: 'Work Experience',
  projects: 'Projects',
  achievements: 'Achievements',
  leadership: 'Mentorship & Leadership',
  certifications: 'Certifications',
  publications: 'Publications',
  extracurricular: 'Extracurricular Activities',
  languages: 'Languages Known',
  interests: 'Interests'
};

/**
 * Normalizes and formats Degree and Field of Study / Branch cleanly.
 * Eliminates awkward dangling "in", "B.E. in", or duplicated fields.
 */
export function formatEducationDegree(degree?: string | null, branch?: string | null): string {
  let d = cleanText(degree);
  let b = cleanText(branch);

  // Clean trailing "in", "of", "-", "–", or commas from degree
  d = d.replace(/[\s,–—-]+$/g, '').trim();
  d = d.replace(/\s+(?:in|of)\s*$/i, '').trim();

  // Clean leading "in", "of", "-", "–" from branch
  b = b.replace(/^[\s,–—-]+/g, '').trim();
  b = b.replace(/^(?:in|of)\s+/i, '').trim();

  if (!d && !b) return '';
  if (d && !b) return d;
  if (!d && b) return b;

  // If degree already includes the branch (e.g. "B.E. in Computer Science")
  const dLower = d.toLowerCase();
  const bLower = b.toLowerCase();
  if (dLower.includes(bLower)) {
    return d;
  }

  return `${d} in ${b}`;
}

/**
 * Formats a clean, safe web URL with protocol, or returns empty string if invalid or generic.
 */
export function formatSafeUrl(url?: string | null): string {
  if (!url || isNAOrEmpty(url)) return '';
  const trimmed = url.trim();

  // Reject generic anchor labels like "Link", "View", "Website"
  if (/^(link|url|website|click here|github|view|demo)$/i.test(trimmed)) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Handle common domains or handle-like patterns
  if (/^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/.*)?$/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return '';
}

export interface CleanedProject {
  title: string;
  subtitle: string;
  bullets: string[];
  techStack: string[];
  githubUrl: string;
  liveUrl: string;
}

/**
 * Cleans a project entry:
 * - Strips dangling "Link", "GitHub", "Code" artifact strings from title and description.
 * - Eliminates exact duplicate titles rendered as descriptions.
 * - Separates title and subtitle if merged with a hyphen/dash.
 * - Deduplicates bullets against subtitle and title.
 * - Validates GitHub and live URLs.
 */
export function cleanProjectEntry(proj: any): CleanedProject {
  let title = cleanText(proj.title);
  let desc = cleanText(proj.description);
  const techStack = cleanList([...(proj.technologies || []), ...(proj.techStack || [])]);
  let bullets = cleanList([...(proj.keyFeatures || []), ...(proj.bullets || [])]);

  // Strip trailing "Link", "GitHub", "Code", "Live Demo" artifact suffixes from title
  title = title.replace(/\s*(?:[-–—|/]\s*)?(?:link|github|code|live\s*demo|view)\s*$/i, '').trim();

  // Strip trailing "Link" artifact from description
  desc = desc.replace(/\s*(?:[-–—|/]\s*)?(?:link|github|code|live\s*demo|view)\s*$/i, '').trim();

  // If title itself has a dash separator (e.g. "Protego – Emergency Response System")
  // and desc is empty or identical, split title and subtitle
  let subtitle = desc;

  const titleSplit = title.match(/^([A-Za-z0-9\s&()'/]+?)\s*[-–—:]\s*(.+)$/);
  if (titleSplit && !subtitle) {
    title = titleSplit[1].trim();
    subtitle = titleSplit[2].trim();
  }

  // If subtitle/desc is essentially identical to title, discard it to avoid duplication!
  const normalizeForComparison = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalizeForComparison(title) === normalizeForComparison(subtitle)) {
    subtitle = '';
  }

  // If subtitle starts with the title followed by separator (e.g. "Protego – Emergency Response System")
  if (subtitle) {
    const subSplit = subtitle.match(/^([A-Za-z0-9\s&()'/]+?)\s*[-–—:]\s*(.+)$/);
    if (subSplit && normalizeForComparison(subSplit[1]) === normalizeForComparison(title)) {
      subtitle = subSplit[2].trim();
    }
  }

  // If subtitle still matches title or is just a URL / "Link", clear it
  if (normalizeForComparison(title) === normalizeForComparison(subtitle) || /^(link|view)$/i.test(subtitle)) {
    subtitle = '';
  }

  // Deduplicate bullets against subtitle
  if (subtitle) {
    bullets = bullets.filter(b => normalizeForComparison(b) !== normalizeForComparison(subtitle));
  }

  // Validate URLs
  const githubUrl = formatSafeUrl(proj.githubUrl || proj.repoUrl);
  const liveUrl = formatSafeUrl(proj.liveUrl || proj.url);

  return {
    title,
    subtitle,
    bullets,
    techStack,
    githubUrl,
    liveUrl
  };
}

