import React from 'react';
import {
  ArrowRight,
  Upload,
  Bot,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Briefcase,
  Compass,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { CandidateProfile } from '../types';

interface LandingPageProps {
  profile: CandidateProfile;
  onNavigate: (tab: string, context?: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  profile,
  onNavigate
}) => {
  return (
    <div className="landing-page space-y-20 pb-16">
      {/* Editorial Asymmetric Hero Section */}
      <section className="pt-8 pb-12 border-b border-[#D5D5CC]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Strong Headline & Core Positioning */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 font-mono text-xs text-[#D9534F] font-semibold tracking-wider uppercase bg-[#E8E7DF] px-2.5 py-1 border border-[#D5D5CC] rounded-[2px]">
              Final-Year Engineering Project • Release 1.0
            </div>

            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.08] text-[#20251F] font-normal">
              Your next role starts with what you know.
            </h1>

            <p className="text-lg sm:text-xl text-[#686C63] max-w-xl leading-relaxed font-normal">
              Build a stronger resume, find jobs that fit, and learn the skills that move you forward.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onNavigate('resume')}
                className="btn-editorial btn-editorial-primary text-sm px-6 py-3"
              >
                Build my resume <ArrowRight size={16} strokeWidth={1.5} />
              </button>

              <button
                onClick={() => onNavigate('how-it-works')}
                className="btn-editorial btn-editorial-outline text-sm px-5 py-3"
              >
                Explore how it works
              </button>
            </div>

            {/* Grounding Commitment Footnote */}
            <div className="pt-4 flex items-center gap-2 text-xs text-[#686C63] font-mono">
              <ShieldCheck size={15} strokeWidth={1.5} className="text-[#20251F]" />
              <span>Grounded in confirmed candidate facts. Zero fabricated achievements or metrics.</span>
            </div>
          </div>

          {/* Right Column: Real Application Interface Preview */}
          <div className="lg:col-span-5">
            <div className="surface-card p-6 border border-[#D5D5CC] bg-[#FFFFFF] shadow-sm space-y-5">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#D5D5CC]">
                <div className="flex items-center gap-2 font-mono text-xs uppercase text-[#686C63]">
                  <span className="w-2 h-2 rounded-full bg-[#D9534F]"></span>
                  Live Match Analysis
                </div>
                <span className="tag-mono text-[#20251F] bg-[#E8E7DF]">
                  Role: Junior Full-Stack
                </span>
              </div>

              {/* Relevance Score Display */}
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="font-mono text-3xl font-bold text-[#20251F]">
                    88<span className="text-base text-[#686C63] font-normal">/100</span>
                  </div>
                  <div className="text-xs text-[#686C63] font-sans mt-0.5">
                    Profile evidence alignment
                  </div>
                </div>
                <span className="tag-mono tag-accent">
                  Strong Match
                </span>
              </div>

              {/* Evidence Breakdown Snippet */}
              <div className="space-y-2.5 pt-1">
                <div className="text-xs font-mono uppercase text-[#686C63] tracking-wide">
                  Evidence breakdown
                </div>

                <div className="p-2.5 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] flex items-start gap-2.5">
                  <CheckCircle2 size={16} strokeWidth={1.5} className="text-[#20251F] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-semibold text-[#20251F]">React & TypeScript</span>
                    <p className="text-[#686C63]">Verified in Skills and DevPulse project repository.</p>
                  </div>
                </div>

                <div className="p-2.5 bg-[#E8E7DF] border border-[#D5D5CC] rounded-[2px] flex items-start gap-2.5">
                  <AlertTriangle size={16} strokeWidth={1.5} className="text-[#D9534F] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-semibold text-[#20251F]">Docker (Essential Gap)</span>
                    <p className="text-[#686C63]">Identified in job requirements. Course roadmap ready.</p>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full btn-editorial btn-editorial-secondary text-xs py-2 flex items-center justify-between"
              >
                <span>Inspect complete candidate dashboard</span>
                <ChevronRight size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Two Clear Resume Entry Paths (Step 1) */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between flex-wrap gap-4 pb-2 border-b border-[#D5D5CC]">
          <div>
            <span className="section-num">01 / Getting Started</span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#20251F] mt-1">
              Two paths to a truthful profile.
            </h2>
          </div>
          <p className="text-sm text-[#686C63] max-w-md">
            Both workflows produce the same structured candidate profile and compilable LaTeX output.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Option A: Upload Existing Resume */}
          <div className="surface-card p-8 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 border border-[#D5D5CC] bg-[#E8E7DF] flex items-center justify-center rounded-[2px]">
                <Upload size={20} strokeWidth={1.5} className="text-[#20251F]" />
              </div>
              <h3 className="font-serif text-2xl text-[#20251F]">
                Option A: Upload your existing resume
              </h3>
              <p className="text-sm text-[#686C63] leading-relaxed">
                Paste your resume text or document content. The parser extracts your education, technical stack, projects, and employment history with review flags for uncertain fields.
              </p>
              <ul className="text-xs space-y-2 text-[#686C63] font-mono pt-2">
                <li>• Instant contact and skill extraction</li>
                <li>• Review-and-correct verification modal</li>
                <li>• Zero fabricated qualifications</li>
              </ul>
            </div>

            <button
              onClick={() => onNavigate('profile')}
              className="btn-editorial btn-editorial-secondary w-full text-sm py-2.5 mt-4"
            >
              Upload or paste resume <ArrowRight size={15} strokeWidth={1.5} />
            </button>
          </div>

          {/* Option B: Build with AI Assistant */}
          <div className="surface-card p-8 space-y-5 flex flex-col justify-between bg-[#E8E7DF] border-[#20251F]">
            <div className="space-y-4">
              <div className="w-10 h-10 border border-[#20251F] bg-[#20251F] text-[#F5F3EE] flex items-center justify-center rounded-[2px]">
                <Bot size={20} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-2xl text-[#20251F]">
                Option B: Build a resume with AI
              </h3>
              <p className="text-sm text-[#686C63] leading-relaxed">
                Walk through an interactive, step-by-step assistant. Answer guided questions about your coursework, technical tools, and projects, with relevant follow-ups to highlight your actual work.
              </p>
              <ul className="text-xs space-y-2 text-[#686C63] font-mono pt-2">
                <li>• Guided conversational questions</li>
                <li>• Follow-up prompts when details are sparse</li>
                <li>• Generates compilable LaTeX and PDF source</li>
              </ul>
            </div>

            <button
              onClick={() => onNavigate('ai-assistant')}
              className="btn-editorial btn-editorial-dark w-full text-sm py-2.5 mt-4"
            >
              Start conversational assistant <ArrowRight size={15} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </section>

      {/* Editorial Grid: The 4 Core Workflow Pillars */}
      <section className="space-y-8 pt-6">
        <div className="pb-2 border-b border-[#D5D5CC]">
          <span className="section-num">02 / Architecture & Workflow</span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#20251F] mt-1">
            Engineered for precision at every step.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-[#FFFFFF] border border-[#D5D5CC] rounded-[2px] space-y-3">
            <span className="font-mono text-xs text-[#D9534F] font-bold">01</span>
            <h4 className="font-serif text-xl text-[#20251F]">Truth-Grounded Profile</h4>
            <p className="text-xs text-[#686C63] leading-relaxed">
              Maintains user-confirmed facts as ground truth. Distinguishes verified achievements from wording polish.
            </p>
          </div>

          <div className="p-6 bg-[#FFFFFF] border border-[#D5D5CC] rounded-[2px] space-y-3">
            <span className="font-mono text-xs text-[#D9534F] font-bold">02</span>
            <h4 className="font-serif text-xl text-[#20251F]">Transparent Alignment</h4>
            <p className="text-xs text-[#686C63] leading-relaxed">
              Weighted scoring evaluates skills, projects, and coursework against job descriptions with proof citations.
            </p>
          </div>

          <div className="p-6 bg-[#FFFFFF] border border-[#D5D5CC] rounded-[2px] space-y-3">
            <span className="font-mono text-xs text-[#D9534F] font-bold">03</span>
            <h4 className="font-serif text-xl text-[#20251F]">Constraint Segregation</h4>
            <p className="text-xs text-[#686C63] leading-relaxed">
              Work authorizations, licenses, and graduation dates are reported separately from learnable technical skills.
            </p>
          </div>

          <div className="p-6 bg-[#FFFFFF] border border-[#D5D5CC] rounded-[2px] space-y-3">
            <span className="font-mono text-xs text-[#D9534F] font-bold">04</span>
            <h4 className="font-serif text-xl text-[#20251F]">Actionable Roadmaps</h4>
            <p className="text-xs text-[#686C63] leading-relaxed">
              Missing essential skills map directly to verified courses from Harvard CS50, freeCodeCamp, and Docker Docs.
            </p>
          </div>
        </div>
      </section>

      {/* Dark Footer Statement Section */}
      <section className="surface-dark p-10 sm:p-14 space-y-6">
        <div className="max-w-3xl space-y-4">
          <span className="font-mono text-xs text-[#D9534F] uppercase tracking-widest font-semibold">
            Responsible AI Positioning
          </span>
          <h3 className="font-serif text-3xl sm:text-4xl text-[#F5F3EE] font-normal leading-tight">
            GigSync supports career preparation. It does not automate hiring decisions or invent qualifications.
          </h3>
          <p className="text-sm text-[#E8E7DF]/75 leading-relaxed">
            Every candidate deserves transparent feedback on how their actual coursework and projects compare with real employer expectations.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap gap-4">
          <button
            onClick={() => onNavigate('jobs')}
            className="btn-editorial btn-editorial-primary text-xs px-5 py-2.5"
          >
            Find jobs for me <ArrowRight size={14} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => onNavigate('how-it-works')}
            className="btn-editorial btn-editorial-outline border-[#D5D5CC] text-[#F5F3EE] hover:bg-[#F5F3EE]/10 text-xs px-5 py-2.5"
          >
            Review documentation
          </button>
        </div>
      </section>
    </div>
  );
};
