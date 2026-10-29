import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  DEFAULT_GUEST_PROFILE,
  SEEDED_JOB_LISTINGS,
  SEEDED_LEARNING_RESOURCES
} from './data/seedData';
import { calculateJobMatch } from './services/matchingEngine';
import { generateLatexResume } from './services/latexService';
import { parseResumeText } from './services/parserService';
import { processAssistantTurn, AssistantState } from './services/aiAssistantService';
import {
  CandidateProfile,
  JobListing,
  LearningRoadmap,
  ResumeVersion,
  SavedJob
} from './types';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// In-memory data store for the session
let currentProfile: CandidateProfile = JSON.parse(JSON.stringify(DEFAULT_GUEST_PROFILE));
let savedJobs: SavedJob[] = [
  {
    id: 'saved_1',
    userId: currentProfile.userId,
    jobId: 'job_1',
    job: SEEDED_JOB_LISTINGS[0],
    matchScore: 88,
    status: 'interested',
    notes: 'Great match for React and TypeScript skills. Need to review Docker basics.',
    savedAt: new Date(Date.now() - 86400000).toISOString()
  }
];
let resumeVersions: ResumeVersion[] = [
  {
    id: 'res_v1',
    userId: currentProfile.userId,
    title: 'Full-Stack Developer Resume (Master)',
    templateId: 'modern',
    structuredContent: JSON.parse(JSON.stringify(currentProfile)),
    latexSource: generateLatexResume(currentProfile, 'modern'),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString()
  }
];

// Active learning roadmaps by user
let activeRoadmaps: Record<string, LearningRoadmap> = {};

// --------------------------------------------------------------------------
// System & Health
// --------------------------------------------------------------------------
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', product: 'GigSync API', version: '1.0.0', time: new Date().toISOString() });
});

// --------------------------------------------------------------------------
// Auth & User Profile (FR-01, FR-02, FR-03, FR-04)
// --------------------------------------------------------------------------
app.post('/api/auth/guest', (req: Request, res: Response) => {
  res.json({
    user: {
      id: currentProfile.userId,
      email: currentProfile.personalInfo.email,
      name: currentProfile.personalInfo.fullName,
      role: 'Student / Early Career',
      isGuest: true
    },
    profile: currentProfile
  });
});

app.get('/api/profile', (req: Request, res: Response) => {
  res.json(currentProfile);
});

app.put('/api/profile', (req: Request, res: Response) => {
  const updated = req.body;
  if (!updated || !updated.personalInfo) {
    return res.status(400).json({ error: 'Invalid profile data structure' });
  }
  currentProfile = {
    ...updated,
    lastConfirmedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  res.json({ success: true, profile: currentProfile });
});

// Data Export & Deletion (FR-04, NFR-05)
app.get('/api/profile/export', (req: Request, res: Response) => {
  const exportPayload = {
    metadata: {
      platform: 'GigSync Career Assistance Platform',
      exportDate: new Date().toISOString(),
      user: currentProfile.userId
    },
    profile: currentProfile,
    savedJobs,
    resumeVersions,
    activeRoadmaps: Object.values(activeRoadmaps)
  };
  res.setHeader('Content-Disposition', 'attachment; filename=gigsync_data_export.json');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(exportPayload, null, 2));
});

app.delete('/api/profile', (req: Request, res: Response) => {
  // Reset to empty profile for privacy wipe
  currentProfile = {
    userId: 'usr_' + Date.now(),
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
    skills: { technical: [], frameworks: [], tools: [], soft: [] },
    certifications: [],
    careerPreferences: { targetRoles: [], workModes: [], targetLocations: [] },
    confirmedFactsOnly: true,
    lastConfirmedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  savedJobs = [];
  resumeVersions = [];
  activeRoadmaps = {};
  res.json({ success: true, message: 'All personal data wiped successfully.' });
});

// --------------------------------------------------------------------------
// Resume Parsing (FR-05, FR-06, FR-07, FR-12)
// --------------------------------------------------------------------------
app.post('/api/parser/parse', (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text content is required for parsing.' });
  }

  const result = parseResumeText(text);
  res.json(result);
});

// --------------------------------------------------------------------------
// Conversational AI Resume Assistant (Option B)
// --------------------------------------------------------------------------
app.post('/api/ai/resume-assistant', (req: Request, res: Response) => {
  const { userText, currentState } = req.body;
  if (!currentState) {
    const initialState: AssistantState = {
      currentStep: 'intro',
      history: [
        {
          id: 'welcome_1',
          sender: 'assistant',
          text: 'Welcome to the GigSync AI Resume Assistant. I will guide you through turning your existing projects, coursework, and experience into a structured, truthful profile. What is your full name and target engineering role?',
          step: 'intro',
          suggestedQuickReplies: ['Alex Morgan - Full-Stack Developer', 'Jordan Lee - Junior Backend Engineer']
        }
      ],
      draftProfile: {}
    };
    return res.json({ state: initialState, reply: initialState.history[0] });
  }

  const result = processAssistantTurn(userText || '', currentState);
  res.json({ state: result.nextState, reply: result.reply });
});

// --------------------------------------------------------------------------
// Jobs & Discovery (FR-14, FR-15, FR-20)
// --------------------------------------------------------------------------
app.get('/api/jobs', (req: Request, res: Response) => {
  const { keyword, workMode, experienceLevel, location } = req.query;

  let results = [...SEEDED_JOB_LISTINGS];

  if (keyword && typeof keyword === 'string') {
    const kw = keyword.toLowerCase();
    results = results.filter(j =>
      j.title.toLowerCase().includes(kw) ||
      j.company.toLowerCase().includes(kw) ||
      j.requirements.essentialSkills.some(s => s.toLowerCase().includes(kw)) ||
      j.description.toLowerCase().includes(kw)
    );
  }

  if (workMode && typeof workMode === 'string' && workMode !== 'All') {
    results = results.filter(j => j.workMode.toLowerCase() === workMode.toLowerCase());
  }

  if (experienceLevel && typeof experienceLevel === 'string' && experienceLevel !== 'All') {
    results = results.filter(j => j.experienceLevel.toLowerCase() === experienceLevel.toLowerCase());
  }

  if (location && typeof location === 'string') {
    results = results.filter(j => j.location.toLowerCase().includes(location.toLowerCase()));
  }

  // Attach real-time computed relevance scores for user
  const jobsWithScores = results.map(job => {
    const match = calculateJobMatch(currentProfile, job);
    return {
      ...job,
      matchScore: match.overallScore,
      matchSummary: match.explanation
    };
  });

  res.json(jobsWithScores);
});

app.get('/api/jobs/:id', (req: Request, res: Response) => {
  const job = SEEDED_JOB_LISTINGS.find(j => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job listing not found.' });
  }
  const match = calculateJobMatch(currentProfile, job);
  res.json({ job, match });
});

// --------------------------------------------------------------------------
// Matching Engine (FR-16, FR-17, FR-18, FR-19)
// --------------------------------------------------------------------------
app.post('/api/match', (req: Request, res: Response) => {
  const { jobId, customJob } = req.body;

  let targetJob: JobListing | undefined;
  if (jobId) {
    targetJob = SEEDED_JOB_LISTINGS.find(j => j.id === jobId);
  } else if (customJob) {
    targetJob = customJob;
  }

  if (!targetJob) {
    return res.status(400).json({ error: 'A valid jobId or customJob is required for matching.' });
  }

  const result = calculateJobMatch(currentProfile, targetJob);
  res.json(result);
});

// --------------------------------------------------------------------------
// Skill-Gap & Course Recommendations (FR-22 to FR-29)
// --------------------------------------------------------------------------
app.get('/api/courses', (req: Request, res: Response) => {
  const { skill } = req.query;

  if (skill && typeof skill === 'string') {
    const s = skill.toLowerCase();
    const matched = SEEDED_LEARNING_RESOURCES.filter(r =>
      r.skills.some(sk => sk.toLowerCase().includes(s) || s.includes(sk.toLowerCase())) ||
      r.title.toLowerCase().includes(s)
    );
    return res.json(matched);
  }

  res.json(SEEDED_LEARNING_RESOURCES);
});

app.post('/api/roadmap/generate', (req: Request, res: Response) => {
  const { jobId, targetRole, missingSkills } = req.body;

  const skillsToAddress: string[] = missingSkills || ['Docker', 'AWS', 'Automated Testing / Jest'];

  // Map missing skills to verified resources
  const roadmapItems = skillsToAddress.map((skillName, index) => {
    const matchingResource = SEEDED_LEARNING_RESOURCES.find(r =>
      r.skills.some(s => s.toLowerCase().includes(skillName.toLowerCase()) || skillName.toLowerCase().includes(s.toLowerCase()))
    ) || SEEDED_LEARNING_RESOURCES[0];

    return {
      id: `plan_item_${Date.now()}_${index}`,
      skill: skillName,
      resourceId: matchingResource.id,
      resource: matchingResource,
      status: 'planned' as const,
      priority: (index === 0 ? 'high' : index === 1 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      targetDate: new Date(Date.now() + (index + 1) * 7 * 86400000).toISOString().split('T')[0]
    };
  });

  const stage1 = {
    stageNumber: 1,
    stageName: 'Stage 1: Core Fundamentals & Prerequisite Tools',
    description: 'Establish baseline competence and containerized local development workflows.',
    items: roadmapItems.slice(0, 1)
  };

  const stage2 = {
    stageNumber: 2,
    stageName: 'Stage 2: Essential Role Requirements',
    description: 'Master mandatory technical stack requirements specified in the job posting.',
    items: roadmapItems.slice(1, 2)
  };

  const stage3 = {
    stageNumber: 3,
    stageName: 'Stage 3: Portfolio Integration & Preferred Skills',
    description: 'Build a tangible project artifact incorporating the newly acquired skill set.',
    items: roadmapItems.slice(2)
  };

  const roadmap: LearningRoadmap = {
    id: `roadmap_${Date.now()}`,
    userId: currentProfile.userId,
    targetJobId: jobId,
    targetRole: targetRole || 'Target Career Pathway',
    stages: [stage1, stage2, stage3].filter(s => s.items.length > 0),
    updatedAt: new Date().toISOString()
  };

  activeRoadmaps[currentProfile.userId] = roadmap;
  res.json(roadmap);
});

app.get('/api/roadmap', (req: Request, res: Response) => {
  const existing = activeRoadmaps[currentProfile.userId];
  if (existing) {
    return res.json(existing);
  }
  // Return default starter roadmap if none generated yet
  const defaultRoadmap: LearningRoadmap = {
    id: 'roadmap_default',
    userId: currentProfile.userId,
    targetRole: 'Junior Full-Stack & Cloud Engineer',
    stages: [
      {
        stageNumber: 1,
        stageName: 'Stage 1: Containerization Fundamentals',
        description: 'Understand container lifecycle, Dockerfiles, and compose configurations.',
        items: [
          {
            id: 'item_dock',
            skill: 'Docker',
            resourceId: 'res_docker_official',
            resource: SEEDED_LEARNING_RESOURCES[0],
            status: 'in-progress',
            priority: 'high',
            targetDate: '2026-11-05',
            notes: 'Completed container basics; working on multi-stage build setup.'
          }
        ]
      },
      {
        stageNumber: 2,
        stageName: 'Stage 2: Automated Testing & CI/CD',
        description: 'Implement automated test suites with high unit & integration coverage.',
        items: [
          {
            id: 'item_test',
            skill: 'Automated Testing / Jest',
            resourceId: 'res_helsinki_fullstack',
            resource: SEEDED_LEARNING_RESOURCES[2],
            status: 'planned',
            priority: 'high',
            targetDate: '2026-11-15'
          }
        ]
      },
      {
        stageNumber: 3,
        stageName: 'Stage 3: Cloud Infrastructure Essentials',
        description: 'Deploy containerized web services to AWS / Cloud runtime.',
        items: [
          {
            id: 'item_cloud',
            skill: 'AWS',
            resourceId: 'res_aws_practitioner',
            resource: SEEDED_LEARNING_RESOURCES[5],
            status: 'planned',
            priority: 'medium',
            targetDate: '2026-11-30'
          }
        ]
      }
    ],
    updatedAt: new Date().toISOString()
  };
  activeRoadmaps[currentProfile.userId] = defaultRoadmap;
  res.json(defaultRoadmap);
});

app.put('/api/roadmap/item/:itemId', (req: Request, res: Response) => {
  const { itemId } = req.params;
  const { status, notes, targetDate } = req.body;
  const roadmap = activeRoadmaps[currentProfile.userId];

  if (!roadmap) {
    return res.status(404).json({ error: 'No active roadmap found.' });
  }

  for (const stage of roadmap.stages) {
    const item = stage.items.find(i => i.id === itemId);
    if (item) {
      if (status) item.status = status;
      if (notes !== undefined) item.notes = notes;
      if (targetDate !== undefined) item.targetDate = targetDate;
      roadmap.updatedAt = new Date().toISOString();
      return res.json({ success: true, item });
    }
  }

  res.status(404).json({ error: 'Roadmap item not found.' });
});

// --------------------------------------------------------------------------
// Resume Studio & LaTeX (FR-08, FR-09, FR-10, FR-11)
// --------------------------------------------------------------------------
app.post('/api/resumes/latex', (req: Request, res: Response) => {
  const { templateId = 'modern', profileOverride } = req.body;
  const profileToUse = profileOverride || currentProfile;

  const latex = generateLatexResume(profileToUse, templateId);
  res.json({
    templateId,
    latexSource: latex,
    generatedAt: new Date().toISOString()
  });
});

app.get('/api/resumes/versions', (req: Request, res: Response) => {
  res.json(resumeVersions);
});

app.post('/api/resumes/versions', (req: Request, res: Response) => {
  const { title, templateId, structuredContent, targetJobId, targetJobTitle } = req.body;

  const newVersion: ResumeVersion = {
    id: `res_v_${Date.now()}`,
    userId: currentProfile.userId,
    title: title || 'Custom Resume Version',
    templateId: templateId || 'modern',
    targetJobId,
    targetJobTitle,
    structuredContent: structuredContent || currentProfile,
    latexSource: generateLatexResume(structuredContent || currentProfile, templateId || 'modern'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  resumeVersions.unshift(newVersion);
  res.status(201).json(newVersion);
});

// --------------------------------------------------------------------------
// Saved Jobs (FR-21, FR-30)
// --------------------------------------------------------------------------
app.get('/api/saved-jobs', (req: Request, res: Response) => {
  res.json(savedJobs);
});

app.post('/api/saved-jobs', (req: Request, res: Response) => {
  const { jobId, status = 'saved', notes = '' } = req.body;

  const job = SEEDED_JOB_LISTINGS.find(j => j.id === jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const existingIdx = savedJobs.findIndex(sj => sj.jobId === jobId);
  const match = calculateJobMatch(currentProfile, job);

  if (existingIdx >= 0) {
    savedJobs[existingIdx].status = status;
    savedJobs[existingIdx].notes = notes;
    savedJobs[existingIdx].matchScore = match.overallScore;
    return res.json(savedJobs[existingIdx]);
  }

  const newSaved: SavedJob = {
    id: `saved_${Date.now()}`,
    userId: currentProfile.userId,
    jobId,
    job,
    matchScore: match.overallScore,
    status,
    notes,
    savedAt: new Date().toISOString()
  };

  savedJobs.unshift(newSaved);
  res.status(201).json(newSaved);
});

app.delete('/api/saved-jobs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  savedJobs = savedJobs.filter(sj => sj.id !== id && sj.jobId !== id);
  res.json({ success: true });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[GigSync] API server listening on http://localhost:${PORT}`);
});
