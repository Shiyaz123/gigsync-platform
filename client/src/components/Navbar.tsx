import React from 'react';
import {
  FileText,
  Briefcase,
  Compass,
  UserCheck,
  LayoutDashboard,
  Bot,
  Info,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isGuest: boolean;
  onResetDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  isGuest,
  onResetDemo
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'resume', label: 'Resume Studio', icon: FileText },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
    { id: 'profile', label: 'Profile & Upload', icon: UserCheck },
    { id: 'jobs', label: 'Find Jobs', icon: Briefcase },
    { id: 'roadmap', label: 'Roadmap', icon: Compass },
    { id: 'how-it-works', label: 'How it Works', icon: Info }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#F5F3EE] border-b border-[#D5D5CC] no-print">
      <div className="max-w-[1340px] mx-auto px-6 h-16 flex items-center justify-between gap-6">
        {/* Brand Wordmark */}
        <div
          className="flex items-baseline gap-3 cursor-pointer group"
          onClick={() => setCurrentTab('landing')}
        >
          <span className="font-serif text-2xl font-bold tracking-tight text-[#20251F] group-hover:text-[#D9534F] transition-colors">
            GigSync
          </span>
          <span className="font-mono text-[11px] text-[#686C63] tracking-widest uppercase hidden sm:inline-block">
            / Career Workspace
          </span>
        </div>

        {/* Editorial Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium transition-all ${
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

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {isGuest && (
            <span className="tag-mono hidden lg:inline-block text-[#686C63]">
              Demo Mode
            </span>
          )}

          <button
            onClick={onResetDemo}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-mono border border-[#D5D5CC] bg-[#E8E7DF] text-[#20251F] hover:border-[#20251F] transition-colors rounded-[2px]"
            title="Reset verified demo student profile"
          >
            <RotateCcw size={12} strokeWidth={1.5} />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>

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

          <button
            onClick={() => setCurrentTab('resume')}
            className="btn-editorial btn-editorial-primary text-xs py-1.5 px-3"
          >
            Build Resume
          </button>
        </div>
      </div>
    </header>
  );
};
