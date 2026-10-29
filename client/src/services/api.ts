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
    return request('/parser/parse', {
      method: 'POST',
      body: JSON.stringify({ text })
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
