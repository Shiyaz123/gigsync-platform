import React from 'react';
import { CandidateProfile } from '../../types';
import { ModernTechTemplate } from './ModernTechTemplate';
import { ClassicAcademicTemplate } from './ClassicAcademicTemplate';
import { ExecutiveTemplate } from './ExecutiveTemplate';
import { MinimalistTemplate } from './MinimalistTemplate';

export type ResumeTemplateId = 'modern' | 'academic' | 'executive' | 'minimalist';

export interface ResumeTemplateRendererProps {
  templateId: ResumeTemplateId;
  profile: CandidateProfile;
  customNames?: Record<string, string>;
  hiddenSections?: string[];
  spacing?: 'compact' | 'normal' | 'spacious';
  className?: string;
}

export const ResumeTemplateRenderer: React.FC<ResumeTemplateRendererProps> = ({
  templateId,
  profile,
  customNames,
  hiddenSections,
  spacing,
  className = ''
}) => {
  const resolvedNames = customNames || profile.sectionNames || {};
  const resolvedHidden = hiddenSections || profile.hiddenSections || [];
  const resolvedSpacing = spacing || profile.layoutSpacing || (templateId === 'minimalist' ? 'compact' : 'normal');

  return (
    <div className={`resume-template-container ${className}`}>
      {templateId === 'modern' && (
        <ModernTechTemplate
          profile={profile}
          customNames={resolvedNames}
          hiddenSections={resolvedHidden}
          spacing={resolvedSpacing}
        />
      )}
      {templateId === 'academic' && (
        <ClassicAcademicTemplate
          profile={profile}
          customNames={resolvedNames}
          hiddenSections={resolvedHidden}
          spacing={resolvedSpacing}
        />
      )}
      {templateId === 'executive' && (
        <ExecutiveTemplate
          profile={profile}
          customNames={resolvedNames}
          hiddenSections={resolvedHidden}
          spacing={resolvedSpacing}
        />
      )}
      {templateId === 'minimalist' && (
        <MinimalistTemplate
          profile={profile}
          customNames={resolvedNames}
          hiddenSections={resolvedHidden}
          spacing={resolvedSpacing}
        />
      )}
    </div>
  );
};
