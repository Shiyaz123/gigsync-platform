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

export const ClassicAcademicTemplate: React.FC<TemplateProps> = ({
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

  const contactElements: React.ReactNode[] = [];
  if (location) contactElements.push(<span key="loc">{location}</span>);
  if (phone) contactElements.push(<a key="phone" href={`tel:${phone}`} className="hover:underline">{phone}</a>);
  if (email) contactElements.push(<a key="email" href={`mailto:${email}`} className="hover:underline">{email}</a>);
  if (linkedin) {
    const safeLi = formatSafeUrl(linkedin);
    contactElements.push(
      safeLi ? (
        <a key="li" href={safeLi} target="_blank" rel="noreferrer" className="hover:underline">
          {linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/i, 'LinkedIn: ')}
        </a>
      ) : (
        <span key="li">{linkedin}</span>
      )
    );
  }
  if (github) {
    const safeGh = formatSafeUrl(github);
    contactElements.push(
      safeGh ? (
        <a key="gh" href={safeGh} target="_blank" rel="noreferrer" className="hover:underline">
          {github.replace(/^https?:\/\/(www\.)?github\.com\/?/i, 'GitHub: ')}
        </a>
      ) : (
        <span key="gh">{github}</span>
      )
    );
  }

  const spacingClasses = {
    compact: 'space-y-3 text-xs leading-normal',
    normal: 'space-y-4 text-xs sm:text-[13px] leading-relaxed',
    spacious: 'space-y-6 text-sm leading-relaxed'
  }[spacing];

  return (
    <div
      className={`classic-academic-template bg-white text-black p-8 sm:p-14 shadow-sm border border-neutral-300 w-full max-w-4xl mx-auto ${spacingClasses}`}
      style={{ fontFamily: "'Times New Roman', Times, 'Charter', 'Georgia', serif" }}
    >
      {/* Centered Academic Header */}
      <header className="text-center pb-3 border-b-2 border-black">
        <h1 className="text-3xl sm:text-4xl font-normal tracking-tight uppercase">
          {fullName || 'Candidate Name'}
        </h1>
        {title && <p className="text-sm italic text-neutral-800 mt-1">{title}</p>}
        {contactElements.length > 0 && (
          <p className="text-xs text-neutral-700 mt-2 tracking-wide">
            {contactElements.map((item, idx) => (
              <React.Fragment key={idx}>
                {item}
                {idx < contactElements.length - 1 && <span className="mx-2">•</span>}
              </React.Fragment>
            ))}
          </p>
        )}
      </header>

      {/* Summary */}
      {!isHidden('summary') && summary && (
        <section className="space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black pb-0.5">
            {getTitle('summary', 'Curriculum Vitae Overview')}
          </h2>
          <p className="text-neutral-900 text-justify">{summary}</p>
        </section>
      )}

      {/* Education — Top Priority in Academic CV */}
      {!isHidden('education') && eduList.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black pb-0.5">
            {getTitle('education', 'Education & Academic Background')}
          </h2>
          {eduList.map((edu, idx) => {
            const inst = cleanText(edu.institution);
            const eduDegreeText = formatEducationDegree(edu.degree, edu.branch || edu.fieldOfStudy);
            const year = cleanText(edu.graduationYear || edu.endDate);
            const gpa = cleanText(edu.cgpa || edu.gpa);

            return (
              <div key={edu.id || idx} className="space-y-0.5 page-break-avoid break-inside-avoid">
                <div className="flex justify-between items-baseline font-bold">
                  <span>{inst}</span>
                  {year && <span className="font-normal text-xs">{year}</span>}
                </div>
                <div className="flex justify-between items-baseline italic text-neutral-800 text-xs">
                  <span>{eduDegreeText}</span>
                  {gpa && <span className="not-italic font-medium">Cumulative Grade: {gpa}</span>}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Publications */}
      {!isHidden('publications') && pubList.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black pb-0.5">
            {getTitle('publications', 'Publications & Scholarly Works')}
          </h2>
          <ol className="list-decimal list-outside pl-5 space-y-1">
            {pubList.map((pub, idx) => {
              const safeUrl = formatSafeUrl(pub.url);
              return (
                <li key={pub.id || idx} className="page-break-avoid break-inside-avoid">
                  <span className="font-semibold">{pub.title}</span>.
                  {pub.publisher && <span className="italic ml-1">{pub.publisher}</span>}
                  {pub.date && <span className="ml-1">({pub.date})</span>}
                  {safeUrl && (
                    <a href={safeUrl} target="_blank" rel="noreferrer" className="ml-1 text-neutral-700 text-xs underline">
                      [Link]
                    </a>
                  )}
                  {pub.description && <p className="text-neutral-700 text-xs mt-0.5">{pub.description}</p>}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* Technical Skills */}
      {!isHidden('skills') && (
        <section className="space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black pb-0.5">
            {getTitle('skills', 'Technical & Specialized Skills')}
          </h2>
          <div className="space-y-1 text-xs">
            {catSkills.programmingLanguages.length > 0 && (
              <div>
                <strong>Programming Languages: </strong>
                <span>{catSkills.programmingLanguages.join(', ')}</span>
              </div>
            )}
            {catSkills.backendAndApis.length > 0 && (
              <div>
                <strong>Backend & Systems: </strong>
                <span>{catSkills.backendAndApis.join(', ')}</span>
              </div>
            )}
            {catSkills.databases.length > 0 && (
              <div>
                <strong>Databases & Storage: </strong>
                <span>{catSkills.databases.join(', ')}</span>
              </div>
            )}
            {catSkills.csFundamentals.length > 0 && (
              <div>
                <strong>Computer Science Fundamentals: </strong>
                <span>{catSkills.csFundamentals.join(', ')}</span>
              </div>
            )}
            {catSkills.aiAndMl.length > 0 && (
              <div>
                <strong>Artificial Intelligence / Machine Learning: </strong>
                <span>{catSkills.aiAndMl.join(', ')}</span>
              </div>
            )}
            {catSkills.toolsAndDevelopment.length > 0 && (
              <div>
                <strong>Scientific & Engineering Tools: </strong>
                <span>{catSkills.toolsAndDevelopment.join(', ')}</span>
              </div>
            )}
            {catSkills.frontend.length > 0 && (
              <div>
                <strong>Frontend: </strong>
                <span>{catSkills.frontend.join(', ')}</span>
              </div>
            )}
            {catSkills.testing.length > 0 && (
              <div>
                <strong>Testing & Verification: </strong>
                <span>{catSkills.testing.join(', ')}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Research & Engineering Projects */}
      {!isHidden('projects') && projList.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black pb-0.5">
            {getTitle('projects', 'Research & Engineering Projects')}
          </h2>
          {projList.map((proj, idx) => {
            const { title, subtitle, bullets, techStack, githubUrl, liveUrl } = cleanProjectEntry(proj);
            if (!title) return null;

            return (
              <div key={proj.id || idx} className="space-y-1 page-break-avoid break-inside-avoid">
                <div className="flex justify-between items-baseline font-bold text-xs flex-wrap gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>{title}</span>
                    {techStack.length > 0 && <span className="font-normal italic text-neutral-700">({techStack.join(', ')})</span>}
                  </div>
                  {(githubUrl || liveUrl) && (
                    <div className="flex items-center gap-2 font-normal text-[11px]">
                      {githubUrl && (
                        <a href={githubUrl} target="_blank" rel="noreferrer" className="text-neutral-800 underline hover:text-black">
                          Repository
                        </a>
                      )}
                      {githubUrl && liveUrl && <span>•</span>}
                      {liveUrl && (
                        <a href={liveUrl} target="_blank" rel="noreferrer" className="text-neutral-800 underline hover:text-black">
                          Demonstration
                        </a>
                      )}
                    </div>
                  )}
                </div>
                {subtitle && <p className="text-neutral-800 text-xs italic">{subtitle}</p>}
                {bullets.length > 0 && (
                  <ul className="list-disc list-outside pl-5 space-y-0.5 text-xs text-neutral-900">
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

      {/* Professional & Academic Experience */}
      {!isHidden('experience') && expList.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black pb-0.5">
            {getTitle('experience', 'Professional & Academic Experience')}
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
                  <span className="font-normal">{expDur}</span>
                </div>
                {expLoc && <p className="text-neutral-700 text-xs italic">{expLoc}</p>}
                {bullets.length > 0 && (
                  <ul className="list-disc list-outside pl-5 space-y-0.5 text-xs text-neutral-900 mt-1">
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

      {/* Achievements */}
      {!isHidden('achievements') && achList.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black pb-0.5">
            {getTitle('achievements', 'Honors & Academic Achievements')}
          </h2>
          <ul className="list-disc list-outside pl-5 space-y-0.5 text-xs">
            {achList.map((ach, idx) => (
              <li key={idx}>{ach}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Mentorship & Leadership */}
      {!isHidden('leadership') && leadList.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black pb-0.5">
            {getTitle('leadership', 'Mentorship & Academic Leadership')}
          </h2>
          <ul className="list-disc list-outside pl-5 space-y-0.5 text-xs">
            {leadList.map((lead, idx) => (
              <li key={idx}>{lead}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Certifications */}
      {!isHidden('certifications') && certList.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black pb-0.5">
            {getTitle('certifications', 'Certifications & Accreditations')}
          </h2>
          <ul className="list-disc list-outside pl-5 space-y-0.5 text-xs">
            {certList.map((c, idx) => (
              <li key={c.id || idx}>
                <strong>{cleanText(c.name)}</strong>
                {c.organization && ` — ${cleanText(c.organization)}`}
                {(c.completionDate || c.issueDate) && ` (${cleanText(c.completionDate || c.issueDate)})`}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Extracurricular Activities */}
      {!isHidden('extracurricular') && extraList.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-widest border-b border-black pb-0.5">
            {getTitle('extracurricular', 'Extracurricular Activities & Service')}
          </h2>
          <ul className="list-disc list-outside pl-5 space-y-0.5 text-xs">
            {extraList.map((act, idx) => (
              <li key={idx}>{act}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Languages & Interests */}
      {((!isHidden('languages') && langList.length > 0) || (!isHidden('interests') && intList.length > 0)) && (
        <section className="pt-2 border-t border-neutral-300 text-xs space-y-1">
          {!isHidden('languages') && langList.length > 0 && (
            <div>
              <strong>{getTitle('languages', 'Languages Known')}: </strong>
              <span>{langList.join(', ')}</span>
            </div>
          )}
          {!isHidden('interests') && intList.length > 0 && (
            <div>
              <strong>{getTitle('interests', 'Academic & Personal Interests')}: </strong>
              <span>{intList.join(', ')}</span>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
