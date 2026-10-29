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
  ShieldCheck,
  ShieldAlert,
  Compass,
  FileText,
  ExternalLink,
  MapPin,
  Bookmark,
  BookmarkCheck,
  Check
} from 'lucide-react';

interface JobDetailPageProps {
  jobId: string;
  profile: CandidateProfile;
  onBack: () => void;
  onNavigateToRoadmap: (jobId: string, roleTitle: string, missingSkills: string[]) => void;
  onNavigateToResume: (jobId: string) => void;
  isSaved: boolean;
  onToggleSave: (jobId: string) => void;
  onConfirmSkill?: (skill: string) => void;
}

export const JobDetailPage: React.FC<JobDetailPageProps> = ({
  jobId,
  profile,
  onBack,
  onNavigateToRoadmap,
  onNavigateToResume,
  isSaved,
  onToggleSave,
  onConfirmSkill
}) => {
  const [job, setJob] = useState<JobListing | null>(null);
  const [match, setMatch] = useState<JobMatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [userConfirmedSkills, setUserConfirmedSkills] = useState<string[]>([]);

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

  const handleUserConfirmSkill = (skill: string) => {
    if (!userConfirmedSkills.includes(skill)) {
      setUserConfirmedSkills([...userConfirmedSkills, skill]);
      if (onConfirmSkill) onConfirmSkill(skill);
    }
  };

  if (loading || !job || !match) {
    return (
      <div className="surface-card p-12 text-center font-mono text-xs text-[#686C63] space-y-2">
        <div className="w-2 h-2 rounded-full bg-[#D9534F] mx-auto animate-ping"></div>
        <p>Analyzing job requirements against verified profile evidence...</p>
      </div>
    );
  }

  const allMissingSkillNames = [
    ...match.missingEssentialSkills.filter(s => !userConfirmedSkills.includes(s.skill)).map(s => s.skill),
    ...match.missingPreferredSkills.filter(s => !userConfirmedSkills.includes(s.skill)).map(s => s.skill)
  ];

  return (
    <div className="job-detail-page space-y-8 pb-16">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="btn-editorial btn-editorial-outline text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> Back to Job Discovery
        </button>
      </div>

      {/* Role Header Card */}
      <div className="surface-card p-8 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-6 pb-6 border-b border-[#D5D5CC]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="section-num">Opportunity Analysis</span>
              {job.verified && (
                <span className="tag-mono text-[11px] text-[#686C63] flex items-center gap-1">
                  <ShieldCheck size={11} strokeWidth={1.5} /> Verified Source Listing
                </span>
              )}
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl text-[#20251F]">
              {job.title}
            </h1>

            <div className="text-sm text-[#686C63] flex items-center gap-3 flex-wrap">
              <span className="font-semibold text-[#20251F] text-base">{job.company}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><MapPin size={14} strokeWidth={1.5} /> {job.location}</span>
              <span>•</span>
              <span className="tag-mono">{job.workMode}</span>
              <span className="tag-mono">{job.experienceLevel}</span>
              {job.salaryRange && (
                <>
                  <span>•</span>
                  <span className="font-mono text-[#20251F] font-semibold">{job.salaryRange}</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onToggleSave(job.id)}
              className="btn-editorial btn-editorial-secondary text-xs px-3.5 py-2.5"
            >
              {isSaved ? <BookmarkCheck size={15} strokeWidth={1.5} className="text-[#D9534F]" /> : <Bookmark size={15} strokeWidth={1.5} />}
              <span>{isSaved ? 'Saved in Pipeline' : 'Save Job'}</span>
            </button>

            <a
              href={job.applyUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-editorial btn-editorial-primary text-xs px-4 py-2.5"
            >
              Apply on {job.source} <ExternalLink size={14} strokeWidth={1.5} />
            </a>
          </div>
        </div>

        {/* Explainable Relevance Score Card */}
        <div className="p-6 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] space-y-4">
          <div className="flex items-baseline justify-between flex-wrap gap-4 pb-3 border-b border-[#D5D5CC]">
            <div>
              <span className="font-mono text-xs uppercase text-[#686C63] font-semibold">
                Grounded Match Evaluation
              </span>
              <p className="text-xs text-[#686C63] mt-1 max-w-xl">
                {match.explanation}
              </p>
            </div>

            <div className="text-right">
              <div className="font-mono text-4xl font-bold text-[#20251F]">
                {match.overallScore}<span className="text-base text-[#686C63] font-normal">/100</span>
              </div>
              <div className="text-[11px] font-mono text-[#686C63] uppercase">
                Relevance Index
              </div>
            </div>
          </div>

          {/* Sub-score grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-2.5 bg-[#FFFFFF] border border-[#D5D5CC] rounded-[2px]">
              <span className="text-[#686C63] block">Skills Overlap (50%)</span>
              <span className="text-sm font-bold text-[#20251F]">{match.scoreBreakdown.skillsScore}%</span>
            </div>
            <div className="p-2.5 bg-[#FFFFFF] border border-[#D5D5CC] rounded-[2px]">
              <span className="text-[#686C63] block">Experience & Projects (25%)</span>
              <span className="text-sm font-bold text-[#20251F]">{match.scoreBreakdown.experienceScore}%</span>
            </div>
            <div className="p-2.5 bg-[#FFFFFF] border border-[#D5D5CC] rounded-[2px]">
              <span className="text-[#686C63] block">Education Alignment (15%)</span>
              <span className="text-sm font-bold text-[#20251F]">{match.scoreBreakdown.educationScore}%</span>
            </div>
            <div className="p-2.5 bg-[#FFFFFF] border border-[#D5D5CC] rounded-[2px]">
              <span className="text-[#686C63] block">Role Similarity (10%)</span>
              <span className="text-sm font-bold text-[#20251F]">{match.scoreBreakdown.roleSimilarityScore}%</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-[#686C63] flex items-center gap-1.5 pt-1">
            <ShieldAlert size={13} strokeWidth={1.5} className="text-[#D9534F] shrink-0" />
            <span>{match.disclaimer}</span>
          </div>
        </div>
      </div>

      {/* 5-Category Classification Grid (Prompt Step 5) */}
      <div className="space-y-6">
        <div className="pb-2 border-b border-[#D5D5CC] flex items-baseline justify-between flex-wrap gap-4">
          <div>
            <span className="section-num">Step 05 / Skill-Gap Analysis</span>
            <h2 className="font-serif text-3xl text-[#20251F] mt-1">
              Requirement Classification
            </h2>
          </div>

          {allMissingSkillNames.length > 0 && (
            <button
              onClick={() => onNavigateToRoadmap(job.id, job.title, allMissingSkillNames)}
              className="btn-editorial btn-editorial-primary text-xs px-4 py-2"
            >
              <Compass size={14} strokeWidth={1.5} /> Generate Personalized Course Roadmap
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Category 1: Skills Already Demonstrated */}
          <div className="surface-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D5D5CC]">
              <h3 className="font-serif text-xl text-[#20251F] flex items-center gap-2">
                <CheckCircle2 size={18} strokeWidth={1.5} className="text-[#20251F]" />
                1. Skills Already Demonstrated ({match.matchedSkills.length})
              </h3>
              <span className="tag-mono">Confirmed</span>
            </div>

            <div className="space-y-3">
              {match.matchedSkills.map(m => (
                <div key={m.skill} className="p-3 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#20251F]">{m.skill}</span>
                    <span className="tag-mono text-[10px] uppercase">{m.category}</span>
                  </div>
                  <p className="text-xs text-[#686C63]">
                    <strong>Evidence:</strong> {m.evidence}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Category 2 & 3: Missing Essential & Preferred Gaps */}
          <div className="surface-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D5D5CC]">
              <h3 className="font-serif text-xl text-[#20251F] flex items-center gap-2">
                <AlertTriangle size={18} strokeWidth={1.5} className="text-[#D9534F]" />
                2 & 3. Missing Skills Gap ({match.missingEssentialSkills.length + match.missingPreferredSkills.length})
              </h3>
              <span className="tag-mono tag-accent">Actionable</span>
            </div>

            <div className="text-xs text-[#686C63]">
              Do not assume you lack a skill simply because it was not listed. Click <strong>"I know this"</strong> to confirm your competence.
            </div>

            <div className="space-y-3">
              {match.missingEssentialSkills.map(m => {
                const confirmed = userConfirmedSkills.includes(m.skill);
                return (
                  <div key={m.skill} className="p-3 bg-[#E8E7DF] border border-[#D5D5CC] rounded-[2px] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#20251F]">{m.skill}</span>
                      <span className="tag-mono tag-accent text-[10px] uppercase">Essential</span>
                    </div>
                    <p className="text-xs text-[#686C63]">{m.whyItMatters}</p>

                    <div className="pt-1 flex items-center justify-end">
                      {confirmed ? (
                        <span className="text-[11px] font-mono text-[#20251F] font-semibold flex items-center gap-1">
                          <Check size={12} strokeWidth={2} /> Confirmed by candidate
                        </span>
                      ) : (
                        <button
                          onClick={() => handleUserConfirmSkill(m.skill)}
                          className="px-2 py-1 text-[11px] font-mono border border-[#D5D5CC] bg-[#FFFFFF] hover:border-[#20251F] text-[#20251F] rounded-[2px]"
                        >
                          + I know this skill
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {match.missingPreferredSkills.map(m => {
                const confirmed = userConfirmedSkills.includes(m.skill);
                return (
                  <div key={m.skill} className="p-3 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#20251F]">{m.skill}</span>
                      <span className="tag-mono text-[10px] uppercase">Preferred Bonus</span>
                    </div>
                    <p className="text-xs text-[#686C63]">{m.whyItMatters}</p>

                    <div className="pt-1 flex items-center justify-end">
                      {confirmed ? (
                        <span className="text-[11px] font-mono text-[#20251F] font-semibold flex items-center gap-1">
                          <Check size={12} strokeWidth={2} /> Confirmed by candidate
                        </span>
                      ) : (
                        <button
                          onClick={() => handleUserConfirmSkill(m.skill)}
                          className="px-2 py-1 text-[11px] font-mono border border-[#D5D5CC] bg-[#FFFFFF] hover:border-[#20251F] text-[#20251F] rounded-[2px]"
                        >
                          + I know this skill
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category 4 & 5: Hard Constraints & Clarification Items */}
        <div className="surface-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D5D5CC]">
            <h3 className="font-serif text-xl text-[#20251F] flex items-center gap-2">
              <ShieldAlert size={18} strokeWidth={1.5} className="text-[#D9534F]" />
              4 & 5. Hard Eligibility Constraints & Items Needing Clarification
            </h3>
            <span className="tag-mono">Non-Coursework Criteria</span>
          </div>

          <div className="space-y-3">
            {match.hardConstraints.map((c, idx) => (
              <div key={idx} className="p-3.5 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-xs text-[#20251F]">{c.constraint}</div>
                  <div className="text-xs text-[#686C63] mt-0.5">{c.note}</div>
                </div>
                <span className={`tag-mono uppercase text-[10px] ${
                  c.status === 'satisfied' ? 'bg-[#FFFFFF] text-[#20251F]' : 'tag-accent'
                }`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description & Tailoring Action */}
      <div className="surface-card p-8 space-y-4">
        <div className="flex items-baseline justify-between pb-3 border-b border-[#D5D5CC] flex-wrap gap-4">
          <h3 className="font-serif text-2xl text-[#20251F]">Full Job Description</h3>
          <button
            onClick={() => onNavigateToResume(job.id)}
            className="btn-editorial btn-editorial-primary text-xs px-4 py-2"
          >
            <FileText size={14} strokeWidth={1.5} /> Tailor Resume for this Role
          </button>
        </div>
        <p className="text-xs sm:text-sm text-[#686C63] leading-relaxed whitespace-pre-line">
          {job.description}
        </p>
      </div>
    </div>
  );
};
