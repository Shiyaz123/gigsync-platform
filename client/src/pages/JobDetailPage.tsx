import React, { useState, useEffect } from 'react';
import {
  JobListing,
  JobMatchResult,
  CandidateProfile
} from '../types';
import { api } from '../services/api';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  ShieldCheck,
  Compass,
  FileText,
  ExternalLink,
  MapPin,
  Sparkles,
  BookOpen,
  DollarSign,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';

interface JobDetailPageProps {
  jobId: string;
  profile: CandidateProfile;
  onBack: () => void;
  onNavigateToRoadmap: (jobId: string, roleTitle: string, missingSkills: string[]) => void;
  onNavigateToResume: (jobId: string) => void;
  isSaved: boolean;
  onToggleSave: (jobId: string) => void;
}

export const JobDetailPage: React.FC<JobDetailPageProps> = ({
  jobId,
  profile,
  onBack,
  onNavigateToRoadmap,
  onNavigateToResume,
  isSaved,
  onToggleSave
}) => {
  const [job, setJob] = useState<JobListing | null>(null);
  const [match, setMatch] = useState<JobMatchResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobMatch();
  }, [jobId]);

  const loadJobMatch = async () => {
    setLoading(true);
    try {
      const data = await api.getJobById(jobId);
      setJob(data.job);
      setMatch(data.match);
    } catch (err) {
      console.error('Failed to load job match:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !job || !match) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <Sparkles size={36} color="#6366f1" style={{ animation: 'spin 2s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Analyzing job description against your confirmed profile...</p>
      </div>
    );
  }

  const allMissingSkillNames = [
    ...match.missingEssentialSkills.map(s => s.skill),
    ...match.missingPreferredSkills.map(s => s.skill)
  ];

  return (
    <div className="job-detail-page">
      {/* Back button */}
      <button className="btn btn-outline btn-sm" onClick={onBack} style={{ marginBottom: '1.25rem' }}>
        <ArrowLeft size={16} /> Back to Job Discovery
      </button>

      {/* Hero Header Card */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{job.title}</h1>
              {job.verified && (
                <span className="badge badge-success">
                  <ShieldCheck size={14} /> Verified Source
                </span>
              )}
            </div>

            <div style={{ fontSize: '1.05rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{job.company}</span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <MapPin size={16} /> {job.location}
              </span>
              <span>•</span>
              <span className="badge badge-primary">{job.workMode}</span>
              <span className="badge" style={{ background: 'var(--bg-elevated)' }}>{job.experienceLevel}</span>
              {job.salaryRange && (
                <>
                  <span>•</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>{job.salaryRange}</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={() => onToggleSave(job.id)}
            >
              {isSaved ? <BookmarkCheck size={16} color="#10b981" /> : <Bookmark size={16} />}
              {isSaved ? 'Saved' : 'Save Job'}
            </button>

            <a
              href={job.applyUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              Apply on {job.source} <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Match Relevance & Score Breakdown */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(16, 185, 129, 0.08) 100%)',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        marginBottom: '2rem',
        padding: '1.75rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Sparkles size={20} color="#818cf8" />
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Explainable Relevance Analysis</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '650px' }}>
              {match.explanation}
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#10b981', lineHeight: 1 }}>
              {match.overallScore}%
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
              Overall Relevance Index
            </div>
          </div>
        </div>

        {/* Sub-scores grid */}
        <div className="grid-4" style={{ marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-card)' }}>
          <div style={{ background: 'var(--bg-glass)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Skills Overlap (50%)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{match.scoreBreakdown.skillsScore}%</div>
          </div>
          <div style={{ background: 'var(--bg-glass)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Experience & Projects (25%)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{match.scoreBreakdown.experienceScore}%</div>
          </div>
          <div style={{ background: 'var(--bg-glass)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Education Alignment (15%)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{match.scoreBreakdown.educationScore}%</div>
          </div>
          <div style={{ background: 'var(--bg-glass)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Role Similarity (10%)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>{match.scoreBreakdown.roleSimilarityScore}%</div>
          </div>
        </div>

        {/* Responsible AI Disclaimer (PRD FR-17) */}
        <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ShieldAlert size={14} />
          {match.disclaimer}
        </div>
      </div>

      {/* Grid: Matched Skills vs Missing Skills Gaps */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Matched Skills with Evidence (PRD Section 7.2) */}
        <div className="card">
          <h2 className="card-title" style={{ color: '#10b981', marginBottom: '1rem' }}>
            <CheckCircle2 size={20} />
            Matched Skills ({match.matchedSkills.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {match.matchedSkills.map(m => (
              <div
                key={m.skill}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-card)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{m.skill}</span>
                  <span className={`badge ${m.category === 'essential' ? 'badge-success' : 'badge-primary'}`}>
                    {m.category.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <strong>Evidence:</strong> {m.evidence}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Missing Skills Gap Analysis (PRD FR-18) */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ color: '#f59e0b' }}>
              <AlertTriangle size={20} />
              Identified Skill Gaps ({match.missingEssentialSkills.length + match.missingPreferredSkills.length})
            </h2>
            {allMissingSkillNames.length > 0 && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onNavigateToRoadmap(job.id, job.title, allMissingSkillNames)}
              >
                <Compass size={14} /> Bridge Gaps in Roadmap
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {match.missingEssentialSkills.map(m => (
              <div
                key={m.skill}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--warning-bg)',
                  border: '1px solid var(--warning-border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fbbf24' }}>{m.skill}</span>
                  <span className="badge badge-warning">MANDATORY GAP</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  {m.whyItMatters}
                </div>
              </div>
            ))}

            {match.missingPreferredSkills.map(m => (
              <div
                key={m.skill}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-card)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{m.skill}</span>
                  <span className="badge" style={{ background: 'var(--bg-card)' }}>PREFERRED GAP</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {m.whyItMatters}
                </div>
              </div>
            ))}

            {match.missingEssentialSkills.length === 0 && match.missingPreferredSkills.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#10b981' }}>
                <CheckCircle2 size={32} style={{ margin: '0 auto 0.5rem' }} />
                <p>No missing skill gaps detected! Your profile covers all stated requirements.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hard Constraints & Eligibility (PRD FR-19: Separated from learnable skills) */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 className="card-title" style={{ marginBottom: '0.5rem' }}>
          <ShieldAlert size={20} color="#f43f5e" />
          Hard Constraints & Eligibility Requirements
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Stated legal, degree, or physical presence conditions. These cannot be resolved by taking an online course.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {match.hardConstraints.map((c, i) => (
            <div
              key={i}
              style={{
                padding: '0.85rem 1rem',
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
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{c.constraint}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {c.note}
                </div>
              </div>
              <span className={`badge ${
                c.status === 'satisfied' ? 'badge-success' :
                c.status === 'unmet' ? 'badge-danger' : 'badge-warning'
              }`}>
                {c.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tailoring & Job Description */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Full Job Description & Role Context</h2>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onNavigateToResume(job.id)}
          >
            <FileText size={14} /> Tailor Resume for this Role
          </button>
        </div>
        <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
          {job.description}
        </div>
      </div>
    </div>
  );
};
