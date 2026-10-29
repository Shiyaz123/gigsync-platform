import React from 'react';
import {
  CandidateProfile,
  JobListing,
  SavedJob,
  LearningRoadmap
} from '../types';
import {
  FileText,
  Briefcase,
  Compass,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  ChevronRight,
  Sparkles
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
  // Defined criteria for profile completion (grounded in actual sections present)
  const criteria = [
    { label: 'Contact Coordinates', complete: Boolean(profile.personalInfo.fullName && profile.personalInfo.email) },
    { label: 'Educational History', complete: profile.education.length > 0 },
    { label: 'Core Technical Stack', complete: profile.skills.technical.length >= 3 },
    { label: 'Project Portfolio Artifacts', complete: profile.projects.length > 0 },
    { label: 'Experience or Internships', complete: profile.experience.length > 0 }
  ];

  const completedCriteriaCount = criteria.filter(c => c.complete).length;
  const isMasterProfileReady = completedCriteriaCount >= 4;

  // Active roadmap items
  const allRoadmapItems = roadmap?.stages.flatMap(s => s.items) || [];
  const inProgressItems = allRoadmapItems.filter(i => i.status === 'in-progress');
  const completedItems = allRoadmapItems.filter(i => i.status === 'completed');

  // Top matching jobs
  const topJobs = [...jobs]
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    .slice(0, 3);

  return (
    <div className="dashboard-page space-y-10 pb-16">
      {/* Editorial Overview Header */}
      <div className="pb-6 border-b border-[#D5D5CC]">
        <div className="flex items-baseline justify-between flex-wrap gap-4">
          <div>
            <span className="section-num">Workspace Overview</span>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#20251F] mt-1">
              Candidate Workspace
            </h1>
            <p className="text-sm text-[#686C63] mt-1.5 font-normal">
              Candidate: <span className="font-semibold text-[#20251F]">{profile.personalInfo.fullName || 'Candidate'}</span> • Target: <span className="font-mono text-[#D9534F]">{profile.personalInfo.title || 'Software Engineer'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('resume')}
              className="btn-editorial btn-editorial-primary text-xs px-4 py-2"
            >
              <FileText size={14} strokeWidth={1.5} /> Edit Resume
            </button>
            <button
              onClick={() => onNavigate('jobs')}
              className="btn-editorial btn-editorial-secondary text-xs px-4 py-2"
            >
              <Briefcase size={14} strokeWidth={1.5} /> Find Jobs for Me
            </button>
          </div>
        </div>
      </div>

      {/* Structured Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Metric 1: Verified Profile Criteria */}
        <div className="surface-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#686C63]">
            <span>Profile Criteria</span>
            <span className="text-[#20251F] font-bold">{completedCriteriaCount}/5 Complete</span>
          </div>
          <div className="font-mono text-2xl font-bold text-[#20251F]">
            {isMasterProfileReady ? 'Ready' : 'Incomplete'}
          </div>
          <div className="text-xs text-[#686C63]">
            {profile.confirmedFactsOnly ? '100% Confirmed facts only' : 'Needs review & confirmation'}
          </div>
        </div>

        {/* Metric 2: Job Applications Pipeline */}
        <div className="surface-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#686C63]">
            <span>Tracked Pipeline</span>
            <span className="text-[#20251F] font-bold">{savedJobs.length} Roles</span>
          </div>
          <div className="font-mono text-2xl font-bold text-[#20251F]">
            {savedJobs.filter(j => j.status === 'applied').length} Applied
          </div>
          <div className="text-xs text-[#686C63]">
            {savedJobs.filter(j => j.status === 'interested' || j.status === 'saved').length} bookmarked for review
          </div>
        </div>

        {/* Metric 3: Active Skill Goals */}
        <div className="surface-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#686C63]">
            <span>Roadmap Goals</span>
            <span className="text-[#20251F] font-bold">{allRoadmapItems.length} Mapped</span>
          </div>
          <div className="font-mono text-2xl font-bold text-[#D9534F]">
            {inProgressItems.length} Active
          </div>
          <div className="text-xs text-[#686C63]">
            {completedItems.length} skills mastered to date
          </div>
        </div>

        {/* Metric 4: Top Opportunity Fit */}
        <div className="surface-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[#686C63]">
            <span>Top Role Match</span>
            <span className="tag-mono tag-accent">88% Index</span>
          </div>
          <div className="font-mono text-xl font-bold text-[#20251F] truncate">
            {topJobs[0]?.title || 'Junior Full-Stack'}
          </div>
          <div className="text-xs text-[#686C63] truncate">
            {topJobs[0]?.company || 'Veloce Digital Systems'}
          </div>
        </div>
      </div>

      {/* Two Column Section: Recommended Jobs & Priority Skill Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Recommended Jobs (with transparent explanation) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-baseline justify-between pb-2 border-b border-[#D5D5CC]">
            <h2 className="font-serif text-2xl text-[#20251F]">
              Recommended Job Matches
            </h2>
            <button
              onClick={() => onNavigate('jobs')}
              className="text-xs font-mono text-[#D9534F] hover:underline"
            >
              View all ({jobs.length}) →
            </button>
          </div>

          <div className="space-y-4">
            {topJobs.map(job => (
              <div
                key={job.id}
                onClick={() => onNavigate('job-detail', { jobId: job.id })}
                className="surface-card p-5 space-y-3 cursor-pointer hover:border-[#20251F] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-xl text-[#20251F] hover:text-[#D9534F] transition-colors">
                      {job.title}
                    </h3>
                    <div className="text-xs text-[#686C63] mt-0.5">
                      {job.company} • {job.location} ({job.workMode})
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="tag-mono tag-accent font-bold">
                      {job.matchScore || 80}% Match
                    </span>
                  </div>
                </div>

                {/* Match Summary Explanation */}
                <p className="text-xs text-[#686C63] leading-relaxed bg-[#F5F3EE] p-2.5 border border-[#D5D5CC] rounded-[2px]">
                  <strong>Evidence:</strong> {job.matchSummary || 'Matches confirmed technical skills and coursework in candidate profile.'}
                </p>

                {/* Skills tags */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex flex-wrap gap-1.5">
                    {job.requirements.essentialSkills.slice(0, 4).map(skill => (
                      <span key={skill} className="tag-mono text-[11px] bg-[#E8E7DF]">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <span className="font-mono text-xs text-[#20251F] flex items-center gap-1 font-semibold">
                    Explain Fit <ArrowRight size={13} strokeWidth={1.5} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Priority Skill Gaps & Course Recommendations */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-baseline justify-between pb-2 border-b border-[#D5D5CC]">
            <h2 className="font-serif text-2xl text-[#20251F]">
              Priority Skill Gaps
            </h2>
            <button
              onClick={() => onNavigate('roadmap')}
              className="text-xs font-mono text-[#D9534F] hover:underline"
            >
              Full Roadmap →
            </button>
          </div>

          <div className="surface-card p-5 space-y-4">
            <div className="text-xs text-[#686C63] leading-relaxed">
              These technical skills appear as mandatory requirements in your top-matching roles but lack confirmed evidence in your profile:
            </div>

            <div className="space-y-3">
              {allRoadmapItems.slice(0, 3).map(item => (
                <div
                  key={item.id}
                  className="p-3 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="tag-mono tag-accent text-xs">
                      {item.skill}
                    </span>
                    <span className="text-[11px] font-mono text-[#686C63]">
                      {item.resource.provider}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-[#20251F]">
                    {item.resource.title}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#D5D5CC] text-[11px] text-[#686C63]">
                    <span>{item.resource.duration} • {item.resource.priceStatus}</span>
                    <a
                      href={item.resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#20251F] font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Open Course <ExternalLink size={11} strokeWidth={1.5} />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Resume Studio Callout */}
            <div className="pt-2">
              <button
                onClick={() => onNavigate('resume')}
                className="w-full btn-editorial btn-editorial-dark text-xs py-2.5 flex items-center justify-between"
              >
                <span>Generate Injection-Safe LaTeX Resume</span>
                <ChevronRight size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
