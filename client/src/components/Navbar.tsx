import React from 'react';
import {
  FileText,
  Briefcase,
  Compass,
  UserCheck,
  Bot,
  ShieldCheck,
  RotateCcw,
  ArrowLeft,
  Zap
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isGuest: boolean;
  isDemoMode: boolean;
  onEnterDemo: () => void;
  onExitDemo: () => void;
  onResetDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  isGuest,
  isDemoMode,
  onEnterDemo,
  onExitDemo,
  onResetDemo
}) => {
  const isHomepage = currentTab === 'landing';

  const workspaceNavItems = [
    { id: 'ai-assistant', label: 'Build Resume with AI', icon: Bot },
    { id: 'resume', label: 'Resume Studio', icon: FileText },
    { id: 'jobs', label: 'Find Jobs', icon: Briefcase },
    { id: 'roadmap', label: 'Roadmap', icon: Compass },
    { id: 'profile', label: 'Profile', icon: UserCheck }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#F5F3EE] border-b border-[#D5D5CC] no-print">
      <div className="max-w-[1340px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Wordmark */}
        <div
          className="flex items-baseline gap-3 cursor-pointer group shrink-0"
          onClick={() => setCurrentTab('landing')}
        >
          <span className="font-serif text-2xl font-bold tracking-tight text-[#20251F] group-hover:text-[#D9534F] transition-colors">
            GigSync
          </span>
          <span className="font-mono text-[11px] text-[#686C63] tracking-widest uppercase hidden lg:inline-block">
            / Career Workspace
          </span>
        </div>

        {/* Workspace Navigation */}
        {!isHomepage ? (
          <nav className="flex items-center gap-1 overflow-x-auto py-1">
            <button
              onClick={() => setCurrentTab('landing')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-medium text-[#686C63] hover:text-[#20251F] transition-colors shrink-0"
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              <span className="hidden sm:inline">Home</span>
            </button>

            {workspaceNavItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-medium transition-all shrink-0 ${
                    isActive
                      ? 'text-[#20251F] border-b-2 border-[#D9534F] font-semibold'
                      : 'text-[#686C63] hover:text-[#20251F]'
                  }`}
                >
                  <Icon size={15} strokeWidth={1.5} className={isActive ? 'text-[#D9534F]' : ''} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        ) : (
          <div className="hidden md:block text-xs font-mono text-[#686C63]">
            Final-Year Capstone Career Assistance Platform
          </div>
        )}

        {/* Right Utility & Demo Mode Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {!isDemoMode ? (
            <button
              onClick={onEnterDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-mono font-semibold rounded-[2px] bg-[#20251F] text-[#F5F3EE] hover:bg-[#D9534F] border border-[#20251F] hover:border-[#D9534F] shadow-sm transition-all"
              title="Launch complete presentation demo mode with Alex Morgan (Bengaluru, Software Engineer)"
            >
              <Zap size={13} className="text-[#F1C40F] fill-[#F1C40F]" />
              <span>⚡ Demo Mode</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-[#FFF9E6] border border-[#D4A373] text-[#6B4B1B] rounded-[2px] text-xs font-mono shadow-sm">
              <span className="flex items-center gap-1.5 font-semibold text-[#8C5E1A]">
                <span className="h-2 w-2 rounded-full bg-[#E67E22] animate-pulse"></span>
                <span className="hidden sm:inline">DEMO: Alex Morgan</span>
                <span className="sm:hidden">DEMO</span>
              </span>
              <span className="text-[#D5D5CC]">|</span>
              <button
                onClick={onResetDemo}
                className="flex items-center gap-1 text-[#20251F] hover:text-[#D9534F] hover:underline transition-colors"
                title="Reset demo to pristine Alex Morgan profile"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
              <span className="text-[#D5D5CC]">|</span>
              <button
                onClick={onExitDemo}
                className="font-semibold text-[#D9534F] hover:underline transition-colors"
                title="Exit demo mode and restore your workspace data"
              >
                Exit
              </button>
            </div>
          )}

          <button
            onClick={() => setCurrentTab('settings')}
            className={`p-1.5 rounded-[2px] border transition-colors ${
              currentTab === 'settings'
                ? 'border-[#D9534F] text-[#D9534F] bg-[#E8E7DF]'
                : 'border-[#D5D5CC] text-[#686C63] hover:text-[#20251F] hover:border-[#20251F]'
            }`}
            title="Privacy & Data Governance"
          >
            <ShieldCheck size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
};
