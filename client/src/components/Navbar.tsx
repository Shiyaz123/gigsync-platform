import React from 'react';
import {
  Sparkles,
  LayoutDashboard,
  UserCheck,
  FileText,
  Briefcase,
  Compass,
  MapPin,
  Moon,
  Sun,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  isGuest: boolean;
  onResetDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  theme,
  toggleTheme,
  isGuest,
  onResetDemo
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile & Extraction', icon: UserCheck },
    { id: 'resume', label: 'Resume Studio', icon: FileText },
    { id: 'jobs', label: 'Job Discovery', icon: Briefcase },
    { id: 'roadmap', label: 'Learning Roadmap', icon: Compass },
    { id: 'settings', label: 'Privacy & Data', icon: ShieldCheck }
  ];

  return (
    <header className="navbar no-print">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="brand" onClick={() => setCurrentTab('dashboard')}>
          <div className="brand-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <span>GigSync</span>
            <span style={{ fontSize: '0.68rem', display: 'block', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Career Intelligence
            </span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="nav-links">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setCurrentTab(item.id)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Actions & Utilities */}
        <div className="nav-actions">
          {isGuest && (
            <span className="badge badge-primary" title="Exploring in guest evaluation mode">
              Guest Demo
            </span>
          )}

          <button
            className="btn btn-outline btn-sm"
            onClick={onResetDemo}
            title="Reload realistic demo student profile"
          >
            Reset Demo
          </button>

          <button
            className="btn-icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Mobile hamburger */}
          <button
            className="btn-icon mobile-only"
            style={{ display: 'none' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
};
