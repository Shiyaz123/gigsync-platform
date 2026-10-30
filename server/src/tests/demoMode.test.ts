import test from 'node:test';
import assert from 'node:assert/strict';
import { ALEX_MORGAN_DEMO_PROFILE, CLEAN_EMPTY_PROFILE } from '../data/seedData';
import { executeResumeEditInstruction } from '../services/aiAssistantService';
import { generateLatexResume } from '../services/latexService';
import { calculateJobMatch } from '../services/matchingEngine';

test('DemoMode: Alex Morgan profile contains all required demonstration data', () => {
  // 1. Personal Information
  assert.equal(ALEX_MORGAN_DEMO_PROFILE.personalInfo.fullName, 'Alex Morgan');
  assert.equal(ALEX_MORGAN_DEMO_PROFILE.personalInfo.location, 'Bengaluru, Karnataka, India');
  assert.equal(ALEX_MORGAN_DEMO_PROFILE.personalInfo.title, 'Software Engineer');
  assert.equal(ALEX_MORGAN_DEMO_PROFILE.personalInfo.phone, '+91 98765 43210');
  assert.equal(ALEX_MORGAN_DEMO_PROFILE.personalInfo.email, 'alex.morgan.demo@example.com');
  assert.equal(ALEX_MORGAN_DEMO_PROFILE.personalInfo.github, 'https://github.com/alexmorgan-demo');
  assert.equal(ALEX_MORGAN_DEMO_PROFILE.personalInfo.linkedin, 'https://www.linkedin.com/in/alex-morgan-demo');

  // 2. Education
  assert.ok(ALEX_MORGAN_DEMO_PROFILE.education.length >= 1);
  assert.equal(ALEX_MORGAN_DEMO_PROFILE.education[0].institution, 'Example Institute of Technology');
  assert.equal(ALEX_MORGAN_DEMO_PROFILE.education[0].degree, 'Bachelor of Engineering');
  assert.equal(ALEX_MORGAN_DEMO_PROFILE.education[0].fieldOfStudy, 'Computer Science and Engineering');
  assert.equal(ALEX_MORGAN_DEMO_PROFILE.education[0].graduationYear, '2027');
  assert.equal(ALEX_MORGAN_DEMO_PROFILE.education[0].cgpa, '8.5');

  // 3. Technical Skills
  const progLangs = ALEX_MORGAN_DEMO_PROFILE.categorizedSkills?.programmingLanguages || [];
  assert.ok(progLangs.includes('Python'));
  assert.ok(progLangs.includes('Java'));
  assert.ok(progLangs.includes('JavaScript'));
  assert.ok(progLangs.includes('C++'));

  const backend = ALEX_MORGAN_DEMO_PROFILE.categorizedSkills?.backendAndApis || [];
  assert.ok(backend.includes('Django'));
  assert.ok(backend.includes('Flask'));
  assert.ok(backend.includes('Node.js'));

  const databases = ALEX_MORGAN_DEMO_PROFILE.categorizedSkills?.databases || [];
  assert.ok(databases.includes('PostgreSQL'));
  assert.ok(databases.includes('MySQL'));
  assert.ok(databases.includes('MongoDB'));

  const aiml = ALEX_MORGAN_DEMO_PROFILE.categorizedSkills?.aiAndMl || [];
  assert.ok(aiml.includes('Machine Learning'));
  assert.ok(aiml.includes('Scikit-learn'));

  // 4. Experience & Projects
  assert.ok(ALEX_MORGAN_DEMO_PROFILE.experience.length >= 1);
  assert.equal(ALEX_MORGAN_DEMO_PROFILE.experience[0].company, 'Innovatech Cloud Solutions');
  assert.ok(ALEX_MORGAN_DEMO_PROFILE.projects.length >= 4);

  // 5. All 13 sections populated
  assert.ok(ALEX_MORGAN_DEMO_PROFILE.certifications.length >= 2);
  assert.ok(ALEX_MORGAN_DEMO_PROFILE.achievements && ALEX_MORGAN_DEMO_PROFILE.achievements.length >= 2);
  assert.ok(ALEX_MORGAN_DEMO_PROFILE.mentorshipAndLeadership && ALEX_MORGAN_DEMO_PROFILE.mentorshipAndLeadership.length >= 1);
  assert.ok(ALEX_MORGAN_DEMO_PROFILE.publications && ALEX_MORGAN_DEMO_PROFILE.publications.length >= 1);
  assert.ok(ALEX_MORGAN_DEMO_PROFILE.extracurricularActivities && ALEX_MORGAN_DEMO_PROFILE.extracurricularActivities.length >= 1);
  assert.ok(ALEX_MORGAN_DEMO_PROFILE.languagesKnown && ALEX_MORGAN_DEMO_PROFILE.languagesKnown.length >= 3);
  assert.ok(ALEX_MORGAN_DEMO_PROFILE.interests && ALEX_MORGAN_DEMO_PROFILE.interests.length >= 4);
});

test('DemoMode: Clean blank profile starts empty for normal users', () => {
  assert.equal(CLEAN_EMPTY_PROFILE.personalInfo.fullName, '');
  assert.equal(CLEAN_EMPTY_PROFILE.personalInfo.email, '');
  assert.equal(CLEAN_EMPTY_PROFILE.education.length, 0);
  assert.equal(CLEAN_EMPTY_PROFILE.experience.length, 0);
  assert.equal(CLEAN_EMPTY_PROFILE.projects.length, 0);
  assert.equal(CLEAN_EMPTY_PROFILE.skills.technical.length, 0);
});

test('DemoMode: All four templates render Alex Morgan profile without errors', () => {
  const templates: ('modern' | 'academic' | 'executive' | 'minimalist')[] = ['modern', 'academic', 'executive', 'minimalist'];
  for (const t of templates) {
    const latex = generateLatexResume(ALEX_MORGAN_DEMO_PROFILE, t);
    assert.ok(latex.includes('Alex Morgan'), `Template ${t} must render Alex Morgan`);
    assert.ok(latex.includes('Bengaluru'), `Template ${t} must render Bengaluru`);
    assert.ok(latex.includes('Example Institute of Technology'), `Template ${t} must render University`);
    assert.ok(latex.includes('\\end{document}'), `Template ${t} must be complete`);
  }
});

test('DemoMode: AI Resume Assistant Chatbot edits Alex Morgan demo profile successfully', async () => {
  const cloned = JSON.parse(JSON.stringify(ALEX_MORGAN_DEMO_PROFILE));
  const editResult = await executeResumeEditInstruction('Add Kubernetes to toolsAndDevelopment', cloned);

  assert.ok(editResult.operations.length > 0, 'Must produce edit operations');
  const tools = editResult.updatedProfile.categorizedSkills?.toolsAndDevelopment || [];
  assert.ok(tools.includes('Kubernetes'), 'AI editor should add Kubernetes to tools');
});
