import React, { useState, useRef } from 'react';
import {
  Upload,
  ArrowRight,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  Building,
  GraduationCap,
  Code2,
  Briefcase,
  FolderGit2,
  Award
} from 'lucide-react';
import { CandidateProfile, ParsedResumeResult, EducationItem, ExperienceItem, ProjectItem, CertificationItem } from '../types';
import { api } from '../services/api';
import { createEmptyProfileClient } from '../services/parserService';

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
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [reviewedProfile, setReviewedProfile] = useState<CandidateProfile>(createEmptyProfileClient());
  const [newSkillInput, setNewSkillInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reuploadInputRef = useRef<HTMLInputElement>(null);

  // Reset and open upload modal
  const handleOpenUpload = () => {
    setUploadStep('upload');
    setFileName('');
    setPastedText('');
    setParsedResult(null);
    setExtractionError(null);
    setReviewedProfile(createEmptyProfileClient());
    setShowUploadModal(true);
  };

  // Handle file selection (PDF, DOCX, TXT)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validate file extension
    const validExtensions = ['.pdf', '.docx', '.txt'];
    const lowerName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some(ext => lowerName.endsWith(ext));
    if (!hasValidExt) {
      showToast?.('Invalid File Type', 'Please upload a PDF, DOCX, or TXT resume document.', 'warning');
      if (e.target) e.target.value = '';
      return;
    }

    // 2. Validate file size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showToast?.('File Too Large', 'Maximum resume file size is 10MB.', 'warning');
      if (e.target) e.target.value = '';
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);
    setExtractionError(null);

    try {
      // Send real file to backend multipart/form-data endpoint
      const result = await api.uploadResumeFile(file);

      // Populate form state strictly from actual extraction response
      setParsedResult(result);
      setReviewedProfile(result.extractedProfile);
      setUploadStep('review');
      showToast?.(
        'Resume Extracted',
        `Successfully extracted details from "${file.name}". Please verify below.`,
        'success'
      );
    } catch (err: any) {
      console.error('File parsing error:', err);
      const msg = err.message || 'Could not parse document. Please check file format or paste plain text.';
      setExtractionError(msg);
      showToast?.('Extraction Failed', msg, 'error');
    } finally {
      setIsProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  // Process text pasted directly
  const processExtractedText = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setExtractionError(null);
    try {
      const result = await api.parseResumeText(text);
      setParsedResult(result);
      setReviewedProfile(result.extractedProfile);
      setUploadStep('review');
      showToast?.('Text Parsed', 'Profile fields populated from pasted resume text.', 'success');
    } catch (err: any) {
      const msg = err.message || 'Could not parse resume text.';
      setExtractionError(msg);
      showToast?.('Parsing Error', msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Skill manipulations
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
    const skill = newSkillInput.trim();
    setReviewedProfile(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        technical: Array.from(new Set([...prev.skills.technical, skill]))
      }
    }));
    setNewSkillInput('');
  };

  // Education manipulations
  const handleAddEducation = () => {
    const newEdu: EducationItem = {
      id: `edu_custom_${Date.now()}`,
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      confirmed: true
    };
    setReviewedProfile(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }));
  };

  const handleRemoveEducation = (index: number) => {
    setReviewedProfile(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  // Experience manipulations
  const handleAddExperience = () => {
    const newExp: ExperienceItem = {
      id: `exp_custom_${Date.now()}`,
      company: '',
      role: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: [''],
      confirmed: true
    };
    setReviewedProfile(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }));
  };

  const handleRemoveExperience = (index: number) => {
    setReviewedProfile(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  // Project manipulations
  const handleAddProject = () => {
    const newProj: ProjectItem = {
      id: `proj_custom_${Date.now()}`,
      title: '',
      techStack: [],
      description: '',
      bullets: [],
      confirmed: true
    };
    setReviewedProfile(prev => ({
      ...prev,
      projects: [...prev.projects, newProj]
    }));
  };

  const handleRemoveProject = (index: number) => {
    setReviewedProfile(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  // Confirm Profile and Find Jobs
  const handleConfirmAndFindJobs = async () => {
    if (!reviewedProfile.personalInfo.fullName.trim()) {
      showToast?.('Full Name Required', 'Please provide candidate full name before proceeding.', 'warning');
      return;
    }

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
      showToast?.(
        'Profile Confirmed',
        `Profile for ${finalProfile.personalInfo.fullName} confirmed. Discovering matching jobs...`,
        'success'
      );
      onNavigate('jobs');
    } catch (err: any) {
      showToast?.('Save Error', err.message || 'Could not save profile to backend.', 'error');
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
            id="btn-upload-resume"
            onClick={handleOpenUpload}
            className="btn-editorial btn-editorial-primary w-full sm:w-auto text-base px-8 py-4 flex items-center justify-center gap-3 shadow-sm hover:translate-y-[-1px] transition-transform"
          >
            <Upload size={18} strokeWidth={1.75} />
            <span className="font-semibold">Upload Resume</span>
          </button>

          {/* Button 2: Build Resume with AI */}
          <button
            id="btn-build-resume-ai"
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
          <div className="surface-card bg-[#FFFFFF] border border-[#D5D5CC] max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto rounded-[3px] shadow-xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#D5D5CC]">
              <div>
                <span className="section-num">Workflow Step 01 / Resume Extraction</span>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#20251F] mt-1">
                  {uploadStep === 'upload' ? 'Upload Existing Resume' : 'Review & Confirm Extracted Details'}
                </h3>
                <p className="text-xs text-[#686C63] mt-0.5">
                  {uploadStep === 'upload'
                    ? 'Upload a PDF or DOCX file. Real text is parsed to extract your contact info, education, skills, and experience.'
                    : 'All fields below are extracted directly from your document. Edit or fill in any missing details before finding matching jobs.'}
                </p>
              </div>

              <button
                onClick={() => setShowUploadModal(false)}
                className="text-[#686C63] hover:text-[#20251F] p-1 font-mono text-xl"
                aria-label="Close modal"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Error Message if extraction failed */}
            {extractionError && (
              <div className="p-3 bg-[#FFF5F5] border border-[#D9534F]/30 text-[#D9534F] text-xs font-mono rounded-[2px] flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Extraction Warning:</div>
                  <div>{extractionError}</div>
                </div>
              </div>
            )}

            {/* STEP 1: Upload Interface */}
            {uploadStep === 'upload' && (
              <div className="space-y-6">
                {/* Drag and Drop Zone */}
                <div
                  id="dropzone-upload"
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed border-[#D5D5CC] hover:border-[#20251F] bg-[#F5F3EE] hover:bg-[#E8E7DF] p-8 text-center cursor-pointer transition-colors rounded-[2px] space-y-3 ${
                    isProcessing ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-12 h-12 mx-auto bg-[#E8E7DF] border border-[#D5D5CC] rounded-full flex items-center justify-center text-[#20251F]">
                    {isProcessing ? (
                      <RefreshCw size={22} strokeWidth={1.5} className="animate-spin text-[#D9534F]" />
                    ) : (
                      <Upload size={22} strokeWidth={1.5} />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-[#20251F]">
                      {isProcessing ? 'Processing & Extracting Resume Data...' : 'Click to select a file or drag and drop here'}
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
                  </div>
                  <textarea
                    className="input-editorial text-xs min-h-[140px] font-mono leading-relaxed"
                    placeholder="Paste plain text from your resume here to extract fields..."
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
                    id="btn-extract-pasted-text"
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
                {/* Confidence & Re-upload Bar with Evidence Breakdown */}
                <div className="p-3.5 bg-[#E8E7DF] border border-[#D5D5CC] rounded-[2px] space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="flex items-center gap-2 text-[#20251F]">
                      <CheckCircle size={15} strokeWidth={1.5} className="text-[#20251F]" />
                      <span>
                        Extraction Evidence Score: <strong className="text-sm font-bold">{parsedResult?.confidenceScore ?? 0}%</strong>
                      </span>
                      {fileName && <span className="text-[#686C63]">({fileName})</span>}
                    </span>

                    {/* Re-upload trigger */}
                    <div className="flex items-center gap-2">
                      <input
                        ref={reuploadInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <button
                        type="button"
                        onClick={() => reuploadInputRef.current?.click()}
                        className="text-xs text-[#20251F] hover:text-[#D9534F] flex items-center gap-1 font-semibold underline underline-offset-2"
                      >
                        <RefreshCw size={12} />
                        Upload Different Resume
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#686C63] leading-relaxed">
                    Score reflects verifiable field-level evidence detected in document (Name, Contact, Education, Skills, Projects). Does not reflect candidate qualification or job match score.
                  </p>

                  {/* Extraction Evidence Status Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#D5D5CC]/60">
                    <span className="text-[10px] uppercase tracking-wider text-[#686C63] mr-1">Evidence Status:</span>
                    {reviewedProfile.personalInfo.fullName.trim() ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#E3E8DC] text-[#2D4A22] border border-[#C6D4BB] rounded-[2px]">
                        ✓ Name Detected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#FFF0EF] text-[#A82B24] border border-[#F3C2C0] rounded-[2px] font-semibold">
                        ⚠ Name Required
                      </span>
                    )}

                    {reviewedProfile.personalInfo.email.trim() ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#E3E8DC] text-[#2D4A22] border border-[#C6D4BB] rounded-[2px]">
                        ✓ Email Detected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#FFF0EF] text-[#A82B24] border border-[#F3C2C0] rounded-[2px]">
                        ⚠ Email Missing
                      </span>
                    )}

                    {reviewedProfile.personalInfo.phone.trim() ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#E3E8DC] text-[#2D4A22] border border-[#C6D4BB] rounded-[2px]">
                        ✓ Phone Detected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#FFF8E6] text-[#785E07] border border-[#E8D6A4] rounded-[2px]">
                        ⚠ Phone Unspecified
                      </span>
                    )}

                    {reviewedProfile.personalInfo.location.trim() ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#E3E8DC] text-[#2D4A22] border border-[#C6D4BB] rounded-[2px]">
                        ✓ Location Detected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#FFF8E6] text-[#785E07] border border-[#E8D6A4] rounded-[2px]">
                        ⚠ Location Needed
                      </span>
                    )}

                    {reviewedProfile.education.length > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#E3E8DC] text-[#2D4A22] border border-[#C6D4BB] rounded-[2px]">
                        ✓ Education ({reviewedProfile.education.length})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#FFF8E6] text-[#785E07] border border-[#E8D6A4] rounded-[2px]">
                        ⚠ Education None
                      </span>
                    )}

                    {[...reviewedProfile.skills.technical, ...reviewedProfile.skills.frameworks, ...reviewedProfile.skills.tools].length > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#E3E8DC] text-[#2D4A22] border border-[#C6D4BB] rounded-[2px]">
                        ✓ Skills ({[...reviewedProfile.skills.technical, ...reviewedProfile.skills.frameworks, ...reviewedProfile.skills.tools].length})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#FFF8E6] text-[#785E07] border border-[#E8D6A4] rounded-[2px]">
                        ⚠ Skills None
                      </span>
                    )}

                    {reviewedProfile.projects.length > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#E3E8DC] text-[#2D4A22] border border-[#C6D4BB] rounded-[2px]">
                        ✓ Projects ({reviewedProfile.projects.length})
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Warnings banner if any */}
                {parsedResult?.warnings && parsedResult.warnings.length > 0 && (
                  <div className="p-3 bg-[#FFFDF5] border border-[#E0D8B0] rounded-[2px] text-xs font-mono text-[#735A00] space-y-1">
                    <div className="font-semibold flex items-center gap-1">
                      <AlertCircle size={14} /> Attention:
                    </div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {parsedResult.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 1. Contact & Identification */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-[#686C63] font-semibold flex items-center gap-1.5">
                      <Building size={14} /> 1. Contact & Identification
                    </span>
                    <span className="text-[11px] font-mono text-[#686C63]">
                      Extracted from resume
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-mono text-[#686C63]">
                          Full Name <span className="text-[#D9534F]">*</span>
                        </label>
                        {!reviewedProfile.personalInfo.fullName.trim() && (
                          <span className="text-[10px] text-[#D9534F] font-mono font-semibold">Confirmation Required</span>
                        )}
                      </div>
                      <input
                        id="input-full-name"
                        className={`input-editorial text-xs mt-0.5 w-full ${!reviewedProfile.personalInfo.fullName.trim() ? 'border-[#D9534F] bg-[#FFF8F8]' : ''}`}
                        placeholder="(Candidate full name required)"
                        value={reviewedProfile.personalInfo.fullName}
                        onChange={e => setReviewedProfile({
                          ...reviewedProfile,
                          personalInfo: { ...reviewedProfile.personalInfo, fullName: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-mono text-[#686C63]">Target Role</label>
                        {!reviewedProfile.personalInfo.title.trim() && (
                          <span className="text-[10px] text-[#686C63] font-mono">Optional</span>
                        )}
                      </div>
                      <input
                        id="input-target-role"
                        className="input-editorial text-xs mt-0.5 w-full"
                        placeholder="(e.g. Junior Full-Stack Developer or Software Engineer)"
                        value={reviewedProfile.personalInfo.title}
                        onChange={e => setReviewedProfile({
                          ...reviewedProfile,
                          personalInfo: { ...reviewedProfile.personalInfo, title: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-mono text-[#686C63]">Email Address</label>
                        {!reviewedProfile.personalInfo.email.trim() && (
                          <span className="text-[10px] text-[#785E07] font-mono">Review</span>
                        )}
                      </div>
                      <input
                        id="input-email"
                        className="input-editorial text-xs mt-0.5 w-full"
                        placeholder="(Candidate email address)"
                        value={reviewedProfile.personalInfo.email}
                        onChange={e => setReviewedProfile({
                          ...reviewedProfile,
                          personalInfo: { ...reviewedProfile.personalInfo, email: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-mono text-[#686C63]">Location</label>
                        {!reviewedProfile.personalInfo.location.trim() && (
                          <span className="text-[10px] text-[#785E07] font-mono">Review</span>
                        )}
                      </div>
                      <input
                        id="input-location"
                        className="input-editorial text-xs mt-0.5 w-full"
                        placeholder="(e.g. Bangalore, Karnataka or San Jose, CA)"
                        value={reviewedProfile.personalInfo.location}
                        onChange={e => setReviewedProfile({
                          ...reviewedProfile,
                          personalInfo: { ...reviewedProfile.personalInfo, location: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-mono text-[#686C63]">Phone Number</label>
                        {!reviewedProfile.personalInfo.phone.trim() && (
                          <span className="text-[10px] text-[#785E07] font-mono">Review</span>
                        )}
                      </div>
                      <input
                        id="input-phone"
                        className="input-editorial text-xs mt-0.5 w-full"
                        placeholder="(e.g. +91 74114 78395 or +1 555-0199)"
                        value={reviewedProfile.personalInfo.phone}
                        onChange={e => setReviewedProfile({
                          ...reviewedProfile,
                          personalInfo: { ...reviewedProfile.personalInfo, phone: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Education */}
                <div className="space-y-3 pt-3 border-t border-[#D5D5CC]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-[#686C63] font-semibold flex items-center gap-1.5">
                      <GraduationCap size={14} /> 2. Education ({reviewedProfile.education.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddEducation}
                      className="text-xs text-[#20251F] hover:text-[#D9534F] font-mono flex items-center gap-1"
                    >
                      <Plus size={13} /> Add Education
                    </button>
                  </div>

                  {reviewedProfile.education.length === 0 ? (
                    <div className="p-4 bg-[#F5F3EE] border border-dashed border-[#D5D5CC] rounded-[2px] text-center text-xs text-[#686C63]">
                      No education detected in document.{' '}
                      <button
                        type="button"
                        onClick={handleAddEducation}
                        className="text-[#20251F] underline font-semibold hover:text-[#D9534F]"
                      >
                        Click to add your university or college
                      </button>
                    </div>
                  ) : (
                    reviewedProfile.education.map((edu, idx) => (
                      <div key={edu.id || idx} className="p-3 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] space-y-2 relative">
                        <div className="flex justify-between items-center pb-1">
                          <span className="text-[11px] font-mono uppercase text-[#686C63]">Degree #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEducation(idx)}
                            className="text-[#686C63] hover:text-[#D9534F] p-0.5"
                            title="Remove degree"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                          <div>
                            <label className="text-[11px] font-mono text-[#686C63] block">Institution</label>
                            <input
                              className="input-editorial text-xs mt-0.5 w-full"
                              placeholder="(University / College)"
                              value={edu.institution}
                              onChange={e => {
                                const next = [...reviewedProfile.education];
                                next[idx].institution = e.target.value;
                                setReviewedProfile({ ...reviewedProfile, education: next });
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-mono text-[#686C63] block">Degree</label>
                            <input
                              className="input-editorial text-xs mt-0.5 w-full"
                              placeholder="(e.g. Bachelor of Science)"
                              value={edu.degree}
                              onChange={e => {
                                const next = [...reviewedProfile.education];
                                next[idx].degree = e.target.value;
                                setReviewedProfile({ ...reviewedProfile, education: next });
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-mono text-[#686C63] block">Major / Field</label>
                            <input
                              className="input-editorial text-xs mt-0.5 w-full"
                              placeholder="(e.g. Computer Science)"
                              value={edu.fieldOfStudy}
                              onChange={e => {
                                const next = [...reviewedProfile.education];
                                next[idx].fieldOfStudy = e.target.value;
                                setReviewedProfile({ ...reviewedProfile, education: next });
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-mono text-[#686C63] block">Graduation Year</label>
                            <input
                              className="input-editorial text-xs mt-0.5 w-full"
                              placeholder="(e.g. 2026)"
                              value={edu.endDate}
                              onChange={e => {
                                const next = [...reviewedProfile.education];
                                next[idx].endDate = e.target.value;
                                setReviewedProfile({ ...reviewedProfile, education: next });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 3. Extracted Skills */}
                <div className="space-y-3 pt-3 border-t border-[#D5D5CC]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-[#686C63] font-semibold flex items-center gap-1.5">
                      <Code2 size={14} /> 3. Extracted Skills ({[
                        ...reviewedProfile.skills.technical,
                        ...reviewedProfile.skills.frameworks,
                        ...reviewedProfile.skills.tools
                      ].length})
                    </span>
                    <span className="text-[11px] font-mono text-[#686C63]">Click × to remove</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px]">
                    {[
                      ...reviewedProfile.skills.technical,
                      ...reviewedProfile.skills.frameworks,
                      ...reviewedProfile.skills.tools
                    ].length === 0 ? (
                      <span className="text-xs text-[#686C63] italic font-mono py-1">
                        No skills detected. Add your skills below.
                      </span>
                    ) : (
                      [
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
                            className="hover:text-[#D9534F] text-xs font-bold leading-none"
                            aria-label={`Remove skill ${skill}`}
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Add Skill Input */}
                  <div className="flex gap-2 pt-1 max-w-sm">
                    <input
                      id="input-new-skill"
                      className="input-editorial text-xs"
                      placeholder="Add skill (e.g. Docker, Python, AWS)..."
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
                      className="btn-editorial btn-editorial-outline text-xs px-3 shrink-0"
                    >
                      <Plus size={13} strokeWidth={1.5} /> Add
                    </button>
                  </div>
                </div>

                {/* 4. Work Experience & Internships */}
                <div className="space-y-3 pt-3 border-t border-[#D5D5CC]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-[#686C63] font-semibold flex items-center gap-1.5">
                      <Briefcase size={14} /> 4. Work Experience ({reviewedProfile.experience.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddExperience}
                      className="text-xs text-[#20251F] hover:text-[#D9534F] font-mono flex items-center gap-1"
                    >
                      <Plus size={13} /> Add Experience
                    </button>
                  </div>

                  {reviewedProfile.experience.length === 0 ? (
                    <div className="p-3 bg-[#F5F3EE] border border-dashed border-[#D5D5CC] rounded-[2px] text-center text-xs text-[#686C63]">
                      No work experience detected in document.{' '}
                      <button
                        type="button"
                        onClick={handleAddExperience}
                        className="text-[#20251F] underline font-semibold hover:text-[#D9534F]"
                      >
                        Click to add internship or employment
                      </button>
                    </div>
                  ) : (
                    reviewedProfile.experience.map((exp, idx) => (
                      <div key={exp.id || idx} className="p-3 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] space-y-2">
                        <div className="flex justify-between items-center pb-1">
                          <span className="text-[11px] font-mono uppercase text-[#686C63]">Role #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExperience(idx)}
                            className="text-[#686C63] hover:text-[#D9534F] p-0.5"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-[11px] font-mono text-[#686C63] block">Company / Org</label>
                            <input
                              className="input-editorial text-xs mt-0.5 w-full"
                              placeholder="(Company Name)"
                              value={exp.company}
                              onChange={e => {
                                const next = [...reviewedProfile.experience];
                                next[idx].company = e.target.value;
                                setReviewedProfile({ ...reviewedProfile, experience: next });
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-mono text-[#686C63] block">Job Title / Role</label>
                            <input
                              className="input-editorial text-xs mt-0.5 w-full"
                              placeholder="(e.g. Software Engineering Intern)"
                              value={exp.role}
                              onChange={e => {
                                const next = [...reviewedProfile.experience];
                                next[idx].role = e.target.value;
                                setReviewedProfile({ ...reviewedProfile, experience: next });
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-mono text-[#686C63] block">Dates / Timeline</label>
                            <input
                              className="input-editorial text-xs mt-0.5 w-full"
                              placeholder="(e.g. Jun 2024 - Aug 2024)"
                              value={exp.startDate ? `${exp.startDate} - ${exp.endDate}` : exp.endDate}
                              onChange={e => {
                                const next = [...reviewedProfile.experience];
                                next[idx].endDate = e.target.value;
                                setReviewedProfile({ ...reviewedProfile, experience: next });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 5. Projects */}
                <div className="space-y-3 pt-3 border-t border-[#D5D5CC]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-[#686C63] font-semibold flex items-center gap-1.5">
                      <FolderGit2 size={14} /> 5. Projects ({reviewedProfile.projects.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddProject}
                      className="text-xs text-[#20251F] hover:text-[#D9534F] font-mono flex items-center gap-1"
                    >
                      <Plus size={13} /> Add Project
                    </button>
                  </div>

                  {reviewedProfile.projects.length === 0 ? (
                    <div className="p-3 bg-[#F5F3EE] border border-dashed border-[#D5D5CC] rounded-[2px] text-center text-xs text-[#686C63]">
                      No projects detected.{' '}
                      <button
                        type="button"
                        onClick={handleAddProject}
                        className="text-[#20251F] underline font-semibold hover:text-[#D9534F]"
                      >
                        Click to add personal or academic project
                      </button>
                    </div>
                  ) : (
                    reviewedProfile.projects.map((proj, idx) => (
                      <div key={proj.id || idx} className="p-3 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] space-y-2">
                        <div className="flex justify-between items-center pb-1">
                          <span className="text-[11px] font-mono uppercase text-[#686C63]">Project #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveProject(idx)}
                            className="text-[#686C63] hover:text-[#D9534F] p-0.5"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-mono text-[#686C63] block">Project Title</label>
                            <input
                              className="input-editorial text-xs mt-0.5 w-full"
                              placeholder="(Project Name)"
                              value={proj.title}
                              onChange={e => {
                                const next = [...reviewedProfile.projects];
                                next[idx].title = e.target.value;
                                setReviewedProfile({ ...reviewedProfile, projects: next });
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-mono text-[#686C63] block">Tech Stack (comma-separated)</label>
                            <input
                              className="input-editorial text-xs mt-0.5 w-full"
                              placeholder="(e.g. React, Python, PostgreSQL)"
                              value={proj.techStack.join(', ')}
                              onChange={e => {
                                const next = [...reviewedProfile.projects];
                                next[idx].techStack = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                setReviewedProfile({ ...reviewedProfile, projects: next });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
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
                    id="btn-confirm-find-jobs"
                    onClick={handleConfirmAndFindJobs}
                    className="btn-editorial btn-editorial-primary text-sm px-6 py-3 flex items-center gap-2 font-semibold shadow-sm hover:translate-y-[-1px] transition-transform"
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
