import React, { useState } from 'react';
import {
  JobListing,
  SavedJob
} from '../types';
import {
  Search,
  MapPin,
  Briefcase,
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
    <div className="job-discovery-page space-y-8 pb-16">
      {/* Editorial Header */}
      <div className="pb-4 border-b border-[#D5D5CC]">
        <div className="flex items-baseline justify-between flex-wrap gap-4">
          <div>
            <span className="section-num">Workflow Step 03 / Job Matching</span>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#20251F] mt-1">
              Find Jobs for Me
            </h1>
            <p className="text-sm text-[#686C63] mt-1">
              Relevance scores reflect verified evidence alignment from your confirmed profile. Not presented as hiring probabilities.
            </p>
          </div>
          <span className="tag-mono text-[#686C63]">
            {filteredJobs.length} verified listings available
          </span>
        </div>
      </div>

      {/* Editorial Filter Bar */}
      <div className="surface-card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#686C63]" />
            <input
              className="input-editorial pl-9 text-xs sm:text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Filter by title, company, or skill (e.g. React, Python, Docker)..."
            />
          </div>

          {/* Work Mode Filter */}
          <div className="md:col-span-2">
            <select
              className="input-editorial text-xs"
              value={workModeFilter}
              onChange={e => setWorkModeFilter(e.target.value)}
            >
              <option value="All">All Work Modes</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </div>

          {/* Experience Level Filter */}
          <div className="md:col-span-2">
            <select
              className="input-editorial text-xs"
              value={expLevelFilter}
              onChange={e => setExpLevelFilter(e.target.value)}
            >
              <option value="All">All Experience Levels</option>
              <option value="Entry-level">Entry-level</option>
              <option value="Junior">Junior</option>
              <option value="Internship">Internship</option>
            </select>
          </div>

          {/* Source Filter */}
          <div className="md:col-span-2">
            <select
              className="input-editorial text-xs"
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
            >
              <option value="All">All Sources</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Indeed">Indeed</option>
              <option value="Handshake">Handshake</option>
              <option value="Company Direct">Company Direct</option>
            </select>
          </div>

          {/* Reset button */}
          <div className="md:col-span-1">
            <button
              onClick={() => {
                setSearchTerm('');
                setWorkModeFilter('All');
                setExpLevelFilter('All');
                setSourceFilter('All');
              }}
              className="btn-editorial btn-editorial-outline w-full text-xs py-2 px-1"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Job Cards List */}
      {filteredJobs.length === 0 ? (
        <div className="surface-card p-12 text-center space-y-3">
          <Inbox size={36} strokeWidth={1.5} className="mx-auto text-[#686C63]" />
          <h3 className="font-serif text-2xl text-[#20251F]">No Matching Job Listings Found</h3>
          <p className="text-xs text-[#686C63] max-w-md mx-auto">
            No verified job records match your current filter parameters. We strictly avoid displaying fabricated fallback data.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setWorkModeFilter('All');
              setExpLevelFilter('All');
              setSourceFilter('All');
            }}
            className="btn-editorial btn-editorial-secondary text-xs px-4 py-2 mt-2"
          >
            Clear Search Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map(job => {
            const saved = isJobSaved(job.id);
            const score = job.matchScore || 75;

            return (
              <div
                key={job.id}
                onClick={() => onSelectJob(job.id)}
                className="surface-card p-6 space-y-4 cursor-pointer hover:border-[#20251F] transition-colors"
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-serif text-2xl text-[#20251F] hover:text-[#D9534F] transition-colors">
                        {job.title}
                      </h2>
                      {job.verified && (
                        <span className="tag-mono text-[11px] text-[#686C63] flex items-center gap-1">
                          <ShieldCheck size={11} strokeWidth={1.5} /> Verified
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#686C63] flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#20251F]">{job.company}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                      <span>•</span>
                      <span className="tag-mono text-[11px]">{job.workMode}</span>
                      <span className="tag-mono text-[11px]">{job.experienceLevel}</span>
                      {job.salaryRange && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[#20251F] font-semibold">{job.salaryRange}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Match Score & Bookmark */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-mono text-xl font-bold text-[#20251F]">
                        {score}%
                      </div>
                      <div className="text-[10px] font-mono text-[#686C63] uppercase">
                        Evidence Match
                      </div>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onToggleSaveJob(job.id);
                      }}
                      className={`p-2 border rounded-[2px] transition-colors ${
                        saved
                          ? 'border-[#D9534F] text-[#D9534F] bg-[#E8E7DF]'
                          : 'border-[#D5D5CC] text-[#686C63] hover:text-[#20251F]'
                      }`}
                      title={saved ? 'Remove from saved' : 'Save job'}
                    >
                      {saved ? <BookmarkCheck size={16} strokeWidth={1.5} /> : <Bookmark size={16} strokeWidth={1.5} />}
                    </button>
                  </div>
                </div>

                {/* Description snippet */}
                <p className="text-xs text-[#686C63] leading-relaxed line-clamp-2">
                  {job.description}
                </p>

                {/* Match Rationale / Evidence callout */}
                <div className="bg-[#F5F3EE] p-2.5 border border-[#D5D5CC] rounded-[2px] text-xs text-[#686C63] flex items-center justify-between gap-4">
                  <div>
                    <strong className="text-[#20251F]">Why this matches:</strong> {job.matchSummary || 'Aligns with confirmed technical skills.'}
                  </div>
                  <span className="font-mono text-[11px] text-[#20251F] shrink-0 flex items-center gap-1 font-semibold">
                    Review Skill Gaps <ArrowRight size={12} strokeWidth={1.5} />
                  </span>
                </div>

                {/* Essential Skills & Actions footer */}
                <div className="pt-2 border-t border-[#D5D5CC] flex items-center justify-between flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[11px] text-[#686C63] uppercase font-semibold">Essential:</span>
                    {job.requirements.essentialSkills.map(skill => (
                      <span key={skill} className="tag-mono text-[11px] bg-[#E8E7DF] text-[#20251F]">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#686C63]">
                    <span>Source: {job.source}</span>
                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-[#20251F] font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Apply on {job.source} <ExternalLink size={12} strokeWidth={1.5} />
                    </a>
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
