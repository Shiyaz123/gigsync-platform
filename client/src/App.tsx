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
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { ResumeStudioPage } from './pages/ResumeStudioPage';
import { AiResumeAssistantPage } from './pages/AiResumeAssistantPage';
import { JobDiscoveryPage } from './pages/JobDiscoveryPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { LearningRoadmapPage } from './pages/LearningRoadmapPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { SettingsPrivacyPage } from './pages/SettingsPrivacyPage';
import { ALEX_MORGAN_DEMO_PROFILE, CLEAN_EMPTY_PROFILE } from './data/demoProfile';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('gigsync_demo_active') === 'true';
  });
  const [profile, setProfile] = useState<CandidateProfile>(() => {
    const isDemo = localStorage.getItem('gigsync_demo_active') === 'true';
    if (isDemo) {
      return JSON.parse(JSON.stringify(ALEX_MORGAN_DEMO_PROFILE));
    }
    const saved = localStorage.getItem('gigsync_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return JSON.parse(JSON.stringify(CLEAN_EMPTY_PROFILE));
  });
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      const isDemo = localStorage.getItem('gigsync_demo_active') === 'true';
      let activeProfile = profile;

      if (isDemo) {
        activeProfile = JSON.parse(JSON.stringify(ALEX_MORGAN_DEMO_PROFILE));
        setProfile(activeProfile);
        api.activateDemo().catch(() => {});
      } else {
        const authData = await api.getGuestSession().catch(() => null);
        if (authData?.profile && authData.profile.personalInfo?.fullName) {
          setProfile(authData.profile);
          activeProfile = authData.profile;
        }
      }

      const prefLoc = activeProfile.personalInfo?.location || activeProfile.careerPreferences?.targetLocations?.[0] || '';
      const prefRole = activeProfile.personalInfo?.title || activeProfile.careerPreferences?.targetRoles?.[0] || 'Software Engineer';

      if (prefLoc || prefRole) {
        const jobsData = await api.getJobs({ location: prefLoc, role: prefRole }).catch(() => []);
        setJobs(jobsData);
      }

      const saved = await api.getSavedJobs().catch(() => []);
      setSavedJobs(saved);

      const rd = await api.getRoadmap().catch(() => null);
      setRoadmap(rd);
    } catch (err) {
      console.warn('Operating in resilient mode.', err);
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

  // Enter Presentation Demo Mode
  const handleEnterDemo = async () => {
    try {
      // 1. Isolate and safely back up the normal user's profile
      if (!isDemoMode) {
        localStorage.setItem('gigsync_user_backup', JSON.stringify(profile));
      }
      setIsDemoMode(true);
      localStorage.setItem('gigsync_demo_active', 'true');

      // 2. Load pristine Alex Morgan profile
      const demoData = JSON.parse(JSON.stringify(ALEX_MORGAN_DEMO_PROFILE));
      setProfile(demoData);

      // 3. Inform server to activate demo sandbox
      await api.activateDemo().catch(() => {});

      // 4. Fetch genuine job opportunities in Alex Morgan's location
      const demoLoc = demoData.personalInfo.location; // Bengaluru, Karnataka, India
      const demoRole = demoData.personalInfo.title; // Software Engineer
      const demoJobs = await api.getJobs({ location: demoLoc, role: demoRole }).catch(() => []);
      setJobs(demoJobs);

      showToast(
        '⚡ Demo Mode Activated',
        'Loaded complete fictional candidate profile for Alex Morgan (Software Engineer, Bengaluru, India).',
        'success'
      );
    } catch (err: any) {
      showToast('Demo Activation Note', err.message || 'Demo mode enabled locally.', 'info');
    }
  };

  // Reset Demo to pristine Alex Morgan state
  const handleResetDemo = async () => {
    try {
      const demoData = JSON.parse(JSON.stringify(ALEX_MORGAN_DEMO_PROFILE));
      setProfile(demoData);
      await api.resetDemo().catch(() => {});

      const demoLoc = demoData.personalInfo.location;
      const demoRole = demoData.personalInfo.title;
      const demoJobs = await api.getJobs({ location: demoLoc, role: demoRole }).catch(() => []);
      setJobs(demoJobs);

      showToast(
        'Demo Profile Reset',
        'Alex Morgan profile reset to initial 13-section demonstration state.',
        'info'
      );
    } catch (err: any) {
      showToast('Reset Note', err.message || 'Reset complete.', 'info');
    }
  };

  // Exit Demo Mode and cleanly restore user state
  const handleExitDemo = async () => {
    try {
      setIsDemoMode(false);
      localStorage.removeItem('gigsync_demo_active');
      localStorage.removeItem('gigsync_resume_builder_draft');

      // Restore user backup if available
      const backupStr = localStorage.getItem('gigsync_user_backup');
      let restoredProfile = JSON.parse(JSON.stringify(CLEAN_EMPTY_PROFILE));
      if (backupStr) {
        try {
          restoredProfile = JSON.parse(backupStr);
          localStorage.removeItem('gigsync_user_backup');
        } catch {
          // ignore
        }
      }

      setProfile(restoredProfile);
      await api.exitDemo().catch(() => {});

      // Refresh jobs for user's profile
      const userLoc = restoredProfile.personalInfo?.location || '';
      const userRole = restoredProfile.personalInfo?.title || '';
      if (userLoc || userRole) {
        const userJobs = await api.getJobs({ location: userLoc, role: userRole }).catch(() => []);
        setJobs(userJobs);
      } else {
        setJobs([]);
      }

      showToast(
        'Exited Demo Mode',
        'Restored your prior workspace data without altering your saved records.',
        'info'
      );
    } catch (err: any) {
      showToast('Exit Note', err.message || 'Exited demo mode.', 'info');
    }
  };

  const handleToggleSaveJob = async (jobId: string) => {
    const isAlreadySaved = savedJobs.some(sj => sj.jobId === jobId);
    try {
      if (isAlreadySaved) {
        await api.removeSavedJob(jobId);
        setSavedJobs(prev => prev.filter(sj => sj.jobId !== jobId));
        showToast('Job Removed', 'Removed from saved pipeline.', 'info');
      } else {
        const saved = await api.saveJob(jobId, 'interested');
        setSavedJobs(prev => [saved, ...prev]);
        showToast('Job Saved', 'Added to your tracked pipeline.', 'success');
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Could not update saved job.', 'error');
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
    <div className="min-h-screen flex flex-col bg-[#F5F3EE] text-[#20251F]">
      {/* Sticky Editorial Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isGuest={true}
        isDemoMode={isDemoMode}
        onEnterDemo={handleEnterDemo}
        onExitDemo={handleExitDemo}
        onResetDemo={handleResetDemo}
      />

      {/* Demo Mode Top Context Banner */}
      {isDemoMode && (
        <div className="bg-[#FFF9E6] border-b border-[#D4A373] text-[#6B4B1B] px-6 py-2.5 text-xs font-mono shadow-sm no-print">
          <div className="max-w-[1340px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#D9534F] text-white font-bold text-[10px] rounded-[2px] tracking-wider uppercase">
                ⚡ DEMO ACTIVE
              </span>
              <span>
                Fictional Candidate: <strong>Alex Morgan</strong> • Software Engineer • Bengaluru, Karnataka, India
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-[11px]">
              <button
                onClick={() => handleNavigate('ai-assistant')}
                className="hover:underline text-[#20251F] font-semibold"
              >
                AI Assistant Form
              </button>
              <span className="text-[#D5D5CC]">•</span>
              <button
                onClick={() => handleNavigate('resume')}
                className="hover:underline text-[#20251F] font-semibold"
              >
                Resume Studio (4 Templates)
              </button>
              <span className="text-[#D5D5CC]">•</span>
              <button
                onClick={() => handleNavigate('jobs')}
                className="hover:underline text-[#20251F] font-semibold"
              >
                Find Genuine Jobs
              </button>
              <span className="text-[#D5D5CC]">•</span>
              <button
                onClick={handleResetDemo}
                className="hover:underline text-[#20251F] font-semibold"
              >
                Reset Demo
              </button>
              <span className="text-[#D5D5CC]">•</span>
              <button
                onClick={handleExitDemo}
                className="hover:underline text-[#D9534F] font-bold"
              >
                Exit Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-[1340px] w-full mx-auto px-6 py-8">
        {currentTab === 'landing' && (
          <LandingPage
            profile={profile}
            onNavigate={handleNavigate}
            onUpdateProfile={(updated) => {
              setProfile(updated);
              setJobs([]);
            }}
            showToast={showToast}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardPage
            profile={profile}
            jobs={jobs}
            savedJobs={savedJobs}
            roadmap={roadmap}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'resume' && (
          <ResumeStudioPage
            profile={profile}
            jobs={jobs}
            targetJobId={selectedJobId}
            showToast={showToast}
            onNavigate={handleNavigate}
          />
        )}

        {currentTab === 'ai-assistant' && (
          <AiResumeAssistantPage
            profile={profile}
            onApplyProfile={(updated) => {
              setProfile(updated);
              setJobs([]);
            }}
            onNavigate={handleNavigate}
            showToast={showToast}
          />
        )}

        {currentTab === 'profile' && (
          <ProfilePage
            profile={profile}
            onUpdateProfile={(updated) => {
              setProfile(updated);
              setJobs([]);
            }}
            showToast={showToast}
            onNavigateToAssistant={() => setCurrentTab('ai-assistant')}
          />
        )}

        {currentTab === 'jobs' && (
          <JobDiscoveryPage
            jobs={jobs}
            savedJobs={savedJobs}
            onToggleSaveJob={handleToggleSaveJob}
            onSelectJob={(jobId) => handleNavigate('job-detail', { jobId })}
            onUpdateJobs={setJobs}
            defaultLocation={profile.personalInfo.location || (profile.careerPreferences?.targetLocations?.[0] || '')}
            defaultRole={profile.personalInfo.title || (profile.careerPreferences?.targetRoles?.[0] || 'Software Engineer')}
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
            onConfirmSkill={(skill) => {
              const updated = {
                ...profile,
                skills: {
                  ...profile.skills,
                  technical: Array.from(new Set([...profile.skills.technical, skill]))
                }
              };
              setProfile(updated);
              api.updateProfile(updated).catch(() => {});
              showToast('Skill Confirmed', `Added ${skill} to your confirmed profile skills.`, 'success');
            }}
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

        {currentTab === 'how-it-works' && (
          <HowItWorksPage onNavigate={handleNavigate} />
        )}

        {currentTab === 'settings' && (
          <SettingsPrivacyPage
            onDataReset={() => {
              setProfile(JSON.parse(JSON.stringify(CLEAN_EMPTY_PROFILE)));
              setSavedJobs([]);
              initializeData();
            }}
            showToast={showToast}
          />
        )}
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[#D5D5CC] bg-[#E8E7DF] py-8 no-print">
        <div className="max-w-[1340px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#686C63]">
          <div>
            <span className="font-serif text-sm font-semibold text-[#20251F]">GigSync</span> • AI-Powered Career Preparation & Job Matching Platform
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentTab('how-it-works')} className="hover:text-[#20251F] underline">
              Architecture & Algorithm
            </button>
            <button onClick={() => setCurrentTab('settings')} className="hover:text-[#20251F] underline">
              Privacy & Safeguards
            </button>
          </div>
        </div>
      </footer>

      {/* Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
