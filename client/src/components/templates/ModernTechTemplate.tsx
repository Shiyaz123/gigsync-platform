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
import { Code2, Link2, Mail, Phone, MapPin, Globe, ExternalLink } from 'lucide-react';

interface TemplateProps {
  profile: CandidateProfile;
  customNames?: Record<string, string>;
  hiddenSections?: string[];
  spacing?: 'compact' | 'normal' | 'spacious';
}

export const ModernTechTemplate: React.FC<TemplateProps> = ({
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
    compact: 'space-y-3 text-xs',
    normal: 'space-y-4 text-xs sm:text-sm',
    spacious: 'space-y-6 text-sm'
  }[spacing];

  return (
    <div className={`modern-tech-template bg-white text-slate-900 font-sans p-8 sm:p-12 shadow-sm border border-slate-200 rounded-sm w-full max-w-4xl mx-auto ${spacingClasses}`}>
      {/* Header */}
      <header className="border-b-2 border-blue-600 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              {fullName || 'Candidate Name'}
            </h1>
            {title && (
              <p className="text-base font-semibold text-blue-600 tracking-wide mt-0.5">
                {title}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-slate-400" />
                {location}
              </span>
            )}
            {email && (
              <a href={`mailto:${email}`} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                <Mail size={13} className="text-slate-400" />
                {email}
              </a>
            )}
            {phone && (
              <span className="flex items-center gap-1">
                <Phone size={13} className="text-slate-400" />
                {phone}
              </span>
            )}
          </div>
        </div>

        {/* Links row */}
        {(github || linkedin || p.portfolio) && (
          <div className="flex flex-wrap items-center gap-3 mt-2 pt-2 border-t border-slate-100 text-xs font-mono text-slate-600">
            {github && (
              <a
                href={github.startsWith('http') ? github : `https://${github}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <Code2 size={13} />
                <span>{github.replace(/^https?:\/\/(www\.)?github\.com\/?/i, 'github/')}</span>
              </a>
            )}
            {linkedin && (
              <a
                href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <Link2 size={13} />
                <span>{linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/i, 'linkedin/')}</span>
              </a>
            )}
            {p.portfolio && !isNAOrEmpty(p.portfolio) && (
              <a
                href={p.portfolio.startsWith('http') ? p.portfolio : `https://${p.portfolio}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <Globe size={13} />
                <span>Portfolio</span>
              </a>
            )}
          </div>
        )}
      </header>

      {/* Summary */}
      {!isHidden('summary') && summary && (
        <section className="space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
            <span>{getTitle('summary', 'Professional Summary')}</span>
            <span className="flex-1 h-px bg-slate-200" />
          </h2>
          <p className="text-slate-700 leading-relaxed font-normal">{summary}</p>
        </section>
      )}

      {/* Technical Skills */}
      {!isHidden('skills') && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
            <span>{getTitle('skills', 'Technical Skills')}</span>
            <span className="flex-1 h-px bg-slate-200" />
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-800">
            {catSkills.programmingLanguages.length > 0 && (
              <div>
                <strong className="text-slate-950 font-semibold">Languages: </strong>
                <span>{catSkills.programmingLanguages.join(', ')}</span>
              </div>
            )}
            {catSkills.backendAndApis.length > 0 && (
              <div>
                <strong className="text-slate-950 font-semibold">Backend & APIs: </strong>
                <span>{catSkills.backendAndApis.join(', ')}</span>
              </div>
            )}
            {catSkills.databases.length > 0 && (
              <div>
                <strong className="text-slate-950 font-semibold">Databases: </strong>
                <span>{catSkills.databases.join(', ')}</span>
              </div>
            )}
            {catSkills.frontend.length > 0 && (
              <div>
                <strong className="text-slate-950 font-semibold">Frontend: </strong>
                <span>{catSkills.frontend.join(', ')}</span>
              </div>
            )}
            {catSkills.toolsAndDevelopment.length > 0 && (
              <div>
                <strong className="text-slate-950 font-semibold">Tools & Cloud: </strong>
                <span>{catSkills.toolsAndDevelopment.join(', ')}</span>
              </div>
            )}
            {catSkills.testing.length > 0 && (
              <div>
                <strong className="text-slate-950 font-semibold">Testing: </strong>
                <span>{catSkills.testing.join(', ')}</span>
              </div>
            )}
            {catSkills.csFundamentals.length > 0 && (
              <div>
                <strong className="text-slate-950 font-semibold">CS Fundamentals: </strong>
                <span>{catSkills.csFundamentals.join(', ')}</span>
              </div>
            )}
            {catSkills.aiAndMl.length > 0 && (
              <div>
                <strong className="text-slate-950 font-semibold">AI / ML: </strong>
                <span>{catSkills.aiAndMl.join(', ')}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Experience */}
      {!isHidden('experience') && expList.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
            <span>{getTitle('experience', 'Work Experience')}</span>
            <span className="flex-1 h-px bg-slate-200" />
          </h2>
          {expList.map((exp, idx) => {
            const expCompany = cleanText(exp.company);
            const expRole = cleanText(exp.role);
            const expType = cleanText(exp.employmentType);
            const expLoc = cleanText(exp.location);
            const expDur = cleanText(exp.duration) || `${cleanText(exp.startDate)} – ${exp.current ? 'Present' : cleanText(exp.endDate)}`.replace(/^ – | – $/g, '');
            const bullets = cleanList([...(exp.responsibilities || []), ...(exp.bullets || [])]);

            return (
              <div key={exp.id || idx} className="space-y-1 page-break-avoid break-inside-avoid">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-950 text-sm">{expRole || 'Software Engineer'}</span>
                    <span className="text-slate-500 mx-1.5">|</span>
                    <span className="font-semibold text-slate-800">{expCompany}</span>
                    {expType && <span className="text-slate-500 font-normal ml-1">({expType})</span>}
                  </div>
                  <div className="text-slate-500 font-mono text-[11px] flex items-center gap-2">
                    {expLoc && <span>{expLoc}</span>}
                    {expLoc && expDur && <span>•</span>}
                    {expDur && <span>{expDur}</span>}
                  </div>
                </div>
                {bullets.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-700 leading-relaxed">
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
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
            <span>{getTitle('projects', 'Projects')}</span>
            <span className="flex-1 h-px bg-slate-200" />
          </h2>
          {projList.map((proj, idx) => {
            const { title, subtitle, bullets, techStack, githubUrl, liveUrl } = cleanProjectEntry(proj);
            if (!title) return null;

            return (
              <div key={proj.id || idx} className="space-y-1 page-break-avoid break-inside-avoid">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-950 text-sm">{title}</span>
                    {techStack.length > 0 && (
                      <span className="text-slate-500 font-mono text-[11px]">
                        [{techStack.join(' • ')}]
                      </span>
                    )}
                  </div>
                  {(githubUrl || liveUrl) && (
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      {githubUrl && (
                        <a href={githubUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-0.5">
                          <Code2 size={11} /> Code
                        </a>
                      )}
                      {liveUrl && (
                        <a href={liveUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-0.5">
                          <ExternalLink size={11} /> Live Demo
                        </a>
                      )}
                    </div>
                  )}
                </div>
                {subtitle && <p className="text-slate-600 italic text-xs">{subtitle}</p>}
                {bullets.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-700 leading-relaxed">
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
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
            <span>{getTitle('education', 'Education')}</span>
            <span className="flex-1 h-px bg-slate-200" />
          </h2>
          {eduList.map((edu, idx) => {
            const inst = cleanText(edu.institution);
            const eduDegreeText = formatEducationDegree(edu.degree, edu.branch || edu.fieldOfStudy);
            const year = cleanText(edu.graduationYear || edu.endDate);
            const gpa = cleanText(edu.cgpa || edu.gpa);

            return (
              <div key={edu.id || idx} className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-xs page-break-avoid break-inside-avoid">
                <div>
                  <span className="font-bold text-slate-950">{inst}</span>
                  {eduDegreeText && (
                    <span className="text-slate-700 ml-1">
                      — {eduDegreeText}
                    </span>
                  )}
                  {gpa && <span className="text-slate-600 font-medium ml-2 font-mono">GPA: {gpa}</span>}
                </div>
                {year && <span className="text-slate-500 font-mono text-[11px]">{year}</span>}
              </div>
            );
          })}
        </section>
      )}

      {/* Achievements */}
      {!isHidden('achievements') && achList.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
            <span>{getTitle('achievements', 'Achievements')}</span>
            <span className="flex-1 h-px bg-slate-200" />
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-700 leading-relaxed">
            {achList.map((ach, idx) => (
              <li key={idx}>{ach}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Mentorship & Leadership */}
      {!isHidden('leadership') && leadList.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
            <span>{getTitle('leadership', 'Mentorship & Leadership')}</span>
            <span className="flex-1 h-px bg-slate-200" />
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-700 leading-relaxed">
            {leadList.map((lead, idx) => (
              <li key={idx}>{lead}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Certifications */}
      {!isHidden('certifications') && certList.length > 0 && (
        <section className="space-y-1.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
            <span>{getTitle('certifications', 'Certifications')}</span>
            <span className="flex-1 h-px bg-slate-200" />
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {certList.map((c, idx) => {
              const name = cleanText(c.name);
              const issuer = cleanText(c.organization || c.issuer);
              const date = cleanText(c.completionDate || c.issueDate);
              const link = cleanText(c.credentialLink || c.credentialUrl);

              return (
                <div key={c.id || idx} className="flex items-baseline justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-900">{name}</span>
                    {issuer && <span className="text-slate-600 text-[11px] ml-1">({issuer})</span>}
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {date && <span>{date}</span>}
                    {link && (
                      <a href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Publications */}
      {!isHidden('publications') && pubList.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
            <span>{getTitle('publications', 'Publications')}</span>
            <span className="flex-1 h-px bg-slate-200" />
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-1 text-slate-700">
            {pubList.map((pub, idx) => (
              <li key={pub.id || idx}>
                <span className="font-semibold text-slate-900">{pub.title}</span>
                {pub.publisher && <span className="text-slate-600"> — {pub.publisher}</span>}
                {pub.date && <span className="font-mono text-slate-500 ml-1">({pub.date})</span>}
                {pub.description && <p className="text-slate-600 italic text-xs mt-0.5">{pub.description}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Extracurricular Activities */}
      {!isHidden('extracurricular') && extraList.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
            <span>{getTitle('extracurricular', 'Extracurricular Activities')}</span>
            <span className="flex-1 h-px bg-slate-200" />
          </h2>
          <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-700 leading-relaxed">
            {extraList.map((act, idx) => (
              <li key={idx}>{act}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Languages & Interests */}
      {((!isHidden('languages') && langList.length > 0) || (!isHidden('interests') && intList.length > 0)) && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-slate-100 text-xs">
          {!isHidden('languages') && langList.length > 0 && (
            <div>
              <strong className="text-slate-900 font-semibold">{getTitle('languages', 'Languages Known')}: </strong>
              <span className="text-slate-700">{langList.join(', ')}</span>
            </div>
          )}
          {!isHidden('interests') && intList.length > 0 && (
            <div>
              <strong className="text-slate-900 font-semibold">{getTitle('interests', 'Interests')}: </strong>
              <span className="text-slate-700">{intList.join(', ')}</span>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
