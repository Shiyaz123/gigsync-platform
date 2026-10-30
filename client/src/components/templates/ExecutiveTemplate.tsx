import React from 'react';
import { CandidateProfile } from '../../types';
import {
  cleanText,
  cleanList,
  isNAOrEmpty,
  getCategorizedSkills,
  DEFAULT_SECTION_NAMES
} from './templateUtils';

interface TemplateProps {
  profile: CandidateProfile;
  customNames?: Record<string, string>;
  hiddenSections?: string[];
  spacing?: 'compact' | 'normal' | 'spacious';
}

export const ExecutiveTemplate: React.FC<TemplateProps> = ({
  profile,
  customNames = {},
  hiddenSections = [],
  spacing = 'normal'
}) => {
  const p = profile.personalInfo;
  const fullName = cleanText(p.fullName);
  const title = cleanText(p.title);
  const location = cleanText(p.location);
  const phone = cleanText(p.phone);
  const email = cleanText(p.email);
  const github = cleanText(p.github);
  const linkedin = cleanText(p.linkedin);
  const summary = cleanText(p.summary);

  const catSkills = getCategorizedSkills(profile);
  const eduList = (profile.education || []).filter(e => !isNAOrEmpty(e.institution));
  const expList = (profile.experience || []).filter(e => !isNAOrEmpty(e.company) || !isNAOrEmpty(e.role));
  const projList = (profile.projects || []).filter(p => !isNAOrEmpty(p.title));
  const certList = (profile.certifications || []).filter(c => !isNAOrEmpty(c.name));
  const achList = cleanList(profile.achievements);
  const leadList = cleanList(profile.mentorshipAndLeadership);
  const pubList = (profile.publications || []).filter(pub => !isNAOrEmpty(pub.title));
  const extraList = cleanList(profile.extracurricularActivities);
  const langList = cleanList(profile.languagesKnown);
  const intList = cleanList(profile.interests);

  const getTitle = (key: string, fallback: string) => customNames[key] || DEFAULT_SECTION_NAMES[key] || fallback;
  const isHidden = (key: string) => hiddenSections.includes(key);

  const spacingClasses = {
    compact: 'space-y-3.5 text-xs',
    normal: 'space-y-5 text-xs sm:text-[13px]',
    spacious: 'space-y-7 text-sm'
  }[spacing];

  // Consolidate core executive competencies from skills
  const coreCompetencies = [
    ...catSkills.programmingLanguages,
    ...catSkills.backendAndApis,
    ...catSkills.databases,
    ...catSkills.toolsAndDevelopment,
    ...catSkills.aiAndMl,
    ...catSkills.csFundamentals
  ].slice(0, 16);

  return (
    <div className={`executive-template bg-white text-slate-900 font-sans p-8 sm:p-12 shadow-sm border border-slate-300 rounded-none w-full max-w-4xl mx-auto ${spacingClasses}`}>
      {/* Executive Header Banner */}
      <header className="border-b-4 border-slate-900 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-slate-950 uppercase">
              {fullName || 'Executive Candidate'}
            </h1>
            {title && (
              <p className="text-sm sm:text-base font-semibold text-slate-700 tracking-wider uppercase mt-1">
                {title}
              </p>
            )}
          </div>
          <div className="text-xs text-slate-600 sm:text-right font-medium space-y-0.5">
            {location && <div>{location}</div>}
            <div className="flex items-center sm:justify-end gap-2 flex-wrap">
              {phone && <span>{phone}</span>}
              {phone && email && <span>•</span>}
              {email && <span>{email}</span>}
            </div>
            {(linkedin || github) && (
              <div className="flex items-center sm:justify-end gap-2 text-slate-700">
                {linkedin && <span>{linkedin.replace(/^https?:\/\/(www\.)?/i, '')}</span>}
                {linkedin && github && <span>•</span>}
                {github && <span>{github.replace(/^https?:\/\/(www\.)?/i, '')}</span>}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Executive Summary */}
      {!isHidden('summary') && summary && (
        <section className="bg-slate-50 p-4 border-l-4 border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-1">
            {getTitle('summary', 'Executive Profile & Strategic Summary')}
          </h2>
          <p className="text-slate-800 leading-relaxed font-normal">{summary}</p>
        </section>
      )}

      {/* Executive Core Competencies */}
      {!isHidden('skills') && coreCompetencies.length > 0 && (
        <section className="space-y-1.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b-2 border-slate-200 pb-1">
            {getTitle('skills', 'Areas of Expertise & Core Competencies')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
            {coreCompetencies.map((comp, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-slate-800">
                <span className="w-1.5 h-1.5 bg-slate-800 rounded-none shrink-0" />
                <span className="font-medium truncate">{comp}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Work Experience */}
      {!isHidden('experience') && expList.length > 0 && (
        <section className="space-y-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b-2 border-slate-200 pb-1">
            {getTitle('experience', 'Professional Experience & Leadership')}
          </h2>
          {expList.map((exp, idx) => {
            const expCompany = cleanText(exp.company);
            const expRole = cleanText(exp.role);
            const expType = cleanText(exp.employmentType);
            const expLoc = cleanText(exp.location);
            const expDur = cleanText(exp.duration) || `${cleanText(exp.startDate)} – ${exp.current ? 'Present' : cleanText(exp.endDate)}`.replace(/^ – | – $/g, '');
            const bullets = cleanList([...(exp.responsibilities || []), ...(exp.bullets || [])]);

            return (
              <div key={exp.id || idx} className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-950 text-sm">{expRole}</span>
                    <span className="text-slate-500 mx-1.5">|</span>
                    <span className="font-semibold text-slate-800">{expCompany}</span>
                    {expType && <span className="text-slate-600 font-normal ml-1">({expType})</span>}
                  </div>
                  <div className="text-slate-600 font-semibold text-xs">
                    {expLoc && <span>{expLoc} • </span>}
                    <span>{expDur}</span>
                  </div>
                </div>
                {bullets.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-1 text-slate-700 leading-relaxed">
                    {bullets.map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Key Initiatives & Technical Projects */}
      {!isHidden('projects') && projList.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b-2 border-slate-200 pb-1">
            {getTitle('projects', 'Key Technical Initiatives & Projects')}
          </h2>
          {projList.map((proj, idx) => {
            const title = cleanText(proj.title);
            const desc = cleanText(proj.description);
            const tech = cleanList([...(proj.technologies || []), ...(proj.techStack || [])]);
            const bullets = cleanList([...(proj.keyFeatures || []), ...(proj.bullets || [])]);
            const live = cleanText(proj.liveUrl || proj.githubUrl || proj.repoUrl);

            return (
              <div key={proj.id || idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-bold text-slate-900">{title}</span>
                  {tech.length > 0 && (
                    <span className="text-slate-600 text-[11px] font-mono">
                      {tech.join(', ')}
                    </span>
                  )}
                </div>
                {desc && <p className="text-slate-700 italic text-xs">{desc}</p>}
                {bullets.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-xs text-slate-700">
                    {bullets.map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Quantified Achievements & Leadership */}
      {((!isHidden('achievements') && achList.length > 0) || (!isHidden('leadership') && leadList.length > 0)) && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b-2 border-slate-200 pb-1">
            {getTitle('leadership', 'Leadership Impact & Key Achievements')}
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-800">
            {achList.map((ach, idx) => (
              <li key={`ach_${idx}`}>
                <strong className="text-slate-950">Achievement: </strong>{ach}
              </li>
            ))}
            {leadList.map((lead, idx) => (
              <li key={`lead_${idx}`}>
                <strong className="text-slate-950">Leadership: </strong>{lead}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Education */}
      {!isHidden('education') && eduList.length > 0 && (
        <section className="space-y-1.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 border-b-2 border-slate-200 pb-1">
            {getTitle('education', 'Education & Professional Credentials')}
          </h2>
          {eduList.map((edu, idx) => {
            const inst = cleanText(edu.institution);
            const degree = cleanText(edu.degree);
            const branch = cleanText(edu.branch || edu.fieldOfStudy);
            const year = cleanText(edu.graduationYear || edu.endDate);
            const gpa = cleanText(edu.cgpa || edu.gpa);

            return (
              <div key={edu.id || idx} className="flex justify-between items-baseline text-xs">
                <div>
                  <span className="font-bold text-slate-950">{degree} {branch ? `in ${branch}` : ''}</span>
                  <span className="text-slate-700 ml-1.5">— {inst}</span>
                  {gpa && <span className="text-slate-600 font-medium ml-2">({gpa})</span>}
                </div>
                {year && <span className="text-slate-600 font-semibold">{year}</span>}
              </div>
            );
          })}
        </section>
      )}

      {/* Certifications & Publications */}
      {((!isHidden('certifications') && certList.length > 0) || (!isHidden('publications') && pubList.length > 0)) && (
        <section className="space-y-1.5 pt-1 border-t border-slate-200 text-xs">
          {!isHidden('certifications') && certList.length > 0 && (
            <div>
              <strong className="text-slate-900 uppercase tracking-wide text-[11px]">Certifications: </strong>
              <span className="text-slate-700">
                {certList.map(c => `${cleanText(c.name)} (${cleanText(c.organization || c.issuer)})`).join(' • ')}
              </span>
            </div>
          )}
          {!isHidden('publications') && pubList.length > 0 && (
            <div>
              <strong className="text-slate-900 uppercase tracking-wide text-[11px]">Publications: </strong>
              <span className="text-slate-700">
                {pubList.map(p => `${cleanText(p.title)}${p.publisher ? ` — ${cleanText(p.publisher)}` : ''}`).join(' • ')}
              </span>
            </div>
          )}
        </section>
      )}

      {/* Extracurricular, Languages, Interests */}
      {((!isHidden('extracurricular') && extraList.length > 0) || (!isHidden('languages') && langList.length > 0) || (!isHidden('interests') && intList.length > 0)) && (
        <section className="pt-2 border-t border-slate-200 text-xs flex flex-wrap gap-x-6 gap-y-1 text-slate-700">
          {!isHidden('languages') && langList.length > 0 && (
            <div>
              <strong className="text-slate-900">Languages: </strong>
              <span>{langList.join(', ')}</span>
            </div>
          )}
          {!isHidden('interests') && intList.length > 0 && (
            <div>
              <strong className="text-slate-900">Interests: </strong>
              <span>{intList.join(', ')}</span>
            </div>
          )}
          {!isHidden('extracurricular') && extraList.length > 0 && (
            <div>
              <strong className="text-slate-900">Activities: </strong>
              <span>{extraList.join(', ')}</span>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
