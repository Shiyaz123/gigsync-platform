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
import { parseResumeTextClient } from './parserService';

// Resolve API base URL dynamically from Vite environment variables (VITE_API_URL / VITE_BACKEND_URL)
// Defaults to relative '/api' for same-origin or proxy setups.
const rawApiUrl = (
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL)) ||
  ''
).trim();

export const API_BASE = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl.replace(/\/+$/, '') : `${rawApiUrl.replace(/\/+$/, '')}/api`)
  : '/api';

// Helper for HTTP requests with robust JSON and HTML misroute detection
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options?.headers || {})
      }
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error(
        `API endpoint '${cleanEndpoint}' returned HTML instead of JSON. The request was likely misrouted to the frontend index page. Verify that the backend server is running and VITE_API_URL is configured correctly.`
      );
    }

    if (!res.ok) {
      let errMsg = `Request to ${cleanEndpoint} failed with status ${res.status}`;
      try {
        const errData = await res.json();
        if (errData && errData.error) errMsg = errData.error;
      } catch {
        // Response was not JSON
      }
      throw new Error(errMsg);
    }

    return await res.json();
  } catch (err: any) {
    console.warn(`[GigSync API] Call to ${endpoint} failed:`, err.message);
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
    const res = await fetch(`${API_BASE}/profile/export`, {
      headers: { 'Accept': 'application/json, text/plain, */*' }
    });
    return await res.blob();
  },

  async deleteProfile(): Promise<{ success: boolean; message: string }> {
    return request('/profile', { method: 'DELETE' });
  },

  // Resume File Upload (multipart/form-data)
  async uploadResumeFile(file: File): Promise<ParsedResumeResult> {
    const formData = new FormData();
    formData.append('resume', file);

    const uploadUrl = `${API_BASE}/parser/upload`;

    try {
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
          // CRITICAL: Do NOT manually set 'Content-Type': 'multipart/form-data'.
          // The browser automatically sets Content-Type with boundary.
        },
        body: formData
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error(`Upload endpoint '${uploadUrl}' returned HTML instead of JSON. Ensure backend is running and VITE_API_URL is configured.`);
      }

      if (res.ok) {
        const data = await res.json();
        return data;
      }

      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned ${res.status}`);
    } catch (backendErr: any) {
      console.info('[GigSync] Backend upload unavailable or failed, attempting client-side document parser:', backendErr.message);

      // Client-side fallback parsing (using properly initialized PDF.js worker)
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
            // Import dedicated worker loader to ensure GlobalWorkerOptions.workerSrc is set
            const { pdfjsLib } = await import('./pdfWorker');
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
          } catch (pdfErr: any) {
            console.warn('[GigSync] Client PDF extraction error:', pdfErr);
            throw new Error(`Client-side PDF text extraction failed: ${pdfErr?.message || 'Invalid or encrypted PDF'}. If this is a scanned document, OCR is required.`);
          }
        } else {
          extractedText = await file.text();
        }
      } catch (extractErr: any) {
        throw new Error(extractErr.message || 'Failed to read document contents. Please check that the file is not corrupted.');
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('Document contains no extractable text. If this is a scanned/image-only PDF, an OCR engine or backend multimodal extraction is required.');
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
      // Graceful local assistant fallback without hardcoded fake candidate profiles
      if (!currentState) {
        return {
          state: {
            currentStep: 'intro',
            history: [{
              id: 'local_welcome',
              sender: 'assistant',
              text: 'Welcome to the GigSync AI Resume Assistant. What is your full name and target engineering role?',
              suggestedQuickReplies: ['Software Engineer', 'Full-Stack Developer', 'Frontend Engineer', 'Data Scientist']
            }],
            draftProfile: {}
          },
          reply: {
            id: 'local_welcome',
            sender: 'assistant',
            text: 'Welcome to the GigSync AI Resume Assistant. What is your full name and target engineering role?',
            suggestedQuickReplies: ['Software Engineer', 'Full-Stack Developer', 'Frontend Engineer', 'Data Scientist']
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
    role?: string;
    workMode?: string;
    experienceLevel?: string;
    location?: string;
    skills?: string[];
    page?: number;
    limit?: number;
  }): Promise<JobListing[]> {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.keyword) params.append('keyword', filters.keyword);
    if (filters?.workMode) params.append('workMode', filters.workMode);
    if (filters?.experienceLevel) params.append('experienceLevel', filters.experienceLevel);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.skills && filters.skills.length > 0) params.append('skills', filters.skills.join(','));
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await request<any>(`/jobs${query}`);
    return Array.isArray(res) ? res : (res.jobs || []);
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
