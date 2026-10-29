import React, { useState, useEffect } from 'react';
import {
  CandidateProfile,
  JobListing,
  ResumeVersion
} from '../types';
import { api } from '../services/api';
import {
  FileText,
  Download,
  Copy,
  Printer,
  Sparkles,
  Save,
  Check,
  Code,
  Eye,
  History,
  Layers,
  ShieldCheck,
  Target
} from 'lucide-react';

interface ResumeStudioPageProps {
  profile: CandidateProfile;
  jobs: JobListing[];
  targetJobId?: string;
  showToast: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const ResumeStudioPage: React.FC<ResumeStudioPageProps> = ({
  profile,
  jobs,
  targetJobId,
  showToast
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'academic' | 'executive' | 'minimalist'>('modern');
  const [viewMode, setViewMode] = useState<'preview' | 'latex' | 'versions'>('preview');
  const [selectedJobId, setSelectedJobId] = useState<string>(targetJobId || '');
  const [latexSource, setLatexSource] = useState<string>('');
  const [isLoadingLatex, setIsLoadingLatex] = useState(false);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [versionTitle, setVersionTitle] = useState('');
  const [copied, setCopied] = useState(false);

  // Fetch LaTeX when template changes
  useEffect(() => {
    loadLatex();
    loadVersions();
  }, [selectedTemplate, profile]);

  const loadLatex = async () => {
    setIsLoadingLatex(true);
    try {
      const res = await api.generateLatex(selectedTemplate, profile);
      setLatexSource(res.latexSource);
    } catch (err: any) {
      console.error('Failed to generate LaTeX:', err);
    } finally {
      setIsLoadingLatex(false);
    }
  };

  const loadVersions = async () => {
    try {
      const res = await api.getResumeVersions();
      setVersions(res);
    } catch (err) {
      console.error('Failed to load resume versions:', err);
    }
  };

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(latexSource);
    setCopied(true);
    showToast('LaTeX Code Copied', 'LaTeX source copied to your clipboard. Ready for Overleaf or local compilation.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTex = () => {
    const blob = new Blob([latexSource], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume_${profile.personalInfo.fullName.replace(/\s+/g, '_')}_${selectedTemplate}.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded .tex File', 'Compilable LaTeX source file saved.', 'success');
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleSaveVersion = async () => {
    const title = versionTitle.trim() || `${selectedTemplate.toUpperCase()} - ${new Date().toLocaleDateString()}`;
    try {
      const saved = await api.saveResumeVersion({
        title,
        templateId: selectedTemplate,
        targetJobId: selectedJobId || undefined,
        structuredContent: profile
      });
      setVersions([saved, ...versions]);
      setVersionTitle('');
      showToast('Resume Version Saved', `Saved as "${title}" in version history.`, 'success');
    } catch (err: any) {
      showToast('Save Failed', err.message || 'Could not save version.', 'error');
    }
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <div className="resume-studio-page">
      {/* Studio Header Toolbar */}
      <div className="no-print" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={28} color="#6366f1" />
            Resume Studio & LaTeX Compiler
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Multi-template visual rendering, injection-safe LaTeX source code, and clean PDF export.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handlePrintPdf}>
            <Printer size={16} /> Print / Export PDF
          </button>
          <button className="btn btn-secondary" onClick={handleDownloadTex}>
            <Download size={16} /> Download .tex
          </button>
          <button className="btn btn-outline" onClick={handleCopyLatex}>
            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy LaTeX'}
          </button>
        </div>
      </div>

      {/* Control Bar: View Switcher & Template Selector */}
      <div className="card no-print" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* View Mode Buttons */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              className={`btn btn-sm ${viewMode === 'preview' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('preview')}
            >
              <Eye size={14} /> Visual Preview
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'latex' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('latex')}
            >
              <Code size={14} /> LaTeX Source Code
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'versions' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setViewMode('versions')}
            >
              <History size={14} /> Version History ({versions.length})
            </button>
          </div>

          {/* Template Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Template:</span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {[
                { id: 'modern', label: 'Modern Tech' },
                { id: 'academic', label: 'Classic Academic' },
                { id: 'executive', label: 'Executive' },
                { id: 'minimalist', label: 'Minimalist' }
              ].map(t => (
                <button
                  key={t.id}
                  className={`btn btn-sm ${selectedTemplate === t.id ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setSelectedTemplate(t.id as any)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Targeted Tailoring Bar */}
        <div style={{
          marginTop: '1rem',
          paddingTop: '0.85rem',
          borderTop: '1px solid var(--border-card)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#818cf8', fontSize: '0.85rem', fontWeight: 600 }}>
            <Target size={16} />
            Tailor to Job:
          </div>
          <select
            className="form-select"
            style={{ maxWidth: '340px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
          >
            <option value="">General Master Resume (No target job)</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.title} @ {j.company} ({j.matchScore || 80}% match)
              </option>
            ))}
          </select>

          {selectedJob && (
            <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>
              Targeting: {selectedJob.title}
            </span>
          )}

          {/* Save Version input */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              className="form-input"
              style={{ width: '220px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
              placeholder="Version name (e.g. Veloce Tailored)"
              value={versionTitle}
              onChange={e => setVersionTitle(e.target.value)}
            />
            <button className="btn btn-secondary btn-sm" onClick={handleSaveVersion}>
              <Save size={14} /> Save Version
            </button>
          </div>
        </div>
      </div>

      {/* View Mode 1: Visual Document Preview */}
      {viewMode === 'preview' && (
        <div style={{ background: 'var(--bg-elevated)', padding: '2rem 1rem', borderRadius: 'var(--radius-lg)' }}>
          <div className={`resume-preview-sheet ${selectedTemplate}`}>
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #2563eb', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {profile.personalInfo.fullName || 'Candidate Name'}
              </h1>
              <div style={{ fontSize: '1rem', color: '#4b5563', fontWeight: 600, marginTop: '2px' }}>
                {profile.personalInfo.title || 'Software Engineer'}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '4px', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span>{profile.personalInfo.location}</span>
                <span>•</span>
                <span>{profile.personalInfo.email}</span>
                <span>•</span>
                <span>{profile.personalInfo.phone}</span>
                {profile.personalInfo.github && <span>• GitHub</span>}
                {profile.personalInfo.linkedin && <span>• LinkedIn</span>}
              </div>
            </div>

            {/* Summary */}
            {profile.personalInfo.summary && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                  Professional Summary
                </h2>
                <p style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.5 }}>
                  {profile.personalInfo.summary}
                </p>
              </div>
            )}

            {/* Technical Skills */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                Technical Qualifications
              </h2>
              <div style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.6 }}>
                <div><strong>Languages:</strong> {profile.skills.technical.join(', ')}</div>
                <div><strong>Frameworks & Libraries:</strong> {profile.skills.frameworks.join(', ')}</div>
                <div><strong>Developer Tooling & Cloud:</strong> {profile.skills.tools.join(', ')}</div>
              </div>
            </div>

            {/* Education */}
            {profile.education.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                  Education
                </h2>
                {profile.education.map(edu => (
                  <div key={edu.id} style={{ marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.92rem' }}>
                      <span>{edu.institution}</span>
                      <span>{edu.startDate} – {edu.endDate}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#4b5563', fontStyle: 'italic' }}>
                      <span>{edu.degree} in {edu.fieldOfStudy}</span>
                      {edu.gpa && <span>GPA: {edu.gpa}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Experience */}
            {profile.experience.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                  Experience
                </h2>
                {profile.experience.map(exp => (
                  <div key={exp.id} style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.92rem' }}>
                      <span>{exp.company}</span>
                      <span>{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                    </div>
                    <div style={{ fontSize: '0.86rem', color: '#4b5563', fontStyle: 'italic', marginBottom: '4px' }}>
                      {exp.role} • {exp.location}
                    </div>
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#374151', lineHeight: 1.5 }}>
                      {exp.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {profile.projects.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                  Technical Projects
                </h2>
                {profile.projects.map(proj => (
                  <div key={proj.id} style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.92rem' }}>
                      <span>{proj.title}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#4b5563' }}>
                        {proj.techStack.join(' | ')}
                      </span>
                    </div>
                    {proj.description && (
                      <div style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '3px' }}>
                        {proj.description}
                      </div>
                    )}
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#374151', lineHeight: 1.5 }}>
                      {proj.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Mode 2: LaTeX Source Code */}
      {viewMode === 'latex' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Code size={18} color="#6366f1" />
                Compilable LaTeX Source Code ({selectedTemplate}.tex)
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Injection-safe output. All special characters escaped. Ready for pdflatex or Overleaf.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline btn-sm" onClick={handleCopyLatex}>
                <Copy size={14} /> Copy Source
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleDownloadTex}>
                <Download size={14} /> Download .tex
              </button>
            </div>
          </div>

          <pre className="code-container">
            <code>{latexSource}</code>
          </pre>
        </div>
      )}

      {/* View Mode 3: Version History */}
      {viewMode === 'versions' && (
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: '1.25rem' }}>Saved Resume Versions</h2>
          {versions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No previous versions saved yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {versions.map(v => (
                <div
                  key={v.id}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{v.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Template: {v.templateId.toUpperCase()} • Saved: {new Date(v.createdAt).toLocaleDateString()}
                      {v.targetJobTitle && ` • Target: ${v.targetJobTitle}`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setSelectedTemplate(v.templateId);
                        setViewMode('preview');
                        showToast('Version Loaded', `Loaded "${v.title}".`, 'info');
                      }}
                    >
                      <Eye size={14} /> Preview
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
