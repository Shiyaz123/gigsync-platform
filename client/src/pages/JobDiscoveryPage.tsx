import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle,
  Globe
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

  // Concurrency and race-condition guards
  const searchRequestIdRef = useRef<number>(0);
  const lastSearchedKeyRef = useRef<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync defaultRole and defaultLocation from confirmed profile when props change
  useEffect(() => {
    if (defaultRole && defaultRole !== roleTerm) {
      setRoleTerm(defaultRole);
    }
  }, [defaultRole]);

  useEffect(() => {
    if (defaultLocation !== undefined && defaultLocation !== locationTerm) {
      setLocationTerm(defaultLocation);
    }
  }, [defaultLocation]);

  // Guaranteed immediate initial search using confirmed resume coordinates
  useEffect(() => {
    const targetLoc = (defaultLocation || '').trim();
    const targetRole = (defaultRole || 'Software Engineer').trim();
    const criteriaKey = `${targetRole}__${targetLoc}__${workModeFilter}__${expLevelFilter}`;

    // If search with these confirmed criteria has not yet executed, run it immediately on the first search
    if (lastSearchedKeyRef.current !== criteriaKey) {
      executeSearch(targetRole, targetLoc, workModeFilter, expLevelFilter);
    }
  }, [defaultLocation, defaultRole]);

  const executeSearch = async (
    role: string,
    loc: string,
    mode: string,
    exp: string
  ) => {
    // 1. Cancel previous in-flight request if any to prevent race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const reqId = ++searchRequestIdRef.current;
    const criteriaKey = `${role.trim()}__${loc.trim()}__${mode}__${exp}`;
    lastSearchedKeyRef.current = criteriaKey;

    // 2. Immediately clear previous search results to avoid showing stale cached listings while loading
    setLocalJobs([]);
    if (onUpdateJobs) {
      onUpdateJobs([]);
    }
    setIsLoading(true);
    setErrorMessage(null);
    setHasSearched(true);

    console.info(`[GigSync JobSearch Client #${reqId}] START: role="${role}", location="${loc}", workMode="${mode}", exp="${exp}"`);

    try {
      const results = await api.getJobs({
        role: role.trim() || undefined,
        keyword: role.trim() || undefined,
        location: loc.trim() || undefined,
        workMode: mode !== 'All' ? mode : undefined,
        experienceLevel: exp !== 'All' ? exp : undefined
      }, { signal: controller.signal });

      // 3. Prevent outdated API responses from overwriting newer results
      if (searchRequestIdRef.current !== reqId) {
        console.info(`[GigSync JobSearch Client #${reqId}] SUPERSEDED by #${searchRequestIdRef.current}, ignoring.`);
        return;
      }

      setLocalJobs(results);
      if (onUpdateJobs) {
        onUpdateJobs(results);
      }
      console.info(`[GigSync JobSearch Client #${reqId}] FINISH: ${results.length} genuine vacancies returned for location="${loc}"`);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      if (searchRequestIdRef.current !== reqId) {
        return;
      }
      console.error(`[GigSync JobSearch Client #${reqId}] ERROR:`, err);
      setErrorMessage(
        err.message || 'Unable to connect to job search provider.'
      );
      setLocalJobs([]);
      if (onUpdateJobs) {
        onUpdateJobs([]);
      }
    } finally {
      if (searchRequestIdRef.current === reqId) {
        setIsLoading(false);
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(roleTerm, locationTerm, workModeFilter, expLevelFilter);
  };

  const isJobSaved = (jobId: string) => savedJobs.some(sj => sj.jobId === jobId);

  // Helper to extract country tag from location string
  const detectCountry = (loc: string): string => {
    const l = (loc || '').toLowerCase();
    if (l.includes('india') || l.includes('bangalore') || l.includes('bengaluru') || l.includes('mumbai') || l.includes('delhi') || l.includes('gurgaon') || l.includes('hyderabad') || l.includes('chennai') || l.includes('pune')) {
      return 'India [IN]';
    }
    if (l.includes('united states') || l.includes('usa') || l.includes('san jose') || l.includes('san francisco') || l.includes('new york') || l.includes('seattle') || l.includes('austin') || l.includes(', ca') || l.includes(', tx') || l.includes(', ny') || l.includes(', wa') || l.includes(', il') || l.includes(', ma')) {
      return 'United States [US]';
    }
    if (l.includes('united kingdom') || l.includes('uk') || l.includes('london') || l.includes('england')) {
      return 'United Kingdom [GB]';
    }
    if (l.includes('germany') || l.includes('deutschland') || l.includes('berlin') || l.includes('munich')) {
      return 'Germany [DE]';
    }
    if (l.includes('worldwide') || l.includes('anywhere') || l.includes('global')) {
      return 'Worldwide [GLOBAL]';
    }
    return '';
  };

  // Helper to extract remote eligibility constraint
  const extractRemoteEligibility = (job: JobListing): string | null => {
    if (job.workMode !== 'Remote') return null;
    const constraint = job.requirements?.constraints?.find(c =>
      c.toLowerCase().includes('eligib') || c.toLowerCase().includes('location')
    );
    if (constraint) {
      return constraint.replace(/^(geographic\s*eligibility|eligible\s*location|verified\s*location):\s*/i, '');
    }
    const match = job.location.match(/remote\s*\(([^)]+)\)/i);
    return match ? match[1] : 'Worldwide';
  };

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
              Real opportunities sourced from authorized global providers (The Muse, Remotive, Arbeitnow). Strictly zero fabricated or placeholder listings.
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
          <div className="flex items-center gap-2 flex-wrap">
            <span>Selected Search Location:</span>
            <span className="text-[#20251F] font-semibold bg-[#E8E7DF] px-1.5 py-0.5 rounded-[2px]">
              {locationTerm || 'Worldwide / Any Location'}
            </span>
            <span>•</span>
            <span>Role:</span>
            <span className="text-[#20251F] font-semibold">
              {roleTerm || 'All Roles'}
            </span>
            <span>•</span>
            <span>Mode: {workModeFilter}</span>
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
          <p className="text-[11px]">Searching The Muse, Remotive, and Arbeitnow for verified vacancies in {locationTerm || 'all locations'}.</p>
        </div>
      )}

      {/* Job Cards List */}
      {!isLoading && localJobs.length === 0 ? (
        <div className="surface-card p-12 text-center space-y-3">
          <Inbox size={36} strokeWidth={1.5} className="mx-auto text-[#686C63]" />
          <h3 className="font-serif text-2xl text-[#20251F]">No Matching Genuine Job Opportunities</h3>
          <p className="text-xs text-[#686C63] max-w-md mx-auto leading-relaxed">
            No live job records currently match your specific location ({locationTerm || 'Worldwide'}).
            GigSync strictly avoids fabricating placeholder companies or misrepresenting job locations to increase counts.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setLocationTerm('India');
                setWorkModeFilter('Remote');
                executeSearch(roleTerm, 'India', 'Remote', expLevelFilter);
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
              Broaden / Clear Location Filter
            </button>
          </div>
        </div>
      ) : !isLoading && (
        <div className="space-y-4">
          {localJobs.map(job => {
            const saved = isJobSaved(job.id);
            const score = typeof job.matchScore === 'number' ? job.matchScore : 0;
            const countryTag = detectCountry(job.location);
            const remoteEligibility = extractRemoteEligibility(job);

            return (
              <div
                key={job.id}
                onClick={() => onSelectJob(job.id)}
                className="surface-card p-6 space-y-4 cursor-pointer hover:border-[#20251F] transition-colors"
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-serif text-2xl text-[#20251F] hover:text-[#D9534F] transition-colors">
                        {job.title}
                      </h2>
                      {job.verified && (
                        <span className="tag-mono text-[11px] text-[#686C63] flex items-center gap-1">
                          <ShieldCheck size={11} strokeWidth={1.5} /> Genuine Provider
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#686C63] flex items-center gap-2 flex-wrap pt-0.5">
                      <span className="font-semibold text-[#20251F]">{job.company}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 font-medium text-[#20251F]">
                        <MapPin size={11} /> Actual Location: {job.location}
                      </span>
                      {countryTag && (
                        <span className="tag-mono text-[10px] bg-[#E8E7DF] text-[#20251F]">
                          {countryTag}
                        </span>
                      )}
                      <span>•</span>
                      <span className="tag-mono text-[11px] font-semibold">{job.workMode}</span>
                      {remoteEligibility && (
                        <span className="tag-mono text-[10px] bg-[#D1E7DD] text-[#0F5132] border border-[#BADBCC] flex items-center gap-1">
                          <Globe size={10} /> Eligible: {remoteEligibility}
                        </span>
                      )}
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
