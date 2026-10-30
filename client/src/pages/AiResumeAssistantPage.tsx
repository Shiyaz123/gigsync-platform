import React, { useState, useEffect } from 'react';
import {
  CandidateProfile,
  TechnicalSkillsCategories,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  CertificationItem,
  PublicationItem
} from '../types';
import { api } from '../services/api';
import { ResumeTemplateRenderer, ResumeTemplateId } from '../components/templates/ResumeTemplateRenderer';
import {
  isNAOrEmpty,
  cleanText,
  cleanList,
  getCategorizedSkills,
  DEFAULT_SECTION_NAMES
} from '../components/templates/templateUtils';
import { AiResumeChatbotPanel } from '../components/AiResumeChatbotPanel';
import {
  Bot,
  Sparkles,
  Save,
  RotateCcw,
  RotateCw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit3,
  Briefcase,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Info
} from 'lucide-react';

interface AiResumeAssistantPageProps {
  profile: CandidateProfile;
  onApplyProfile: (updated: CandidateProfile) => void;
  onNavigate: (tab: string, context?: any) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const AiResumeAssistantPage: React.FC<AiResumeAssistantPageProps> = ({
  profile,
  onApplyProfile,
  onNavigate,
  showToast
}) => {
  // Draft profile with 13 sections initialized
  const [draftProfile, setDraftProfile] = useState<CandidateProfile>(() => {
    const cloned: CandidateProfile = JSON.parse(JSON.stringify(profile));
    if (!cloned.categorizedSkills) {
      cloned.categorizedSkills = getCategorizedSkills(cloned);
    }
    if (!cloned.achievements) cloned.achievements = [];
    if (!cloned.mentorshipAndLeadership) cloned.mentorshipAndLeadership = [];
    if (!cloned.publications) cloned.publications = [];
    if (!cloned.extracurricularActivities) cloned.extracurricularActivities = [];
    if (!cloned.languagesKnown) cloned.languagesKnown = [];
    if (!cloned.interests) cloned.interests = [];
    if (!cloned.sectionNames) cloned.sectionNames = {};
    if (!cloned.hiddenSections) cloned.hiddenSections = [];
    return cloned;
  });

  // Undo / Redo History Stack
  const [history, setHistory] = useState<CandidateProfile[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // View Mode: 'form' (Structured Editing) or 'preview' (Review & Live Templates)
  const [viewMode, setViewMode] = useState<'form' | 'preview'>('form');

  // Selected Resume Template for Preview & PDF
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplateId>('modern');

  // Chatbot Panel Open State
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Expanded Accordion Sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personalInfo: true,
    summary: true,
    education: true,
    skills: true,
    experience: true,
    projects: true,
    achievements: false,
    leadership: false,
    certifications: false,
    publications: false,
    extracurricular: false,
    languages: false,
    interests: false
  });

  // Active Tag Input buffer for each of the 8 skill categories
  const [newSkillInputs, setNewSkillInputs] = useState<Record<string, string>>({});

  // Initialize and synchronize with incoming profile prop (e.g. Demo Mode activation / reset / exit)
  useEffect(() => {
    const cloned: CandidateProfile = JSON.parse(JSON.stringify(profile));
    if (!cloned.categorizedSkills) {
      cloned.categorizedSkills = getCategorizedSkills(cloned);
    }
    if (!cloned.achievements) cloned.achievements = [];
    if (!cloned.mentorshipAndLeadership) cloned.mentorshipAndLeadership = [];
    if (!cloned.publications) cloned.publications = [];
    if (!cloned.extracurricularActivities) cloned.extracurricularActivities = [];
    if (!cloned.languagesKnown) cloned.languagesKnown = [];
    if (!cloned.interests) cloned.interests = [];
    if (!cloned.sectionNames) cloned.sectionNames = {};
    if (!cloned.hiddenSections) cloned.hiddenSections = [];

    setDraftProfile(cloned);
    setHistory([cloned]);
    setHistoryIndex(0);
  }, [profile]);

  // Record profile mutation with history snapshot
  const commitProfileChange = (updated: CandidateProfile, opDescription?: string) => {
    setDraftProfile(updated);
    // Push onto undo stack (truncate any future redos)
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(updated)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Auto-save draft
    localStorage.setItem('gigsync_resume_builder_draft', JSON.stringify(updated));

    if (opDescription) {
      showToast('Resume Updated', opDescription, 'info');
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const target = history[prevIndex];
      setDraftProfile(JSON.parse(JSON.stringify(target)));
      setHistoryIndex(prevIndex);
      localStorage.setItem('gigsync_resume_builder_draft', JSON.stringify(target));
      showToast('Undo', 'Reverted previous action', 'info');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const target = history[nextIndex];
      setDraftProfile(JSON.parse(JSON.stringify(target)));
      setHistoryIndex(nextIndex);
      localStorage.setItem('gigsync_resume_builder_draft', JSON.stringify(target));
      showToast('Redo', 'Restored action', 'info');
    }
  };

  const toggleSection = (secKey: string) => {
    setExpandedSections(prev => ({ ...prev, [secKey]: !prev[secKey] }));
  };

  const handleSaveProgress = () => {
    localStorage.setItem('gigsync_resume_builder_draft', JSON.stringify(draftProfile));
    showToast('Progress Saved', 'Your resume draft has been saved to your browser session.', 'success');
  };

  // --------------------------------------------------------------------------
  // Normalize & Strip Blank / N/A values before final generation
  // --------------------------------------------------------------------------
  const getNormalizedProfile = (): CandidateProfile => {
    const raw: CandidateProfile = JSON.parse(JSON.stringify(draftProfile));

    // Normalize Personal Info
    raw.personalInfo = {
      fullName: cleanText(raw.personalInfo.fullName),
      email: cleanText(raw.personalInfo.email),
      phone: cleanText(raw.personalInfo.phone),
      location: cleanText(raw.personalInfo.location),
      title: cleanText(raw.personalInfo.title),
      summary: cleanText(raw.personalInfo.summary),
      linkedin: cleanText(raw.personalInfo.linkedin),
      github: cleanText(raw.personalInfo.github),
      portfolio: cleanText(raw.personalInfo.portfolio)
    };

    // Normalize Education
    raw.education = (raw.education || [])
      .map(e => ({
        ...e,
        institution: cleanText(e.institution),
        degree: cleanText(e.degree),
        branch: cleanText(e.branch || e.fieldOfStudy),
        fieldOfStudy: cleanText(e.branch || e.fieldOfStudy),
        graduationYear: cleanText(e.graduationYear || e.endDate),
        endDate: cleanText(e.graduationYear || e.endDate),
        cgpa: cleanText(e.cgpa || e.gpa),
        gpa: cleanText(e.cgpa || e.gpa)
      }))
      .filter(e => e.institution);

    // Normalize Categorized Skills
    const cat = getCategorizedSkills(raw);
    raw.categorizedSkills = cat;
    raw.skills = {
      technical: [
        ...cat.programmingLanguages,
        ...cat.backendAndApis,
        ...cat.databases,
        ...cat.toolsAndDevelopment,
        ...cat.testing,
        ...cat.csFundamentals,
        ...cat.aiAndMl
      ],
      frameworks: cat.frontend,
      tools: cat.toolsAndDevelopment,
      soft: cleanList(raw.skills?.soft || [])
    };

    // Normalize Experience
    raw.experience = (raw.experience || [])
      .map(exp => ({
        ...exp,
        role: cleanText(exp.role),
        company: cleanText(exp.company),
        employmentType: cleanText(exp.employmentType),
        location: cleanText(exp.location),
        duration: cleanText(exp.duration) || `${cleanText(exp.startDate)} – ${exp.current ? 'Present' : cleanText(exp.endDate)}`.replace(/^ – | – $/g, ''),
        responsibilities: cleanList([...(exp.responsibilities || []), ...(exp.bullets || [])]),
        bullets: cleanList([...(exp.responsibilities || []), ...(exp.bullets || [])])
      }))
      .filter(exp => exp.company || exp.role);

    // Normalize Projects
    raw.projects = (raw.projects || [])
      .map(pr => ({
        ...pr,
        title: cleanText(pr.title),
        description: cleanText(pr.description),
        technologies: cleanList([...(pr.technologies || []), ...(pr.techStack || [])]),
        techStack: cleanList([...(pr.technologies || []), ...(pr.techStack || [])]),
        keyFeatures: cleanList([...(pr.keyFeatures || []), ...(pr.bullets || [])]),
        bullets: cleanList([...(pr.keyFeatures || []), ...(pr.bullets || [])]),
        githubUrl: cleanText(pr.githubUrl || pr.repoUrl),
        liveUrl: cleanText(pr.liveUrl)
      }))
      .filter(pr => pr.title);

    // Normalize Certifications
    raw.certifications = (raw.certifications || [])
      .map(c => ({
        ...c,
        name: cleanText(c.name),
        issuer: cleanText(c.organization || c.issuer),
        organization: cleanText(c.organization || c.issuer),
        issueDate: cleanText(c.completionDate || c.issueDate),
        completionDate: cleanText(c.completionDate || c.issueDate),
        credentialUrl: cleanText(c.credentialLink || c.credentialUrl),
        credentialLink: cleanText(c.credentialLink || c.credentialUrl)
      }))
      .filter(c => c.name);

    // Clean remaining arrays
    raw.achievements = cleanList(raw.achievements);
    raw.mentorshipAndLeadership = cleanList(raw.mentorshipAndLeadership);
    raw.publications = (raw.publications || [])
      .map(pub => ({
        ...pub,
        title: cleanText(pub.title),
        publisher: cleanText(pub.publisher),
        date: cleanText(pub.date),
        url: cleanText(pub.url),
        description: cleanText(pub.description)
      }))
      .filter(pub => pub.title);
    raw.extracurricularActivities = cleanList(raw.extracurricularActivities);
    raw.languagesKnown = cleanList(raw.languagesKnown);
    raw.interests = cleanList(raw.interests);

    return raw;
  };

  // Final Action: Confirm and Discover Jobs
  const handleConfirmAndFindJobs = async () => {
    const normalized = getNormalizedProfile();
    const confirmed: CandidateProfile = {
      ...normalized,
      confirmedFactsOnly: true,
      lastConfirmedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await api.updateProfile(confirmed);
      onApplyProfile(confirmed);
      showToast('Profile Confirmed', 'Resume saved. Finding genuine vacancies matching your confirmed background...', 'success');
      onNavigate('jobs');
    } catch (err: any) {
      showToast('Error', err.message || 'Could not save profile.', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Skill Pills Helpers
  const addSkillToCategory = (catKey: keyof TechnicalSkillsCategories) => {
    const inputVal = (newSkillInputs[catKey] || '').trim();
    if (!inputVal) return;

    const updated = JSON.parse(JSON.stringify(draftProfile));
    if (!updated.categorizedSkills) updated.categorizedSkills = getCategorizedSkills(updated);

    const prevList = updated.categorizedSkills[catKey] || [];
    if (!prevList.some((s: string) => s.toLowerCase() === inputVal.toLowerCase())) {
      updated.categorizedSkills[catKey] = [...prevList, inputVal];
      commitProfileChange(updated, `Added "${inputVal}" under ${catKey}`);
      setNewSkillInputs(prev => ({ ...prev, [catKey]: '' }));
    }
  };

  const removeSkillFromCategory = (catKey: keyof TechnicalSkillsCategories, skillName: string) => {
    const updated = JSON.parse(JSON.stringify(draftProfile));
    if (!updated.categorizedSkills) updated.categorizedSkills = getCategorizedSkills(updated);

    updated.categorizedSkills[catKey] = (updated.categorizedSkills[catKey] || []).filter(
      (s: string) => s !== skillName
    );
    commitProfileChange(updated, `Removed "${skillName}" from ${catKey}`);
  };

  // Repeatable Items Helpers
  const addEducationEntry = () => {
    const updated = JSON.parse(JSON.stringify(draftProfile));
    updated.education = [
      ...(updated.education || []),
      {
        id: `edu_${Date.now()}`,
        institution: '',
        degree: '',
        branch: '',
        fieldOfStudy: '',
        graduationYear: '',
        cgpa: '',
        startDate: '',
        endDate: '',
        confirmed: true
      }
    ];
    commitProfileChange(updated);
  };

  const removeEducationEntry = (idx: number) => {
    const updated = JSON.parse(JSON.stringify(draftProfile));
    updated.education.splice(idx, 1);
    commitProfileChange(updated, 'Removed education entry');
  };

  const addExperienceEntry = () => {
    const updated = JSON.parse(JSON.stringify(draftProfile));
    updated.experience = [
      ...(updated.experience || []),
      {
        id: `exp_${Date.now()}`,
        role: '',
        company: '',
        employmentType: 'Full-time',
        location: '',
        duration: '',
        startDate: '',
        endDate: '',
        current: false,
        responsibilities: [''],
        bullets: [''],
        confirmed: true
      }
    ];
    commitProfileChange(updated);
  };

  const removeExperienceEntry = (idx: number) => {
    const updated = JSON.parse(JSON.stringify(draftProfile));
    updated.experience.splice(idx, 1);
    commitProfileChange(updated, 'Removed experience entry');
  };

  const addProjectEntry = () => {
    const updated = JSON.parse(JSON.stringify(draftProfile));
    updated.projects = [
      ...(updated.projects || []),
      {
        id: `proj_${Date.now()}`,
        title: '',
        description: '',
        technologies: [],
        keyFeatures: [''],
        bullets: [''],
        githubUrl: '',
        liveUrl: '',
        confirmed: true
      }
    ];
    commitProfileChange(updated);
  };

  const removeProjectEntry = (idx: number) => {
    const updated = JSON.parse(JSON.stringify(draftProfile));
    updated.projects.splice(idx, 1);
    commitProfileChange(updated, 'Removed project entry');
  };

  const addCertificationEntry = () => {
    const updated = JSON.parse(JSON.stringify(draftProfile));
    updated.certifications = [
      ...(updated.certifications || []),
      {
        id: `cert_${Date.now()}`,
        name: '',
        organization: '',
        issuer: '',
        completionDate: '',
        issueDate: '',
        credentialLink: '',
        confirmed: true
      }
    ];
    commitProfileChange(updated);
  };

  const removeCertificationEntry = (idx: number) => {
    const updated = JSON.parse(JSON.stringify(draftProfile));
    updated.certifications.splice(idx, 1);
    commitProfileChange(updated, 'Removed certification entry');
  };

  const addPublicationEntry = () => {
    const updated = JSON.parse(JSON.stringify(draftProfile));
    updated.publications = [
      ...(updated.publications || []),
      {
        id: `pub_${Date.now()}`,
        title: '',
        publisher: '',
        date: '',
        url: '',
        description: ''
      }
    ];
    commitProfileChange(updated);
  };

  const removePublicationEntry = (idx: number) => {
    const updated = JSON.parse(JSON.stringify(draftProfile));
    updated.publications.splice(idx, 1);
    commitProfileChange(updated, 'Removed publication');
  };

  const addArrayItem = (key: 'achievements' | 'mentorshipAndLeadership' | 'extracurricularActivities' | 'languagesKnown' | 'interests') => {
    const updated = JSON.parse(JSON.stringify(draftProfile));
    if (!updated[key]) updated[key] = [];
    updated[key].push('');
    commitProfileChange(updated);
  };

  const updateArrayItem = (key: 'achievements' | 'mentorshipAndLeadership' | 'extracurricularActivities' | 'languagesKnown' | 'interests', idx: number, val: string) => {
    const updated = JSON.parse(JSON.stringify(draftProfile));
    updated[key][idx] = val;
    setDraftProfile(updated);
  };

  const removeArrayItem = (key: 'achievements' | 'mentorshipAndLeadership' | 'extracurricularActivities' | 'languagesKnown' | 'interests', idx: number) => {
    const updated = JSON.parse(JSON.stringify(draftProfile));
    updated[key].splice(idx, 1);
    commitProfileChange(updated);
  };

  const currentCatSkills = getCategorizedSkills(draftProfile);

  return (
    <div className="ai-resume-builder-page space-y-6 pb-20">
      {/* Top Banner & Mode Switcher */}
      <div className="pb-4 border-b border-[#D5D5CC] flex items-baseline justify-between flex-wrap gap-4 no-print">
        <div>
          <span className="section-num">Workflow Step 01 / AI Resume Builder</span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#20251F] mt-1">
            Build Resume with AI
          </h1>
          <p className="text-xs sm:text-sm text-[#686C63] mt-1 max-w-2xl">
            Structured, zero-hallucination resume builder. Fill the sections that apply to your background, or instruct the AI assistant to refine and mutate your CV in real time.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSaveProgress}
            className="btn-editorial btn-editorial-outline text-xs px-3.5 py-2 flex items-center gap-1.5"
            title="Save current progress to session"
          >
            <Save size={14} strokeWidth={1.5} />
            <span>Save Progress</span>
          </button>

          <button
            onClick={() => setViewMode(viewMode === 'form' ? 'preview' : 'form')}
            className={`btn-editorial text-xs px-4 py-2 flex items-center gap-1.5 font-semibold ${
              viewMode === 'preview' ? 'btn-editorial-dark' : 'btn-editorial-secondary'
            }`}
          >
            {viewMode === 'form' ? (
              <>
                <Eye size={14} strokeWidth={1.5} />
                <span>Review & Live Preview</span>
              </>
            ) : (
              <>
                <Edit3 size={14} strokeWidth={1.5} />
                <span>Back to Form</span>
              </>
            )}
          </button>

          <button
            onClick={handleConfirmAndFindJobs}
            className="btn-editorial btn-editorial-primary text-xs px-4 py-2 font-semibold flex items-center gap-2 shadow-xs"
          >
            <Briefcase size={14} strokeWidth={1.5} />
            <span>Save & Find Jobs for Me</span>
            <ArrowRight size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Skipping / Optional Fields Notice */}
      <div className="p-3 bg-[#E8E7DF] border border-[#D5D5CC] rounded-[3px] text-xs text-[#20251F] flex items-center gap-2.5 no-print">
        <Info size={16} className="text-[#D9534F] shrink-0" />
        <span>
          <strong>Zero Forced Sections:</strong> All fields are optional. Leave fields blank or enter <em>N/A</em> to skip. Blank and N/A entries are cleanly omitted from the final resume.
        </span>
      </div>

      {/* Main Grid: Form on Left, Chatbot on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Form or Preview) */}
        <div className="lg:col-span-8 space-y-6">
          {viewMode === 'form' ? (
            <div className="space-y-4">
              {/* ------------------------------------------------------------------ */}
              {/* SECTION 1: Personal Information */}
              {/* ------------------------------------------------------------------ */}
              <div className="surface-card border border-[#D5D5CC] rounded-[3px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('personalInfo')}
                  className="w-full p-4 bg-[#F5F3EE] border-b border-[#D5D5CC] flex items-center justify-between text-left hover:bg-[#E8E7DF] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#D9534F] uppercase">01</span>
                    <h2 className="font-serif text-xl font-bold text-[#20251F]">Personal Information</h2>
                    {cleanText(draftProfile.personalInfo.fullName) && (
                      <span className="tag-mono text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                        {draftProfile.personalInfo.fullName}
                      </span>
                    )}
                  </div>
                  {expandedSections.personalInfo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {expandedSections.personalInfo && (
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-mono text-[#686C63] font-semibold mb-1 uppercase tracking-wide">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          className="input-editorial text-xs"
                          placeholder="e.g. Alex Morgan"
                          value={draftProfile.personalInfo.fullName || ''}
                          onChange={e => {
                            const updated = {
                              ...draftProfile,
                              personalInfo: { ...draftProfile.personalInfo, fullName: e.target.value }
                            };
                            setDraftProfile(updated);
                          }}
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[#686C63] font-semibold mb-1 uppercase tracking-wide">
                          Target Role / Title
                        </label>
                        <input
                          type="text"
                          className="input-editorial text-xs"
                          placeholder="e.g. Full-Stack Engineer"
                          value={draftProfile.personalInfo.title || ''}
                          onChange={e => {
                            const updated = {
                              ...draftProfile,
                              personalInfo: { ...draftProfile.personalInfo, title: e.target.value }
                            };
                            setDraftProfile(updated);
                          }}
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[#686C63] font-semibold mb-1 uppercase tracking-wide">
                          Location (City, Country / Remote)
                        </label>
                        <input
                          type="text"
                          className="input-editorial text-xs"
                          placeholder="e.g. Bengaluru, India or Remote"
                          value={draftProfile.personalInfo.location || ''}
                          onChange={e => {
                            const updated = {
                              ...draftProfile,
                              personalInfo: { ...draftProfile.personalInfo, location: e.target.value }
                            };
                            setDraftProfile(updated);
                          }}
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[#686C63] font-semibold mb-1 uppercase tracking-wide">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          className="input-editorial text-xs"
                          placeholder="e.g. +91 98765 43210"
                          value={draftProfile.personalInfo.phone || ''}
                          onChange={e => {
                            const updated = {
                              ...draftProfile,
                              personalInfo: { ...draftProfile.personalInfo, phone: e.target.value }
                            };
                            setDraftProfile(updated);
                          }}
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[#686C63] font-semibold mb-1 uppercase tracking-wide">
                          Email Address
                        </label>
                        <input
                          type="email"
                          className="input-editorial text-xs"
                          placeholder="e.g. alex@example.com"
                          value={draftProfile.personalInfo.email || ''}
                          onChange={e => {
                            const updated = {
                              ...draftProfile,
                              personalInfo: { ...draftProfile.personalInfo, email: e.target.value }
                            };
                            setDraftProfile(updated);
                          }}
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[#686C63] font-semibold mb-1 uppercase tracking-wide">
                          GitHub URL
                        </label>
                        <input
                          type="text"
                          className="input-editorial text-xs"
                          placeholder="e.g. github.com/alex"
                          value={draftProfile.personalInfo.github || ''}
                          onChange={e => {
                            const updated = {
                              ...draftProfile,
                              personalInfo: { ...draftProfile.personalInfo, github: e.target.value }
                            };
                            setDraftProfile(updated);
                          }}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-mono text-[#686C63] font-semibold mb-1 uppercase tracking-wide">
                          LinkedIn URL
                        </label>
                        <input
                          type="text"
                          className="input-editorial text-xs"
                          placeholder="e.g. linkedin.com/in/alex"
                          value={draftProfile.personalInfo.linkedin || ''}
                          onChange={e => {
                            const updated = {
                              ...draftProfile,
                              personalInfo: { ...draftProfile.personalInfo, linkedin: e.target.value }
                            };
                            setDraftProfile(updated);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------------ */}
              {/* SECTION 2: Profile / Professional Summary */}
              {/* ------------------------------------------------------------------ */}
              <div className="surface-card border border-[#D5D5CC] rounded-[3px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('summary')}
                  className="w-full p-4 bg-[#F5F3EE] border-b border-[#D5D5CC] flex items-center justify-between text-left hover:bg-[#E8E7DF] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#D9534F] uppercase">02</span>
                    <h2 className="font-serif text-xl font-bold text-[#20251F]">Profile / Professional Summary</h2>
                    {cleanText(draftProfile.personalInfo.summary) && (
                      <span className="tag-mono text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                        Filled
                      </span>
                    )}
                  </div>
                  {expandedSections.summary ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {expandedSections.summary && (
                  <div className="p-5 space-y-3">
                    <textarea
                      rows={4}
                      className="input-editorial text-xs leading-relaxed"
                      placeholder="Write 2-4 sentences highlighting your core competencies and experience, or click '✨ Generate Summary with AI'..."
                      value={draftProfile.personalInfo.summary || ''}
                      onChange={e => {
                        const updated = {
                          ...draftProfile,
                          personalInfo: { ...draftProfile.personalInfo, summary: e.target.value }
                        };
                        setDraftProfile(updated);
                      }}
                    />
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#686C63] text-[11px]">
                        Optional. Leave blank or enter N/A to omit from your resume.
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await api.editResumeWithAi('Rewrite professional summary', draftProfile);
                          if (res.updatedProfile) commitProfileChange(res.updatedProfile, 'Generated AI summary');
                        }}
                        className="btn-editorial btn-editorial-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <Sparkles size={12} className="text-[#D9534F]" />
                        <span>✨ Polish Summary with AI</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------------ */}
              {/* SECTION 3: Education */}
              {/* ------------------------------------------------------------------ */}
              <div className="surface-card border border-[#D5D5CC] rounded-[3px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('education')}
                  className="w-full p-4 bg-[#F5F3EE] border-b border-[#D5D5CC] flex items-center justify-between text-left hover:bg-[#E8E7DF] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#D9534F] uppercase">03</span>
                    <h2 className="font-serif text-xl font-bold text-[#20251F]">Education</h2>
                    <span className="tag-mono text-[10px]">
                      {(draftProfile.education || []).length} Entries
                    </span>
                  </div>
                  {expandedSections.education ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {expandedSections.education && (
                  <div className="p-5 space-y-4">
                    {(draftProfile.education || []).map((edu, idx) => (
                      <div key={edu.id || idx} className="p-4 border border-[#D5D5CC] rounded-[3px] bg-[#FAF9F5] space-y-3 relative">
                        <div className="flex justify-between items-center pb-2 border-b border-[#D5D5CC]">
                          <span className="font-mono text-xs font-bold text-[#20251F]">
                            Education Record #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeEducationEntry(idx)}
                            className="text-rose-600 hover:text-rose-800 text-xs flex items-center gap-1"
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              University / College
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. Stanford University"
                              value={edu.institution || ''}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.education[idx].institution = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Degree
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. Bachelor of Science"
                              value={edu.degree || ''}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.education[idx].degree = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Branch / Specialization
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. Computer Science"
                              value={edu.branch || edu.fieldOfStudy || ''}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.education[idx].branch = e.target.value;
                                updated.education[idx].fieldOfStudy = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Graduation Year
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. 2026 or Dec 2025"
                              value={edu.graduationYear || edu.endDate || ''}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.education[idx].graduationYear = e.target.value;
                                updated.education[idx].endDate = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              CGPA / Percentage (Optional)
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. 3.8 / 4.0 or N/A"
                              value={edu.cgpa || edu.gpa || ''}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.education[idx].cgpa = e.target.value;
                                updated.education[idx].gpa = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addEducationEntry}
                      className="btn-editorial btn-editorial-outline text-xs py-2 px-3 flex items-center gap-1.5 w-full justify-center border-dashed"
                    >
                      <Plus size={13} />
                      <span>Add Another Education</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------------ */}
              {/* SECTION 4: Technical Skills (8 Categories) */}
              {/* ------------------------------------------------------------------ */}
              <div className="surface-card border border-[#D5D5CC] rounded-[3px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('skills')}
                  className="w-full p-4 bg-[#F5F3EE] border-b border-[#D5D5CC] flex items-center justify-between text-left hover:bg-[#E8E7DF] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#D9534F] uppercase">04</span>
                    <h2 className="font-serif text-xl font-bold text-[#20251F]">Technical Skills</h2>
                    <span className="tag-mono text-[10px]">
                      {Object.values(currentCatSkills).reduce((acc, curr) => acc + curr.length, 0)} Skills
                    </span>
                  </div>
                  {expandedSections.skills ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {expandedSections.skills && (
                  <div className="p-5 space-y-5">
                    <p className="text-xs text-[#686C63]">
                      Enter individual skills under each category. Press <kbd className="px-1 py-0.5 bg-neutral-200 rounded text-[10px]">Enter</kbd> or click <strong>+ Add</strong>.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'programmingLanguages', label: 'Programming Languages', placeholder: 'e.g. Python, TypeScript, Java' },
                        { key: 'backendAndApis', label: 'Backend & APIs', placeholder: 'e.g. Node.js, Express, FastAPI, REST' },
                        { key: 'databases', label: 'Databases', placeholder: 'e.g. PostgreSQL, MongoDB, Redis' },
                        { key: 'testing', label: 'Testing', placeholder: 'e.g. Jest, PyTest, Cypress' },
                        { key: 'toolsAndDevelopment', label: 'Tools & Development', placeholder: 'e.g. Git, Docker, AWS, Linux' },
                        { key: 'frontend', label: 'Frontend', placeholder: 'e.g. React, Tailwind CSS, Next.js' },
                        { key: 'csFundamentals', label: 'Computer Science Fundamentals', placeholder: 'e.g. Data Structures, OOP, System Design' },
                        { key: 'aiAndMl', label: 'AI / ML', placeholder: 'e.g. PyTorch, LLMs, Scikit-learn' }
                      ].map(cat => {
                        const catKey = cat.key as keyof TechnicalSkillsCategories;
                        const skillList = currentCatSkills[catKey] || [];

                        return (
                          <div key={cat.key} className="p-3.5 border border-[#D5D5CC] rounded-[3px] bg-[#FAF9F5] space-y-2.5">
                            <label className="block font-mono text-xs font-bold text-[#20251F]">
                              {cat.label}
                            </label>

                            {/* Existing Tags */}
                            <div className="flex flex-wrap gap-1.5 min-h-[26px]">
                              {skillList.map((skill, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="inline-flex items-center gap-1 text-[11px] font-mono bg-[#FFFFFF] border border-[#D5D5CC] px-2 py-0.5 rounded-[2px] text-[#20251F]"
                                >
                                  <span>{skill}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeSkillFromCategory(catKey, skill)}
                                    className="text-[#686C63] hover:text-rose-600 transition-colors ml-0.5"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                              {skillList.length === 0 && (
                                <span className="text-[11px] text-[#686C63] italic">No skills added yet</span>
                              )}
                            </div>

                            {/* Add Skill Input */}
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                className="input-editorial text-xs py-1 px-2 flex-1"
                                placeholder={cat.placeholder}
                                value={newSkillInputs[cat.key] || ''}
                                onChange={e => setNewSkillInputs({ ...newSkillInputs, [cat.key]: e.target.value })}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addSkillToCategory(catKey);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => addSkillToCategory(catKey)}
                                className="btn-editorial btn-editorial-secondary text-xs py-1 px-2.5"
                              >
                                + Add
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------------ */}
              {/* SECTION 5: Experience / Work Experience */}
              {/* ------------------------------------------------------------------ */}
              <div className="surface-card border border-[#D5D5CC] rounded-[3px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('experience')}
                  className="w-full p-4 bg-[#F5F3EE] border-b border-[#D5D5CC] flex items-center justify-between text-left hover:bg-[#E8E7DF] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#D9534F] uppercase">05</span>
                    <h2 className="font-serif text-xl font-bold text-[#20251F]">Experience / Work Experience</h2>
                    <span className="tag-mono text-[10px]">
                      {(draftProfile.experience || []).length} Entries
                    </span>
                  </div>
                  {expandedSections.experience ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {expandedSections.experience && (
                  <div className="p-5 space-y-4">
                    {(draftProfile.experience || []).map((exp, idx) => (
                      <div key={exp.id || idx} className="p-4 border border-[#D5D5CC] rounded-[3px] bg-[#FAF9F5] space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-[#D5D5CC]">
                          <span className="font-mono text-xs font-bold text-[#20251F]">
                            Experience #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeExperienceEntry(idx)}
                            className="text-rose-600 hover:text-rose-800 text-xs flex items-center gap-1"
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Job Title
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. Software Engineer Intern"
                              value={exp.role || ''}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.experience[idx].role = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Company Name
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. Acme Corp"
                              value={exp.company || ''}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.experience[idx].company = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Employment Type
                            </label>
                            <select
                              className="input-editorial text-xs"
                              value={exp.employmentType || 'Full-time'}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.experience[idx].employmentType = e.target.value;
                                setDraftProfile(updated);
                              }}
                            >
                              <option value="Full-time">Full-time</option>
                              <option value="Internship">Internship</option>
                              <option value="Contract">Contract</option>
                              <option value="Part-time">Part-time</option>
                              <option value="Freelance">Freelance</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Location
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. San Francisco, CA or Remote"
                              value={exp.location || ''}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.experience[idx].location = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Duration
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. Jun 2024 – Present or 6 Months"
                              value={exp.duration || `${exp.startDate || ''} – ${exp.current ? 'Present' : exp.endDate || ''}`.replace(/^ – | – $/g, '')}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.experience[idx].duration = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Responsibilities (1 bullet point per line)
                            </label>
                            <textarea
                              rows={3}
                              className="input-editorial text-xs leading-relaxed"
                              placeholder="• Engineered high-performance REST APIs with Node.js and PostgreSQL&#10;• Reduced latency by 35% through Redis query caching"
                              value={(exp.responsibilities || exp.bullets || []).join('\n')}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                const lines = e.target.value.split('\n');
                                updated.experience[idx].responsibilities = lines;
                                updated.experience[idx].bullets = lines;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addExperienceEntry}
                      className="btn-editorial btn-editorial-outline text-xs py-2 px-3 flex items-center gap-1.5 w-full justify-center border-dashed"
                    >
                      <Plus size={13} />
                      <span>Add Another Experience</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------------ */}
              {/* SECTION 6: Projects */}
              {/* ------------------------------------------------------------------ */}
              <div className="surface-card border border-[#D5D5CC] rounded-[3px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('projects')}
                  className="w-full p-4 bg-[#F5F3EE] border-b border-[#D5D5CC] flex items-center justify-between text-left hover:bg-[#E8E7DF] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#D9534F] uppercase">06</span>
                    <h2 className="font-serif text-xl font-bold text-[#20251F]">Projects</h2>
                    <span className="tag-mono text-[10px]">
                      {(draftProfile.projects || []).length} Projects
                    </span>
                  </div>
                  {expandedSections.projects ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {expandedSections.projects && (
                  <div className="p-5 space-y-4">
                    {(draftProfile.projects || []).map((proj, idx) => (
                      <div key={proj.id || idx} className="p-4 border border-[#D5D5CC] rounded-[3px] bg-[#FAF9F5] space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-[#D5D5CC]">
                          <span className="font-mono text-xs font-bold text-[#20251F]">
                            Project #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeProjectEntry(idx)}
                            className="text-rose-600 hover:text-rose-800 text-xs flex items-center gap-1"
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Project Name
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. GigSync Platform"
                              value={proj.title || ''}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.projects[idx].title = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Technologies Used (Comma-separated)
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. React, Node.js, PostgreSQL"
                              value={(proj.technologies || proj.techStack || []).join(', ')}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                const items = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                updated.projects[idx].technologies = items;
                                updated.projects[idx].techStack = items;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Description
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="One-line summary of what the project solves"
                              value={proj.description || ''}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.projects[idx].description = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              GitHub Link
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. github.com/user/project"
                              value={proj.githubUrl || proj.repoUrl || ''}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.projects[idx].githubUrl = e.target.value;
                                updated.projects[idx].repoUrl = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Live Project Link
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. project-demo.vercel.app"
                              value={proj.liveUrl || ''}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.projects[idx].liveUrl = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Key Features & Accomplishments (1 bullet per line)
                            </label>
                            <textarea
                              rows={3}
                              className="input-editorial text-xs leading-relaxed"
                              placeholder="• Designed location parsing with 100% boundary regex matching&#10;• Implemented ATS-friendly layout exporter"
                              value={(proj.keyFeatures || proj.bullets || []).join('\n')}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                const lines = e.target.value.split('\n');
                                updated.projects[idx].keyFeatures = lines;
                                updated.projects[idx].bullets = lines;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addProjectEntry}
                      className="btn-editorial btn-editorial-outline text-xs py-2 px-3 flex items-center gap-1.5 w-full justify-center border-dashed"
                    >
                      <Plus size={13} />
                      <span>Add Another Project</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------------ */}
              {/* SECTION 7: Achievements */}
              {/* ------------------------------------------------------------------ */}
              <div className="surface-card border border-[#D5D5CC] rounded-[3px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('achievements')}
                  className="w-full p-4 bg-[#F5F3EE] border-b border-[#D5D5CC] flex items-center justify-between text-left hover:bg-[#E8E7DF] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#D9534F] uppercase">07</span>
                    <h2 className="font-serif text-xl font-bold text-[#20251F]">Achievements</h2>
                    <span className="tag-mono text-[10px]">
                      {(draftProfile.achievements || []).length} Entries
                    </span>
                  </div>
                  {expandedSections.achievements ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {expandedSections.achievements && (
                  <div className="p-5 space-y-3">
                    {(draftProfile.achievements || []).map((ach, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          className="input-editorial text-xs flex-1"
                          placeholder="e.g. 1st Place at National Hackathon 2025 (out of 200+ teams)"
                          value={ach}
                          onChange={e => updateArrayItem('achievements', idx, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('achievements', idx)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('achievements')}
                      className="btn-editorial btn-editorial-outline text-xs py-1.5 px-3 flex items-center gap-1 border-dashed"
                    >
                      <Plus size={12} /> Add Achievement
                    </button>
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------------ */}
              {/* SECTION 8: Mentorship & Leadership */}
              {/* ------------------------------------------------------------------ */}
              <div className="surface-card border border-[#D5D5CC] rounded-[3px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('leadership')}
                  className="w-full p-4 bg-[#F5F3EE] border-b border-[#D5D5CC] flex items-center justify-between text-left hover:bg-[#E8E7DF] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#D9534F] uppercase">08</span>
                    <h2 className="font-serif text-xl font-bold text-[#20251F]">Mentorship & Leadership</h2>
                    <span className="tag-mono text-[10px]">
                      {(draftProfile.mentorshipAndLeadership || []).length} Entries
                    </span>
                  </div>
                  {expandedSections.leadership ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {expandedSections.leadership && (
                  <div className="p-5 space-y-3">
                    {(draftProfile.mentorshipAndLeadership || []).map((lead, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          className="input-editorial text-xs flex-1"
                          placeholder="e.g. Head of University Google Developer Student Club"
                          value={lead}
                          onChange={e => updateArrayItem('mentorshipAndLeadership', idx, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('mentorshipAndLeadership', idx)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('mentorshipAndLeadership')}
                      className="btn-editorial btn-editorial-outline text-xs py-1.5 px-3 flex items-center gap-1 border-dashed"
                    >
                      <Plus size={12} /> Add Leadership Entry
                    </button>
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------------ */}
              {/* SECTION 9: Certifications */}
              {/* ------------------------------------------------------------------ */}
              <div className="surface-card border border-[#D5D5CC] rounded-[3px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('certifications')}
                  className="w-full p-4 bg-[#F5F3EE] border-b border-[#D5D5CC] flex items-center justify-between text-left hover:bg-[#E8E7DF] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#D9534F] uppercase">09</span>
                    <h2 className="font-serif text-xl font-bold text-[#20251F]">Certifications</h2>
                    <span className="tag-mono text-[10px]">
                      {(draftProfile.certifications || []).length} Certifications
                    </span>
                  </div>
                  {expandedSections.certifications ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {expandedSections.certifications && (
                  <div className="p-5 space-y-4">
                    {(draftProfile.certifications || []).map((cert, idx) => (
                      <div key={cert.id || idx} className="p-3 border border-[#D5D5CC] rounded-[3px] bg-[#FAF9F5] space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-[#D5D5CC]">
                          <span className="font-mono text-xs font-bold text-[#20251F]">
                            Certification #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeCertificationEntry(idx)}
                            className="text-rose-600 hover:text-rose-800 text-xs flex items-center gap-1"
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Certification Name
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. AWS Certified Solutions Architect"
                              value={cert.name || ''}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.certifications[idx].name = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Issuing Organization
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. Amazon Web Services"
                              value={cert.organization || cert.issuer || ''}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.certifications[idx].organization = e.target.value;
                                updated.certifications[idx].issuer = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Completion Date
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. Jan 2025"
                              value={cert.completionDate || cert.issueDate || ''}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.certifications[idx].completionDate = e.target.value;
                                updated.certifications[idx].issueDate = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Credential Link (Optional)
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. https://aws.amazon.com/verify"
                              value={cert.credentialLink || cert.credentialUrl || ''}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.certifications[idx].credentialLink = e.target.value;
                                updated.certifications[idx].credentialUrl = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addCertificationEntry}
                      className="btn-editorial btn-editorial-outline text-xs py-2 px-3 flex items-center gap-1.5 w-full justify-center border-dashed"
                    >
                      <Plus size={13} />
                      <span>Add Another Certification</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------------ */}
              {/* SECTION 10: Publications */}
              {/* ------------------------------------------------------------------ */}
              <div className="surface-card border border-[#D5D5CC] rounded-[3px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('publications')}
                  className="w-full p-4 bg-[#F5F3EE] border-b border-[#D5D5CC] flex items-center justify-between text-left hover:bg-[#E8E7DF] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#D9534F] uppercase">10</span>
                    <h2 className="font-serif text-xl font-bold text-[#20251F]">Publications</h2>
                    <span className="tag-mono text-[10px]">
                      {(draftProfile.publications || []).length} Publications
                    </span>
                  </div>
                  {expandedSections.publications ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {expandedSections.publications && (
                  <div className="p-5 space-y-4">
                    {(draftProfile.publications || []).map((pub, idx) => (
                      <div key={pub.id || idx} className="p-3 border border-[#D5D5CC] rounded-[3px] bg-[#FAF9F5] space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-[#D5D5CC]">
                          <span className="font-mono text-xs font-bold text-[#20251F]">
                            Publication #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removePublicationEntry(idx)}
                            className="text-rose-600 hover:text-rose-800 text-xs flex items-center gap-1"
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Publication Title
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. Distributed Consensus in Cloud Systems"
                              value={pub.title || ''}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.publications[idx].title = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Publisher / Journal / Conference
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. IEEE Transactions or ACM"
                              value={pub.publisher || ''}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.publications[idx].publisher = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Date
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. 2024"
                              value={pub.date || ''}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.publications[idx].date = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block font-mono text-[#686C63] text-[11px] font-semibold mb-1 uppercase">
                              Link / DOI (Optional)
                            </label>
                            <input
                              type="text"
                              className="input-editorial text-xs"
                              placeholder="e.g. doi.org/10.1234/example"
                              value={pub.url || ''}
                              onChange={e => {
                                const updated = JSON.parse(JSON.stringify(draftProfile));
                                updated.publications[idx].url = e.target.value;
                                setDraftProfile(updated);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addPublicationEntry}
                      className="btn-editorial btn-editorial-outline text-xs py-2 px-3 flex items-center gap-1.5 w-full justify-center border-dashed"
                    >
                      <Plus size={13} />
                      <span>Add Another Publication</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------------ */}
              {/* SECTION 11: Extracurricular Activities */}
              {/* ------------------------------------------------------------------ */}
              <div className="surface-card border border-[#D5D5CC] rounded-[3px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('extracurricular')}
                  className="w-full p-4 bg-[#F5F3EE] border-b border-[#D5D5CC] flex items-center justify-between text-left hover:bg-[#E8E7DF] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#D9534F] uppercase">11</span>
                    <h2 className="font-serif text-xl font-bold text-[#20251F]">Extracurricular Activities</h2>
                    <span className="tag-mono text-[10px]">
                      {(draftProfile.extracurricularActivities || []).length} Entries
                    </span>
                  </div>
                  {expandedSections.extracurricular ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {expandedSections.extracurricular && (
                  <div className="p-5 space-y-3">
                    {(draftProfile.extracurricularActivities || []).map((act, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          className="input-editorial text-xs flex-1"
                          placeholder="e.g. Volunteer Coding Tutor at Youth Tech Hub"
                          value={act}
                          onChange={e => updateArrayItem('extracurricularActivities', idx, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('extracurricularActivities', idx)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('extracurricularActivities')}
                      className="btn-editorial btn-editorial-outline text-xs py-1.5 px-3 flex items-center gap-1 border-dashed"
                    >
                      <Plus size={12} /> Add Activity
                    </button>
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------------ */}
              {/* SECTION 12: Languages Known */}
              {/* ------------------------------------------------------------------ */}
              <div className="surface-card border border-[#D5D5CC] rounded-[3px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('languages')}
                  className="w-full p-4 bg-[#F5F3EE] border-b border-[#D5D5CC] flex items-center justify-between text-left hover:bg-[#E8E7DF] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#D9534F] uppercase">12</span>
                    <h2 className="font-serif text-xl font-bold text-[#20251F]">Languages Known</h2>
                    <span className="tag-mono text-[10px]">
                      {(draftProfile.languagesKnown || []).length} Languages
                    </span>
                  </div>
                  {expandedSections.languages ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {expandedSections.languages && (
                  <div className="p-5 space-y-3">
                    {(draftProfile.languagesKnown || []).map((lang, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          className="input-editorial text-xs flex-1"
                          placeholder="e.g. English (Fluent), Spanish (Conversational)"
                          value={lang}
                          onChange={e => updateArrayItem('languagesKnown', idx, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('languagesKnown', idx)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('languagesKnown')}
                      className="btn-editorial btn-editorial-outline text-xs py-1.5 px-3 flex items-center gap-1 border-dashed"
                    >
                      <Plus size={12} /> Add Language
                    </button>
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------------------ */}
              {/* SECTION 13: Interests */}
              {/* ------------------------------------------------------------------ */}
              <div className="surface-card border border-[#D5D5CC] rounded-[3px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('interests')}
                  className="w-full p-4 bg-[#F5F3EE] border-b border-[#D5D5CC] flex items-center justify-between text-left hover:bg-[#E8E7DF] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#D9534F] uppercase">13</span>
                    <h2 className="font-serif text-xl font-bold text-[#20251F]">Interests</h2>
                    <span className="tag-mono text-[10px]">
                      {(draftProfile.interests || []).length} Interests
                    </span>
                  </div>
                  {expandedSections.interests ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {expandedSections.interests && (
                  <div className="p-5 space-y-3">
                    {(draftProfile.interests || []).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          className="input-editorial text-xs flex-1"
                          placeholder="e.g. Open Source, Distributed Systems, Chess"
                          value={item}
                          onChange={e => updateArrayItem('interests', idx, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('interests', idx)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('interests')}
                      className="btn-editorial btn-editorial-outline text-xs py-1.5 px-3 flex items-center gap-1 border-dashed"
                    >
                      <Plus size={12} /> Add Interest
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Review & Live Preview Screen (Templates 1 to 4) */
            <div className="space-y-6">
              {/* Template Switcher Bar */}
              <div className="surface-card p-4 flex items-center justify-between flex-wrap gap-3 no-print">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#686C63] uppercase">Template:</span>
                  <div className="flex items-center gap-1.5">
                    {[
                      { id: 'modern', label: 'Modern Tech' },
                      { id: 'academic', label: 'Classic Academic' },
                      { id: 'executive', label: 'Executive' },
                      { id: 'minimalist', label: 'Minimalist' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTemplate(t.id as ResumeTemplateId)}
                        className={`px-3 py-1.5 text-xs font-mono rounded-[2px] transition-colors border ${
                          selectedTemplate === t.id
                            ? 'border-[#D9534F] bg-[#E8E7DF] text-[#D9534F] font-bold shadow-xs'
                            : 'border-[#D5D5CC] bg-[#FFFFFF] text-[#686C63] hover:text-[#20251F]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="btn-editorial btn-editorial-outline text-xs px-3 py-1.5 flex items-center gap-1.5"
                  >
                    <Printer size={13} strokeWidth={1.5} />
                    <span>Print / Export PDF</span>
                  </button>
                </div>
              </div>

              {/* Render Selected Template */}
              <div className="p-4 sm:p-8 bg-[#E8E7DF] border border-[#D5D5CC] rounded-[3px] flex justify-center print:p-0 print:m-0 print:bg-transparent print:border-none">
                <ResumeTemplateRenderer
                  templateId={selectedTemplate}
                  profile={getNormalizedProfile()}
                  className="w-full flex justify-center"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive AI Resume Editor Chatbot Panel */}
        <div className="lg:col-span-4 sticky top-20 no-print">
          <AiResumeChatbotPanel
            profile={draftProfile}
            onUpdateProfile={commitProfileChange}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onUndo={handleUndo}
            onRedo={handleRedo}
            isOpen={isChatOpen}
            onToggleOpen={() => setIsChatOpen(!isChatOpen)}
          />
        </div>
      </div>
    </div>
  );
};
