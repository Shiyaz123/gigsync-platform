import React, { useState, useEffect } from 'react';
import { CandidateProfile, JobListing, ResumeVersion } from '../types';
import { api } from '../services/api';
import { ResumeTemplateRenderer } from '../components/templates/ResumeTemplateRenderer';
import {
  FileText,
  Download,
  Copy,
  Printer,
  Save,
  Check,
  Code,
  Eye,
  History,
  Target,
  ShieldCheck,
  Briefcase,
  ArrowRight
} from 'lucide-react';

interface ResumeStudioPageProps {
  profile: CandidateProfile;
  jobs: JobListing[];
  targetJobId?: string;
  showToast: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  onNavigate?: (tab: string, context?: any) => void;
}

export const ResumeStudioPage: React.FC<ResumeStudioPageProps> = ({
  profile,
  jobs,
  targetJobId,
  showToast,
  onNavigate
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'academic' | 'executive' | 'minimalist'>('modern');
  const [viewMode, setViewMode] = useState<'preview' | 'latex' | 'versions'>('preview');
  const [selectedJobId, setSelectedJobId] = useState<string>(targetJobId || '');
  const [latexSource, setLatexSource] = useState<string>('');
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [versionTitle, setVersionTitle] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadLatex();
    loadVersions();
  }, [selectedTemplate, profile]);

  const loadLatex = async () => {
    try {
      const res = await api.generateLatex(selectedTemplate, profile);
      setLatexSource(res.latexSource);
    } catch (err: any) {
      console.error('Failed to generate LaTeX:', err);
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
    showToast('LaTeX Source Copied', 'Compilable code copied. Ready for Overleaf or local compilation.', 'success');
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
    const title = versionTitle.trim() || `${selectedTemplate.toUpperCase()} Version - ${new Date().toLocaleDateString()}`;
    try {
      const saved = await api.saveResumeVersion({
        title,
        templateId: selectedTemplate,
        targetJobId: selectedJobId || undefined,
        structuredContent: profile
      });
      setVersions([saved, ...versions]);
      setVersionTitle('');
      showToast('Version Saved', `Saved "${title}" in history.`, 'success');
    } catch (err: any) {
      showToast('Save Failed', err.message || 'Could not save version.', 'error');
    }
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <div className="resume-studio-page space-y-6 pb-16">
      {/* Studio Toolbar Header */}
      <div className="pb-4 border-b border-[#D5D5CC] flex items-baseline justify-between flex-wrap gap-4 no-print">
        <div>
          <span className="section-num">Workflow Step 02 / Studio</span>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#20251F] mt-1">
            Resume Studio & LaTeX Compiler
          </h1>
          <p className="text-sm text-[#686C63] mt-1">
            Production-grade typography, injection-safe LaTeX code generation, and clean PDF export.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {onNavigate && (
            <button
              onClick={() => onNavigate('jobs')}
              className="btn-editorial btn-editorial-primary text-xs px-4 py-2 font-semibold flex items-center gap-2 shadow-sm"
            >
              <Briefcase size={14} strokeWidth={1.5} />
              <span>Find Jobs for Me</span>
              <ArrowRight size={14} strokeWidth={2} />
            </button>
          )}
          <button onClick={handlePrintPdf} className="btn-editorial btn-editorial-secondary text-xs px-3.5 py-2">
            <Printer size={14} strokeWidth={1.5} /> Print / Export PDF
          </button>
          <button onClick={handleDownloadTex} className="btn-editorial btn-editorial-outline text-xs px-3.5 py-2">
            <Download size={14} strokeWidth={1.5} /> Download .tex
          </button>
          <button onClick={handleCopyLatex} className="btn-editorial btn-editorial-outline text-xs px-3.5 py-2">
            {copied ? <Check size={14} strokeWidth={2} className="text-[#20251F]" /> : <Copy size={14} strokeWidth={1.5} />}
            <span>{copied ? 'Copied' : 'Copy LaTeX'}</span>
          </button>
        </div>
      </div>

      {/* Control Surface: Mode & Template Switcher */}
      <div className="surface-card p-4 space-y-4 no-print">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* View Modes */}
          <div className="flex items-center gap-1">
            {[
              { id: 'preview', label: 'Visual Preview', icon: Eye },
              { id: 'latex', label: 'LaTeX Source', icon: Code },
              { id: 'versions', label: `Versions (${versions.length})`, icon: History }
            ].map(m => {
              const Icon = m.icon;
              const active = viewMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setViewMode(m.id as any)}
                  className={`btn-editorial text-xs px-3 py-1.5 ${
                    active ? 'btn-editorial-dark' : 'btn-editorial-outline'
                  }`}
                >
                  <Icon size={13} strokeWidth={1.5} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Template Selector */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#686C63] uppercase font-semibold">Template:</span>
            <div className="flex items-center gap-1">
              {[
                { id: 'modern', label: 'Modern Tech' },
                { id: 'academic', label: 'Classic Academic' },
                { id: 'executive', label: 'Executive' },
                { id: 'minimalist', label: 'Minimalist' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id as any)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-[2px] transition-colors border ${
                    selectedTemplate === t.id
                      ? 'border-[#D9534F] bg-[#E8E7DF] text-[#D9534F] font-bold'
                      : 'border-[#D5D5CC] bg-[#FFFFFF] text-[#686C63] hover:text-[#20251F]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Targeted Tailoring Sub-Bar */}
        <div className="pt-3 border-t border-[#D5D5CC] flex items-center justify-between flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[#686C63] uppercase flex items-center gap-1 font-semibold">
              <Target size={13} strokeWidth={1.5} className="text-[#D9534F]" /> Target Job:
            </span>
            <select
              className="input-editorial text-xs max-w-sm py-1"
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
            >
              <option value="">Master Resume (General software roles)</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} @ {j.company} ({j.matchScore || 80}% match)
                </option>
              ))}
            </select>

            {selectedJob && (
              <span className="tag-mono tag-accent">
                Targeting: {selectedJob.title}
              </span>
            )}
          </div>

          {/* Save Version Name */}
          <div className="flex items-center gap-2">
            <input
              className="input-editorial text-xs py-1 w-44"
              placeholder="Version title..."
              value={versionTitle}
              onChange={e => setVersionTitle(e.target.value)}
            />
            <button onClick={handleSaveVersion} className="btn-editorial btn-editorial-secondary text-xs py-1 px-2.5">
              <Save size={13} strokeWidth={1.5} /> Save
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: Printable Document Sheet Preview */}
      {viewMode === 'preview' && (
        <div className="p-4 sm:p-10 bg-[#E8E7DF] border border-[#D5D5CC] rounded-[3px] flex justify-center print:p-0 print:m-0 print:bg-transparent print:border-none">
          <ResumeTemplateRenderer
            templateId={selectedTemplate}
            profile={profile}
            className="w-full flex justify-center"
          />
        </div>
      )}

      {/* Mode 2: LaTeX Source Code */}
      {viewMode === 'latex' && (
        <div className="surface-card p-6 space-y-4">
          <div className="flex items-baseline justify-between pb-3 border-b border-[#D5D5CC]">
            <div>
              <h2 className="font-serif text-2xl text-[#20251F]">
                Compilable LaTeX Source ({selectedTemplate}.tex)
              </h2>
              <p className="text-xs text-[#686C63] mt-0.5">
                Injection-safe character escaping applied. Validated for standard pdflatex or Overleaf compilers.
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={handleCopyLatex} className="btn-editorial btn-editorial-outline text-xs px-3 py-1.5">
                <Copy size={13} strokeWidth={1.5} /> Copy Code
              </button>
              <button onClick={handleDownloadTex} className="btn-editorial btn-editorial-primary text-xs px-3 py-1.5">
                <Download size={13} strokeWidth={1.5} /> Download .tex
              </button>
            </div>
          </div>

          <pre className="p-4 bg-[#20251F] text-[#F5F3EE] font-mono text-xs rounded-[2px] overflow-x-auto max-h-[500px] leading-relaxed">
            <code>{latexSource}</code>
          </pre>
        </div>
      )}

      {/* Mode 3: Version History */}
      {viewMode === 'versions' && (
        <div className="surface-card p-6 space-y-4">
          <div className="pb-3 border-b border-[#D5D5CC]">
            <h2 className="font-serif text-2xl text-[#20251F]">
              Saved Resume Versions ({versions.length})
            </h2>
            <p className="text-xs text-[#686C63] mt-0.5">
              Review and restore previous tailored resumes without affecting your confirmed master profile.
            </p>
          </div>

          {versions.length === 0 ? (
            <div className="text-xs text-[#686C63] text-center py-8">
              No saved resume versions yet. Click "Save" above to bookmark current configurations.
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map(v => (
                <div key={v.id} className="p-4 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] flex items-center justify-between">
                  <div>
                    <div className="font-serif text-lg text-[#20251F]">{v.title}</div>
                    <div className="text-xs font-mono text-[#686C63]">
                      Template: {v.templateId.toUpperCase()} • Saved: {new Date(v.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTemplate(v.templateId);
                      setViewMode('preview');
                      showToast('Version Loaded', `Loaded "${v.title}".`, 'info');
                    }}
                    className="btn-editorial btn-editorial-outline text-xs px-3 py-1.5"
                  >
                    Inspect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
