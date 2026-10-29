import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      maxWidth: '380px',
      width: '100%'
    }}>
      {toasts.map(t => {
        const icons = {
          success: <CheckCircle2 size={18} color="#10b981" />,
          warning: <AlertTriangle size={18} color="#f59e0b" />,
          error: <AlertCircle size={18} color="#f43f5e" />,
          info: <CheckCircle2 size={18} color="#38bdf8" />
        };

        return (
          <div
            key={t.id}
            className="card"
            style={{
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              borderLeft: `4px solid ${
                t.type === 'success' ? '#10b981' :
                t.type === 'warning' ? '#f59e0b' :
                t.type === 'error' ? '#f43f5e' : '#38bdf8'
              }`,
              animation: 'fadeIn 0.25s ease'
            }}
          >
            <div style={{ flexShrink: 0, marginTop: '2px' }}>{icons[t.type]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                {t.title}
              </div>
              {t.message && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {t.message}
                </div>
              )}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px'
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
