export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isGuest: boolean;
  preferences?: {
    theme: 'light' | 'dark';
    allowExternalAI: boolean;
  };
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  honors?: string;
  confirmed: boolean;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
  confirmed: boolean;
}

export interface ProjectItem {
  id: string;
  title: string;
  role?: string;
  techStack: string[];
  description: string;
  bullets: string[];
  liveUrl?: string;
  repoUrl?: string;
  confirmed: boolean;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  credentialUrl?: string;
  confirmed: boolean;
}

export interface CandidateProfile {
  userId: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    title: string;
    summary: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: {
    technical: string[];
    frameworks: string[];
    tools: string[];
    soft: string[];
  };
  certifications: CertificationItem[];
  careerPreferences: {
    targetRoles: string[];
    workModes: ('Remote' | 'Hybrid' | 'On-site')[];
    targetLocations: string[];
    minSalary?: string;
  };
  confirmedFactsOnly: boolean;
  lastConfirmedAt: string;
  updatedAt: string;
}

export interface ExtractedFieldFlag {
  field: string;
  confidence: number;
  needsReview: boolean;
  reason?: string;
}

export interface ParsedResumeResult {
  extractedProfile: CandidateProfile;
  confidenceScore: number;
  flags: ExtractedFieldFlag[];
  warnings: string[];
  rawTextPreview: string;
}

export interface ResumeVersion {
  id: string;
  userId: string;
  title: string;
  templateId: 'modern' | 'academic' | 'executive' | 'minimalist';
  targetJobId?: string;
  targetJobTitle?: string;
  structuredContent: CandidateProfile;
  latexSource: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobRequirements {
  essentialSkills: string[];
  preferredSkills: string[];
  constraints: string[];
  minYearsExperience: number;
  degreeRequirement?: string;
}

export interface JobListing {
  id: string;
  source: 'LinkedIn' | 'Indeed' | 'Handshake' | 'Company Direct' | 'Curated Partner';
  sourceJobId: string;
  title: string;
  company: string;
  location: string;
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  experienceLevel: 'Internship' | 'Entry-level' | 'Junior' | 'Mid-level';
  salaryRange: string;
  description: string;
  requirements: JobRequirements;
  postedAt: string;
  applyUrl: string;
  verified: boolean;
  matchScore?: number;
  matchSummary?: string;
  stale?: boolean;
}

export interface MatchedSkillItem {
  skill: string;
  evidence: string;
  category: 'essential' | 'preferred';
}

export interface MissingSkillItem {
  skill: string;
  importance: 'essential' | 'preferred';
  learnable: boolean;
  whyItMatters: string;
}

export interface ConstraintItem {
  constraint: string;
  status: 'satisfied' | 'unmet' | 'unknown';
  note: string;
}

export interface JobMatchResult {
  id: string;
  userId: string;
  jobId: string;
  overallScore: number;
  scoreBreakdown: {
    skillsScore: number;
    experienceScore: number;
    educationScore: number;
    roleSimilarityScore: number;
  };
  matchedSkills: MatchedSkillItem[];
  missingEssentialSkills: MissingSkillItem[];
  missingPreferredSkills: MissingSkillItem[];
  hardConstraints: ConstraintItem[];
  unknownInfo: string[];
  explanation: string;
  tailoringTips: string[];
  disclaimer: string;
  createdAt: string;
}

export interface LearningResource {
  id: string;
  provider: string;
  title: string;
  url: string;
  skills: string[];
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  priceStatus: 'Free' | 'Free Audit' | 'Paid';
  rating: number;
  verified: boolean;
  description: string;
}

export interface LearningRoadmapItem {
  id: string;
  skill: string;
  resourceId: string;
  resource: LearningResource;
  status: 'planned' | 'in-progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  targetDate?: string;
  notes?: string;
}

export interface LearningRoadmapStage {
  stageNumber: number;
  stageName: string;
  description: string;
  items: LearningRoadmapItem[];
}

export interface LearningRoadmap {
  id: string;
  userId: string;
  targetJobId?: string;
  targetRole: string;
  stages: LearningRoadmapStage[];
  updatedAt: string;
}

export interface SavedJob {
  id: string;
  userId: string;
  jobId: string;
  job: JobListing;
  matchScore: number;
  status: 'saved' | 'interested' | 'applied' | 'interviewing' | 'not_relevant';
  notes: string;
  savedAt: string;
}
