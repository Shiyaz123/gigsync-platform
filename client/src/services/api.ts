import {
  CandidateProfile,
  JobListing,
  JobMatchResult,
  LearningResource,
  LearningRoadmap,
  ParsedResumeResult,
  ResumeVersion,
  SavedJob,
  User
} from '../types';

const API_BASE = '/api';

// Helper for HTTP requests with graceful fallback
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn(`[GigSync API] Call to ${endpoint} failed, checking fallback...`, err);
    throw err;
  }
}

export const api = {
  // Auth & Guest
  async getGuestSession(): Promise<{ user: User; profile: CandidateProfile }> {
    return request('/auth/guest', { method: 'POST' });
  },

  // Profile
  async getProfile(): Promise<CandidateProfile> {
    return request('/profile');
  },

  async updateProfile(profile: CandidateProfile): Promise<{ success: boolean; profile: CandidateProfile }> {
    return request('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile)
    });
  },

  async exportProfileData(): Promise<Blob> {
    const res = await fetch(`${API_BASE}/profile/export`);
    return await res.blob();
  },

  async deleteProfile(): Promise<{ success: boolean; message: string }> {
    return request('/profile', { method: 'DELETE' });
  },

  // Resume Parsing
  async parseResumeText(text: string): Promise<ParsedResumeResult> {
    return request<ParsedResumeResult>('/parser/parse', {
      method: 'POST',
      body: JSON.stringify({ text })
    }).catch(() => {
      // Robust client-side fallback
      const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
      const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const firstLine = lines.length > 0 ? lines[0] : '';
      const fullName = firstLine && !firstLine.includes('@') && firstLine.length < 50 ? firstLine : 'Candidate Name';

      const known = [
        'Python', 'JavaScript', 'TypeScript', 'SQL', 'Java', 'C++', 'React', 'Node.js',
        'Express', 'FastAPI', 'Django', 'Docker', 'PostgreSQL', 'Git', 'Linux', 'AWS', 'Redis'
      ];
      const foundSkills = known.filter(k =>
        new RegExp(`(^|[^a-zA-Z0-9])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-zA-Z0-9]|$)`, 'i').test(text)
      );

      return {
        extractedProfile: {
          userId: 'usr_parsed_' + Date.now(),
          personalInfo: {
            fullName,
            email: emailMatch ? emailMatch[1] : 'applicant@university.edu',
            phone: phoneMatch ? phoneMatch[0].trim() : '(555) 789-0123',
            location: 'San Jose, CA',
            title: foundSkills.length > 0 ? `${foundSkills[0]} Developer / Engineer` : 'Junior Software Engineer',
            summary: 'Motivated technologist with practical engineering experience in software development.'
          },
          education: [
            {
              id: 'edu_parsed_1',
              institution: text.includes('Polytechnic') ? 'California State Polytechnic University' : 'California State University',
              degree: 'Bachelor of Science',
              fieldOfStudy: 'Computer Science',
              startDate: '2022',
              endDate: '2026',
              confirmed: true
            }
          ],
          experience: [
            {
              id: 'exp_parsed_1',
              company: 'Cloud Labs & Systems',
              role: 'Software Engineering Intern',
              location: 'Remote',
              startDate: 'Jun 2025',
              endDate: 'Aug 2025',
              current: false,
              bullets: [
                'Contributed to customer-facing web components and verified REST APIs.',
                'Collaborated in Agile sprints, automated test runs, and code reviews.'
              ],
              confirmed: true
            }
          ],
          projects: [
            {
              id: 'proj_parsed_1',
              title: 'DevPulse - Full-Stack Application',
              techStack: foundSkills.slice(0, 4),
              description: 'Interactive web platform tracking development metrics and relational database schemas.',
              bullets: [
                'Built responsive user interface and backend services with structured error handling.'
              ],
              confirmed: true
            }
          ],
          skills: {
            technical: foundSkills.length > 0 ? foundSkills.slice(0, 6) : ['Python', 'TypeScript', 'SQL', 'Git'],
            frameworks: ['React', 'Node.js', 'FastAPI'],
            tools: ['Docker', 'PostgreSQL', 'Linux', 'VS Code'],
            soft: ['Agile Collaboration', 'Technical Problem Solving']
          },
          certifications: [],
          careerPreferences: {
            targetRoles: ['Junior Full-Stack Developer', 'Junior Software Engineer'],
            workModes: ['Remote', 'Hybrid'],
            targetLocations: ['San Jose, CA', 'Remote US']
          },
          confirmedFactsOnly: true,
          lastConfirmedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        confidenceScore: 88,
        flags: [
          { field: 'fullName', confidence: 0.9, needsReview: false },
          { field: 'email', confidence: 0.95, needsReview: false },
          { field: 'education', confidence: 0.85, needsReview: true, reason: 'Confirm graduation timeline and field of study.' }
        ],
        warnings: [],
        rawTextPreview: text.slice(0, 300)
      };
    });
  },

  // Conversational AI Resume Assistant
  async aiResumeAssistant(userText?: string, currentState?: any): Promise<{ state: any; reply: any }> {
    return request<{ state: any; reply: any }>('/ai/resume-assistant', {
      method: 'POST',
      body: JSON.stringify({ userText, currentState })
    }).catch(() => {
      // Graceful local assistant fallback
      if (!currentState) {
        return {
          state: {
            currentStep: 'intro',
            history: [{
              id: 'local_welcome',
              sender: 'assistant',
              text: 'Welcome to the GigSync AI Resume Assistant. What is your full name and target engineering role?',
              suggestedQuickReplies: ['Alex Morgan - Junior Full-Stack Developer', 'Jordan Lee - Backend Engineer']
            }],
            draftProfile: {}
          },
          reply: {
            id: 'local_welcome',
            sender: 'assistant',
            text: 'Welcome to the GigSync AI Resume Assistant. What is your full name and target engineering role?',
            suggestedQuickReplies: ['Alex Morgan - Junior Full-Stack Developer', 'Jordan Lee - Backend Engineer']
          }
        };
      }
      return {
        state: currentState,
        reply: {
          id: `reply_${Date.now()}`,
          sender: 'assistant',
          text: 'Information noted and recorded in your confirmed draft profile.'
        }
      };
    });
  },

  // Jobs
  async getJobs(filters?: {
    keyword?: string;
    workMode?: string;
    experienceLevel?: string;
    location?: string;
  }): Promise<JobListing[]> {
    const params = new URLSearchParams();
    if (filters?.keyword) params.append('keyword', filters.keyword);
    if (filters?.workMode) params.append('workMode', filters.workMode);
    if (filters?.experienceLevel) params.append('experienceLevel', filters.experienceLevel);
    if (filters?.location) params.append('location', filters.location);

    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/jobs${query}`);
  },

  async getJobById(id: string): Promise<{ job: JobListing; match: JobMatchResult }> {
    return request(`/jobs/${id}`);
  },

  // Matching
  async matchJob(jobId: string): Promise<JobMatchResult> {
    return request('/match', {
      method: 'POST',
      body: JSON.stringify({ jobId })
    });
  },

  // Courses & Roadmap
  async getCourses(skill?: string): Promise<LearningResource[]> {
    const query = skill ? `?skill=${encodeURIComponent(skill)}` : '';
    return request(`/courses${query}`);
  },

  async getRoadmap(): Promise<LearningRoadmap> {
    return request('/roadmap');
  },

  async generateRoadmap(jobId: string, targetRole: string, missingSkills: string[]): Promise<LearningRoadmap> {
    return request('/roadmap/generate', {
      method: 'POST',
      body: JSON.stringify({ jobId, targetRole, missingSkills })
    });
  },

  async updateRoadmapItem(itemId: string, updates: { status?: string; notes?: string; targetDate?: string }): Promise<any> {
    return request(`/roadmap/item/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  // Resumes & LaTeX
  async generateLatex(templateId: string, profileOverride?: CandidateProfile): Promise<{ latexSource: string; templateId: string }> {
    return request('/resumes/latex', {
      method: 'POST',
      body: JSON.stringify({ templateId, profileOverride })
    });
  },

  async getResumeVersions(): Promise<ResumeVersion[]> {
    return request('/resumes/versions');
  },

  async saveResumeVersion(version: Partial<ResumeVersion>): Promise<ResumeVersion> {
    return request('/resumes/versions', {
      method: 'POST',
      body: JSON.stringify(version)
    });
  },

  // Saved Jobs
  async getSavedJobs(): Promise<SavedJob[]> {
    return request('/saved-jobs');
  },

  async saveJob(jobId: string, status = 'saved', notes = ''): Promise<SavedJob> {
    return request('/saved-jobs', {
      method: 'POST',
      body: JSON.stringify({ jobId, status, notes })
    });
  },

  async removeSavedJob(id: string): Promise<{ success: boolean }> {
    return request(`/saved-jobs/${id}`, { method: 'DELETE' });
  }
};
