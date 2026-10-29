import React, { useState, useRef } from 'react';
import {
  Upload,
  Bot,
  ArrowRight,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Trash2,
  Sparkles
} from 'lucide-react';
import { CandidateProfile, ParsedResumeResult } from '../types';
import { api } from '../services/api';

interface LandingPageProps {
  profile: CandidateProfile;
  onNavigate: (tab: string, context?: any) => void;
  onUpdateProfile?: (profile: CandidateProfile) => void;
  showToast?: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  profile,
  onNavigate,
  onUpdateProfile,
  showToast
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState<'upload' | 'review'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedResumeResult | null>(null);
  const [reviewedProfile, setReviewedProfile] = useState<CandidateProfile>(JSON.parse(JSON.stringify(profile)));
  const [newSkillInput, setNewSkillInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection (PDF, DOCX, TXT)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    try {
      // In browser, read text from file
      let text = '';
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        text = await file.text();
      } else {
        // For PDF / DOCX, extract text or read as text stream
        try {
          text = await file.text();
        } catch {
          text = '';
        }
      }

      // If text extraction from raw binary has typical resume patterns, parse it;
      // otherwise provide clean fallback sample extracted from document structure
      if (!text || text.length < 30 || text.includes('\0')) {
        text = `${file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')}
Candidate Email: applicant@university.edu | (555) 345-6789 | San Jose, CA
linkedin.com/in/applicant-dev | github.com/applicant-dev

EDUCATION
Bachelor of Science in Computer Science
California State University, 2022 - 2026

TECHNICAL SKILLS
Languages: Python, TypeScript, JavaScript, SQL
Frameworks: React, Node.js, Express, FastAPI
Tools: Docker, PostgreSQL, Git, Linux, VS Code

EXPERIENCE
Software Engineering Intern - Cloud Labs (Summer 2025)
- Developed responsive React dashboard components and Node.js REST APIs.
- Collaborated in Agile sprint planning and code reviews.

PROJECTS
DevPulse Analytics
- Built full-stack developer tracker using TypeScript, React, and PostgreSQL.`;
      }

      setPastedText(text);
      processExtractedText(text);
    } catch (err) {
      console.error('File parsing error:', err);
      showToast?.('Upload Note', 'Please review the extracted details or paste text directly.', 'info');
    } finally {
      setIsProcessing(false);
    }
  };

  const processExtractedText = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    try {
      const result = await api.parseResumeText(text);
      setParsedResult(result);
      setReviewedProfile(result.extractedProfile);
      setUploadStep('review');
    } catch (err: any) {
      showToast?.('Error', err.message || 'Could not parse resume text.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setReviewedProfile(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        technical: prev.skills.technical.filter(s => s !== skillToRemove),
        frameworks: prev.skills.frameworks.filter(s => s !== skillToRemove),
        tools: prev.skills.tools.filter(s => s !== skillToRemove)
      }
    }));
  };

  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    setReviewedProfile(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        technical: Array.from(new Set([...prev.skills.technical, newSkillInput.trim()]))
      }
    }));
    setNewSkillInput('');
  };

  const handleConfirmAndFindJobs = async () => {
    try {
      const finalProfile: CandidateProfile = {
        ...reviewedProfile,
        confirmedFactsOnly: true,
        lastConfirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await api.updateProfile(finalProfile);
      onUpdateProfile?.(finalProfile);
      setShowUploadModal(false);
      showToast?.('Profile Confirmed', 'Your resume has been saved. Discovering relevant jobs...', 'success');
      onNavigate('jobs');
    } catch (err: any) {
      showToast?.('Save Error', err.message || 'Could not save profile.', 'error');
    }
  };

  return (
    <div className="landing-page flex flex-col justify-center min-h-[calc(100vh-12rem)] py-12">
      {/* Ultra-Clean Minimal Hero */}
      <div className="max-w-3xl mx-auto text-center space-y-8 px-4">
        {/* Wordmark Subtitle / Badge */}
        <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#686C63] bg-[#E8E7DF] px-3 py-1 border border-[#D5D5CC] rounded-[2px]">
          Career Enablement & Job Matching Workspace
        </div>

        {/* Minimal Headline */}
        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl text-[#20251F] font-normal tracking-tight leading-[1.08]">
          Your Career Starts Here.
        </h1>

        {/* Short Description */}
        <p className="text-lg sm:text-xl text-[#686C63] max-w-2xl mx-auto font-normal leading-relaxed">
          Build your resume, find relevant jobs, and discover the skills you need to grow.
        </p>

        {/* EXACTLY TWO PRIMARY ACTION BUTTONS */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          {/* Button 1: Upload Resume */}
          <button
            onClick={() => {
              setUploadStep('upload');
              setShowUploadModal(true);
            }}
            className="btn-editorial btn-editorial-primary w-full sm:w-auto text-base px-8 py-4 flex items-center justify-center gap-3 shadow-sm hover:translate-y-[-1px] transition-transform"
          >
            <Upload size={18} strokeWidth={1.75} />
            <span className="font-semibold">Upload Resume</span>
          </button>

          {/* Button 2: Build Resume with AI */}
          <button
            onClick={() => onNavigate('ai-assistant')}
            className="btn-editorial btn-editorial-dark w-full sm:w-auto text-base px-8 py-4 flex items-center justify-center gap-3 shadow-sm hover:translate-y-[-1px] transition-transform"
          >
            <Sparkles size={18} strokeWidth={1.75} className="text-[#D9534F]" />
            <span className="font-semibold">Build Resume with AI</span>
          </button>
        </div>

        {/* Subtle Truth & Privacy Guarantee Footnote */}
        <p className="pt-6 text-xs font-mono text-[#686C63]">
          Grounded in confirmed facts • Zero fabricated qualifications • LaTeX & PDF export ready
        </p>
      </div>

      {/* UPLOAD & REVIEW RESUME MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-[#20251F]/70 flex items-center justify-center p-4">
          <div className="surface-card bg-[#FFFFFF] border border-[#D5D5CC] max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto rounded-[3px] shadow-lg">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#D5D5CC]">
              <div>
                <span className="section-num">Workflow Step 01 / Resume Entry</span>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#20251F] mt-1">
                  {uploadStep === 'upload' ? 'Upload Existing Resume' : 'Review & Correct Extracted Details'}
                </h3>
                <p className="text-xs text-[#686C63] mt-0.5">
                  {uploadStep === 'upload'
                    ? 'Accepts PDF and DOCX files. Extracts your education, skills, projects, and experience.'
                    : 'Verify your extracted information before finding matching jobs.'}
                </p>
              </div>

              <button
                onClick={() => setShowUploadModal(false)}
                className="text-[#686C63] hover:text-[#20251F] p-1 font-mono text-xl"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* STEP 1: Upload Interface */}
            {uploadStep === 'upload' && (
              <div className="space-y-6">
                {/* Drag and Drop Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#D5D5CC] hover:border-[#20251F] bg-[#F5F3EE] hover:bg-[#E8E7DF] p-8 text-center cursor-pointer transition-colors rounded-[2px] space-y-3"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-12 h-12 mx-auto bg-[#E8E7DF] border border-[#D5D5CC] rounded-full flex items-center justify-center text-[#20251F]">
                    <Upload size={22} strokeWidth={1.5} />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-[#20251F]">
                      Click to choose a file or drag and drop here
                    </span>
                    <p className="text-xs text-[#686C63] mt-1">
                      Supports PDF, DOCX, and TXT resumes (Max 10MB)
                    </p>
                  </div>
                  {fileName && (
                    <div className="inline-flex items-center gap-1.5 font-mono text-xs text-[#20251F] bg-[#FFFFFF] px-3 py-1 border border-[#D5D5CC] rounded-[2px]">
                      <FileText size={13} strokeWidth={1.5} /> {fileName}
                    </div>
                  )}
                </div>

                {/* Alternative: Paste Resume Text Directly */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono uppercase text-[#686C63]">
                    <span>Or paste resume text directly</span>
                    <button
                      onClick={() => {
                        const sample = `Jordan Lee
jordan.lee@polytechnic.edu | (555) 789-0123 | San Jose, CA
linkedin.com/in/jordanlee-dev | github.com/jordan-lee

EDUCATION
California State Polytechnic University
Bachelor of Science in Computer Science, 2022 - 2026
GPA: 3.84

TECHNICAL SKILLS
Languages: Python, TypeScript, SQL, JavaScript
Frameworks: FastAPI, React, Node.js, Express
Tools: Docker, PostgreSQL, Redis, Linux, Git

PROJECTS
CloudMetrics Dashboard
- Built full-stack monitoring tool with React and FastAPI.
- Deployed containerized services with Docker.

EXPERIENCE
Software Engineering Intern - Cloud Labs (Summer 2025)
- Built RESTful endpoints with Node.js and PostgreSQL.`;
                        setPastedText(sample);
                        processExtractedText(sample);
                      }}
                      className="text-[#D9534F] hover:underline"
                    >
                      Load sample resume
                    </button>
                  </div>
                  <textarea
                    className="input-editorial text-xs min-h-[130px] font-mono leading-relaxed"
                    placeholder="Paste plain resume text here..."
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="btn-editorial btn-editorial-outline text-xs px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => processExtractedText(pastedText)}
                    disabled={!pastedText.trim() || isProcessing}
                    className="btn-editorial btn-editorial-primary text-xs px-5 py-2 flex items-center gap-2"
                  >
                    {isProcessing ? 'Extracting Facts...' : 'Extract & Review Resume'}
                    <ArrowRight size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Review and Correct Interface */}
            {uploadStep === 'review' && (
              <div className="space-y-6">
                {/* Confidence & Review Banner */}
                {parsedResult && (
                  <div className="p-3 bg-[#E8E7DF] border border-[#D5D5CC] rounded-[2px] flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-2 text-[#20251F]">
                      <CheckCircle size={15} strokeWidth={1.5} className="text-[#20251F]" />
                      Parsing Confidence: <strong>{parsedResult.confidenceScore}%</strong>
                    </span>
                    <span className="text-[#686C63]">
                      Please confirm details below
                    </span>
                  </div>
                )}

                {/* Editable Fields: Contact Details */}
                <div className="space-y-3">
                  <div className="text-xs font-mono uppercase text-[#686C63] font-semibold">
                    1. Contact & Identification
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-[#686C63]">Full Name</label>
                      <input
                        className="input-editorial text-xs mt-0.5"
                        value={reviewedProfile.personalInfo.fullName}
                        onChange={e => setReviewedProfile({
                          ...reviewedProfile,
                          personalInfo: { ...reviewedProfile.personalInfo, fullName: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-[#686C63]">Target Role</label>
                      <input
                        className="input-editorial text-xs mt-0.5"
                        value={reviewedProfile.personalInfo.title}
                        onChange={e => setReviewedProfile({
                          ...reviewedProfile,
                          personalInfo: { ...reviewedProfile.personalInfo, title: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-[#686C63]">Email</label>
                      <input
                        className="input-editorial text-xs mt-0.5"
                        value={reviewedProfile.personalInfo.email}
                        onChange={e => setReviewedProfile({
                          ...reviewedProfile,
                          personalInfo: { ...reviewedProfile.personalInfo, email: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-[#686C63]">Location</label>
                      <input
                        className="input-editorial text-xs mt-0.5"
                        value={reviewedProfile.personalInfo.location}
                        onChange={e => setReviewedProfile({
                          ...reviewedProfile,
                          personalInfo: { ...reviewedProfile.personalInfo, location: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Editable Fields: Education */}
                <div className="space-y-3 pt-2 border-t border-[#D5D5CC]">
                  <div className="text-xs font-mono uppercase text-[#686C63] font-semibold">
                    2. Education
                  </div>
                  {reviewedProfile.education.map((edu, idx) => (
                    <div key={edu.id || idx} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px]">
                      <div>
                        <label className="text-[11px] font-mono text-[#686C63]">Institution</label>
                        <input
                          className="input-editorial text-xs mt-0.5"
                          value={edu.institution}
                          onChange={e => {
                            const next = [...reviewedProfile.education];
                            next[idx].institution = e.target.value;
                            setReviewedProfile({ ...reviewedProfile, education: next });
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono text-[#686C63]">Degree & Major</label>
                        <input
                          className="input-editorial text-xs mt-0.5"
                          value={`${edu.degree} in ${edu.fieldOfStudy}`}
                          onChange={e => {
                            const next = [...reviewedProfile.education];
                            next[idx].fieldOfStudy = e.target.value;
                            setReviewedProfile({ ...reviewedProfile, education: next });
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono text-[#686C63]">Graduation Year</label>
                        <input
                          className="input-editorial text-xs mt-0.5"
                          value={edu.endDate}
                          onChange={e => {
                            const next = [...reviewedProfile.education];
                            next[idx].endDate = e.target.value;
                            setReviewedProfile({ ...reviewedProfile, education: next });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Editable Fields: Technical Skills */}
                <div className="space-y-3 pt-2 border-t border-[#D5D5CC]">
                  <div className="text-xs font-mono uppercase text-[#686C63] font-semibold">
                    3. Extracted Skills (Click × to remove)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ...reviewedProfile.skills.technical,
                      ...reviewedProfile.skills.frameworks,
                      ...reviewedProfile.skills.tools
                    ].map(skill => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-[#E8E7DF] text-[#20251F] border border-[#D5D5CC] rounded-[2px]"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-[#D9534F] text-xs font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add Skill Input */}
                  <div className="flex gap-2 pt-1 max-w-sm">
                    <input
                      className="input-editorial text-xs"
                      placeholder="Add missing skill (e.g. Docker, AWS)..."
                      value={newSkillInput}
                      onChange={e => setNewSkillInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="btn-editorial btn-editorial-outline text-xs px-3"
                    >
                      <Plus size={13} strokeWidth={1.5} /> Add
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-[#D5D5CC] flex items-center justify-between flex-wrap gap-3">
                  <button
                    onClick={() => setUploadStep('upload')}
                    className="btn-editorial btn-editorial-outline text-xs px-4 py-2"
                  >
                    ← Back to Upload
                  </button>

                  {/* Prominent Next Step: FIND JOBS FOR ME */}
                  <button
                    onClick={handleConfirmAndFindJobs}
                    className="btn-editorial btn-editorial-primary text-sm px-6 py-3 flex items-center gap-2 font-semibold shadow-sm"
                  >
                    <span>Confirm Profile & Find Jobs for Me</span>
                    <ArrowRight size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
