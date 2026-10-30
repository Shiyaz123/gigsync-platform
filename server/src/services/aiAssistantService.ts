import { CandidateProfile, TechnicalSkillsCategories } from '../types';

export interface ResumeEditOperation {
  type: 'ADD' | 'UPDATE' | 'DELETE' | 'REORDER' | 'RENAME' | 'FORMAT';
  target: string; // e.g. 'skills.programmingLanguages', 'personalInfo.github', 'sections'
  value?: any;
  previousValue?: any;
  description: string;
}

export interface AssistantTurnResult {
  reply: string;
  operations: ResumeEditOperation[];
  updatedProfile: CandidateProfile;
  suggestedQuickReplies?: string[];
  requiresConfirmation?: boolean;
}

function cleanText(val: any): string {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (/^(n\/?a|na|not\s+applicable|none|nil|-|\.)$/i.test(trimmed)) return '';
  return trimmed;
}

function cleanList(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(cleanText).filter(Boolean);
}

function getSafeCategorizedSkills(profile: CandidateProfile): TechnicalSkillsCategories {
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

  return {
    programmingLanguages: cleanList(cat.programmingLanguages),
    backendAndApis: cleanList(cat.backendAndApis),
    databases: cleanList(cat.databases),
    testing: cleanList(cat.testing),
    toolsAndDevelopment: cleanList(cat.toolsAndDevelopment),
    frontend: cleanList(cat.frontend),
    csFundamentals: cleanList(cat.csFundamentals),
    aiAndMl: cleanList(cat.aiAndMl)
  };
}

/**
 * Intelligent AI Resume Editor
 * Interprets natural language instructions and applies controlled, schema-validated mutations.
 */
export async function executeResumeEditInstruction(
  instruction: string,
  currentProfile: CandidateProfile,
  _history?: any[]
): Promise<AssistantTurnResult> {
  const text = instruction.trim();
  const lower = text.toLowerCase();
  const updated: CandidateProfile = JSON.parse(JSON.stringify(currentProfile));
  const operations: ResumeEditOperation[] = [];

  // Initialize helper structures if not yet set
  if (!updated.categorizedSkills) {
    updated.categorizedSkills = getSafeCategorizedSkills(currentProfile);
  }
  if (!updated.sectionNames) updated.sectionNames = {};
  if (!updated.hiddenSections) updated.hiddenSections = [];
  if (!updated.sectionOrder) {
    updated.sectionOrder = [
      'personalInfo', 'summary', 'skills', 'experience', 'projects',
      'education', 'achievements', 'leadership', 'certifications',
      'publications', 'extracurricular', 'languages', 'interests'
    ];
  }

  // 1. Remove specific field ("Remove GitHub field", "Remove LinkedIn link", "Remove phone number")
  const removeFieldMatch = text.match(/(?:remove|delete|clear)\s+(?:the\s+)?(github|linkedin|phone|email|location|summary|portfolio)(?:\s+field|\s+link)?/i);
  if (removeFieldMatch) {
    const field = removeFieldMatch[1].toLowerCase() as keyof typeof updated.personalInfo;
    const prev = updated.personalInfo[field];
    (updated.personalInfo as any)[field] = '';
    operations.push({
      type: 'DELETE',
      target: `personalInfo.${field}`,
      value: '',
      previousValue: prev,
      description: `Cleared ${field}`
    });

    return {
      reply: `Cleared your ${field} from personal information.`,
      operations,
      updatedProfile: updated,
      suggestedQuickReplies: ['Undo change']
    };
  }

  // 2. Remove or hide an entire section ("Remove the Interests section", "Hide Publications")
  const removeSectionMatch = text.match(/(?:remove|delete|hide)\s+(?:the\s+)?([a-zA-Z\s&]+?)\s+section/i);
  if (removeSectionMatch) {
    const secName = removeSectionMatch[1].trim().toLowerCase();
    const sectionKeys = ['interests', 'publications', 'achievements', 'leadership', 'extracurricular', 'certifications', 'skills', 'projects', 'experience', 'education', 'summary'];
    const targetSec = sectionKeys.find(k => secName.includes(k));

    if (targetSec) {
      if (!updated.hiddenSections.includes(targetSec)) {
        updated.hiddenSections.push(targetSec);
        operations.push({
          type: 'DELETE',
          target: `sections.${targetSec}`,
          value: 'hidden',
          description: `Hidden section "${targetSec}"`
        });

        return {
          reply: `I have removed the "${targetSec}" section from your generated resume. Your entered data is preserved if you wish to unhide it later.`,
          operations,
          updatedProfile: updated,
          suggestedQuickReplies: ['Undo change', 'Restore section']
        };
      } else {
        return {
          reply: `The "${targetSec}" section is already hidden.`,
          operations: [],
          updatedProfile: currentProfile
        };
      }
    }
  }

  // 3. Rename a section ("Rename Technical Skills to Skills", "Rename Projects to Technical Portfolio")
  const renameMatch = text.match(/rename\s+(?:the\s+)?([a-zA-Z\s&]+?)\s+(?:section\s+)?to\s+["']?([a-zA-Z\s&/]+?)["']?$/i);
  if (renameMatch) {
    const rawTarget = renameMatch[1].trim().toLowerCase();
    const newName = renameMatch[2].trim();

    const sectionKeyMap: Record<string, string> = {
      'technical skills': 'skills',
      'skills': 'skills',
      'experience': 'experience',
      'work experience': 'experience',
      'projects': 'projects',
      'education': 'education',
      'achievements': 'achievements',
      'mentorship & leadership': 'leadership',
      'leadership': 'leadership',
      'certifications': 'certifications',
      'publications': 'publications',
      'extracurricular activities': 'extracurricular',
      'languages': 'languages',
      'interests': 'interests',
      'professional summary': 'summary',
      'summary': 'summary'
    };

    const targetKey = Object.keys(sectionKeyMap).find(k => rawTarget.includes(k));
    if (targetKey) {
      const key = sectionKeyMap[targetKey];
      const prev = updated.sectionNames[key] || '';
      updated.sectionNames[key] = newName;
      operations.push({
        type: 'RENAME',
        target: `sections.${key}`,
        value: newName,
        previousValue: prev,
        description: `Renamed section "${key}" to "${newName}"`
      });

      return {
        reply: `Renamed the "${targetKey}" section to "${newName}". The updated header is now visible in the form and CV templates.`,
        operations,
        updatedProfile: updated
      };
    }
  }

  // 4. Move / Reorder section ("Move Certifications above Projects", "Move Education to top")
  const moveMatch = text.match(/move\s+(?:the\s+)?([a-zA-Z\s&]+?)\s+(?:section\s+)?(above|below|before|after|to top)\s*(?:of\s+)?([a-zA-Z\s&]*)/i);
  if (moveMatch) {
    const rawSubject = moveMatch[1].trim().toLowerCase();
    const position = moveMatch[2].toLowerCase();
    const rawTarget = moveMatch[3] ? moveMatch[3].trim().toLowerCase() : '';

    const sectionKeys = ['personalInfo', 'summary', 'skills', 'experience', 'projects', 'education', 'achievements', 'leadership', 'certifications', 'publications', 'extracurricular', 'languages', 'interests'];
    const subjectKey = sectionKeys.find(k => rawSubject.includes(k) || k.toLowerCase().includes(rawSubject));
    const targetKey = rawTarget ? sectionKeys.find(k => rawTarget.includes(k) || k.toLowerCase().includes(rawTarget)) : null;

    if (subjectKey) {
      const prevOrder = [...updated.sectionOrder];
      let newOrder = prevOrder.filter(s => s !== subjectKey);

      if (position === 'to top') {
        newOrder = [subjectKey, ...newOrder];
      } else if (targetKey) {
        const targetIdx = newOrder.indexOf(targetKey);
        if (targetIdx !== -1) {
          if (position === 'above' || position === 'before') {
            newOrder.splice(targetIdx, 0, subjectKey);
          } else {
            newOrder.splice(targetIdx + 1, 0, subjectKey);
          }
        }
      }

      updated.sectionOrder = newOrder;
      operations.push({
        type: 'REORDER',
        target: 'sections.order',
        value: newOrder,
        previousValue: prevOrder,
        description: `Reordered section "${subjectKey}"`
      });

      return {
        reply: `Updated the section order. "${subjectKey}" has been moved ${position} ${rawTarget || ''}.`,
        operations,
        updatedProfile: updated
      };
    }
  }

  // 5. Add a new skill under a specific category ("Add Docker under Tools & Development", "Add Python to programming languages")
  const addSkillMatch = text.match(/(?:add|insert|include)\s+([a-zA-Z0-9#+.\s-]+?)\s+(?:under|to|into|in)\s+(?:my\s+)?([a-zA-Z0-9&/,\s-]+)/i);
  if (addSkillMatch) {
    const newSkill = addSkillMatch[1].trim();
    const dest = addSkillMatch[2].toLowerCase();

    let targetCat: keyof TechnicalSkillsCategories = 'toolsAndDevelopment';
    if (dest.includes('language') || dest.includes('programming')) targetCat = 'programmingLanguages';
    else if (dest.includes('backend') || dest.includes('api')) targetCat = 'backendAndApis';
    else if (dest.includes('database') || dest.includes('data')) targetCat = 'databases';
    else if (dest.includes('frontend') || dest.includes('ui')) targetCat = 'frontend';
    else if (dest.includes('test') || dest.includes('qa')) targetCat = 'testing';
    else if (dest.includes('fundamental') || dest.includes('cs') || dest.includes('algorithm')) targetCat = 'csFundamentals';
    else if (dest.includes('ai') || dest.includes('ml') || dest.includes('learning')) targetCat = 'aiAndMl';

    const prevList = updated.categorizedSkills[targetCat] || [];
    if (!prevList.some(s => s.toLowerCase() === newSkill.toLowerCase())) {
      updated.categorizedSkills[targetCat] = [...prevList, newSkill];
      operations.push({
        type: 'ADD',
        target: `skills.${targetCat}`,
        value: newSkill,
        previousValue: prevList,
        description: `Added "${newSkill}" to ${targetCat}`
      });

      // Synchronize legacy skills
      if (updated.skills) {
        if (!updated.skills.technical.includes(newSkill)) {
          updated.skills.technical.push(newSkill);
        }
      }

      return {
        reply: `Added "${newSkill}" under ${targetCat}. The change is live on your form and preview.`,
        operations,
        updatedProfile: updated,
        suggestedQuickReplies: ['Undo change', 'View updated preview']
      };
    } else {
      return {
        reply: `"${newSkill}" is already listed under ${targetCat}.`,
        operations: [],
        updatedProfile: currentProfile
      };
    }
  }

  // 6. Remove specific skill ("Remove Java from my programming languages", "delete python from skills", "remove skill Java")
  const removeSkillMatch = text.match(/(?:remove|delete|drop|eliminate)\s+([a-zA-Z0-9#+.\s-]+?)\s+(?:from|in|out of)\s+(?:my\s+)?([a-zA-Z0-9&/,\s-]+)/i) ||
                           text.match(/(?:remove|delete)\s+(?:skill\s+)?([a-zA-Z0-9#+.-]+)\s*$/i);

  if (removeSkillMatch && !lower.includes('section') && !lower.includes('field')) {
    const targetSkill = removeSkillMatch[1].trim();
    const specifiedCategory = removeSkillMatch[2] ? removeSkillMatch[2].toLowerCase() : '';

    let removed = false;
    let categoryFound = '';

    const catKeyMap: Record<string, keyof TechnicalSkillsCategories> = {
      'programming': 'programmingLanguages',
      'programming language': 'programmingLanguages',
      'programming languages': 'programmingLanguages',
      'language': 'programmingLanguages',
      'languages': 'programmingLanguages',
      'backend': 'backendAndApis',
      'api': 'backendAndApis',
      'apis': 'backendAndApis',
      'backend & apis': 'backendAndApis',
      'database': 'databases',
      'databases': 'databases',
      'testing': 'testing',
      'tool': 'toolsAndDevelopment',
      'tools': 'toolsAndDevelopment',
      'tools & development': 'toolsAndDevelopment',
      'frontend': 'frontend',
      'computer science': 'csFundamentals',
      'cs fundamentals': 'csFundamentals',
      'ai': 'aiAndMl',
      'ml': 'aiAndMl',
      'ai / ml': 'aiAndMl',
      'ai/ml': 'aiAndMl'
    };

    const targetKey = specifiedCategory ? Object.keys(catKeyMap).find(k => specifiedCategory.includes(k)) : null;

    if (targetKey && updated.categorizedSkills[catKeyMap[targetKey]]) {
      const catName = catKeyMap[targetKey];
      const prevList = [...updated.categorizedSkills[catName]];
      const nextList = prevList.filter(s => s.toLowerCase() !== targetSkill.toLowerCase());
      if (prevList.length !== nextList.length) {
        updated.categorizedSkills[catName] = nextList;
        removed = true;
        categoryFound = catName;
        operations.push({
          type: 'DELETE',
          target: `skills.${catName}`,
          value: targetSkill,
          previousValue: prevList,
          description: `Removed "${targetSkill}" from ${catName}`
        });
      }
    } else {
      // Search across all skill categories
      for (const [key, list] of Object.entries(updated.categorizedSkills)) {
        const k = key as keyof TechnicalSkillsCategories;
        const prevList = [...list];
        const nextList = prevList.filter(s => s.toLowerCase() !== targetSkill.toLowerCase());
        if (prevList.length !== nextList.length) {
          updated.categorizedSkills[k] = nextList;
          removed = true;
          categoryFound = k;
          operations.push({
            type: 'DELETE',
            target: `skills.${k}`,
            value: targetSkill,
            previousValue: prevList,
            description: `Removed "${targetSkill}" from ${k}`
          });
          break;
        }
      }

      // Also clean up legacy technical list if present
      if (updated.skills?.technical) {
        updated.skills.technical = updated.skills.technical.filter(s => s.toLowerCase() !== targetSkill.toLowerCase());
      }
    }

    if (removed) {
      return {
        reply: `Done! I have removed "${targetSkill}" from your ${categoryFound || 'skills'}. All other skills and sections remain untouched.`,
        operations,
        updatedProfile: updated,
        suggestedQuickReplies: ['Undo change', 'View updated preview', 'Add another skill']
      };
    } else {
      return {
        reply: `I could not find "${targetSkill}" in your skills. Here are your current skill categories: ${Object.keys(updated.categorizedSkills).filter(k => updated.categorizedSkills![k as keyof TechnicalSkillsCategories].length > 0).join(', ')}.`,
        operations: [],
        updatedProfile: currentProfile
      };
    }
  }

  // 7. Adjust formatting and spacing ("Make Education more compact", "Make CV one page", "Compact spacing", "Spacious")
  if (lower.includes('compact') || lower.includes('one page') || lower.includes('single page')) {
    const prevSpacing = updated.layoutSpacing;
    updated.layoutSpacing = 'compact';
    operations.push({
      type: 'FORMAT',
      target: 'layoutSpacing',
      value: 'compact',
      previousValue: prevSpacing,
      description: 'Set layout spacing to compact for single-page presentation'
    });

    return {
      reply: `Adjusted formatting to compact mode. Padding and line-spacing have been optimized for high-density, ATS-friendly single-page output.`,
      operations,
      updatedProfile: updated
    };
  } else if (lower.includes('spacious') || lower.includes('relax spacing') || lower.includes('more space')) {
    updated.layoutSpacing = 'spacious';
    operations.push({
      type: 'FORMAT',
      target: 'layoutSpacing',
      value: 'spacious',
      description: 'Set layout spacing to spacious'
    });

    return {
      reply: `Adjusted formatting to spacious mode with generous white-space for multi-page executive readability.`,
      operations,
      updatedProfile: updated
    };
  }

  // 8. Rewrite / polish professional summary based strictly on confirmed profile facts
  if (lower.includes('rewrite') || lower.includes('summary') || lower.includes('professional summary')) {
    const role = cleanText(updated.personalInfo.title) || 'Software Engineer';
    const topSkills = [
      ...updated.categorizedSkills.programmingLanguages.slice(0, 3),
      ...updated.categorizedSkills.backendAndApis.slice(0, 2),
      ...updated.categorizedSkills.databases.slice(0, 1)
    ];

    let polishedSummary = `${role} with strong hands-on experience in ${topSkills.length > 0 ? topSkills.join(', ') : 'modern software engineering'}.`;
    if (updated.projects?.length > 0) {
      polishedSummary += ` Demonstrated track record building resilient web applications, including ${cleanText(updated.projects[0].title)}.`;
    }
    polishedSummary += ` Focused on clean architecture, ATS-compliant delivery, and scalable systems.`;

    const prev = updated.personalInfo.summary;
    updated.personalInfo.summary = polishedSummary;
    operations.push({
      type: 'UPDATE',
      target: 'personalInfo.summary',
      value: polishedSummary,
      previousValue: prev,
      description: 'Polished professional summary using confirmed facts'
    });

    return {
      reply: `Here is a refined, truthful professional summary based on your confirmed background:\n\n"${polishedSummary}"\n\nI have updated the summary field on your form.`,
      operations,
      updatedProfile: updated,
      suggestedQuickReplies: ['Undo change', 'Shorten summary']
    };
  }

  // 9. General guidance or intelligent suggestion
  return {
    reply: `I understand. I can directly edit your resume data. You can ask me to:\n• "Remove Java from my programming languages"\n• "Add Docker under Tools & Development"\n• "Rename Technical Skills to Core Competencies"\n• "Move Certifications above Projects"\n• "Remove the Interests section"\n• "Make the CV compact / one page"\n• "Rewrite the professional summary"`,
    operations: [],
    updatedProfile: currentProfile,
    suggestedQuickReplies: [
      'Rewrite professional summary',
      'Make CV compact (one page)',
      'Add Docker under Tools & Development'
    ]
  };
}
