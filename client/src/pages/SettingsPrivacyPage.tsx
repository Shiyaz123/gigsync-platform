import React, { useState } from 'react';
import { api } from '../services/api';
import {
  ShieldCheck,
  Download,
  Trash2,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Server
} from 'lucide-react';

interface SettingsPrivacyPageProps {
  onDataReset: () => void;
  showToast: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const SettingsPrivacyPage: React.FC<SettingsPrivacyPageProps> = ({
  onDataReset,
  showToast
}) => {
  const [allowExternalAI, setAllowExternalAI] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const blob = await api.exportProfileData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gigsync_profile_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Data Export Complete', 'All personal profile, application, and roadmap data downloaded as JSON.', 'success');
    } catch (err: any) {
      showToast('Export Failed', err.message || 'Could not export data.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllData = async () => {
    try {
      await api.deleteProfile();
      setShowConfirmDelete(false);
      onDataReset();
      showToast('Data Deleted', 'All stored resume versions, profile details, and applications have been wiped.', 'info');
    } catch (err: any) {
      showToast('Deletion Failed', err.message || 'Could not delete data.', 'error');
    }
  };

  return (
    <div className="settings-privacy-page">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldCheck size={28} color="#10b981" />
          Privacy, Data Governance & Responsible AI
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Full user control over personal data, export rights, zero-hallucination compliance, and transparent scoring algorithms.
        </p>
      </div>

      {/* Data Sovereignty Card (PRD FR-04, NFR-05) */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <h2 className="card-title" style={{ marginBottom: '0.75rem' }}>
          <Download size={20} color="#6366f1" />
          Data Portability & Export (FR-04)
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          In accordance with data minimization principles, you can export all stored profile fields, resume iterations, match analyses, and roadmap progress into a portable machine-readable JSON format at any time.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleExportData}
            disabled={isExporting}
          >
            <Download size={16} />
            {isExporting ? 'Preparing Archive...' : 'Download Complete Data Archive (.json)'}
          </button>
        </div>
      </div>

      {/* Responsible AI Commitments (PRD Section 12) */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <h2 className="card-title" style={{ marginBottom: '1rem' }}>
          <Lock size={20} color="#38bdf8" />
          Responsible AI Architecture & Safeguards
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Anti-Hallucination Grounding (FR-12)</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                The platform never invents degrees, employment dates, employer names, certifications, or numeric achievements. All generated resume content strictly mirrors confirmed user facts.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Explainable Match Scoring (FR-17, FR-18)</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Match scores reflect evidence overlap across essential skills, preferred skills, projects, and education. Scores are never presented as hiring probabilities or automated employer decisions.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Hard Constraint Segregation (FR-19)</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Work authorization, licenses, and location mandates are treated as independent eligibility criteria, preventing misleading implications that an online course can resolve a legal constraint.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>LaTeX Injection Protection (Section 12)</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                All user inputs passed into LaTeX resume templates undergo strict sanitization and character escaping (escaping %, $, &, _, #, braces, ~, ^, backslash) to prevent server abuse or compilation faults.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Data Deletion */}
      <div className="card" style={{ borderColor: 'var(--danger-border)', background: 'rgba(244, 63, 94, 0.05)' }}>
        <h2 className="card-title" style={{ color: '#f43f5e', marginBottom: '0.75rem' }}>
          <Trash2 size={20} />
          Danger Zone: Wipe Stored Data (FR-04)
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          Permanently delete all personal contact information, uploaded resume fragments, saved jobs, and learning roadmaps from the active session. This action cannot be reversed.
        </p>

        {!showConfirmDelete ? (
          <button
            className="btn btn-sm"
            style={{ background: 'var(--danger)', color: 'white' }}
            onClick={() => setShowConfirmDelete(true)}
          >
            <Trash2 size={14} /> Request Full Data Erasure
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#f43f5e', fontWeight: 600 }}>Are you absolutely sure?</span>
            <button
              className="btn btn-sm"
              style={{ background: 'var(--danger)', color: 'white' }}
              onClick={handleDeleteAllData}
            >
              Yes, Wipe All My Data
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowConfirmDelete(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
