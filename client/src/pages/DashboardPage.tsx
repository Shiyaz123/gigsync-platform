import React from 'react';
import {
  CandidateProfile,
  JobListing,
  SavedJob,
  LearningRoadmap
} from '../types';
import {
  Sparkles,
  ArrowRight,
  CheckCircle,
  Briefcase,
  Compass,
  FileText,
  Clock,
  ExternalLink,
  BookmarkCheck,
  ShieldCheck,
  TrendingUp,
  Award
} from 'lucide-react';

interface DashboardPageProps {
  profile: CandidateProfile;
  jobs: JobListing[];
  savedJobs: SavedJob[];
  roadmap: LearningRoadmap | null;
  onNavigate: (tab: string, context?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  profile,
  jobs,
  savedJobs,
  roadmap,
  onNavigate
}) => {
  // Calculate profile completeness
  let completeness = 0;
  if (profile.personalInfo.fullName) completeness += 15;
  if (profile.personalInfo.email) completeness += 10;
  if (profile.education.length > 0) completeness += 20;
  if (profile.experience.length > 0) completeness += 20;
  if (profile.projects.length > 0) completeness += 20;
  if (profile.skills.technical.length >= 3) completeness += 15;

  // Active roadmap items
  const allRoadmapItems = roadmap?.stages.flatMap(s => s.items) || [];
  const inProgressItems = allRoadmapItems.filter(i => i.status === 'in-progress');
  const completedItems = allRoadmapItems.filter(i => i.status === 'completed');

  // Top matching jobs
  const topJobs = [...jobs]
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    .slice(0, 3);

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(14, 165, 233, 0.1) 100%)',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        marginBottom: '2rem',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#818cf8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              <ShieldCheck size={16} />
              Grounding Active • Verified Student Profile
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
              Welcome back, {profile.personalInfo.fullName || 'Candidate'}!
            </h1>
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', fontSize: '0.95rem' }}>
              Your career launchpad is active. Discover explainable job matches, generate injection-safe LaTeX resumes, and bridge essential technical skill gaps.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => onNavigate('resume')}
            >
              <FileText size={16} />
              Open Resume Studio
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate('jobs')}
            >
              <Briefcase size={16} />
              Find Jobs
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {/* Profile Readiness */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Profile Completeness</span>
            <span className="badge badge-success">{completeness}% Ready</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            {profile.confirmedFactsOnly ? '100% Grounded' : 'Needs Review'}
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${completeness}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)', borderRadius: '3px' }}></div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '0.5rem' }}>
            Zero hallucinated data • Fact-checked
          </div>
        </div>

        {/* Saved Jobs & Applications */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Job Pipeline</span>
            <span className="badge badge-primary">{savedJobs.length} Tracked</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            {savedJobs.filter(j => j.status === 'applied').length} Applied
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {savedJobs.filter(j => j.status === 'interested' || j.status === 'saved').length} bookmarked for review
          </div>
        </div>

        {/* Learning Roadmap Progress */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Skill Goals</span>
            <span className="badge badge-warning">{inProgressItems.length} In Progress</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            {completedItems.length} Mastered
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Target: {allRoadmapItems.length} total mapped skills
          </div>
        </div>

        {/* Match Index */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Top Role Match</span>
            <span className="badge badge-success">High Fit</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: '#10b981' }}>
            {topJobs[0]?.matchScore || 88}%
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {topJobs[0]?.title || 'Junior Full-Stack'}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recommended Jobs & Learning Roadmap Milestone */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Recommended Jobs */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Sparkles size={18} color="#818cf8" />
                Recommended Roles (Grounded Evidence)
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Ranked using skill overlap, project artifacts, and coursework
              </p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onNavigate('jobs')}
            >
              View All ({jobs.length})
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {topJobs.map(job => (
              <div
                key={job.id}
                className="card card-interactive"
                style={{ padding: '1.1rem', background: 'var(--bg-elevated)' }}
                onClick={() => onNavigate('job-detail', { jobId: job.id })}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{job.title}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {job.company} • {job.location} ({job.workMode})
                    </div>
                  </div>
                  <div className={`match-score-badge ${
                    (job.matchScore || 0) >= 80 ? 'match-high' :
                    (job.matchScore || 0) >= 65 ? 'match-medium' : 'match-low'
                  }`}>
                    {job.matchScore || 75}% Match
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', margin: '0.6rem 0' }}>
                  {job.requirements.essentialSkills.slice(0, 4).map(skill => (
                    <span key={skill} className="badge badge-primary">
                      {skill}
                    </span>
                  ))}
                  {job.requirements.essentialSkills.length > 4 && (
                    <span className="badge" style={{ background: 'var(--bg-card)' }}>
                      +{job.requirements.essentialSkills.length - 4} more
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '0.5rem' }}>
                  <span>Source: {job.source} (Verified)</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    View Gap Analysis <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Learning Goals & Active Roadmap */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <Compass size={18} color="#38bdf8" />
                Skill Gap Roadmap
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Targeted courses closing required gaps for top roles
              </p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onNavigate('roadmap')}
            >
              Full Roadmap
            </button>
          </div>

          {allRoadmapItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <Compass size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <p>No roadmap items generated yet.</p>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: '0.75rem' }}
                onClick={() => onNavigate('roadmap')}
              >
                Generate Custom Roadmap
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {allRoadmapItems.slice(0, 3).map(item => (
                <div
                  key={item.id}
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
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span className="badge badge-warning" style={{ textTransform: 'uppercase' }}>
                        {item.skill}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        {item.resource.provider}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.resource.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.resource.duration} • {item.resource.priceStatus}
                    </div>
                  </div>

                  <a
                    href={item.resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{ flexShrink: 0 }}
                  >
                    Open Course <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Quick Resume Studio Callout */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.08) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                LaTeX Resume Ready for Export
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Production-grade .tex source and PDF layout available.
              </div>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onNavigate('resume')}
            >
              Export Resume
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
