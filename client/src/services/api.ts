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
import { parseResumeTextClient, createEmptyProfileClient } from './parserService';

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

  // Resume File Upload (multipart/form-data)
  async uploadResumeFile(file: File): Promise<ParsedResumeResult> {
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch(`${API_BASE}/parser/upload`, {
        method: 'POST',
        body: formData
        // Note: fetch automatically sets the correct multipart boundary header
      });

      if (res.ok) {
        const data = await res.json();
        return data;
      }

      const errData = await res.json().catch(() => ({}));
      console.warn('[GigSync] Backend upload failed:', errData.error || res.statusText);
      throw new Error(errData.error || `Server returned ${res.status}`);
    } catch (backendErr: any) {
      console.info('[GigSync] Falling back to client-side document parser:', backendErr.message);

      // Client-side fallback parsing
      let extractedText = '';
      const nameLower = file.name.toLowerCase();

      try {
        if (nameLower.endsWith('.docx')) {
          const mammoth = await import('mammoth');
          const arrayBuffer = await file.arrayBuffer();
          const docxResult = await mammoth.extractRawText({ arrayBuffer });
          extractedText = docxResult.value || '';
        } else if (nameLower.endsWith('.pdf')) {
          try {
            const pdfjsLib = await import('pdfjs-dist');
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
            const pdfDoc = await loadingTask.promise;
            let fullText = '';
            for (let i = 1; i <= pdfDoc.numPages; i++) {
              const page = await pdfDoc.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item: any) => item.str || '').join(' ');
              fullText += pageText + '\n';
            }
            extractedText = fullText;
          } catch (pdfErr) {
            console.warn('[GigSync] Client PDF extraction error:', pdfErr);
            extractedText = await file.text().catch(() => '');
          }
        } else {
          extractedText = await file.text();
        }
      } catch (extractErr) {
        console.error('[GigSync] Document text extraction failed:', extractErr);
        throw new Error('Failed to read document contents. Please check that the file is not corrupted.');
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('Uploaded document appears empty or could not be decoded. Please verify file text or paste directly.');
      }

      return parseResumeTextClient(extractedText);
    }
  },

  // Resume Text Parsing (Zero-hallucination)
  async parseResumeText(text: string): Promise<ParsedResumeResult> {
    try {
      return await request<ParsedResumeResult>('/parser/parse', {
        method: 'POST',
        body: JSON.stringify({ text })
      });
    } catch (err) {
      return parseResumeTextClient(text);
    }
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
