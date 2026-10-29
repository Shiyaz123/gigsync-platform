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
  Calendar,
  Layers,
  ArrowRight
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

      const updatedStages = roadmap.stages.map(stage => ({
        ...stage,
        items: stage.items.map(it => it.id === item.id ? { ...it, status: nextStatus } : it)
      }));

      const updatedRoadmap = { ...roadmap, stages: updatedStages };
      onUpdateRoadmap(updatedRoadmap);

      showToast('Status Updated', `"${item.skill}" marked as ${nextStatus.replace('-', ' ')}.`, 'info');
    } catch (err: any) {
      showToast('Error', err.message || 'Could not update status.', 'error');
    }
  };

  return (
    <div className="learning-roadmap-page space-y-8 pb-16">
      {/* Editorial Header */}
      <div className="pb-4 border-b border-[#D5D5CC]">
        <div className="flex items-baseline justify-between flex-wrap gap-4">
          <div>
            <span className="section-num">Workflow Step 06 / Skill Acquisition</span>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#20251F] mt-1">
              Personalized Learning Roadmap
            </h1>
            <p className="text-sm text-[#686C63] mt-1">
              Closing identified technical gaps with verified resources from trusted educational partners.
            </p>
          </div>

          <span className="tag-mono text-[#20251F] bg-[#E8E7DF]">
            Target Role: {roadmap.targetRole}
          </span>
        </div>
      </div>

      {/* Progress & Milestone Card */}
      <div className="surface-card p-6 space-y-4">
        <div className="flex items-baseline justify-between flex-wrap gap-4">
          <div>
            <span className="font-mono text-xs uppercase text-[#686C63] font-semibold">
              Roadmap Progression
            </span>
            <div className="font-serif text-2xl text-[#20251F] mt-0.5">
              {completedCount} of {allItems.length} skills mastered ({progressPercent}%)
            </div>
          </div>

          {/* Filter Status Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 'planned', 'in-progress', 'completed'] as const).map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 text-xs font-mono rounded-[2px] transition-colors border ${
                  filterStatus === st
                    ? 'border-[#20251F] bg-[#20251F] text-[#F5F3EE]'
                    : 'border-[#D5D5CC] bg-[#E8E7DF] text-[#686C63] hover:text-[#20251F]'
                }`}
              >
                {st === 'all' ? `All (${allItems.length})` :
                 st === 'in-progress' ? `In Progress (${inProgressCount})` :
                 st === 'completed' ? `Completed (${completedCount})` : 'Planned'}
              </button>
            ))}
          </div>
        </div>

        {/* Crisp Progress Bar */}
        <div className="w-full h-2 bg-[#E8E7DF] border border-[#D5D5CC] rounded-[1px] overflow-hidden">
          <div
            className="h-full bg-[#D9534F] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* 3-Stage Timeline */}
      <div className="space-y-8">
        {roadmap.stages.map(stage => {
          const visibleItems = stage.items.filter(item =>
            filterStatus === 'all' || item.status === filterStatus
          );

          if (visibleItems.length === 0 && filterStatus !== 'all') return null;

          return (
            <div key={stage.stageNumber} className="surface-card p-8 space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-[#D5D5CC] flex-wrap gap-4">
                <div>
                  <span className="font-mono text-xs text-[#D9534F] font-bold uppercase tracking-wider">
                    Stage 0{stage.stageNumber}
                  </span>
                  <h3 className="font-serif text-2xl text-[#20251F] mt-0.5">
                    {stage.stageName}
                  </h3>
                  <p className="text-xs text-[#686C63] mt-1">{stage.description}</p>
                </div>

                <span className="tag-mono text-xs">
                  {stage.items.length} Course Module{stage.items.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Resource cards */}
              <div className="space-y-4">
                {visibleItems.map(item => (
                  <div
                    key={item.id}
                    className="p-5 bg-[#F5F3EE] border border-[#D5D5CC] rounded-[2px] flex items-start justify-between flex-wrap gap-6"
                  >
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="tag-mono tag-accent text-xs font-semibold">
                          Skill: {item.skill}
                        </span>
                        <span className="tag-mono text-[11px] bg-[#FFFFFF]">
                          {item.resource.provider}
                        </span>
                        <span className="tag-mono text-[11px]">{item.resource.level}</span>
                        <span className="tag-mono text-[11px] text-[#20251F] font-bold">{item.resource.priceStatus}</span>
                      </div>

                      <h4 className="font-serif text-xl text-[#20251F]">
                        {item.resource.title}
                      </h4>

                      <p className="text-xs text-[#686C63] leading-relaxed">
                        {item.resource.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs font-mono text-[#686C63] pt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={13} strokeWidth={1.5} /> Duration: {item.resource.duration}
                        </span>
                        {item.targetDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={13} strokeWidth={1.5} /> Target: {item.targetDate}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0 items-end">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`btn-editorial text-xs px-3.5 py-1.5 ${
                          item.status === 'completed'
                            ? 'btn-editorial-dark'
                            : item.status === 'in-progress'
                            ? 'btn-editorial-primary'
                            : 'btn-editorial-outline'
                        }`}
                      >
                        {item.status === 'completed' && <CheckCircle2 size={13} strokeWidth={2} />}
                        {item.status === 'in-progress' && <Clock size={13} strokeWidth={1.5} />}
                        <span>
                          {item.status === 'completed' ? 'Completed' :
                           item.status === 'in-progress' ? 'In Progress' : 'Mark In Progress'}
                        </span>
                      </button>

                      <a
                        href={item.resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-editorial btn-editorial-outline text-xs px-3.5 py-1.5"
                      >
                        Open Course <ExternalLink size={12} strokeWidth={1.5} />
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
