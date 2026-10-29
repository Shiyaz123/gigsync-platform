import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileAsync = promisify(execFile);
import {
  DEFAULT_GUEST_PROFILE,
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
const FLASK_SERVICE_URL = (process.env.FLASK_SERVICE_URL || 'http://127.0.0.1:5001').replace(/\/+$/, '');

// In-memory cache for live genuine job listings fetched from Flask/providers
const liveJobStore = new Map<string, JobListing>();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID', 'Accept'],
  credentials: true
}));
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));

// URL normalizer: ensure req.url starts with /api for Vercel serverless / proxy rewrites
app.use((req, res, next) => {
  if (!req.url.startsWith('/api')) {
    req.url = `/api${req.url}`;
  }
  next();
});

const uploadStorage = multer.memoryStorage();
const uploadMiddleware = multer({
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// In-memory data store for the session
let currentProfile: CandidateProfile = JSON.parse(JSON.stringify(DEFAULT_GUEST_PROFILE));
// Genuine saved jobs: initialized empty in production (no fabricated jobs)
let savedJobs: SavedJob[] = [];
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
// Support both POST and GET for guest session initialization
const handleGuestAuth = (req: Request, res: Response) => {
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
};
app.post('/api/auth/guest', handleGuestAuth);
app.get('/api/auth/guest', handleGuestAuth);

app.get('/api/profile', (req: Request, res: Response) => {
  res.json(currentProfile);
});

// Support both PUT and POST for profile update
const handleProfileUpdate = (req: Request, res: Response) => {
  const updated = req.body;
  if (!updated) {
    return res.status(400).json({ error: 'Invalid profile data structure' });
  }

  if (updated.personalInfo) {
    currentProfile = {
      ...updated,
      lastConfirmedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } else {
    // If flat format received
    currentProfile.personalInfo.fullName = updated.full_name || updated.fullName || currentProfile.personalInfo.fullName;
    currentProfile.personalInfo.email = updated.email || currentProfile.personalInfo.email;
    currentProfile.personalInfo.phone = updated.phone || currentProfile.personalInfo.phone;
    currentProfile.personalInfo.location = updated.location || currentProfile.personalInfo.location;
    currentProfile.personalInfo.title = updated.target_role || updated.targetRole || currentProfile.personalInfo.title;
    if (updated.skills && Array.isArray(updated.skills)) {
      currentProfile.skills.technical = updated.skills;
    }
    currentProfile.lastConfirmedAt = new Date().toISOString();
    currentProfile.updatedAt = new Date().toISOString();
  }

  res.json({ success: true, profile: currentProfile });
};
app.put('/api/profile', handleProfileUpdate);
app.post('/api/profile', handleProfileUpdate);

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
const uploadFields = uploadMiddleware.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]);

app.post('/api/parser/upload', (req: Request, res: Response, next) => {
  uploadFields(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds 10MB limit.' });
      }
      return res.status(400).json({ error: err.message || 'Error processing uploaded file.' });
    }
    next();
  });
}, async (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const file = files?.resume?.[0] || files?.file?.[0] || (req as any).file;
  if (!file) {
    return res.status(400).json({ error: 'No resume file uploaded. Please select a PDF, DOCX, or TXT file using field "resume" or "file".' });
  }

  // 1. First, attempt Python PyMuPDF (fitz) + python-docx + Gemini extraction
  const tempDir = os.tmpdir();
  const safeBase = path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
  const tempFilePath = path.join(tempDir, `gigsync_${Date.now()}_${safeBase}`);

  try {
    await fs.promises.writeFile(tempFilePath, file.buffer);
    const cliScript = path.resolve(__dirname, '../../backend/parse_cli.py');

    if (fs.existsSync(cliScript)) {
      try {
        const { stdout } = await execFileAsync('py', [cliScript, tempFilePath], {
          timeout: 45000,
          env: { ...process.env }
        });

        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON object found in Python output');
        }
        const pyResult = JSON.parse(jsonMatch[0]);
        if (pyResult.success && pyResult.extracted_profile) {
          const p = pyResult.extracted_profile;
          const extractedProfile: CandidateProfile = {
            userId: 'usr_parsed_' + Date.now(),
            personalInfo: {
              fullName: p.full_name || '',
              email: p.email || '',
              phone: p.phone || '',
              location: p.location || '',
              title: p.target_role || '',
              summary: ''
            },
            education: (p.education || []).map((e: any, idx: number) => ({
              id: `edu_parsed_${idx + 1}`,
              institution: e.institution || '',
              degree: e.degree || '',
              fieldOfStudy: e.field_of_study || '',
              startDate: e.start_date || '',
              endDate: e.end_date || '',
              gpa: e.gpa || undefined,
              confirmed: false
            })),
            skills: {
              technical: p.skills || [],
              frameworks: [],
              tools: [],
              soft: []
            },
            experience: (p.experience || []).map((e: any, idx: number) => ({
              id: `exp_parsed_${idx + 1}`,
              company: e.company || '',
              role: e.role || '',
              location: e.location || '',
              startDate: e.start_date || '',
              endDate: e.end_date || '',
              current: false,
              bullets: e.bullets || [],
              confirmed: false
            })),
            projects: (p.projects || []).map((proj: any, idx: number) => ({
              id: `proj_parsed_${idx + 1}`,
              title: proj.title || '',
              techStack: proj.tech_stack || [],
              description: proj.description || '',
              bullets: proj.bullets || [],
              confirmed: false
            })),
            certifications: (p.certifications || []).map((c: any, idx: number) => ({
              id: `cert_parsed_${idx + 1}`,
              name: c.name || '',
              issuer: c.issuer || '',
              issueDate: c.issue_date || '',
              confirmed: false
            })),
            careerPreferences: {
              targetRoles: p.target_role ? [p.target_role] : [],
              workModes: ['Remote', 'Hybrid'],
              targetLocations: p.location ? [p.location] : []
            },
            confirmedFactsOnly: true,
            lastConfirmedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          currentProfile = JSON.parse(JSON.stringify(extractedProfile));

          return res.json({
            success: true,
            fileName: file.originalname,
            fileSize: file.size,
            extractedProfile,
            extracted_profile: p,
            confidenceScore: pyResult.confidence_score,
            warnings: pyResult.warnings || [],
            sourceMethod: pyResult.source_method || 'pymupdf_python_parser'
          });
        }
      } catch (pyRunErr) {
        console.warn('[GigSync] Python PyMuPDF subprocess error, invoking resilient Node parser:', pyRunErr);
      }
    }
  } catch (fsErr) {
    console.warn('[GigSync] Temp file error:', fsErr);
  } finally {
    await fs.promises.unlink(tempFilePath).catch(() => {});
  }

  // 2. Resilient Node Parser Fallback (strictly NEVER decoding binary PDF buffers as strings)
  try {
    let extractedText = '';
    const nameLower = file.originalname.toLowerCase();

    if (nameLower.endsWith('.pdf') || file.mimetype === 'application/pdf') {
      try {
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const uint8 = new Uint8Array(file.buffer);
        const loadingTask = pdfjsLib.getDocument({ data: uint8, isEvalSupported: false, useSystemFonts: true } as any);
        const pdfDoc = await loadingTask.promise;
        let fullText = '';
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const content = await page.getTextContent();
          let pageLines: string[] = [];
          let currentLine = '';
          let lastY: number | null = null;

          for (const item of content.items as any[]) {
            if (!item.str && !item.hasEOL) continue;
            const y = item.transform ? item.transform[5] : null;
            if (lastY !== null && y !== null && Math.abs(y - lastY) > 3.5) {
              if (currentLine.trim()) pageLines.push(currentLine.trim());
              currentLine = '';
            }
            const str = item.str || '';
            if (str) {
              if (currentLine && !currentLine.endsWith(' ') && !str.startsWith(' ')) {
                currentLine += ' ';
              }
              currentLine += str;
            }
            if (item.hasEOL) {
              if (currentLine.trim()) pageLines.push(currentLine.trim());
              currentLine = '';
              lastY = null;
            } else {
              lastY = y;
            }
          }
          if (currentLine.trim()) pageLines.push(currentLine.trim());
          fullText += pageLines.join('\n') + '\n\n';
        }
        extractedText = fullText;
      } catch (pdfErr) {
        console.warn('[GigSync] PDF text extraction failed:', pdfErr);
        return res.status(400).json({
          error: 'Could not extract readable text from PDF. If this is a scanned document, please paste the plain text directly.'
        });
      }
    } else if (nameLower.endsWith('.docx') || file.mimetype.includes('wordprocessingml')) {
      const docxResult = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = docxResult.value || '';
    } else {
      extractedText = file.buffer.toString('utf-8');
    }

    if (!extractedText || extractedText.trim().length < 15) {
      return res.status(400).json({
        error: 'Could not extract readable text from document. If this is a scanned document, please paste the plain text directly.'
      });
    }

    const parsedResult = parseResumeText(extractedText, file.originalname);
    currentProfile = JSON.parse(JSON.stringify(parsedResult.extractedProfile));

    return res.json({
      success: true,
      fileName: file.originalname,
      fileSize: file.size,
      ...parsedResult,
      sourceMethod: 'nodejs_resilient_parser'
    });
  } catch (err: any) {
    console.error('File parsing error:', err);
    return res.status(500).json({ error: err.message || 'Failed to process resume file.' });
  }
});

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
app.get('/api/ai/resume-assistant', (req: Request, res: Response) => {
  const initialState: AssistantState = {
    currentStep: 'intro',
    history: [
      {
        id: 'welcome_1',
        sender: 'assistant',
        text: 'Welcome to the GigSync AI Resume Assistant. I will guide you through turning your existing projects, coursework, and experience into a structured, truthful profile. What is your full name and target engineering role?',
        step: 'intro',
        suggestedQuickReplies: ['Software Engineer', 'Full-Stack Developer', 'Frontend Engineer', 'Data Scientist']
      }
    ],
    draftProfile: {}
  };
  res.json({ state: initialState, reply: initialState.history[0] });
});

app.post('/api/ai/resume-assistant', (req: Request, res: Response) => {
  const { userText, currentState } = req.body || {};
  if (!currentState) {
    const initialState: AssistantState = {
      currentStep: 'intro',
      history: [
        {
          id: 'welcome_1',
          sender: 'assistant',
          text: 'Welcome to the GigSync AI Resume Assistant. I will guide you through turning your existing projects, coursework, and experience into a structured, truthful profile. What is your full name and target engineering role?',
          step: 'intro',
          suggestedQuickReplies: ['Software Engineer', 'Full-Stack Developer', 'Frontend Engineer', 'Data Scientist']
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
// Powered by Python Flask Job Search Service with Real Job Providers
// --------------------------------------------------------------------------
app.get('/api/jobs', async (req: Request, res: Response) => {
  const { keyword, role, workMode, work_mode, experienceLevel, experience_level, experience, location, page, limit } = req.query;

  const params = new URLSearchParams();
  const searchRole = (role || keyword || '') as string;
  if (searchRole) params.append('role', searchRole);
  if (location && typeof location === 'string') params.append('location', location);

  const resolvedWorkMode = (workMode || work_mode || 'All') as string;
  if (resolvedWorkMode && resolvedWorkMode !== 'All') params.append('work_mode', resolvedWorkMode);

  const resolvedExp = (experienceLevel || experience_level || experience || 'All') as string;
  if (resolvedExp && resolvedExp !== 'All') params.append('experience_level', resolvedExp);

  if (page) params.append('page', String(page));
  if (limit) params.append('limit', String(limit));

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const flaskUrl = `${FLASK_SERVICE_URL}/api/jobs${queryStr}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const flaskRes = await fetch(flaskUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeout);

    if (!flaskRes.ok) {
      let errMsg = `Flask service returned HTTP ${flaskRes.status}`;
      try {
        const errJson: any = await flaskRes.json();
        if (errJson && errJson.message) errMsg = errJson.message;
      } catch {}
      return res.status(flaskRes.status).json({
        error: 'Job Search Provider Error',
        message: errMsg
      });
    }

    const data: any = await flaskRes.json();
    const rawJobs: JobListing[] = Array.isArray(data) ? data : (data.jobs || []);

    // Cache the genuine jobs in liveJobStore and calculate honest match scores
    const jobsWithScores = rawJobs.map(job => {
      liveJobStore.set(job.id, job);
      const match = calculateJobMatch(currentProfile, job);
      return {
        ...job,
        matchScore: match.overallScore,
        matchSummary: match.explanation
      };
    });

    res.json(jobsWithScores);
  } catch (err: any) {
    console.error('[GigSync Gateway] Failed to query Flask job search service:', err.message);
    // Return structured 503 error without fabricated jobs
    return res.status(503).json({
      error: 'Job Service Unavailable',
      message: 'The Python Flask job search service is not reachable. Please start the Flask service on port 5001 to execute live location-based searches.'
    });
  }
});

app.get('/api/jobs/:id', async (req: Request, res: Response) => {
  let job = liveJobStore.get(req.params.id);

  if (!job) {
    try {
      const flaskRes = await fetch(`${FLASK_SERVICE_URL}/api/jobs/${req.params.id}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (flaskRes.ok) {
        const data: any = await flaskRes.json();
        job = data.job || data;
        if (job) liveJobStore.set(job.id, job);
      }
    } catch {}
  }

  if (!job) {
    return res.status(404).json({ error: 'Job listing not found. It may have expired or was not yet cached from search results.' });
  }

  const match = calculateJobMatch(currentProfile, job);
  res.json({ job, match });
});

// --------------------------------------------------------------------------
// Matching Engine (FR-16, FR-17, FR-18, FR-19)
// --------------------------------------------------------------------------
app.post('/api/match', async (req: Request, res: Response) => {
  const { jobId, customJob } = req.body;

  let targetJob: JobListing | undefined;
  if (jobId) {
    targetJob = liveJobStore.get(jobId);
    if (!targetJob) {
      try {
        const flaskRes = await fetch(`${FLASK_SERVICE_URL}/api/jobs/${jobId}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (flaskRes.ok) {
          const data: any = await flaskRes.json();
          targetJob = data.job || data;
          if (targetJob) liveJobStore.set(targetJob.id, targetJob);
        }
      } catch {}
    }
  } else if (customJob) {
    targetJob = customJob;
  }

  if (!targetJob) {
    return res.status(400).json({ error: 'A valid jobId or customJob is required for matching.' });
  }

  // Attempt match computation via Python Flask matching engine endpoint
  try {
    const matchRes = await fetch(`${FLASK_SERVICE_URL}/api/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: currentProfile, job: targetJob })
    });
    if (matchRes.ok) {
      const matchResult = await matchRes.json();
      return res.json(matchResult);
    }
  } catch {}

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
  const { jobId, status = 'saved', notes = '', job: customJob } = req.body;

  const job = liveJobStore.get(jobId) || customJob;
  if (!job) {
    return res.status(404).json({ error: 'Job not found in active session.' });
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

// Catch-all 404 handler for any unhandled /api/* routes ensuring clean JSON response
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `Route '${req.method} ${req.path}' not found on API server.` });
});

// Start Server when run directly
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[GigSync] API server listening on http://localhost:${PORT}`);
  });
}

export default app;
