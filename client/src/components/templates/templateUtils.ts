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
