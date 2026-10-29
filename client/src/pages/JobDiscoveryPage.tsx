import React, { useState } from 'react';
import {
  JobListing,
  SavedJob
} from '../types';
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  DollarSign,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Inbox
} from 'lucide-react';

interface JobDiscoveryPageProps {
  jobs: JobListing[];
  savedJobs: SavedJob[];
  onToggleSaveJob: (jobId: string) => void;
  onSelectJob: (jobId: string) => void;
}

export const JobDiscoveryPage: React.FC<JobDiscoveryPageProps> = ({
  jobs,
  savedJobs,
  onToggleSaveJob,
  onSelectJob
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('All');
  const [expLevelFilter, setExpLevelFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');

  // Filter logic
  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.requirements.essentialSkills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesWorkMode = workModeFilter === 'All' || job.workMode.toLowerCase() === workModeFilter.toLowerCase();
    const matchesExp = expLevelFilter === 'All' || job.experienceLevel.toLowerCase() === expLevelFilter.toLowerCase();
    const matchesSource = sourceFilter === 'All' || job.source === sourceFilter;

    return matchesSearch && matchesWorkMode && matchesExp && matchesSource;
  });

  const isJobSaved = (jobId: string) => savedJobs.some(sj => sj.jobId === jobId);

  return (
    <div className="job-discovery-page">
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Briefcase size={28} color="#6366f1" />
          Job Discovery & Match Relevance
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Explore verified entry-level and junior software roles. Transparent match scores explain evidence and missing requirements.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by title, company, or skill (e.g. React, Python, Docker)..."
            />
          </div>

          {/* Work Mode Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '130px' }}
            value={workModeFilter}
            onChange={e => setWorkModeFilter(e.target.value)}
          >
            <option value="All">All Work Modes</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>

          {/* Experience Level Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '140px' }}
            value={expLevelFilter}
            onChange={e => setExpLevelFilter(e.target.value)}
          >
            <option value="All">All Levels</option>
            <option value="Entry-level">Entry-level</option>
            <option value="Junior">Junior</option>
            <option value="Internship">Internship</option>
          </select>

          {/* Source Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '130px' }}
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
          >
            <option value="All">All Sources</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Indeed">Indeed</option>
            <option value="Handshake">Handshake</option>
            <option value="Company Direct">Company Direct</option>
          </select>

          {(searchTerm || workModeFilter !== 'All' || expLevelFilter !== 'All' || sourceFilter !== 'All') && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                setSearchTerm('');
                setWorkModeFilter('All');
                setExpLevelFilter('All');
                setSourceFilter('All');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredJobs.length}</strong> verified job opportunities
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
          Scores indicate profile evidence alignment, not hiring guarantees
        </span>
      </div>

      {/* Job Cards List */}
      {filteredJobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
          <Inbox size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            No Matching Job Listings
          </h3>
          <p style={{ maxWidth: '400px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
            No seeded records match your current filter criteria. We avoid displaying fabricated records.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchTerm('');
              setWorkModeFilter('All');
              setExpLevelFilter('All');
              setSourceFilter('All');
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredJobs.map(job => {
            const saved = isJobSaved(job.id);
            const score = job.matchScore || 75;

            return (
              <div
                key={job.id}
                className="card card-interactive"
                style={{ padding: '1.5rem' }}
                onClick={() => onSelectJob(job.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{job.title}</h2>
                      {job.verified && (
                        <span className="badge badge-success" title="Verified source listing">
                          <ShieldCheck size={12} /> Verified
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{job.company}</span>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <MapPin size={14} /> {job.location}
                      </span>
                      <span>•</span>
                      <span className="badge badge-primary">{job.workMode}</span>
                      <span className="badge" style={{ background: 'var(--bg-elevated)' }}>{job.experienceLevel}</span>
                    </div>
                  </div>

                  {/* Match Score & Bookmark */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className={`match-score-badge ${
                      score >= 80 ? 'match-high' :
                      score >= 65 ? 'match-medium' : 'match-low'
                    }`}>
                      <Sparkles size={14} />
                      {score}% Relevance
                    </div>

                    <button
                      className="btn-icon"
                      title={saved ? 'Remove from saved' : 'Save job'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSaveJob(job.id);
                      }}
                    >
                      {saved ? <BookmarkCheck size={18} color="#10b981" /> : <Bookmark size={18} />}
                    </button>
                  </div>
                </div>

                {/* Salary & Description snippet */}
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  {job.description}
                </div>

                {/* Skills tags */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-card)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Essential:</span>
                    {job.requirements.essentialSkills.map(skill => (
                      <span key={skill} className="badge badge-primary">
                        {skill}
                      </span>
                    ))}
                    {job.requirements.preferredSkills.length > 0 && (
                      <>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600, marginLeft: '6px' }}>Preferred:</span>
                        {job.requirements.preferredSkills.slice(0, 2).map(skill => (
                          <span key={skill} className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                            {skill}
                          </span>
                        ))}
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                      Source: {job.source}
                    </span>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectJob(job.id);
                      }}
                    >
                      Explain Fit & Gaps <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
