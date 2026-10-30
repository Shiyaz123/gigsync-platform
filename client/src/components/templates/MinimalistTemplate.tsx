import React from 'react';
import { CandidateProfile } from '../../types';
import {
  cleanText,
  cleanList,
  isNAOrEmpty,
  getCategorizedSkills,
  DEFAULT_SECTION_NAMES,
  formatEducationDegree,
  cleanProjectEntry,
  formatSafeUrl
} from './templateUtils';

interface TemplateProps {
  profile: CandidateProfile;
  customNames?: Record<string, string>;
  hiddenSections?: string[];
  spacing?: 'compact' | 'normal' | 'spacious';
}

export const MinimalistTemplate: React.FC<TemplateProps> = ({
  profile,
  customNames = {},
  hiddenSections = [],
  spacing = 'compact'
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

  const safeLinkedin = formatSafeUrl(linkedin);
  const safeGithub = formatSafeUrl(github);

  const contactNodes: React.ReactNode[] = [];
  if (location) contactNodes.push(<span key="loc">{location}</span>);
  if (phone) contactNodes.push(<a key="ph" href={`tel:${phone}`} className="hover:underline">{phone}</a>);
  if (email) contactNodes.push(<a key="em" href={`mailto:${email}`} className="hover:underline">{email}</a>);
  if (linkedin) {
    contactNodes.push(
      safeLinkedin ? (
        <a key="li" href={safeLinkedin} target="_blank" rel="noreferrer" className="hover:underline">
          {linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/i, 'linkedin/')}
        </a>
      ) : <span key="li">{linkedin}</span>
    );
  }
  if (github) {
    contactNodes.push(
      safeGithub ? (
        <a key="gh" href={safeGithub} target="_blank" rel="noreferrer" className="hover:underline">
          {github.replace(/^https?:\/\/(www\.)?github\.com\/?/i, 'github/')}
        </a>
      ) : <span key="gh">{github}</span>
    );
  }

  const spacingClasses = {
    compact: 'space-y-2.5 text-xs',
    normal: 'space-y-3.5 text-xs sm:text-[13px]',
    spacious: 'space-y-5 text-sm'
  }[spacing];

  return (
    <div className={`minimalist-template bg-white text-black font-sans p-6 sm:p-10 shadow-none border border-neutral-200 rounded-none w-full max-w-4xl mx-auto ${spacingClasses}`}>
      {/* Header */}
      <header className="pb-2 border-b border-black">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase">
            {fullName || 'Candidate Name'}
          </h1>
          {title && <span className="text-xs font-mono uppercase text-neutral-600">{title}</span>}
        </div>
        {contactNodes.length > 0 && (
          <div className="text-[11px] font-mono text-neutral-700 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
            {contactNodes.map((c, i) => (
              <span key={i}>
                {c}{i < contactNodes.length - 1 ? ' |' : ''}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Summary */}
      {!isHidden('summary') && summary && (
        <section className="space-y-0.5">
          <h2 className="text-[11px] font-mono font-bold uppercase tracking-wider text-black">
            // {getTitle('summary', 'Summary')}
          </h2>
          <p className="text-neutral-800 leading-snug">{summary}</p>
        </section>
      )}

      {/* Skills */}
      {!isHidden('skills') && (
        <section className="space-y-1">
          <h2 className="text-[11px] font-mono font-bold uppercase tracking-wider text-black">
            // {getTitle('skills', 'Technical Skills')}
          </h2>
          <div className="space-y-0.5 text-neutral-900">
            {catSkills.programmingLanguages.length > 0 && (
              <div><strong>Languages:</strong> {catSkills.programmingLanguages.join(', ')}</div>
            )}
            {catSkills.backendAndApis.length > 0 && (
              <div><strong>Backend & APIs:</strong> {catSkills.backendAndApis.join(', ')}</div>
            )}
            {catSkills.databases.length > 0 && (
              <div><strong>Databases:</strong> {catSkills.databases.join(', ')}</div>
            )}
            {catSkills.frontend.length > 0 && (
              <div><strong>Frontend:</strong> {catSkills.frontend.join(', ')}</div>
            )}
            {catSkills.toolsAndDevelopment.length > 0 && (
              <div><strong>Tools & Platforms:</strong> {catSkills.toolsAndDevelopment.join(', ')}</div>
            )}
            {catSkills.testing.length > 0 && (
              <div><strong>Testing:</strong> {catSkills.testing.join(', ')}</div>
            )}
            {catSkills.csFundamentals.length > 0 && (
              <div><strong>CS Fundamentals:</strong> {catSkills.csFundamentals.join(', ')}</div>
            )}
            {catSkills.aiAndMl.length > 0 && (
              <div><strong>AI / ML:</strong> {catSkills.aiAndMl.join(', ')}</div>
            )}
          </div>
        </section>
      )}

      {/* Experience */}
      {!isHidden('experience') && expList.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[11px] font-mono font-bold uppercase tracking-wider text-black">
            // {getTitle('experience', 'Experience')}
          </h2>
          {expList.map((exp, idx) => {
            const expCompany = cleanText(exp.company);
            const expRole = cleanText(exp.role);
            const expLoc = cleanText(exp.location);
            const expDur = cleanText(exp.duration) || `${cleanText(exp.startDate)} – ${exp.current ? 'Present' : cleanText(exp.endDate)}`.replace(/^ – | – $/g, '');
            const bullets = cleanList([...(exp.responsibilities || []), ...(exp.bullets || [])]);

            return (
              <div key={exp.id || idx} className="space-y-0.5 page-break-avoid break-inside-avoid">
                <div className="flex justify-between items-baseline font-bold text-xs">
                  <span>{expRole} — {expCompany}</span>
                  <span className="font-mono text-[11px] font-normal">{expDur} {expLoc ? `(${expLoc})` : ''}</span>
                </div>
                {bullets.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-neutral-800 text-xs">
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

      {/* Projects */}
      {!isHidden('projects') && projList.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[11px] font-mono font-bold uppercase tracking-wider text-black">
            // {getTitle('projects', 'Projects')}
          </h2>
          {projList.map((proj, idx) => {
            const { title, subtitle, bullets, techStack, githubUrl, liveUrl } = cleanProjectEntry(proj);
            if (!title) return null;

            return (
              <div key={proj.id || idx} className="space-y-0.5 page-break-avoid break-inside-avoid">
                <div className="flex justify-between items-baseline text-xs flex-wrap gap-1">
                  <span className="font-bold">{title}</span>
                  <span className="font-mono text-[11px] text-neutral-600 flex items-center gap-2">
                    {techStack.length > 0 && `[${techStack.join(', ')}]`}
                    {githubUrl && (
                      <a href={githubUrl} target="_blank" rel="noreferrer" className="underline hover:text-black">
                        code
                      </a>
                    )}
                    {liveUrl && (
                      <a href={liveUrl} target="_blank" rel="noreferrer" className="underline hover:text-black">
                        live
                      </a>
                    )}
                  </span>
                </div>
                {subtitle && <p className="text-neutral-700 italic text-xs">{subtitle}</p>}
                {bullets.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-xs text-neutral-800">
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

      {/* Education */}
      {!isHidden('education') && eduList.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-[11px] font-mono font-bold uppercase tracking-wider text-black">
            // {getTitle('education', 'Education')}
          </h2>
          {eduList.map((edu, idx) => {
            const inst = cleanText(edu.institution);
            const eduDegreeText = formatEducationDegree(edu.degree, edu.branch || edu.fieldOfStudy);
            const year = cleanText(edu.graduationYear || edu.endDate);
            const gpa = cleanText(edu.cgpa || edu.gpa);

            return (
              <div key={edu.id || idx} className="flex justify-between items-baseline text-xs page-break-avoid break-inside-avoid">
                <div>
                  <span className="font-bold">{inst}</span>
                  {eduDegreeText && <span> — {eduDegreeText}</span>}
                  {gpa && <span className="font-mono ml-2">[GPA: {gpa}]</span>}
                </div>
                {year && <span className="font-mono text-[11px]">{year}</span>}
              </div>
            );
          })}
        </section>
      )}

      {/* Achievements & Leadership */}
      {((!isHidden('achievements') && achList.length > 0) || (!isHidden('leadership') && leadList.length > 0)) && (
        <section className="space-y-1">
          <h2 className="text-[11px] font-mono font-bold uppercase tracking-wider text-black">
            // Achievements & Leadership
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-0.5 text-xs text-neutral-800">
            {achList.map((ach, idx) => (
              <li key={`ach_${idx}`}>{ach}</li>
            ))}
            {leadList.map((lead, idx) => (
              <li key={`lead_${idx}`}>{lead}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Certifications & Publications */}
      {((!isHidden('certifications') && certList.length > 0) || (!isHidden('publications') && pubList.length > 0)) && (
        <section className="space-y-1 text-xs">
          <h2 className="text-[11px] font-mono font-bold uppercase tracking-wider text-black">
            // Certifications & Publications
          </h2>
          <div className="space-y-0.5 text-neutral-800">
            {certList.map((c, idx) => (
              <div key={idx}>
                <strong>{cleanText(c.name)}</strong> — {cleanText(c.organization || c.issuer)}
                {(c.completionDate || c.issueDate) && ` (${cleanText(c.completionDate || c.issueDate)})`}
              </div>
            ))}
            {pubList.map((p, idx) => (
              <div key={idx}>
                <strong>{cleanText(p.title)}</strong>{p.publisher ? ` — ${cleanText(p.publisher)}` : ''}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Extracurricular, Languages, Interests */}
      {((!isHidden('extracurricular') && extraList.length > 0) || (!isHidden('languages') && langList.length > 0) || (!isHidden('interests') && intList.length > 0)) && (
        <section className="pt-1 border-t border-neutral-300 text-xs text-neutral-800 space-y-0.5">
          {!isHidden('languages') && langList.length > 0 && (
            <div><strong>Languages:</strong> {langList.join(', ')}</div>
          )}
          {!isHidden('interests') && intList.length > 0 && (
            <div><strong>Interests:</strong> {intList.join(', ')}</div>
          )}
          {!isHidden('extracurricular') && extraList.length > 0 && (
            <div><strong>Activities:</strong> {extraList.join(', ')}</div>
          )}
        </section>
      )}
    </div>
  );
};
