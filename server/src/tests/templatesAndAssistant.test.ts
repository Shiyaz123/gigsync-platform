import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateLatexResume } from '../services/latexService';
import { executeResumeEditInstruction } from '../services/aiAssistantService';
import { CandidateProfile } from '../types';

const mockProfile: CandidateProfile = {
  userId: 'test_user_1',
  personalInfo: {
    fullName: 'Alex Morgan',
    email: 'alex@example.com',
    phone: '+1 (555) 019-2834',
    location: 'San Francisco, CA',
    title: 'Senior Software Engineer',
    summary: 'Experienced engineer specializing in distributed systems and cloud platforms.',
    linkedin: 'https://linkedin.com/in/alexmorgan',
    github: 'https://github.com/alexmorgan',
    portfolio: 'https://alexmorgan.dev'
  },
  education: [
    {
      id: 'edu_1',
      institution: 'University of California, Berkeley',
      degree: 'B.S.',
      branch: 'Electrical Engineering & Computer Science',
      fieldOfStudy: 'Electrical Engineering & Computer Science',
      graduationYear: '2022',
      startDate: '2018',
      endDate: '2022',
      cgpa: '3.92',
      gpa: '3.92',
      confirmed: true
    }
  ],
  experience: [
    {
      id: 'exp_1',
      company: 'Stripe',
      role: 'Software Engineer',
      employmentType: 'Full-time',
      location: 'San Francisco, CA',
      duration: '2022 – Present',
      startDate: '2022',
      endDate: 'Present',
      current: true,
      responsibilities: [
        'Architected high-throughput ledger service processing 10k+ transactions/sec.',
        'Reduced p99 latency by 40% using Redis pipelining.'
      ],
      bullets: [
        'Architected high-throughput ledger service processing 10k+ transactions/sec.',
        'Reduced p99 latency by 40% using Redis pipelining.'
      ],
      confirmed: true
    }
  ],
  projects: [
    {
      id: 'proj_1',
      title: 'GigSync Career Platform',
      description: 'AI-assisted resume building and real-time job matching engine.',
      technologies: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      techStack: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      keyFeatures: [
        'Engineered strict city-boundary regex filter for zero-bleed location search.',
        'Implemented 4 distinct LaTeX templates with instant switching.'
      ],
      bullets: [
        'Engineered strict city-boundary regex filter for zero-bleed location search.',
        'Implemented 4 distinct LaTeX templates with instant switching.'
      ],
      githubUrl: 'https://github.com/alex/gigsync',
      liveUrl: 'https://gigsync-platform.vercel.app',
      confirmed: true
    }
  ],
  skills: {
    technical: ['TypeScript', 'Go', 'Python', 'Java'],
    frameworks: ['React', 'Node.js'],
    tools: ['Docker', 'Kubernetes'],
    soft: ['Team Leadership']
  },
  categorizedSkills: {
    programmingLanguages: ['TypeScript', 'Go', 'Python', 'Java'],
    backendAndApis: ['Node.js', 'FastAPI', 'gRPC'],
    databases: ['PostgreSQL', 'Redis'],
    testing: ['Jest', 'PyTest'],
    toolsAndDevelopment: ['Docker', 'Kubernetes', 'Git'],
    frontend: ['React', 'Tailwind CSS'],
    csFundamentals: ['Distributed Systems', 'Algorithms'],
    aiAndMl: ['PyTorch', 'LLMs']
  },
  certifications: [
    {
      id: 'cert_1',
      name: 'AWS Solutions Architect Associate',
      issuer: 'Amazon Web Services',
      organization: 'Amazon Web Services',
      issueDate: '2024',
      completionDate: '2024',
      credentialUrl: 'https://aws.amazon.com/verify',
      confirmed: true
    }
  ],
  achievements: ['Won 1st Place at CalHacks 2021 among 300+ teams.'],
  mentorshipAndLeadership: ['Mentored 15+ junior developers through HackBright.'],
  publications: [
    {
      id: 'pub_1',
      title: 'Optimizing Distributed Consensus in Edge Clusters',
      publisher: 'IEEE CloudNet',
      date: '2023',
      url: 'https://doi.org/10.1109/example',
      description: 'Evaluated Raft protocol optimizations under high network jitter.'
    }
  ],
  extracurricularActivities: ['Organized Bay Area Go Meetup (500+ members).'],
  languagesKnown: ['English (Native)', 'Spanish (Conversational)'],
  interests: ['Open Source Tooling', 'Rock Climbing'],
  careerPreferences: {
    targetRoles: ['Senior Software Engineer'],
    workModes: ['Remote', 'Hybrid'],
    targetLocations: ['San Francisco, CA'],
    minSalary: '$160,000'
  },
  confirmedFactsOnly: true,
  lastConfirmedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('Resume Templates (Modern Tech, Classic Academic, Executive, Minimalist)', () => {
  it('generates distinct compilable LaTeX for all 4 templates without errors', () => {
    const modern = generateLatexResume(mockProfile, 'modern');
    const academic = generateLatexResume(mockProfile, 'academic');
    const executive = generateLatexResume(mockProfile, 'executive');
    const minimalist = generateLatexResume(mockProfile, 'minimalist');

    assert.ok(modern.includes('Modern Tech Template'), 'Modern template header present');
    assert.ok(modern.includes('Alex Morgan'), 'Modern template includes candidate name');
    assert.ok(modern.includes('Technical Skills'), 'Modern template includes skills');

    assert.ok(academic.includes('Classic Academic Template'), 'Academic template header present');
    assert.ok(academic.includes('Publications \\& Research'), 'Academic emphasizes publications & research');
    assert.ok(academic.includes('University of California, Berkeley'), 'Academic includes university');

    assert.ok(executive.includes('Executive Template'), 'Executive template header present');
    assert.ok(executive.includes('Executive Profile'), 'Executive emphasizes executive profile');
    assert.ok(executive.includes('Core Competencies'), 'Executive includes core competencies');

    assert.ok(minimalist.includes('Minimalist Template'), 'Minimalist template header present');
    assert.ok(minimalist.includes('Ultra Clean ATS'), 'Minimalist marked as ultra clean ATS');

    // Verify all 4 templates have distinct LaTeX class/geometry
    assert.notStrictEqual(modern, academic, 'Modern and Academic templates are distinct');
    assert.notStrictEqual(modern, executive, 'Modern and Executive templates are distinct');
    assert.notStrictEqual(modern, minimalist, 'Modern and Minimalist templates are distinct');
    assert.notStrictEqual(executive, minimalist, 'Executive and Minimalist templates are distinct');
  });

  it('filters out N/A, NA, Not Applicable, and blank values from generated resumes', () => {
    const profileWithNA: CandidateProfile = JSON.parse(JSON.stringify(mockProfile));
    profileWithNA.personalInfo.portfolio = 'N/A';
    profileWithNA.education[0].cgpa = 'Not Applicable';
    profileWithNA.achievements = ['N/A', 'NA', 'Won 1st place'];
    profileWithNA.interests = ['Not Applicable'];

    const modern = generateLatexResume(profileWithNA, 'modern');
    assert.strictEqual(modern.includes('Not Applicable'), false, 'Does not output "Not Applicable"');
    assert.strictEqual(modern.includes('Portfolio'), false, 'Omitted N/A portfolio link');
    assert.ok(modern.includes('Won 1st place'), 'Preserved valid achievement');
  });
});

describe('AI Resume Editor Chatbot (executeResumeEditInstruction)', () => {
  it('safely removes a specific skill from programming languages while preserving others', async () => {
    const res = await executeResumeEditInstruction(
      'Remove Java from my programming languages',
      mockProfile
    );

    assert.ok(res.operations.length > 0, 'Operations recorded');
    assert.strictEqual(res.operations[0].type, 'DELETE');
    assert.strictEqual(res.operations[0].value, 'Java');

    const updatedLanguages = res.updatedProfile.categorizedSkills?.programmingLanguages || [];
    assert.ok(!updatedLanguages.includes('Java'), 'Java was removed');
    assert.ok(updatedLanguages.includes('TypeScript'), 'TypeScript was preserved');
    assert.ok(updatedLanguages.includes('Go'), 'Go was preserved');
    assert.ok(updatedLanguages.includes('Python'), 'Python was preserved');

    // Confirm unrelated sections were untouched
    assert.strictEqual(res.updatedProfile.experience.length, mockProfile.experience.length);
    assert.strictEqual(res.updatedProfile.projects.length, mockProfile.projects.length);
  });

  it('safely adds a new skill under a specific category', async () => {
    const res = await executeResumeEditInstruction(
      'Add Terraform under Tools & Development',
      mockProfile
    );

    assert.ok(res.operations.length > 0, 'Operations recorded');
    assert.strictEqual(res.operations[0].type, 'ADD');

    const updatedTools = res.updatedProfile.categorizedSkills?.toolsAndDevelopment || [];
    assert.ok(updatedTools.includes('Terraform'), 'Terraform added to tools');
    assert.ok(updatedTools.includes('Docker'), 'Docker preserved in tools');
  });

  it('renames a section header accurately', async () => {
    const res = await executeResumeEditInstruction(
      'Rename Technical Skills to Core Competencies',
      mockProfile
    );

    assert.strictEqual(res.updatedProfile.sectionNames?.skills, 'Core Competencies');
    assert.ok(res.reply.includes('Core Competencies'), 'Reply confirms rename');
  });

  it('reorders sections when requested', async () => {
    const res = await executeResumeEditInstruction(
      'Move Certifications above Projects',
      mockProfile
    );

    const order = res.updatedProfile.sectionOrder || [];
    const certIdx = order.indexOf('certifications');
    const projIdx = order.indexOf('projects');
    assert.ok(certIdx !== -1 && projIdx !== -1, 'Both sections present in order');
    assert.ok(certIdx < projIdx, 'Certifications is positioned before Projects');
  });

  it('hides a section when asked to remove it without deleting user underlying data', async () => {
    const res = await executeResumeEditInstruction(
      'Remove the Interests section',
      mockProfile
    );

    assert.ok(res.updatedProfile.hiddenSections?.includes('interests'), 'Interests marked hidden');
    assert.ok((res.updatedProfile.interests || []).length > 0, 'Original data preserved');
  });

  it('clears a specific personalInfo field when requested', async () => {
    const res = await executeResumeEditInstruction(
      'Remove the GitHub field',
      mockProfile
    );

    assert.strictEqual(res.updatedProfile.personalInfo.github, '', 'GitHub field cleared');
    assert.strictEqual(res.updatedProfile.personalInfo.email, mockProfile.personalInfo.email, 'Email preserved');
  });

  it('sets compact layout spacing when requested', async () => {
    const res = await executeResumeEditInstruction(
      'Make CV compact (one page)',
      mockProfile
    );

    assert.strictEqual(res.updatedProfile.layoutSpacing, 'compact', 'Compact layout set');
  });
});
