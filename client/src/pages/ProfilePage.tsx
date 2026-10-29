import React, { useState } from 'react';
import {
  CandidateProfile,
  ParsedResumeResult
} from '../types';
import { api } from '../services/api';
import {
  UserCheck,
  Upload,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  FileText,
  Save,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

interface ProfilePageProps {
  profile: CandidateProfile;
  onUpdateProfile: (updated: CandidateProfile) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  onNavigateToAssistant?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  onUpdateProfile,
  showToast,
  onNavigateToAssistant
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'education' | 'experience' | 'projects' | 'skills' | 'parser'>('info');
  const [formData, setFormData] = useState<CandidateProfile>(JSON.parse(JSON.stringify(profile)));
  const [pastedText, setPastedText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedResumeResult | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Skill input state
  const [newSkillText, setNewSkillText] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<'technical' | 'frameworks' | 'tools' | 'soft'>('technical');

  const handleSave = async () => {
    try {
      const updated = {
        ...formData,
        confirmedFactsOnly: true,
        lastConfirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await api.updateProfile(updated);
      onUpdateProfile(updated);
      showToast('Profile Saved', 'Confirmed facts saved across all matching and resume outputs.', 'success');
    } catch (err: any) {
      showToast('Save Failed', err.message || 'Could not save profile.', 'error');
    }
  };

  const handleParseText = async () => {
    if (!pastedText.trim()) {
      showToast('Empty Content', 'Please paste the plain text of your resume or use sample text.', 'warning');
      return;
    }
    setIsParsing(true);
    try {
      const res = await api.parseResumeText(pastedText);
      setParsedResult(res);
      setShowReviewModal(true);
      showToast('Resume Extracted', `Extracted with ${res.confidenceScore}% confidence. Review before confirming.`, 'info');
    } catch (err: any) {
      showToast('Parsing Failed', err.message || 'Unable to parse text.', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleAcceptExtraction = () => {
    if (!parsedResult) return;
    const extracted = parsedResult.extractedProfile;

    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        fullName: extracted.personalInfo.fullName || prev.personalInfo.fullName,
        email: extracted.personalInfo.email || prev.personalInfo.email,
        phone: extracted.personalInfo.phone || prev.personalInfo.phone,
        title: extracted.personalInfo.title || prev.personalInfo.title
      },
      education: extracted.education.length > 0 ? extracted.education : prev.education,
      skills: {
        technical: Array.from(new Set([...prev.skills.technical, ...extracted.skills.technical])),
        frameworks: Array.from(new Set([...prev.skills.frameworks, ...extracted.skills.frameworks])),
        tools: Array.from(new Set([...prev.skills.tools, ...extracted.skills.tools])),
        soft: Array.from(new Set([...prev.skills.soft, ...extracted.skills.soft]))
      }
    }));

    setShowReviewModal(false);
    showToast('Extraction Accepted', 'Fields populated. Click "Save Master Profile" to confirm.', 'success');
  };

  const handleAddSkill = () => {
    if (!newSkillText.trim()) return;
    const trimmed = newSkillText.trim();
    if (!formData.skills[newSkillCategory].includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        skills: {
          ...prev.skills,
          [newSkillCategory]: [...prev.skills[newSkillCategory], trimmed]
        }
      }));
    }
    setNewSkillText('');
  };

  const handleRemoveSkill = (category: 'technical' | 'frameworks' | 'tools' | 'soft', skillName: string) => {
    setFormData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills[category].filter(s => s !== skillName)
      }
    }));
  };

  return (
    <div className="profile-page space-y-8 pb-16">
      {/* Editorial Header */}
      <div className="pb-4 border-b border-[#D5D5CC]">
        <div className="flex items-baseline justify-between flex-wrap gap-4">
          <div>
            <span className="section-num">Workflow Step 01 & 02 / Ground Truth</span>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#20251F] mt-1">
              Candidate Profile & Document Ingestion
            </h1>
            <p className="text-sm text-[#686C63] mt-1">
              Confirmed facts only. Used as ground truth for resume generation and explainable job matching.
            </p>
          </div>

          <div className="flex gap-3">
            {onNavigateToAssistant && (
              <button
                onClick={onNavigateToAssistant}
                className="btn-editorial btn-editorial-outline text-xs px-3.5 py-2"
              >
                Use AI Assistant Instead
              </button>
            )}
            <button
              onClick={handleSave}
              className="btn-editorial btn-editorial-primary text-xs px-4 py-2"
            >
              <Save size={14} strokeWidth={1.5} /> Save Master Profile
            </button>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-[#D5D5CC] pb-3 overflow-x-auto text-xs">
        {[
          { id: 'info', label: 'Personal Coordinates' },
          { id: 'education', label: 'Education History' },
          { id: 'experience', label: 'Experience & Internships' },
          { id: 'projects', label: 'Technical Projects' },
          { id: 'skills', label: 'Skills & Tools' },
          { id: 'parser', label: 'Option A: Upload / Paste Resume' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-3 py-1.5 font-mono text-xs rounded-[2px] transition-colors border ${
              activeSubTab === tab.id
                ? 'border-[#20251F] bg-[#20251F] text-[#F5F3EE]'
                : 'border-[#D5D5CC] bg-[#E8E7DF] text-[#686C63] hover:text-[#20251F]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Personal Info */}
      {activeSubTab === 'info' && (
        <div className="surface-card p-6 space-y-6">
          <h2 className="font-serif text-2xl text-[#20251F]">Contact Coordinates & Headline</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase text-[#686C63]">Full Name</label>
              <input
                className="input-editorial text-xs"
                value={formData.personalInfo.fullName}
                onChange={e => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, fullName: e.target.value } })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase text-[#686C63]">Target Role / Professional Headline</label>
              <input
                className="input-editorial text-xs"
                value={formData.personalInfo.title}
                onChange={e => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, title: e.target.value } })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase text-[#686C63]">Email Address</label>
              <input
                className="input-editorial text-xs"
                type="email"
                value={formData.personalInfo.email}
                onChange={e => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, email: e.target.value } })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase text-[#686C63]">Phone Number</label>
              <input
                className="input-editorial text-xs"
                value={formData.personalInfo.phone}
                onChange={e => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, phone: e.target.value } })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase text-[#686C63]">Location (City, State / Country)</label>
              <input
                className="input-editorial text-xs"
                value={formData.personalInfo.location}
                onChange={e => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, location: e.target.value } })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase text-[#686C63]">GitHub Profile URL</label>
              <input
                className="input-editorial text-xs"
                value={formData.personalInfo.github || ''}
                onChange={e => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, github: e.target.value } })}
              />
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-xs font-mono uppercase text-[#686C63]">Professional Summary</label>
            <textarea
              className="input-editorial text-xs min-h-[90px]"
              value={formData.personalInfo.summary}
              onChange={e => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, summary: e.target.value } })}
            />
          </div>
        </div>
      )}

      {/* Tab: Education */}
      {activeSubTab === 'education' && (
        <div className="surface-card p-6 space-y-6">
          <div className="flex items-baseline justify-between pb-3 border-b border-[#D5D5CC]">
            <h2 className="font-serif text-2xl text-[#20251F]">Formal Education</h2>
            <button
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  education: [
                    ...prev.education,
                    {
                      id: `edu_${Date.now()}`,
                      institution: 'University / College',
                      degree: 'Bachelor of Science',
                      fieldOfStudy: 'Computer Science',
                      startDate: '2022',
                      endDate: '2026',
                      confirmed: true
                    }
                  ]
                }));
              }}
              className="btn-editorial btn-editorial-outline text-xs px-3 py-1"
            >
              <Plus size={13} strokeWidth={1.5} /> Add Education
            </button>
          </div>

          <div className="space-y-4">
            {formData.education.map((edu, idx) => (
              <div key={edu.id} className="p-4 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-[#20251F]">Credential #{idx + 1}</span>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, education: prev.education.filter(e => e.id !== edu.id) }))}
                    className="text-[#D9534F] hover:underline"
                  >
                    Delete
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    className="input-editorial text-xs"
                    placeholder="Institution name"
                    value={edu.institution}
                    onChange={e => {
                      const next = [...formData.education];
                      next[idx].institution = e.target.value;
                      setFormData({ ...formData, education: next });
                    }}
                  />
                  <input
                    className="input-editorial text-xs"
                    placeholder="Degree & Major"
                    value={`${edu.degree} in ${edu.fieldOfStudy}`}
                    onChange={e => {
                      const next = [...formData.education];
                      next[idx].fieldOfStudy = e.target.value;
                      setFormData({ ...formData, education: next });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Skills */}
      {activeSubTab === 'skills' && (
        <div className="surface-card p-6 space-y-6">
          <h2 className="font-serif text-2xl text-[#20251F]">Technical & Professional Skills</h2>

          {/* Add skill control */}
          <div className="flex items-center gap-2 flex-wrap pb-4 border-b border-[#D5D5CC]">
            <input
              className="input-editorial text-xs max-w-xs"
              placeholder="e.g. Docker, GraphQL, Kubernetes"
              value={newSkillText}
              onChange={e => setNewSkillText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
            />
            <select
              className="input-editorial text-xs max-w-xs"
              value={newSkillCategory}
              onChange={e => setNewSkillCategory(e.target.value as any)}
            >
              <option value="technical">Languages</option>
              <option value="frameworks">Frameworks & Libraries</option>
              <option value="tools">Tools, Cloud & Databases</option>
              <option value="soft">Practices & Soft Skills</option>
            </select>
            <button onClick={handleAddSkill} className="btn-editorial btn-editorial-secondary text-xs px-3 py-2">
              <Plus size={13} strokeWidth={1.5} /> Add Skill
            </button>
          </div>

          <div className="space-y-4">
            {(['technical', 'frameworks', 'tools', 'soft'] as const).map(cat => {
              const labels = {
                technical: 'Languages',
                frameworks: 'Frameworks & Libraries',
                tools: 'Tools & Databases',
                soft: 'Practices & Soft Skills'
              };
              return (
                <div key={cat} className="space-y-2">
                  <div className="text-xs font-mono uppercase text-[#686C63] font-semibold">{labels[cat]}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.skills[cat].map(s => (
                      <span key={s} className="tag-mono text-xs bg-[#E8E7DF] text-[#20251F] flex items-center gap-1.5">
                        {s}
                        <button
                          onClick={() => handleRemoveSkill(cat, s)}
                          className="hover:text-[#D9534F]"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Projects */}
      {activeSubTab === 'projects' && (
        <div className="surface-card p-6 space-y-6">
          <div className="flex items-baseline justify-between pb-3 border-b border-[#D5D5CC]">
            <h2 className="font-serif text-2xl text-[#20251F]">Technical Projects</h2>
            <button
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  projects: [
                    ...prev.projects,
                    {
                      id: `proj_${Date.now()}`,
                      title: 'Project Title',
                      techStack: ['Python', 'SQL'],
                      description: 'Concise summary of implementation and architecture.',
                      bullets: ['Engineered core endpoints and schema.'],
                      confirmed: true
                    }
                  ]
                }));
              }}
              className="btn-editorial btn-editorial-outline text-xs px-3 py-1"
            >
              <Plus size={13} strokeWidth={1.5} /> Add Project
            </button>
          </div>

          <div className="space-y-4">
            {formData.projects.map((proj, idx) => (
              <div key={proj.id} className="p-4 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-[#20251F]">{proj.title}</span>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== proj.id) }))}
                    className="text-[#D9534F] hover:underline"
                  >
                    Delete
                  </button>
                </div>
                <input
                  className="input-editorial text-xs"
                  placeholder="Project name"
                  value={proj.title}
                  onChange={e => {
                    const next = [...formData.projects];
                    next[idx].title = e.target.value;
                    setFormData({ ...formData, projects: next });
                  }}
                />
                <input
                  className="input-editorial text-xs"
                  placeholder="Technologies (comma-separated)"
                  value={proj.techStack.join(', ')}
                  onChange={e => {
                    const next = [...formData.projects];
                    next[idx].techStack = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    setFormData({ ...formData, projects: next });
                  }}
                />
                <textarea
                  className="input-editorial text-xs"
                  placeholder="Project description and achievement bullet points..."
                  value={proj.bullets.join('\n')}
                  onChange={e => {
                    const next = [...formData.projects];
                    next[idx].bullets = e.target.value.split('\n').filter(Boolean);
                    setFormData({ ...formData, projects: next });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Experience */}
      {activeSubTab === 'experience' && (
        <div className="surface-card p-6 space-y-6">
          <div className="flex items-baseline justify-between pb-3 border-b border-[#D5D5CC]">
            <h2 className="font-serif text-2xl text-[#20251F]">Internships & Work Experience</h2>
            <button
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  experience: [
                    ...prev.experience,
                    {
                      id: `exp_${Date.now()}`,
                      company: 'Organization Name',
                      role: 'Software Engineering Intern',
                      location: 'Remote',
                      startDate: 'Jun 2025',
                      endDate: 'Aug 2025',
                      current: false,
                      bullets: ['Contributed to production codebases and automated test suites.'],
                      confirmed: true
                    }
                  ]
                }));
              }}
              className="btn-editorial btn-editorial-outline text-xs px-3 py-1"
            >
              <Plus size={13} strokeWidth={1.5} /> Add Experience
            </button>
          </div>

          <div className="space-y-4">
            {formData.experience.map((exp, idx) => (
              <div key={exp.id} className="p-4 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-[#20251F]">{exp.company} — {exp.role}</span>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, experience: prev.experience.filter(e => e.id !== exp.id) }))}
                    className="text-[#D9534F] hover:underline"
                  >
                    Delete
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    className="input-editorial text-xs"
                    placeholder="Company name"
                    value={exp.company}
                    onChange={e => {
                      const next = [...formData.experience];
                      next[idx].company = e.target.value;
                      setFormData({ ...formData, experience: next });
                    }}
                  />
                  <input
                    className="input-editorial text-xs"
                    placeholder="Role title"
                    value={exp.role}
                    onChange={e => {
                      const next = [...formData.experience];
                      next[idx].role = e.target.value;
                      setFormData({ ...formData, experience: next });
                    }}
                  />
                </div>
                <textarea
                  className="input-editorial text-xs"
                  placeholder="Bullets (one per line)..."
                  value={exp.bullets.join('\n')}
                  onChange={e => {
                    const next = [...formData.experience];
                    next[idx].bullets = e.target.value.split('\n').filter(Boolean);
                    setFormData({ ...formData, experience: next });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Parser / Document Upload (Option A) */}
      {activeSubTab === 'parser' && (
        <div className="surface-card p-6 space-y-6">
          <div className="pb-3 border-b border-[#D5D5CC]">
            <span className="section-num">Option A / Extraction Engine</span>
            <h2 className="font-serif text-2xl text-[#20251F] mt-1">
              Resume Document Parser & Review
            </h2>
            <p className="text-xs text-[#686C63] mt-1">
              Paste your resume text. The parser extracts fields with confidence indicators for user verification.
            </p>
          </div>

          <textarea
            className="input-editorial text-xs min-h-[180px] font-mono leading-relaxed"
            placeholder="Paste raw resume text here (PDF / DOCX text extract)..."
            value={pastedText}
            onChange={e => setPastedText(e.target.value)}
          />

          <div className="flex gap-3">
            <button
              onClick={handleParseText}
              disabled={isParsing}
              className="btn-editorial btn-editorial-primary text-xs px-5 py-2.5"
            >
              <Upload size={14} strokeWidth={1.5} />
              {isParsing ? 'Parsing Document...' : 'Extract Structured Profile'}
            </button>

            <button
              onClick={() => {
                setPastedText(`Jordan Lee
jordan.lee@polytechnic.edu | (555) 789-0123 | San Jose, CA
linkedin.com/in/jordanlee-dev | github.com/jordan-lee

EDUCATION
California State Polytechnic University
Bachelor of Science in Computer Science, 2022 - 2026
GPA: 3.84

TECHNICAL SKILLS
Languages: Python, TypeScript, SQL, Go
Frameworks: FastAPI, React, Node.js, Express
Tools: Docker, PostgreSQL, Redis, Linux, Git

PROJECTS
CloudMetrics Dashboard
- Built full-stack monitoring tool with React and FastAPI.
- Deployed containerized services with Docker.`);
              }}
              className="btn-editorial btn-editorial-outline text-xs px-4 py-2"
            >
              Load Sample Text
            </button>
          </div>
        </div>
      )}

      {/* Review & Correct Extraction Modal (FR-07) */}
      {showReviewModal && parsedResult && (
        <div className="fixed inset-0 z-50 bg-[#20251F]/70 flex items-center justify-center p-4">
          <div className="surface-card max-w-xl w-full p-6 space-y-5 bg-[#FFFFFF] max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-[#D5D5CC]">
              <div>
                <span className="section-num">Extraction Verification</span>
                <h3 className="font-serif text-2xl text-[#20251F]">Review & Correct Extracted Facts</h3>
                <div className="text-xs font-mono text-[#686C63]">
                  Confidence Rating: <strong>{parsedResult.confidenceScore}%</strong>
                </div>
              </div>

              <button onClick={() => setShowReviewModal(false)} className="text-[#686C63] hover:text-[#20251F] text-lg font-mono">
                ×
              </button>
            </div>

            {/* Field Flags */}
            <div className="space-y-2">
              {parsedResult.flags.map((flag, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-[2px] text-xs font-mono flex items-center gap-2 border ${
                    flag.needsReview
                      ? 'bg-[#E8E7DF] border-[#D9534F] text-[#20251F]'
                      : 'bg-[#F5F3EE] border-[#D5D5CC] text-[#20251F]'
                  }`}
                >
                  {flag.needsReview ? <AlertCircle size={14} strokeWidth={1.5} className="text-[#D9534F]" /> : <CheckCircle size={14} strokeWidth={1.5} className="text-[#20251F]" />}
                  <span>
                    <strong>{flag.field.toUpperCase()}:</strong> {flag.reason || `Extracted with ${Math.round(flag.confidence * 100)}% confidence`}
                  </span>
                </div>
              ))}
            </div>

            {/* Extracted preview */}
            <div className="p-3 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] text-xs space-y-1">
              <div><strong>Name:</strong> {parsedResult.extractedProfile.personalInfo.fullName}</div>
              <div><strong>Email:</strong> {parsedResult.extractedProfile.personalInfo.email}</div>
              <div><strong>Skills Found:</strong> {parsedResult.extractedProfile.skills.technical.join(', ')}</div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowReviewModal(false)}
                className="btn-editorial btn-editorial-outline text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptExtraction}
                className="btn-editorial btn-editorial-primary text-xs px-4 py-2"
              >
                Confirm & Apply to Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
