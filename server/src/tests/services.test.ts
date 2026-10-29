import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateJobMatch, matchesSkillToken, normalizeSkill } from '../services/matchingEngine';
import { escapeLatex, generateLatexResume } from '../services/latexService';
import { parseResumeText } from '../services/parserService';
import { DEFAULT_GUEST_PROFILE } from '../data/seedData';
import { MOCK_TEST_JOB_LISTINGS } from './fixtures/mockJobs';

test('MatchingEngine: normalizes skill tokens correctly', () => {
  assert.equal(normalizeSkill('React.js'), 'react');
  assert.equal(normalizeSkill('Node.js  '), 'node');
  assert.equal(normalizeSkill('  PostgreSQL '), 'postgresql');
});

test('MatchingEngine: matches skill aliases accurately', () => {
  assert.equal(matchesSkillToken('React', 'Built with React 18 and Vite'), true);
  assert.equal(matchesSkillToken('TypeScript', 'Proficient in TS and JS'), true);
  assert.equal(matchesSkillToken('Docker', 'Created Dockerfile and container workflows'), true);
  assert.equal(matchesSkillToken('Docker', 'Experienced with React and Node'), false);
});

test('MatchingEngine: calculates explainable match score and separates hard constraints', () => {
  const job = MOCK_TEST_JOB_LISTINGS[0]; // Junior Full-Stack Developer
  const result = calculateJobMatch(DEFAULT_GUEST_PROFILE, job);

  assert.ok(result.overallScore > 60, 'Score should be high for matching full-stack profile');
  assert.ok(result.matchedSkills.length >= 3, 'Should match React, TypeScript, Node.js, SQL, Git');
  assert.ok(result.explanation.includes('Matches'), 'Should have explanatory text');

  // Hard constraints check (FR-19)
  const authConstraint = result.hardConstraints.find(c => c.constraint.includes('Work Authorization'));
  assert.ok(authConstraint, 'Should capture work authorization as a hard constraint');
  assert.equal(authConstraint?.status, 'unknown', 'Should treat unknown auth as unknown, not mismatch');
});

test('LatexService: escapes special characters to prevent injection', () => {
  const unsafeString = '100% C# & R&D $100K {test} _under_ ~tilde~ ^hat^ \\escape';
  const escaped = escapeLatex(unsafeString);

  assert.ok(escaped.includes('\\%'), 'Percent must be escaped');
  assert.ok(escaped.includes('\\&'), 'Ampersand must be escaped');
  assert.ok(escaped.includes('\\$'), 'Dollar sign must be escaped');
  assert.ok(escaped.includes('\\_'), 'Underscore must be escaped');
  assert.ok(escaped.includes('\\{'), 'Open brace must be escaped');
  assert.ok(escaped.includes('\\}'), 'Close brace must be escaped');
  assert.ok(escaped.includes('\\textbackslash{}'), 'Backslash must be escaped');
  assert.ok(!escaped.includes('<'), 'HTML tags must be stripped');
});

test('LatexService: generates valid, compilable LaTeX document structure', () => {
  const latex = generateLatexResume(DEFAULT_GUEST_PROFILE, 'modern');

  assert.ok(latex.includes('\\documentclass'), 'Must define documentclass');
  assert.ok(latex.includes('\\begin{document}'), 'Must have begin document');
  assert.ok(latex.includes('\\end{document}'), 'Must have end document');
  assert.ok(latex.includes('Alex Morgan'), 'Must contain candidate name');
  assert.ok(latex.includes('California State University'), 'Must contain education institution');
});

test('ParserService: extracts contact and skills without hallucination', () => {
  const sampleResume = `
Johnathan Doe
johndoe@example.com | (555) 987-6543 | San Francisco, CA
linkedin.com/in/johndoe | github.com/johndoe

EDUCATION
Bachelor of Science in Computer Science
Stanford University, 2021 - 2025

TECHNICAL SKILLS
Languages: Python, JavaScript, TypeScript, SQL
Frameworks: React, FastAPI, Node.js
Tools: Docker, Git, Linux
`;

  const parsed = parseResumeText(sampleResume);

  assert.equal(parsed.extractedProfile.personalInfo.fullName, 'Johnathan Doe');
  assert.equal(parsed.extractedProfile.personalInfo.email, 'johndoe@example.com');
  assert.ok(parsed.extractedProfile.skills.technical.includes('Python'));
  assert.ok(parsed.extractedProfile.skills.technical.includes('TypeScript'));
  assert.ok(parsed.extractedProfile.skills.frameworks.includes('React'));
  assert.ok(parsed.extractedProfile.skills.tools.includes('Docker'));
  assert.ok(parsed.confidenceScore >= 70, 'Confidence score should reflect good match');
  assert.equal(parsed.extractedProfile.confirmedFactsOnly, false, 'Parsed profile must require confirmation');
});
