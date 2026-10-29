import React from 'react';
import {
  FileText,
  Search,
  Compass,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Code,
  ArrowRight
} from 'lucide-react';

interface HowItWorksPageProps {
  onNavigate: (tab: string) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate }) => {
  return (
    <div className="how-it-works-page space-y-12 pb-16">
      {/* Header */}
      <div className="pb-4 border-b border-[#D5D5CC]">
        <span className="section-num">System Overview & Evaluation Guide</span>
        <h1 className="font-serif text-4xl sm:text-5xl text-[#20251F] mt-1">
          How GigSync Works
        </h1>
        <p className="text-base text-[#686C63] mt-2 max-w-2xl">
          An explainable career workflow combining grounded resume extraction, transparent weighted matching, and staged skill-gap roadmaps.
        </p>
      </div>

      {/* 4 Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pillar 1 */}
        <div className="surface-card p-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D5D5CC]">
            <span className="font-mono text-xs text-[#D9534F] font-bold">Pillar 01</span>
            <span className="tag-mono">Grounded Extraction</span>
          </div>
          <h3 className="font-serif text-2xl text-[#20251F]">
            Truth-Grounded Profile Ingestion
          </h3>
          <p className="text-sm text-[#686C63] leading-relaxed">
            Uploaded resumes are parsed using deterministic heuristics. The system extracts contact coordinates, educational credentials, tech stack tokens, and project summaries.
          </p>
          <div className="p-3 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] text-xs font-mono space-y-1 text-[#686C63]">
            <div className="text-[#20251F] font-semibold">• Review-and-Correct step (FR-07)</div>
            <div>• Confidence scoring per extracted field</div>
            <div>• Zero-hallucination constraint enforcement (FR-12)</div>
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="surface-card p-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D5D5CC]">
            <span className="font-mono text-xs text-[#D9534F] font-bold">Pillar 02</span>
            <span className="tag-mono">Weighted Algorithm</span>
          </div>
          <h3 className="font-serif text-2xl text-[#20251F]">
            Transparent Relevance Scoring
          </h3>
          <p className="text-sm text-[#686C63] leading-relaxed">
            The matching algorithm evaluates candidate evidence against structured job description requirements using fixed, auditable weights.
          </p>
          <div className="p-3 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] text-xs font-mono space-y-1 text-[#686C63]">
            <div>• 50% Skills Overlap (Essential vs Preferred)</div>
            <div>• 25% Experience & Project Relevance</div>
            <div>• 15% Education Alignment</div>
            <div>• 10% Role Title Similarity</div>
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="surface-card p-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D5D5CC]">
            <span className="font-mono text-xs text-[#D9534F] font-bold">Pillar 03</span>
            <span className="tag-mono">Eligibility Safeguard</span>
          </div>
          <h3 className="font-serif text-2xl text-[#20251F]">
            Hard Constraint Segregation (FR-19)
          </h3>
          <p className="text-sm text-[#686C63] leading-relaxed">
            Work authorizations, residency requirements, and formal graduation timelines are decoupled from learnable skills.
          </p>
          <div className="p-3 bg-[#E8E7DF] border border-[#D5D5CC] rounded-[2px] text-xs text-[#20251F] space-y-1">
            <strong>Key Safeguard:</strong> The system will never imply an online course can resolve a legal work authorization requirement.
          </div>
        </div>

        {/* Pillar 4 */}
        <div className="surface-card p-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D5D5CC]">
            <span className="font-mono text-xs text-[#D9534F] font-bold">Pillar 04</span>
            <span className="tag-mono">LaTeX & Learning</span>
          </div>
          <h3 className="font-serif text-2xl text-[#20251F]">
            Compilable Output & Actionable Roadmaps
          </h3>
          <p className="text-sm text-[#686C63] leading-relaxed">
            Resumes are compiled into clean `.tex` source code protected by character escaping against injection, alongside interactive 3-stage course roadmaps.
          </p>
          <div className="p-3 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] text-xs font-mono space-y-1 text-[#686C63]">
            <div>• Multi-template support: Modern, Academic, Executive</div>
            <div>• Character escaping: %, $, &, _, #, braces, ~, ^, \</div>
            <div>• Verified course partners: Harvard, freeCodeCamp, MDN</div>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="surface-secondary p-8 border border-[#D5D5CC] flex flex-wrap items-center justify-between gap-6">
        <div>
          <h3 className="font-serif text-2xl text-[#20251F]">Ready to prepare your profile?</h3>
          <p className="text-sm text-[#686C63] mt-1">Start by uploading your resume or using the conversational assistant.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('resume')}
            className="btn-editorial btn-editorial-primary text-xs px-5 py-2.5"
          >
            Open Resume Studio <ArrowRight size={14} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => onNavigate('jobs')}
            className="btn-editorial btn-editorial-secondary text-xs px-5 py-2.5"
          >
            Explore Job Matches
          </button>
        </div>
      </div>
    </div>
  );
};
