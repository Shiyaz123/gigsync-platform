import { JobListing } from '../../types';

/**
 * MOCK TEST FIXTURES ONLY.
 * Strictly prohibited from being returned in production APIs or user-facing job discoveries.
 */
export const MOCK_TEST_JOB_LISTINGS: JobListing[] = [
  {
    id: 'test_job_1',
    source: 'LinkedIn',
    sourceJobId: 'test-li-001',
    title: 'Junior Full-Stack Developer',
    company: 'Test Systems Corp',
    location: 'San Francisco, CA',
    workMode: 'Hybrid',
    experienceLevel: 'Entry-level',
    salaryRange: '$80,000 - $95,000 / year',
    description: 'Unit testing fixture for developer role.',
    requirements: {
      essentialSkills: ['React', 'TypeScript', 'Node.js', 'SQL', 'Git'],
      preferredSkills: ['Docker', 'PostgreSQL', 'Tailwind CSS'],
      constraints: ['Must possess US Work Authorization'],
      minYearsExperience: 0,
      degreeRequirement: 'BS in Computer Science'
    },
    postedAt: '2026-10-26T09:00:00Z',
    applyUrl: 'https://example.com/jobs/test-001',
    verified: true
  },
  {
    id: 'test_job_2',
    source: 'Indeed',
    sourceJobId: 'test-ind-002',
    title: 'Junior Python Backend Engineer',
    company: 'Test Data Labs',
    location: 'Austin, TX',
    workMode: 'Remote',
    experienceLevel: 'Junior',
    salaryRange: '$85,000 - $100,000 / year',
    description: 'Unit testing fixture for Python role.',
    requirements: {
      essentialSkills: ['Python', 'SQL', 'REST APIs', 'FastAPI', 'Docker'],
      preferredSkills: ['AWS', 'PostgreSQL'],
      constraints: ['Authorized to work in USA'],
      minYearsExperience: 1
    },
    postedAt: '2026-10-25T11:00:00Z',
    applyUrl: 'https://example.com/jobs/test-002',
    verified: true
  }
];
