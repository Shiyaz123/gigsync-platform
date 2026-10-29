import React, { useState } from 'react';
import { api } from '../services/api';
import {
  ShieldCheck,
  Download,
  Trash2,
  Lock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface SettingsPrivacyPageProps {
  onDataReset: () => void;
  showToast: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const SettingsPrivacyPage: React.FC<SettingsPrivacyPageProps> = ({
  onDataReset,
  showToast
}) => {
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
      showToast('Export Complete', 'All personal profile, application, and roadmap data downloaded as JSON.', 'success');
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
      showToast('Data Cleared', 'All stored profile details and applications have been wiped.', 'info');
    } catch (err: any) {
      showToast('Deletion Failed', err.message || 'Could not delete data.', 'error');
    }
  };

  return (
    <div className="settings-privacy-page space-y-8 pb-16">
      {/* Editorial Header */}
      <div className="pb-4 border-b border-[#D5D5CC]">
        <span className="section-num">Data Governance & Safeguards</span>
        <h1 className="font-serif text-4xl sm:text-5xl text-[#20251F] mt-1">
          Account & Privacy Governance
        </h1>
        <p className="text-sm text-[#686C63] mt-1">
          Candidate data sovereignty, verifiable export archives, and responsible AI system architecture.
        </p>
      </div>

      {/* Data Sovereignty Card (FR-04) */}
      <div className="surface-card p-6 space-y-4">
        <div className="pb-3 border-b border-[#D5D5CC]">
          <h2 className="font-serif text-2xl text-[#20251F]">
            Data Portability & Export (FR-04)
          </h2>
          <p className="text-xs text-[#686C63] mt-1 leading-relaxed">
            In accordance with data minimization principles, you can export your entire structured profile, saved jobs pipeline, and roadmap progress into a portable machine-readable JSON format.
          </p>
        </div>

        <div>
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="btn-editorial btn-editorial-primary text-xs px-4 py-2"
          >
            <Download size={14} strokeWidth={1.5} />
            {isExporting ? 'Packaging Archive...' : 'Download Complete Data Archive (.json)'}
          </button>
        </div>
      </div>

      {/* Responsible AI Commitments */}
      <div className="surface-card p-6 space-y-4">
        <div className="pb-3 border-b border-[#D5D5CC]">
          <h2 className="font-serif text-2xl text-[#20251F]">
            Responsible AI Safeguards
          </h2>
          <p className="text-xs text-[#686C63] mt-1">
            Grounded system principles enforced across all GigSync modules.
          </p>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] space-y-1">
            <div className="font-semibold text-xs text-[#20251F] flex items-center gap-2">
              <CheckCircle2 size={14} strokeWidth={1.5} className="text-[#20251F]" />
              Zero-Hallucination Policy (FR-12)
            </div>
            <p className="text-xs text-[#686C63]">
              The platform never fabricates degrees, employment dates, employer names, certifications, or numeric metrics.
            </p>
          </div>

          <div className="p-3.5 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] space-y-1">
            <div className="font-semibold text-xs text-[#20251F] flex items-center gap-2">
              <CheckCircle2 size={14} strokeWidth={1.5} className="text-[#20251F]" />
              Transparent Scoring (FR-17)
            </div>
            <p className="text-xs text-[#686C63]">
              Match percentages reflect evidence overlap across essential skills, preferred skills, projects, and education. Scores are not hiring probabilities.
            </p>
          </div>

          <div className="p-3.5 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] space-y-1">
            <div className="font-semibold text-xs text-[#20251F] flex items-center gap-2">
              <CheckCircle2 size={14} strokeWidth={1.5} className="text-[#20251F]" />
              Hard Constraint Segregation (FR-19)
            </div>
            <p className="text-xs text-[#686C63]">
              Work authorizations, licenses, and location requirements are separated from learnable skills, avoiding false claims that courses solve legal criteria.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone: Data Erasure */}
      <div className="surface-card p-6 border-[#D9534F] bg-[#E8E7DF] space-y-3">
        <h2 className="font-serif text-2xl text-[#D9534F]">
          Danger Zone: Wipe Stored Data (FR-04)
        </h2>
        <p className="text-xs text-[#20251F] leading-relaxed">
          Permanently delete all personal contact information, uploaded resume fragments, saved jobs, and learning roadmaps from the active session. This action cannot be reversed.
        </p>

        {!showConfirmDelete ? (
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="btn-editorial btn-editorial-outline border-[#D9534F] text-[#D9534F] hover:bg-[#D9534F] hover:text-[#F5F3EE] text-xs px-3.5 py-2"
          >
            <Trash2 size={13} strokeWidth={1.5} /> Request Full Data Erasure
          </button>
        ) : (
          <div className="flex items-center gap-3 pt-2">
            <span className="text-xs font-mono text-[#D9534F] font-bold">Are you sure?</span>
            <button
              onClick={handleDeleteAllData}
              className="btn-editorial btn-editorial-primary text-xs px-3.5 py-1.5"
            >
              Yes, Wipe All Data
            </button>
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="btn-editorial btn-editorial-outline text-xs px-3.5 py-1.5"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
