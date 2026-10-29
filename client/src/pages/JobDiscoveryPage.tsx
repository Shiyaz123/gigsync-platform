import React, { useState, useEffect } from 'react';
import {
  JobListing,
  SavedJob
} from '../types';
import { api } from '../services/api';
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
  Inbox,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface JobDiscoveryPageProps {
  jobs: JobListing[];
  savedJobs: SavedJob[];
  onToggleSaveJob: (jobId: string) => void;
  onSelectJob: (jobId: string) => void;
  onUpdateJobs?: (jobs: JobListing[]) => void;
  defaultLocation?: string;
  defaultRole?: string;
}

export const JobDiscoveryPage: React.FC<JobDiscoveryPageProps> = ({
  jobs,
  savedJobs,
  onToggleSaveJob,
  onSelectJob,
  onUpdateJobs,
  defaultLocation = '',
  defaultRole = 'Software Engineer'
}) => {
  const [roleTerm, setRoleTerm] = useState(defaultRole);
  const [locationTerm, setLocationTerm] = useState(defaultLocation);
  const [workModeFilter, setWorkModeFilter] = useState('All');
  const [expLevelFilter, setExpLevelFilter] = useState('All');
  const [localJobs, setLocalJobs] = useState<JobListing[]>(jobs);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Sync external jobs
  useEffect(() => {
    if (jobs && jobs.length > 0) {
      setLocalJobs(jobs);
    }
  }, [jobs]);

  // Initial load if empty
  useEffect(() => {
    if ((!jobs || jobs.length === 0) && !hasSearched) {
      executeSearch(defaultRole, defaultLocation, workModeFilter, expLevelFilter);
    }
  }, []);

  const executeSearch = async (
    role: string,
    loc: string,
    mode: string,
    exp: string
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const results = await api.getJobs({
        role: role.trim() || undefined,
        keyword: role.trim() || undefined,
        location: loc.trim() || undefined,
        workMode: mode !== 'All' ? mode : undefined,
        experienceLevel: exp !== 'All' ? exp : undefined
      });

      setLocalJobs(results);
      if (onUpdateJobs) {
        onUpdateJobs(results);
      }
    } catch (err: any) {
      console.error('[GigSync] Job search error:', err);
      setErrorMessage(
        err.message || 'Unable to connect to job search provider. Ensure Flask service is running on port 5001.'
      );
      setLocalJobs([]);
      if (onUpdateJobs) {
        onUpdateJobs([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(roleTerm, locationTerm, workModeFilter, expLevelFilter);
  };

  const isJobSaved = (jobId: string) => savedJobs.some(sj => sj.jobId === jobId);

  return (
    <div className="job-discovery-page space-y-8 pb-16">
      {/* Editorial Header */}
      <div className="pb-4 border-b border-[#D5D5CC]">
        <div className="flex items-baseline justify-between flex-wrap gap-4">
          <div>
            <span className="section-num">Workflow Step 03 / Live Job Discovery</span>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#20251F] mt-1">
              Find Genuine Jobs
            </h1>
            <p className="text-sm text-[#686C63] mt-1">
              Real opportunities sourced from authorized global providers (Adzuna, The Muse, Remotive). Zero fabricated postings.
            </p>
          </div>
          <span className="tag-mono text-[#686C63]">
            {localJobs.length} live listings found
          </span>
        </div>
      </div>

      {/* Editorial Filter Bar with Real Location Search */}
      <form onSubmit={handleSearchSubmit} className="surface-card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Target Role Search */}
          <div className="md:col-span-4 relative">
            <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#686C63]" />
            <input
              id="job-search-role"
              className="input-editorial pl-9 text-xs sm:text-sm"
              value={roleTerm}
              onChange={e => setRoleTerm(e.target.value)}
              placeholder="Target Role (e.g. Python Developer, Full-Stack)..."
            />
          </div>

          {/* Location Input (Real Location-Based Search) */}
          <div className="md:col-span-3 relative">
            <MapPin size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#686C63]" />
            <input
              id="job-search-location"
              className="input-editorial pl-9 text-xs sm:text-sm"
              value={locationTerm}
              onChange={e => setLocationTerm(e.target.value)}
              placeholder="City, Country (e.g. Bengaluru, India, Remote)..."
            />
          </div>

          {/* Work Mode Filter */}
          <div className="md:col-span-2">
            <select
              id="job-filter-workmode"
              className="input-editorial text-xs"
              value={workModeFilter}
              onChange={e => {
                setWorkModeFilter(e.target.value);
                executeSearch(roleTerm, locationTerm, e.target.value, expLevelFilter);
              }}
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
              id="job-filter-explevel"
              className="input-editorial text-xs"
              value={expLevelFilter}
              onChange={e => {
                setExpLevelFilter(e.target.value);
                executeSearch(roleTerm, locationTerm, workModeFilter, e.target.value);
              }}
            >
              <option value="All">All Levels</option>
              <option value="Entry-level">Entry-level</option>
              <option value="Junior">Junior</option>
              <option value="Internship">Internship</option>
            </select>
          </div>

          {/* Search Action Button */}
          <div className="md:col-span-1">
            <button
              id="job-search-submit-btn"
              type="submit"
              disabled={isLoading}
              className="btn-editorial btn-editorial-primary w-full text-xs py-2 px-2 flex items-center justify-center gap-1"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>

        {/* Active Query Summary & Reset */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#686C63] pt-1">
          <div className="flex items-center gap-2">
            <span>Querying:</span>
            <span className="text-[#20251F] font-semibold">
              {roleTerm || 'All Roles'}
            </span>
            <span>•</span>
            <span className="text-[#20251F] font-semibold">
              {locationTerm || 'Worldwide / Any Location'}
            </span>
            <span>•</span>
            <span>{workModeFilter}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setRoleTerm('Software Engineer');
              setLocationTerm('');
              setWorkModeFilter('All');
              setExpLevelFilter('All');
              executeSearch('Software Engineer', '', 'All', 'All');
            }}
            className="hover:underline flex items-center gap-1 text-[#686C63]"
          >
            <RefreshCw size={10} /> Reset Filters
          </button>
        </div>
      </form>

      {/* Error state callout */}
      {errorMessage && (
        <div className="bg-[#FFF8F7] border border-[#EAA29E] p-4 rounded-[2px] flex items-start gap-3 text-xs text-[#20251F]">
          <AlertCircle size={16} className="text-[#D9534F] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-[#D9534F]">Job Search Service Notice</div>
            <p className="text-[#686C63]">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="surface-card p-12 text-center space-y-3 font-mono text-xs text-[#686C63]">
          <Loader2 size={28} className="animate-spin mx-auto text-[#20251F]" />
          <p className="font-semibold text-[#20251F]">Querying authorized job providers...</p>
          <p className="text-[11px]">Connecting to Adzuna, The Muse, and Remotive with your verified filters.</p>
        </div>
      )}

      {/* Job Cards List */}
      {!isLoading && localJobs.length === 0 ? (
        <div className="surface-card p-12 text-center space-y-3">
          <Inbox size={36} strokeWidth={1.5} className="mx-auto text-[#686C63]" />
          <h3 className="font-serif text-2xl text-[#20251F]">No Matching Genuine Job Opportunities</h3>
          <p className="text-xs text-[#686C63] max-w-md mx-auto leading-relaxed">
            No live job records matched your specific role or location ({locationTerm || 'Any'}).
            GigSync strictly avoids generating fabricated companies or placeholder listings.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setLocationTerm('Remote');
                setWorkModeFilter('Remote');
                executeSearch(roleTerm, 'Remote', 'Remote', expLevelFilter);
              }}
              className="btn-editorial btn-editorial-primary text-xs px-4 py-2"
            >
              Search Remote Roles
            </button>
            <button
              onClick={() => {
                setLocationTerm('');
                setWorkModeFilter('All');
                executeSearch(roleTerm, '', 'All', 'All');
              }}
              className="btn-editorial btn-editorial-outline text-xs px-4 py-2"
            >
              Clear Location Filter
            </button>
          </div>
        </div>
      ) : !isLoading && (
        <div className="space-y-4">
          {localJobs.map(job => {
            const saved = isJobSaved(job.id);
            const score = typeof job.matchScore === 'number' ? job.matchScore : 0;

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
                          <ShieldCheck size={11} strokeWidth={1.5} /> Genuine Provider
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#686C63] flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#20251F]">{job.company}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <MapPin size={11} /> {job.location}
                      </span>
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
                    <strong className="text-[#20251F]">Why this matches:</strong> {job.matchSummary || 'Analyzed against your confirmed profile skills and projects.'}
                  </div>
                  <span className="font-mono text-[11px] text-[#20251F] shrink-0 flex items-center gap-1 font-semibold">
                    Review Skill Gaps <ArrowRight size={12} strokeWidth={1.5} />
                  </span>
                </div>

                {/* Essential Skills & Actions footer */}
                <div className="pt-2 border-t border-[#D5D5CC] flex items-center justify-between flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[11px] text-[#686C63] uppercase font-semibold">Essential:</span>
                    {job.requirements?.essentialSkills?.map(skill => (
                      <span key={skill} className="tag-mono text-[11px] bg-[#E8E7DF] text-[#20251F]">
                        {skill}
                      </span>
                    )) || <span className="text-[#686C63] text-[11px]">General Software Engineering</span>}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#686C63]">
                    <span className="tag-mono text-[11px]">Source: {job.source}</span>
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
