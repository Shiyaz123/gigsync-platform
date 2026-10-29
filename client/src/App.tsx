import React, { useState, useEffect } from 'react';
import {
  CandidateProfile,
  JobListing,
  SavedJob,
  LearningRoadmap
} from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { ToastContainer, ToastMessage } from './components/Toast';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { ResumeStudioPage } from './pages/ResumeStudioPage';
import { JobDiscoveryPage } from './pages/JobDiscoveryPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { LearningRoadmapPage } from './pages/LearningRoadmapPage';
import { SettingsPrivacyPage } from './pages/SettingsPrivacyPage';

// Default starter profile in case of fresh launch
const INITIAL_PROFILE: CandidateProfile = {
  userId: 'usr_guest_demo',
  personalInfo: {
    fullName: 'Alex Morgan',
    email: 'alex.morgan@university.edu',
    phone: '+1 (555) 234-5678',
    location: 'San Jose, CA',
    title: 'Aspiring Software Engineer & Full-Stack Developer',
    summary: 'Final-year Computer Science student with practical experience building responsive web applications and RESTful APIs using TypeScript, React, and Node.js. Passionate about clean code, test-driven development, and scalable cloud architectures.',
    linkedin: 'https://linkedin.com/in/alexmorgan-dev',
    github: 'https://github.com/alexmorgan-dev',
    portfolio: 'https://alexmorgan.dev'
  },
  education: [
    {
      id: 'edu_1',
      institution: 'California State University',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science',
      startDate: '2022',
      endDate: '2026',
      gpa: '3.75 / 4.0',
      honors: 'Dean’s Honor List (Fall 2023, Spring 2024)',
      confirmed: true
    }
  ],
  experience: [
    {
      id: 'exp_1',
      company: 'NextGen Cloud Labs',
      role: 'Software Engineering Intern',
      location: 'Remote',
      startDate: 'Jun 2025',
      endDate: 'Aug 2025',
      current: false,
      bullets: [
        'Developed interactive dashboard components using React, TypeScript, and CSS modules, cutting dashboard load time by 18%.',
        'Implemented secure RESTful endpoints in Node.js/Express for user telemetry and activity logging with PostgreSQL.',
        'Collaborated with senior engineers in an Agile sprint cycle, participating in code reviews and automated CI pipeline checks.'
      ],
      confirmed: true
    }
  ],
  projects: [
    {
      id: 'proj_1',
      title: 'DevPulse - Developer Productivity Tracker',
      role: 'Lead Developer',
      techStack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
      description: 'Full-stack web application tracking sprint velocity, GitHub commit trends, and task completion metrics.',
      bullets: [
        'Engineered responsive single-page application using React 18 and state management hooks.',
        'Built backend REST API handling authentication, webhook events, and relational queries in PostgreSQL.',
        'Integrated GitHub REST API to automatically sync and visualize repository contribution metrics.'
      ],
      liveUrl: 'https://devpulse-demo.app',
      repoUrl: 'https://github.com/alexmorgan-dev/devpulse',
      confirmed: true
    },
    {
      id: 'proj_2',
      title: 'SmartQuery - Natural Language SQL Assistant',
      role: 'Full Stack Creator',
      techStack: ['Python', 'FastAPI', 'SQLite', 'HTML5', 'CSS3'],
      description: 'Educational tool converting natural language queries into verified SQL statements with visual schema breakdown.',
      bullets: [
        'Designed lightweight FastAPI service parsing incoming schema definitions and generating syntax-validated queries.',
        'Implemented interactive query playground with query execution plan visualization.'
      ],
      liveUrl: 'https://smartquery.app',
      repoUrl: 'https://github.com/alexmorgan-dev/smartquery',
      confirmed: true
    }
  ],
  skills: {
    technical: ['JavaScript', 'TypeScript', 'Python', 'SQL', 'HTML5', 'CSS3', 'Git'],
    frameworks: ['React', 'Node.js', 'Express', 'FastAPI'],
    tools: ['PostgreSQL', 'SQLite', 'VS Code', 'Postman', 'Linux / Bash'],
    soft: ['Agile / Scrum', 'Technical Writing', 'Problem Solving', 'Collaborative Code Review']
  },
  certifications: [
    {
      id: 'cert_1',
      name: 'Meta Front-End Developer Professional Certificate',
      issuer: 'Coursera / Meta',
      issueDate: 'Jan 2025',
      credentialUrl: 'https://coursera.org/verify/professional-cert/meta-frontend',
      confirmed: true
    }
  ],
  careerPreferences: {
    targetRoles: ['Junior Full-Stack Developer', 'Frontend Engineer', 'Junior Software Engineer'],
    workModes: ['Remote', 'Hybrid'],
    targetLocations: ['San Francisco, CA', 'Remote US', 'San Jose, CA'],
    minSalary: '$75,000'
  },
  confirmedFactsOnly: true,
  lastConfirmedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [profile, setProfile] = useState<CandidateProfile>(INITIAL_PROFILE);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initial Data Fetch
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // Load guest session / profile
      const authData = await api.getGuestSession().catch(() => null);
      if (authData?.profile) {
        setProfile(authData.profile);
      }

      // Load jobs
      const jobsData = await api.getJobs().catch(() => []);
      setJobs(jobsData);

      // Load saved jobs
      const saved = await api.getSavedJobs().catch(() => []);
      setSavedJobs(saved);

      // Load roadmap
      const rd = await api.getRoadmap().catch(() => null);
      setRoadmap(rd);
    } catch (err) {
      console.warn('Backend loading in progress, operating in resilient mode.', err);
    }
  };

  const showToast = (title: string, message?: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleResetDemo = () => {
    setProfile(JSON.parse(JSON.stringify(INITIAL_PROFILE)));
    api.updateProfile(INITIAL_PROFILE).catch(() => {});
    showToast('Demo State Reloaded', 'Clean verified student profile loaded for evaluation.', 'success');
  };

  const handleToggleSaveJob = async (jobId: string) => {
    const isAlreadySaved = savedJobs.some(sj => sj.jobId === jobId);
    try {
      if (isAlreadySaved) {
        await api.removeSavedJob(jobId);
        setSavedJobs(prev => prev.filter(sj => sj.jobId !== jobId));
        showToast('Job Removed', 'Removed from your saved pipeline.', 'info');
      } else {
        const saved = await api.saveJob(jobId, 'interested');
        setSavedJobs(prev => [saved, ...prev]);
        showToast('Job Saved!', 'Added to your application pipeline.', 'success');
      }
    } catch (err: any) {
      showToast('Action Failed', err.message || 'Could not update saved job.', 'error');
    }
  };

  const handleNavigate = (tab: string, context?: any) => {
    if (context?.jobId) {
      setSelectedJobId(context.jobId);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      {/* Top Sticky Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        theme={theme}
        toggleTheme={toggleTheme}
        isGuest={true}
        onResetDemo={handleResetDemo}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {currentTab === 'dashboard' && (
          <DashboardPage
            profile={profile}
            jobs={jobs}
            savedJobs={savedJobs}
            roadmap={roadmap}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'profile' && (
          <ProfilePage
            profile={profile}
            onUpdateProfile={(updated) => {
              setProfile(updated);
              // Refresh job match scores with updated profile
              api.getJobs().then(setJobs).catch(() => {});
            }}
            showToast={showToast}
          />
        )}

        {currentTab === 'resume' && (
          <ResumeStudioPage
            profile={profile}
            jobs={jobs}
            targetJobId={selectedJobId}
            showToast={showToast}
          />
        )}

        {currentTab === 'jobs' && (
          <JobDiscoveryPage
            jobs={jobs}
            savedJobs={savedJobs}
            onToggleSaveJob={handleToggleSaveJob}
            onSelectJob={(jobId) => handleNavigate('job-detail', { jobId })}
          />
        )}

        {currentTab === 'job-detail' && selectedJobId && (
          <JobDetailPage
            jobId={selectedJobId}
            profile={profile}
            onBack={() => setCurrentTab('jobs')}
            onNavigateToRoadmap={async (jobId, roleTitle, missingSkills) => {
              try {
                const generated = await api.generateRoadmap(jobId, roleTitle, missingSkills);
                setRoadmap(generated);
                showToast('Roadmap Generated', `Targeted learning plan created for ${roleTitle}.`, 'success');
                setCurrentTab('roadmap');
              } catch (err) {
                setCurrentTab('roadmap');
              }
            }}
            onNavigateToResume={(jobId) => {
              setSelectedJobId(jobId);
              setCurrentTab('resume');
            }}
            isSaved={savedJobs.some(sj => sj.jobId === selectedJobId)}
            onToggleSave={handleToggleSaveJob}
          />
        )}

        {currentTab === 'roadmap' && (
          <LearningRoadmapPage
            roadmap={roadmap || {
              id: 'roadmap_empty',
              userId: profile.userId,
              targetRole: 'Junior Full-Stack Developer',
              stages: [],
              updatedAt: new Date().toISOString()
            }}
            onUpdateRoadmap={setRoadmap}
            showToast={showToast}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsPrivacyPage
            onDataReset={() => {
              setProfile(INITIAL_PROFILE);
              setSavedJobs([]);
              initializeData();
            }}
            showToast={showToast}
          />
        )}
      </main>

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
