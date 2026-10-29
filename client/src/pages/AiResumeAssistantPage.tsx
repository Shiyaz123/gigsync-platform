import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  User,
  CheckCircle2,
  FileText,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { CandidateProfile } from '../types';
import { api } from '../services/api';

interface AiResumeAssistantPageProps {
  profile: CandidateProfile;
  onApplyProfile: (updated: CandidateProfile) => void;
  onNavigate: (tab: string, context?: any) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const AiResumeAssistantPage: React.FC<AiResumeAssistantPageProps> = ({
  profile,
  onApplyProfile,
  onNavigate,
  showToast
}) => {
  const [messages, setMessages] = useState<Array<{ id: string; sender: 'assistant' | 'user'; text: string; quickReplies?: string[] }>>([]);
  const [inputText, setInputText] = useState('');
  const [assistantState, setAssistantState] = useState<any>(null);
  const [draftProfile, setDraftProfile] = useState<CandidateProfile>(JSON.parse(JSON.stringify(profile)));
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize conversation with assistant
  useEffect(() => {
    initializeAssistant();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const initializeAssistant = async () => {
    setIsTyping(true);
    try {
      const res = await api.aiResumeAssistant();
      setAssistantState(res.state);
      setMessages([
        {
          id: res.reply.id || 'welcome',
          sender: 'assistant',
          text: res.reply.text,
          quickReplies: res.reply.suggestedQuickReplies
        }
      ]);
    } catch (err) {
      console.warn('Using local assistant engine');
      setMessages([
        {
          id: 'local_init',
          sender: 'assistant',
          text: 'Welcome to the GigSync AI Resume Assistant. I will guide you through structuring your confirmed education, skills, and projects without fabricating details. What is your full name and target role?',
          quickReplies: [`${profile.personalInfo.fullName} - ${profile.personalInfo.title}`, 'Junior Software Engineer']
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;
    const userMsg = { id: `user_${Date.now()}`, sender: 'user' as const, text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await api.aiResumeAssistant(textToSend, assistantState);
      setAssistantState(res.state);

      if (res.state.draftProfile) {
        setDraftProfile(prev => ({
          ...prev,
          ...res.state.draftProfile,
          personalInfo: {
            ...prev.personalInfo,
            ...(res.state.draftProfile.personalInfo || {})
          },
          education: res.state.draftProfile.education?.length ? res.state.draftProfile.education : prev.education,
          skills: res.state.draftProfile.skills?.technical?.length ? res.state.draftProfile.skills : prev.skills,
          projects: res.state.draftProfile.projects?.length ? res.state.draftProfile.projects : prev.projects,
          experience: res.state.draftProfile.experience !== undefined ? res.state.draftProfile.experience : prev.experience
        }));
      }

      setMessages(prev => [
        ...prev,
        {
          id: res.reply.id || `reply_${Date.now()}`,
          sender: 'assistant',
          text: res.reply.text,
          quickReplies: res.reply.suggestedQuickReplies
        }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmAndFindJobs = async () => {
    try {
      const confirmed = {
        ...draftProfile,
        confirmedFactsOnly: true,
        lastConfirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await api.updateProfile(confirmed);
      onApplyProfile(confirmed);
      showToast('Profile Confirmed', 'Your resume has been saved. Discovering relevant jobs...', 'success');
      onNavigate('jobs');
    } catch (err: any) {
      showToast('Error', err.message || 'Could not save profile.', 'error');
    }
  };

  const handleConfirmAndFinish = async () => {
    try {
      const confirmed = {
        ...draftProfile,
        confirmedFactsOnly: true,
        lastConfirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await api.updateProfile(confirmed);
      onApplyProfile(confirmed);
      showToast('Profile Confirmed', 'Your assistant-structured resume is ready in Resume Studio.', 'success');
      onNavigate('resume');
    } catch (err: any) {
      showToast('Error', err.message || 'Could not save profile.', 'error');
    }
  };

  return (
    <div className="ai-resume-assistant-page space-y-6">
      {/* Header */}
      <div className="flex items-baseline justify-between pb-4 border-b border-[#D5D5CC] flex-wrap gap-4">
        <div>
          <span className="section-num">Workflow Step 01 / Option B</span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#20251F] mt-1">
            Build Resume with AI Assistant
          </h1>
          <p className="text-sm text-[#686C63] mt-1">
            Guided conversational builder. Answers are verified and mapped into clean LaTeX sections without hallucinated metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleConfirmAndFinish}
            className="btn-editorial btn-editorial-outline text-xs px-3.5 py-2"
          >
            Preview Resume
          </button>
          <button
            onClick={handleConfirmAndFindJobs}
            className="btn-editorial btn-editorial-primary text-xs px-4 py-2 font-semibold flex items-center gap-2"
          >
            <span>Find Jobs for Me</span>
            <ArrowRight size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Chat Flow */}
        <div className="lg:col-span-7 surface-card bg-[#FFFFFF] border border-[#D5D5CC] flex flex-col h-[640px]">
          {/* Chat Header */}
          <div className="px-5 py-3 border-b border-[#D5D5CC] bg-[#E8E7DF] flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-2 text-[#20251F] font-semibold">
              <Bot size={15} strokeWidth={1.5} className="text-[#D9534F]" />
              GigSync Guided Assistant
            </span>
            <span className="text-[#686C63]">
              Anti-Hallucination Grounding Active
            </span>
          </div>

          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map(m => (
              <div
                key={m.id}
                className={`flex gap-3 text-sm leading-relaxed ${
                  m.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-[2px] bg-[#20251F] text-[#F5F3EE] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={14} strokeWidth={1.5} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] p-3.5 rounded-[2px] text-xs sm:text-sm ${
                    m.sender === 'user'
                      ? 'bg-[#20251F] text-[#F5F3EE]'
                      : 'bg-[#F5F3EE] border border-[#D5D5CC] text-[#20251F]'
                  }`}
                >
                  <p>{m.text}</p>

                  {/* Suggested Quick Replies */}
                  {m.quickReplies && m.quickReplies.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-[#D5D5CC] flex flex-wrap gap-2">
                      {m.quickReplies.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(q)}
                          className="px-2.5 py-1 text-xs font-mono bg-[#E8E7DF] hover:bg-[#D5D5CC] text-[#20251F] border border-[#D5D5CC] rounded-[2px] transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-[2px] bg-[#E8E7DF] text-[#20251F] border border-[#D5D5CC] flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs">
                    You
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs font-mono text-[#686C63] pl-10">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D9534F] animate-pulse"></span>
                Processing verified response...
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-[#D5D5CC] bg-[#F5F3EE]">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="flex gap-2"
            >
              <input
                className="input-editorial text-xs sm:text-sm"
                placeholder="Type your answer (e.g. university details, tech stack, project bullets)..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="btn-editorial btn-editorial-primary text-xs px-4"
              >
                <Send size={14} strokeWidth={1.5} />
              </button>
            </form>
          </div>
        </div>

        {/* Right: Live Assembled Profile State Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="surface-card bg-[#FFFFFF] border border-[#D5D5CC] p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#D5D5CC]">
              <div className="flex items-center gap-2 font-mono text-xs uppercase text-[#686C63]">
                <FileText size={14} strokeWidth={1.5} className="text-[#20251F]" />
                Live Assembled Profile
              </div>
              <span className="tag-mono text-[#20251F] bg-[#E8E7DF]">
                Step: {assistantState?.currentStep || 'In Progress'}
              </span>
            </div>

            {/* Candidate Identity */}
            <div className="space-y-1">
              <div className="font-serif text-2xl text-[#20251F]">
                {draftProfile.personalInfo.fullName || 'Candidate Name'}
              </div>
              <div className="text-xs text-[#686C63] font-mono">
                {draftProfile.personalInfo.title || 'Software Engineering Candidate'} • {draftProfile.personalInfo.location || 'Location'}
              </div>
            </div>

            {/* Structured Education */}
            <div className="space-y-2 pt-2 border-t border-[#D5D5CC]">
              <div className="text-xs font-mono uppercase text-[#686C63]">Education</div>
              {draftProfile.education.length > 0 ? (
                draftProfile.education.map(e => (
                  <div key={e.id} className="text-xs space-y-0.5">
                    <div className="font-semibold text-[#20251F]">{e.institution}</div>
                    <div className="text-[#686C63]">{e.degree} in {e.fieldOfStudy} ({e.endDate})</div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#686C63] italic">Pending response...</div>
              )}
            </div>

            {/* Structured Skills */}
            <div className="space-y-2 pt-2 border-t border-[#D5D5CC]">
              <div className="text-xs font-mono uppercase text-[#686C63]">Identified Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {[...draftProfile.skills.technical, ...draftProfile.skills.frameworks, ...draftProfile.skills.tools].map(s => (
                  <span key={s} className="tag-mono text-[11px] bg-[#E8E7DF] text-[#20251F]">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Key Project */}
            <div className="space-y-2 pt-2 border-t border-[#D5D5CC]">
              <div className="text-xs font-mono uppercase text-[#686C63]">Featured Technical Project</div>
              {draftProfile.projects.length > 0 ? (
                <div className="text-xs space-y-1 bg-[#F5F3EE] p-3 border border-[#D5D5CC] rounded-[2px]">
                  <div className="font-semibold text-[#20251F]">{draftProfile.projects[0].title}</div>
                  <div className="text-[11px] font-mono text-[#D9534F]">{draftProfile.projects[0].techStack.join(', ')}</div>
                  <p className="text-[#686C63] text-[11px] line-clamp-2">{draftProfile.projects[0].description}</p>
                </div>
              ) : (
                <div className="text-xs text-[#686C63] italic">Pending response...</div>
              )}
            </div>

            {/* Completion Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleConfirmAndFindJobs}
                className="btn-editorial btn-editorial-primary w-full text-xs py-3 flex items-center justify-center gap-2 font-semibold shadow-sm"
              >
                <span>Find Jobs for Me</span>
                <ArrowRight size={14} strokeWidth={2} />
              </button>

              <button
                onClick={handleConfirmAndFinish}
                className="btn-editorial btn-editorial-secondary w-full text-xs py-2 flex items-center justify-center gap-1.5"
              >
                <span>Preview in Resume Studio</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
