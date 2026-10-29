import {
  CandidateProfile,
  JobListing,
  JobMatchResult,
  MatchedSkillItem,
  MissingSkillItem,
  ConstraintItem
} from '../types';

/**
 * Normalizes skill strings for robust matching (e.g., 'React.js' -> 'react', 'Node' -> 'node')
 */
export function normalizeSkill(skill: string): string {
  return skill
    .trim()
    .toLowerCase()
    .replace(/\.js$/i, '')
    .trim();
}

/**
 * Checks if a target skill exists within a text string or profile token
 */
export function matchesSkillToken(targetSkill: string, text: string): boolean {
  const normTarget = normalizeSkill(targetSkill);
  const normText = text.toLowerCase();

  if (normTarget === 'c' && !normText.includes(' c ') && !normText.startsWith('c ') && !normText.endsWith(' c')) {
    return false;
  }

  // Handle common aliases
  const aliasMap: Record<string, string[]> = {
    'react': ['react', 'reactjs', 'react.js'],
    'node': ['node', 'nodejs', 'node.js'],
    'typescript': ['typescript', 'ts'],
    'javascript': ['javascript', 'js', 'es6'],
    'postgres': ['postgres', 'postgresql'],
    'mongo': ['mongo', 'mongodb'],
    'rest apis': ['rest', 'restful', 'rest api', 'rest apis', 'api design'],
    'fastapi': ['fastapi', 'fast-api'],
    'docker': ['docker', 'container', 'containers', 'dockerfile'],
    'aws': ['aws', 'amazon web services', 's3', 'ec2'],
    'automated testing / jest': ['testing', 'jest', 'cypress', 'playwright', 'unit test', 'automated test'],
    'flutter or react native': ['flutter', 'react native'],
    'javascript or python': ['javascript', 'python', 'js', 'py']
  };

  const aliases = aliasMap[normTarget] || [normTarget];
  return aliases.some(alias => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    return regex.test(normText);
  });
}

/**
 * Explains and calculates job match using PRD Section 7.2 weighted scoring algorithm.
 */
export function calculateJobMatch(
  profile: CandidateProfile,
  job: JobListing
): JobMatchResult {
  // Collect all confirmed profile evidence
  const allProfileSkills = [
    ...profile.skills.technical,
    ...profile.skills.frameworks,
    ...profile.skills.tools
  ];

  // Search project descriptions & bullet points for tech evidence
  const projectTech = profile.projects.flatMap(p => [
    ...p.techStack,
    p.title,
    p.description,
    ...p.bullets
  ]);

  // Search experience bullets
  const experienceText = profile.experience.flatMap(e => [
    e.company,
    e.role,
    ...e.bullets
  ]);

  const combinedEvidenceText = [
    ...allProfileSkills,
    ...projectTech,
    ...experienceText
  ].join(' ');

  const matchedSkills: MatchedSkillItem[] = [];
  const missingEssentialSkills: MissingSkillItem[] = [];
  const missingPreferredSkills: MissingSkillItem[] = [];

  // 1. Evaluate Essential Skills
  let essentialMatchedCount = 0;
  for (const skill of job.requirements.essentialSkills) {
    let found = false;
    let evidenceSource = '';

    // Check direct skill list
    const inSkills = allProfileSkills.find(s => matchesSkillToken(skill, s));
    if (inSkills) {
      found = true;
      evidenceSource = `Listed in Profile Skills: "${inSkills}"`;
    }

    // Check projects
    const matchedProject = profile.projects.find(p =>
      p.techStack.some(t => matchesSkillToken(skill, t)) ||
      matchesSkillToken(skill, p.title) ||
      matchesSkillToken(skill, p.description) ||
      p.bullets.some(b => matchesSkillToken(skill, b))
    );

    if (matchedProject) {
      found = true;
      evidenceSource = evidenceSource
        ? `${evidenceSource} & Demonstrated in Project "${matchedProject.title}"`
        : `Demonstrated in Project "${matchedProject.title}"`;
    }

    // Check experience
    const matchedExp = profile.experience.find(e =>
      matchesSkillToken(skill, e.role) ||
      e.bullets.some(b => matchesSkillToken(skill, b))
    );

    if (matchedExp) {
      found = true;
      evidenceSource = evidenceSource
        ? `${evidenceSource} & Applied at ${matchedExp.company}`
        : `Applied in experience at ${matchedExp.company}`;
    }

    if (found) {
      essentialMatchedCount++;
      matchedSkills.push({
        skill,
        evidence: evidenceSource,
        category: 'essential'
      });
    } else {
      missingEssentialSkills.push({
        skill,
        importance: 'essential',
        learnable: true,
        whyItMatters: `Explicitly marked as a mandatory requirement for ${job.title} at ${job.company}.`
      });
    }
  }

  // 2. Evaluate Preferred Skills
  let preferredMatchedCount = 0;
  for (const skill of job.requirements.preferredSkills) {
    let found = false;
    let evidenceSource = '';

    const inSkills = allProfileSkills.find(s => matchesSkillToken(skill, s));
    if (inSkills) {
      found = true;
      evidenceSource = `Listed in Profile Skills: "${inSkills}"`;
    }

    const matchedProject = profile.projects.find(p =>
      p.techStack.some(t => matchesSkillToken(skill, t)) ||
      matchesSkillToken(skill, p.title) ||
      p.bullets.some(b => matchesSkillToken(skill, b))
    );

    if (matchedProject) {
      found = true;
      evidenceSource = evidenceSource
        ? `${evidenceSource} & Project "${matchedProject.title}"`
        : `Demonstrated in Project "${matchedProject.title}"`;
    }

    if (found) {
      preferredMatchedCount++;
      matchedSkills.push({
        skill,
        evidence: evidenceSource,
        category: 'preferred'
      });
    } else {
      missingPreferredSkills.push({
        skill,
        importance: 'preferred',
        learnable: true,
        whyItMatters: `Valued bonus qualification that distinguishes candidates during technical screening.`
      });
    }
  }

  // 3. Score Calculations (PRD Section 7.2)
  // Essential skills: 70% of skills weight, Preferred skills: 30%
  const essentialRatio = job.requirements.essentialSkills.length > 0
    ? essentialMatchedCount / job.requirements.essentialSkills.length
    : 1;

  const preferredRatio = job.requirements.preferredSkills.length > 0
    ? preferredMatchedCount / job.requirements.preferredSkills.length
    : 1;

  const skillsScore = Math.round((essentialRatio * 0.7 + preferredRatio * 0.3) * 100);

  // Experience relevance (25% weight): based on projects & relevant internships
  let experienceScore = 70; // baseline for student projects
  if (profile.experience.length > 0) {
    experienceScore = Math.min(100, 75 + (profile.experience.length * 12));
  }
  if (job.requirements.minYearsExperience > 0 && profile.experience.length === 0) {
    experienceScore = Math.max(35, experienceScore - 30);
  }

  // Education score (15% weight)
  let educationScore = 85;
  if (profile.education.length > 0) {
    const csDegree = profile.education.find(e =>
      /computer science|software|engineering|data|information/i.test(e.fieldOfStudy)
    );
    if (csDegree) educationScore = 95;
  }

  // Role similarity score (10% weight)
  const targetMatches = profile.careerPreferences.targetRoles.some(r =>
    job.title.toLowerCase().includes(r.toLowerCase()) ||
    r.toLowerCase().includes(job.title.toLowerCase())
  );
  const roleSimilarityScore = targetMatches ? 95 : 75;

  // Weighted total: Skills 50%, Experience 25%, Education 15%, Role 10%
  const overallScore = Math.round(
    (skillsScore * 0.50) +
    (experienceScore * 0.25) +
    (educationScore * 0.15) +
    (roleSimilarityScore * 0.10)
  );

  // 4. Hard Constraints Evaluation (FR-19: separated from learnable skills)
  const hardConstraints: ConstraintItem[] = [];
  const unknownInfo: string[] = [];

  for (const constraint of job.requirements.constraints) {
    const lowerC = constraint.toLowerCase();
    if (lowerC.includes('work authorization') || lowerC.includes('authorized to work') || lowerC.includes('us citizen')) {
      // In early-career profiles, work auth is often assumed or needs user confirmation
      hardConstraints.push({
        constraint,
        status: 'unknown',
        note: 'Requires user confirmation during external application.'
      });
      unknownInfo.push('Work authorization status not explicitly specified in master profile.');
    } else if (lowerC.includes('graduating') || lowerC.includes('grad')) {
      const gradYear = profile.education[0]?.endDate;
      if (gradYear && (gradYear.includes('2025') || gradYear.includes('2026'))) {
        hardConstraints.push({
          constraint,
          status: 'satisfied',
          note: `Profile graduation date (${gradYear}) matches requirement.`
        });
      } else {
        hardConstraints.push({
          constraint,
          status: 'unknown',
          note: 'Confirm graduation timeline matches candidate window.'
        });
      }
    } else if (lowerC.includes('on-site') || lowerC.includes('presence')) {
      const isLocal = profile.personalInfo.location.toLowerCase().includes(job.location.split(',')[0].toLowerCase());
      hardConstraints.push({
        constraint,
        status: isLocal ? 'satisfied' : 'unmet',
        note: isLocal ? 'Candidate location aligns with office hub.' : 'Role requires physical presence; relocation or commute required.'
      });
    } else {
      hardConstraints.push({
        constraint,
        status: 'unknown',
        note: 'Review formal job listing details before final application submission.'
      });
    }
  }

  // 5. Tailoring Tips (Grounded, non-hallucinated guidance)
  const tailoringTips: string[] = [];
  if (missingEssentialSkills.length > 0) {
    tailoringTips.push(
      `Prioritize ${missingEssentialSkills.map(s => s.skill).slice(0, 2).join(' and ')} in your learning roadmap before applying.`
    );
  }
  if (matchedSkills.length > 0) {
    tailoringTips.push(
      `Feature your experience with ${matchedSkills.slice(0, 3).map(m => m.skill).join(', ')} prominently in your project bullet points.`
    );
  }
  if (job.workMode === 'Remote') {
    tailoringTips.push('Highlight asynchronous communication and self-directed project delivery in your summary.');
  }

  // 6. Generate Human-Readable Explanation
  const explanation = `Matches ${matchedSkills.length} of ${job.requirements.essentialSkills.length + job.requirements.preferredSkills.length} total requirements (${essentialMatchedCount}/${job.requirements.essentialSkills.length} essential). ${
    missingEssentialSkills.length > 0
      ? `Primary skill gap: ${missingEssentialSkills.map(s => s.skill).join(', ')}.`
      : 'All essential technical skills are verified in your profile.'
  }`;

  return {
    id: `match_${Date.now()}_${job.id}`,
    userId: profile.userId,
    jobId: job.id,
    overallScore: Math.min(99, Math.max(15, overallScore)),
    scoreBreakdown: {
      skillsScore,
      experienceScore,
      educationScore,
      roleSimilarityScore
    },
    matchedSkills,
    missingEssentialSkills,
    missingPreferredSkills,
    hardConstraints,
    unknownInfo,
    explanation,
    tailoringTips,
    disclaimer: 'This relevance score reflects profile alignment with stated requirements. It does not calculate hiring probability or guarantee an interview.',
    createdAt: new Date().toISOString()
  };
}
