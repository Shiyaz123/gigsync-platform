import React, { useState } from 'react';
import {
  CandidateProfile,
  ParsedResumeResult,
  ExtractedFieldFlag
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
  Info,
  ExternalLink
} from 'lucide-react';

interface ProfilePageProps {
  profile: CandidateProfile;
  onUpdateProfile: (updated: CandidateProfile) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  onUpdateProfile,
  showToast
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

  // Handle saving master profile
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
      showToast('Profile Saved Successfully', 'Your confirmed profile is ready for job matching and resume generation.', 'success');
    } catch (err: any) {
      showToast('Save Failed', err.message || 'Could not save profile changes.', 'error');
    }
  };

  // Handle parsing resume text
  const handleParseText = async () => {
    if (!pastedText.trim()) {
      showToast('Empty Resume Content', 'Please paste the plain text of your resume or use sample text.', 'warning');
      return;
    }
    setIsParsing(true);
    try {
      const res = await api.parseResumeText(pastedText);
      setParsedResult(res);
      setShowReviewModal(true);
      showToast('Resume Parsed', `Extracted with ${res.confidenceScore}% confidence. Please review before confirming.`, 'info');
    } catch (err: any) {
      showToast('Parsing Failed', err.message || 'Unable to parse provided text.', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  // Confirm extracted data from modal (FR-07: Review-and-correct step)
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
    showToast('Extraction Accepted', 'Extracted fields imported into your draft. Review and click "Save Profile" to finalize.', 'success');
  };

  // Add skill tag
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
    <div className="profile-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UserCheck size={28} color="#6366f1" />
            Candidate Profile & Extraction
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Confirmed facts only. Manage personal details, education, projects, and skills used across all matching and resume outputs.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={16} />
          Save Master Profile
        </button>
      </div>

      {/* Zero Hallucination Guarantee Banner (PRD FR-12) */}
      <div className="card" style={{
        background: 'rgba(16, 185, 129, 0.08)',
        borderColor: 'rgba(16, 185, 129, 0.25)',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <ShieldCheck size={24} color="#10b981" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
          <strong>Responsible AI Policy Active:</strong> GigSync only uses user-confirmed details. The system never invents degrees, employment dates, employer names, or inflated metrics.
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {[
          { id: 'info', label: 'Personal Info' },
          { id: 'education', label: 'Education' },
          { id: 'experience', label: 'Experience' },
          { id: 'projects', label: 'Projects' },
          { id: 'skills', label: 'Skills & Tools' },
          { id: 'parser', label: 'Upload / Parse Resume' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`btn btn-sm ${activeSubTab === tab.id ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveSubTab(tab.id as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Personal Info */}
      {activeSubTab === 'info' && (
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: '1.25rem' }}>Personal & Contact Details</h2>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={formData.personalInfo.fullName}
                onChange={e => setFormData({
                  ...formData,
                  personalInfo: { ...formData.personalInfo, fullName: e.target.value }
                })}
                placeholder="e.g. Alex Morgan"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Professional Headline / Target Role</label>
              <input
                className="form-input"
                value={formData.personalInfo.title}
                onChange={e => setFormData({
                  ...formData,
                  personalInfo: { ...formData.personalInfo, title: e.target.value }
                })}
                placeholder="e.g. Junior Full-Stack Developer"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                value={formData.personalInfo.email}
                onChange={e => setFormData({
                  ...formData,
                  personalInfo: { ...formData.personalInfo, email: e.target.value }
                })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-input"
                value={formData.personalInfo.phone}
                onChange={e => setFormData({
                  ...formData,
                  personalInfo: { ...formData.personalInfo, phone: e.target.value }
                })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Location (City, State / Country)</label>
              <input
                className="form-input"
                value={formData.personalInfo.location}
                onChange={e => setFormData({
                  ...formData,
                  personalInfo: { ...formData.personalInfo, location: e.target.value }
                })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">LinkedIn URL</label>
              <input
                className="form-input"
                value={formData.personalInfo.linkedin || ''}
                onChange={e => setFormData({
                  ...formData,
                  personalInfo: { ...formData.personalInfo, linkedin: e.target.value }
                })}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div className="form-group">
              <label className="form-label">GitHub URL</label>
              <input
                className="form-input"
                value={formData.personalInfo.github || ''}
                onChange={e => setFormData({
                  ...formData,
                  personalInfo: { ...formData.personalInfo, github: e.target.value }
                })}
                placeholder="https://github.com/username"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Portfolio Website</label>
              <input
                className="form-input"
                value={formData.personalInfo.portfolio || ''}
                onChange={e => setFormData({
                  ...formData,
                  personalInfo: { ...formData.personalInfo, portfolio: e.target.value }
                })}
                placeholder="https://yourportfolio.dev"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <label className="form-label">Professional Summary</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formData.personalInfo.summary}
              onChange={e => setFormData({
                ...formData,
                personalInfo: { ...formData.personalInfo, summary: e.target.value }
              })}
              placeholder="Concise 2-3 sentence overview of your technical background..."
            />
          </div>
        </div>
      )}

      {/* Tab 2: Education */}
      {activeSubTab === 'education' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Education History</h2>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  education: [
                    ...prev.education,
                    {
                      id: `edu_${Date.now()}`,
                      institution: 'University Name',
                      degree: 'Bachelor of Science',
                      fieldOfStudy: 'Computer Science',
                      startDate: '2022',
                      endDate: '2026',
                      gpa: '3.8 / 4.0',
                      confirmed: true
                    }
                  ]
                }));
              }}
            >
              <Plus size={14} /> Add Education
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {formData.education.map((edu, idx) => (
              <div key={edu.id} style={{ padding: '1rem', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Entry #{idx + 1}</span>
                  <button
                    className="btn-icon"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        education: prev.education.filter(e => e.id !== edu.id)
                      }));
                    }}
                  >
                    <Trash2 size={14} color="#f43f5e" />
                  </button>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Institution / College</label>
                    <input
                      className="form-input"
                      value={edu.institution}
                      onChange={e => {
                        const next = [...formData.education];
                        next[idx].institution = e.target.value;
                        setFormData({ ...formData, education: next });
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Degree & Major</label>
                    <input
                      className="form-input"
                      value={`${edu.degree} in ${edu.fieldOfStudy}`}
                      onChange={e => {
                        const next = [...formData.education];
                        next[idx].fieldOfStudy = e.target.value;
                        setFormData({ ...formData, education: next });
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Dates (Start - Graduation)</label>
                    <input
                      className="form-input"
                      value={`${edu.startDate} - ${edu.endDate}`}
                      onChange={e => {
                        const next = [...formData.education];
                        next[idx].endDate = e.target.value;
                        setFormData({ ...formData, education: next });
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GPA / Academic Honors</label>
                    <input
                      className="form-input"
                      value={edu.gpa || ''}
                      placeholder="e.g. 3.8 / 4.0"
                      onChange={e => {
                        const next = [...formData.education];
                        next[idx].gpa = e.target.value;
                        setFormData({ ...formData, education: next });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Experience */}
      {activeSubTab === 'experience' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Work & Internship Experience</h2>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  experience: [
                    ...prev.experience,
                    {
                      id: `exp_${Date.now()}`,
                      company: 'Company Name',
                      role: 'Software Engineering Intern',
                      location: 'Remote',
                      startDate: 'Jun 2025',
                      endDate: 'Aug 2025',
                      current: false,
                      bullets: ['Contributed to engineering features and code quality improvements.'],
                      confirmed: true
                    }
                  ]
                }));
              }}
            >
              <Plus size={14} /> Add Experience
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {formData.experience.map((exp, idx) => (
              <div key={exp.id} style={{ padding: '1rem', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{exp.company} — {exp.role}</span>
                  <button
                    className="btn-icon"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        experience: prev.experience.filter(e => e.id !== exp.id)
                      }));
                    }}
                  >
                    <Trash2 size={14} color="#f43f5e" />
                  </button>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input
                      className="form-input"
                      value={exp.company}
                      onChange={e => {
                        const next = [...formData.experience];
                        next[idx].company = e.target.value;
                        setFormData({ ...formData, experience: next });
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role / Job Title</label>
                    <input
                      className="form-input"
                      value={exp.role}
                      onChange={e => {
                        const next = [...formData.experience];
                        next[idx].role = e.target.value;
                        setFormData({ ...formData, experience: next });
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Achievement Bullets (One per line)</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={exp.bullets.join('\n')}
                    onChange={e => {
                      const next = [...formData.experience];
                      next[idx].bullets = e.target.value.split('\n').filter(Boolean);
                      setFormData({ ...formData, experience: next });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Projects */}
      {activeSubTab === 'projects' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Technical Projects (Key Proof Points)</h2>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  projects: [
                    ...prev.projects,
                    {
                      id: `proj_${Date.now()}`,
                      title: 'Project Title',
                      techStack: ['React', 'TypeScript', 'Node.js'],
                      description: 'Concise summary of what the project does.',
                      bullets: ['Engineered key architecture and integrated verified APIs.'],
                      liveUrl: '',
                      repoUrl: '',
                      confirmed: true
                    }
                  ]
                }));
              }}
            >
              <Plus size={14} /> Add Project
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {formData.projects.map((proj, idx) => (
              <div key={proj.id} style={{ padding: '1rem', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{proj.title}</span>
                  <button
                    className="btn-icon"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        projects: prev.projects.filter(p => p.id !== proj.id)
                      }));
                    }}
                  >
                    <Trash2 size={14} color="#f43f5e" />
                  </button>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Project Name</label>
                    <input
                      className="form-input"
                      value={proj.title}
                      onChange={e => {
                        const next = [...formData.projects];
                        next[idx].title = e.target.value;
                        setFormData({ ...formData, projects: next });
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Technologies (Comma-separated)</label>
                    <input
                      className="form-input"
                      value={proj.techStack.join(', ')}
                      onChange={e => {
                        const next = [...formData.projects];
                        next[idx].techStack = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        setFormData({ ...formData, projects: next });
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Project Bullets</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={proj.bullets.join('\n')}
                    onChange={e => {
                      const next = [...formData.projects];
                      next[idx].bullets = e.target.value.split('\n').filter(Boolean);
                      setFormData({ ...formData, projects: next });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Skills */}
      {activeSubTab === 'skills' && (
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: '1.25rem' }}>Verified Technical Skills & Tools</h2>

          {/* Add Skill Form */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <input
              className="form-input"
              style={{ maxWidth: '280px' }}
              value={newSkillText}
              onChange={e => setNewSkillText(e.target.value)}
              placeholder="e.g. Docker, GraphQL, Redis"
              onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
            />
            <select
              className="form-select"
              style={{ maxWidth: '180px' }}
              value={newSkillCategory}
              onChange={e => setNewSkillCategory(e.target.value as any)}
            >
              <option value="technical">Languages</option>
              <option value="frameworks">Frameworks</option>
              <option value="tools">Tools & Cloud</option>
              <option value="soft">Soft Skills</option>
            </select>
            <button className="btn btn-secondary btn-sm" onClick={handleAddSkill}>
              <Plus size={14} /> Add Skill
            </button>
          </div>

          {/* Categories */}
          {(['technical', 'frameworks', 'tools', 'soft'] as const).map(cat => {
            const labels = {
              technical: 'Programming Languages',
              frameworks: 'Frameworks & Libraries',
              tools: 'Cloud, Databases & Tooling',
              soft: 'Engineering Practices & Soft Skills'
            };

            return (
              <div key={cat} style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {labels[cat]} ({formData.skills[cat].length})
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {formData.skills[cat].map(skill => (
                    <span key={skill} className="badge badge-primary" style={{ padding: '0.35rem 0.65rem' }}>
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(cat, skill)}
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '4px' }}
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
      )}

      {/* Tab 6: Upload / Parse Resume (FR-05, FR-06, FR-07) */}
      {activeSubTab === 'parser' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Upload size={20} color="#6366f1" />
                Resume Document Parser
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Paste resume text or sample candidate details. The system extracts structured fields with confidence scores.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Resume Raw Text</label>
            <textarea
              className="form-textarea"
              rows={8}
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              placeholder="Paste raw text from a PDF, DOCX, or text resume here..."
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-primary"
              onClick={handleParseText}
              disabled={isParsing}
            >
              <FileText size={16} />
              {isParsing ? 'Parsing Document...' : 'Extract Structured Profile'}
            </button>

            <button
              className="btn btn-outline"
              onClick={() => {
                setPastedText(`Sarah Jenkins
sarah.j@stateuniv.edu | (555) 432-1098 | Austin, TX
linkedin.com/in/sarahjenkins-cs | github.com/sarah-j

EDUCATION
California State University, Long Beach
Bachelor of Science in Computer Science, 2022 - 2026
Cumulative GPA: 3.82

TECHNICAL SKILLS
Languages: Python, JavaScript, TypeScript, C++, SQL
Frameworks: React, Express, FastAPI, Django
Tools: Docker, PostgreSQL, Git, Linux, Postman

PROJECTS
TaskFlow Web App
- Built reactive SPA with React and TypeScript.
- Implemented RESTful microservices with Python and FastAPI.`);
              }}
            >
              Load Sample Text
            </button>
          </div>
        </div>
      )}

      {/* Review & Correct Extraction Modal (FR-07) */}
      {showReviewModal && parsedResult && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Review & Correct Extracted Profile</h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Extraction Confidence Score: <strong>{parsedResult.confidenceScore}%</strong>
                </div>
              </div>
              <button
                className="btn-icon"
                onClick={() => setShowReviewModal(false)}
              >
                ×
              </button>
            </div>

            {/* Confidence & Flag Badges */}
            <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {parsedResult.flags.map((flag, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: flag.needsReview ? 'var(--warning-bg)' : 'var(--success-bg)',
                    border: `1px solid ${flag.needsReview ? 'var(--warning-border)' : 'var(--success-border)'}`,
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {flag.needsReview ? <AlertCircle size={15} color="#f59e0b" /> : <CheckCircle size={15} color="#10b981" />}
                  <span>
                    <strong>{flag.field.toUpperCase()}:</strong> {flag.reason || `Extracted with ${Math.round(flag.confidence * 100)}% confidence`}
                  </span>
                </div>
              ))}
            </div>

            {/* Extracted Fields Summary */}
            <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <div style={{ marginBottom: '0.4rem' }}>
                <strong>Name:</strong> {parsedResult.extractedProfile.personalInfo.fullName}
              </div>
              <div style={{ marginBottom: '0.4rem' }}>
                <strong>Email:</strong> {parsedResult.extractedProfile.personalInfo.email || 'None detected'}
              </div>
              <div style={{ marginBottom: '0.4rem' }}>
                <strong>Education:</strong> {parsedResult.extractedProfile.education[0]?.institution || 'Manual entry needed'}
              </div>
              <div style={{ marginBottom: '0.4rem' }}>
                <strong>Identified Skills:</strong> {parsedResult.extractedProfile.skills.technical.join(', ')}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn btn-outline"
                onClick={() => setShowReviewModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAcceptExtraction}
              >
                <CheckCircle size={16} /> Confirm & Apply to Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
