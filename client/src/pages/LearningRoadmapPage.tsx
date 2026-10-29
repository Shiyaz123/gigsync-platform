import React, { useState } from 'react';
import {
  LearningRoadmap,
  LearningRoadmapItem
} from '../types';
import { api } from '../services/api';
import {
  Compass,
  CheckCircle2,
  Clock,
  ExternalLink,
  BookOpen,
  Award,
  Layers,
  Sparkles,
  Calendar,
  Plus
} from 'lucide-react';

interface LearningRoadmapPageProps {
  roadmap: LearningRoadmap;
  onUpdateRoadmap: (updated: LearningRoadmap) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const LearningRoadmapPage: React.FC<LearningRoadmapPageProps> = ({
  roadmap,
  onUpdateRoadmap,
  showToast
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'planned' | 'in-progress' | 'completed'>('all');

  const allItems = roadmap.stages.flatMap(s => s.items);
  const completedCount = allItems.filter(i => i.status === 'completed').length;
  const inProgressCount = allItems.filter(i => i.status === 'in-progress').length;
  const progressPercent = allItems.length > 0 ? Math.round((completedCount / allItems.length) * 100) : 0;

  const handleToggleStatus = async (item: LearningRoadmapItem) => {
    const nextStatus: 'planned' | 'in-progress' | 'completed' =
      item.status === 'planned' ? 'in-progress' :
      item.status === 'in-progress' ? 'completed' : 'planned';

    try {
      await api.updateRoadmapItem(item.id, { status: nextStatus });

      // Update state in memory
      const updatedStages = roadmap.stages.map(stage => ({
        ...stage,
        items: stage.items.map(it => it.id === item.id ? { ...it, status: nextStatus } : it)
      }));

      const updatedRoadmap = { ...roadmap, stages: updatedStages };
      onUpdateRoadmap(updatedRoadmap);

      if (nextStatus === 'completed') {
        showToast('Skill Mastered!', `Marked "${item.skill}" as completed. Great work!`, 'success');
      } else {
        showToast('Status Updated', `Skill marked as ${nextStatus.replace('-', ' ')}.`, 'info');
      }
    } catch (err: any) {
      showToast('Update Failed', err.message || 'Could not update status.', 'error');
    }
  };

  return (
    <div className="learning-roadmap-page">
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Compass size={28} color="#38bdf8" />
          Skill-Gap Learning Roadmap
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Targeted, staged learning plans closing technical gaps identified in job requirements. Curated from verified high-quality providers.
        </p>
      </div>

      {/* Target Role & Progress Overview Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)',
        borderColor: 'rgba(56, 189, 248, 0.3)',
        marginBottom: '2rem',
        padding: '1.75rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.25rem' }}>
          <div>
            <span className="badge badge-info" style={{ marginBottom: '0.4rem' }}>
              Target Milestone
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{roadmap.targetRole}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Structured progression: Prerequisites → Mandatory Requirements → Portfolio Integration
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#38bdf8', lineHeight: 1 }}>
              {progressPercent}%
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {completedCount} of {allItems.length} Skills Mastered
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '8px', background: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #10b981)', transition: 'width 0.4s ease' }}></div>
        </div>

        {/* Quick status tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
          {(['all', 'planned', 'in-progress', 'completed'] as const).map(st => (
            <button
              key={st}
              className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilterStatus(st)}
            >
              {st === 'all' ? `All Items (${allItems.length})` :
               st === 'in-progress' ? `In Progress (${inProgressCount})` :
               st === 'completed' ? `Completed (${completedCount})` : 'Planned'}
            </button>
          ))}
        </div>
      </div>

      {/* Staged Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {roadmap.stages.map(stage => {
          const visibleItems = stage.items.filter(item =>
            filterStatus === 'all' || item.status === filterStatus
          );

          if (visibleItems.length === 0 && filterStatus !== 'all') return null;

          return (
            <div key={stage.stageNumber} className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}>
                  {stage.stageNumber}
                </span>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{stage.stageName}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{stage.description}</p>
                </div>
              </div>

              {/* Items in Stage */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
                {visibleItems.map(item => (
                  <div
                    key={item.id}
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-card)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '260px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-warning" style={{ textTransform: 'uppercase' }}>
                          Skill: {item.skill}
                        </span>
                        <span className="badge" style={{ background: 'var(--bg-card)' }}>
                          {item.resource.provider}
                        </span>
                        <span className="badge badge-info">
                          {item.resource.level}
                        </span>
                        <span className="badge badge-success">
                          {item.resource.priceStatus}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        {item.resource.title}
                      </h4>

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                        {item.resource.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} /> Est. {item.resource.duration}
                        </span>
                        {item.targetDate && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={14} /> Target: {item.targetDate}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status & Link Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'flex-end' }}>
                      <button
                        className={`btn btn-sm ${
                          item.status === 'completed' ? 'btn-primary' :
                          item.status === 'in-progress' ? 'btn-secondary' : 'btn-outline'
                        }`}
                        onClick={() => handleToggleStatus(item)}
                        style={{ minWidth: '130px' }}
                      >
                        {item.status === 'completed' && <CheckCircle2 size={14} />}
                        {item.status === 'in-progress' && <Clock size={14} />}
                        {item.status === 'planned' && <BookOpen size={14} />}
                        {item.status === 'completed' ? 'Completed' :
                         item.status === 'in-progress' ? 'In Progress' : 'Mark In Progress'}
                      </button>

                      <a
                        href={item.resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline btn-sm"
                        style={{ minWidth: '130px' }}
                      >
                        Open Course <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
