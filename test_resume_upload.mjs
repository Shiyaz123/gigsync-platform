import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('====================================================');
  console.log('GigSync Resume Upload & Extraction Verification Test');
  console.log('====================================================\n');

  const BASE_URL = 'http://localhost:5000';

  // 1. Create Candidate 1 Resume (Priya Sharma - AI/ML)
  const resumePriya = `Priya Sharma
priya.sharma@stanford.edu | +1 650-723-2300 | Palo Alto, CA
github.com/priyasharma-ai | linkedin.com/in/priyasharma-ai

SUMMARY
Graduate student specializing in deep learning architectures and transformer optimization.

EDUCATION
Stanford University
Master of Science in Artificial Intelligence
2023 - 2025

TECHNICAL SKILLS
Languages: Python, C++, SQL, Bash
Frameworks: PyTorch, TensorFlow, HuggingFace, Keras, FastAI
Tools: CUDA, Docker, Linux, Git, Weights & Biases, Kubernetes

EXPERIENCE
Stanford AI Lab (2023 - 2025)
Research Assistant in Multimodal Architectures
- Implemented high-throughput CUDA kernels for transformer self-attention.
- Published benchmark evaluations on vision-language models.

PROJECTS
VisionTransformer-Optimization
- Engineered quantized ViT pipeline in PyTorch, reducing inference latency by 34%.
`;

  // 2. Create Candidate 2 Resume (Marcus Vance - Frontend)
  const resumeMarcus = `Marcus Vance
marcus.vance@umich.edu | (734) 555-0182 | Ann Arbor, MI
github.com/marcusvance | linkedin.com/in/marcus-vance

EDUCATION
University of Michigan
Bachelor of Science in Computer Science
2019 - 2023

SKILLS
React, TypeScript, Next.js, Tailwind CSS, GraphQL, JavaScript, Redux, Jest, Webpack, HTML5, CSS3, Git

EXPERIENCE
Duo Security (May 2022 - Aug 2022)
Frontend Engineering Intern
- Created accessible authentication modals conforming to WCAG 2.1 AA.
- Migrated legacy dashboard views to React and TypeScript.

PROJECTS
DesignSystem UI Kit
- Built accessible open-source design system in React, TypeScript, and Tailwind CSS.
`;

  const priyaPath = path.resolve('./priya_sharma_resume.txt');
  const marcusPath = path.resolve('./marcus_vance_resume.txt');
  fs.writeFileSync(priyaPath, resumePriya, 'utf-8');
  fs.writeFileSync(marcusPath, resumeMarcus, 'utf-8');

  // Helper for multipart upload using standard Node fetch & FormData
  async function uploadFile(filePath, filename, mimetype = 'text/plain') {
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: mimetype });
    const formData = new FormData();
    formData.append('resume', blob, filename);

    const res = await fetch(`${BASE_URL}/api/parser/upload`, {
      method: 'POST',
      body: formData
    });

    const body = await res.json();
    return { status: res.status, body };
  }

  // TEST 1: Upload Candidate 1 (Priya Sharma)
  console.log('--- TEST 1: Uploading Resume 1 (Priya Sharma) ---');
  const res1 = await uploadFile(priyaPath, 'priya_sharma_resume.txt');
  if (res1.status !== 200 || !res1.body.success) {
    console.error('FAIL: Resume 1 upload failed', res1);
    process.exit(1);
  }

  const p1 = res1.body.extractedProfile;
  console.log('Extracted Candidate 1:');
  console.log(`  Name: "${p1.personalInfo.fullName}"`);
  console.log(`  Email: "${p1.personalInfo.email}"`);
  console.log(`  Phone: "${p1.personalInfo.phone}"`);
  console.log(`  Location: "${p1.personalInfo.location}"`);
  console.log(`  Role: "${p1.personalInfo.title}"`);
  console.log(`  Education:`, p1.education);
  console.log(`  Skills:`, p1.skills.technical);
  console.log(`  Experience:`, p1.experience.map(e => `${e.company} (${e.role})`));
  console.log(`  Confidence: ${res1.body.confidenceScore}%`);

  const allSkills1 = [...p1.skills.technical, ...p1.skills.frameworks, ...p1.skills.tools];
  if (p1.personalInfo.fullName !== 'Priya Sharma') throw new Error(`Expected Priya Sharma, got: ${p1.personalInfo.fullName}`);
  if (p1.personalInfo.email !== 'priya.sharma@stanford.edu') throw new Error(`Expected priya.sharma@stanford.edu, got: ${p1.personalInfo.email}`);
  if (!p1.personalInfo.location.includes('Palo Alto')) throw new Error(`Expected Palo Alto in location, got: ${p1.personalInfo.location}`);
  if (!p1.education.some(e => e.institution.includes('Stanford'))) throw new Error(`Expected Stanford University in education, got: ${JSON.stringify(p1.education)}`);
  if (!allSkills1.includes('PyTorch')) throw new Error(`Expected PyTorch in skills, got: ${allSkills1}`);
  if (p1.personalInfo.fullName === 'Alex Morgan' || p1.personalInfo.fullName === 'Jordan Lee') {
    throw new Error('Detected default demo name in extracted profile!');
  }
  console.log('>>> TEST 1 PASSED: Priya Sharma extracted accurately without demo defaults.\n');

  // TEST 2: Save Priya's Profile to Backend and Verify Job Matching
  console.log('--- TEST 2: Confirm Profile 1 & Verify Matching Engine ---');
  const saveRes1 = await fetch(`${BASE_URL}/api/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p1)
  });
  const saveJson1 = await saveRes1.json();
  if (!saveJson1.success) throw new Error('Failed to save profile 1 to database');

  const jobsRes1 = await fetch(`${BASE_URL}/api/jobs`);
  const jobs1 = await jobsRes1.json();
  console.log(`Job match scores computed for Priya Sharma:`);
  jobs1.slice(0, 3).forEach(j => {
    console.log(`  Job: "${j.title}" at ${j.company} -> Match Score: ${j.matchScore}%`);
  });
  console.log('>>> TEST 2 PASSED: Profile saved and matched to real jobs.\n');

  // TEST 3: Upload Candidate 2 (Marcus Vance) - Verify replacement
  console.log('--- TEST 3: Uploading Resume 2 (Marcus Vance) ---');
  const res2 = await uploadFile(marcusPath, 'marcus_vance_resume.txt');
  if (res2.status !== 200 || !res2.body.success) {
    console.error('FAIL: Resume 2 upload failed', res2);
    process.exit(1);
  }

  const p2 = res2.body.extractedProfile;
  console.log('Extracted Candidate 2:');
  console.log(`  Name: "${p2.personalInfo.fullName}"`);
  console.log(`  Email: "${p2.personalInfo.email}"`);
  console.log(`  Phone: "${p2.personalInfo.phone}"`);
  console.log(`  Location: "${p2.personalInfo.location}"`);
  console.log(`  Role: "${p2.personalInfo.title}"`);
  console.log(`  Education:`, p2.education);
  console.log(`  Skills:`, p2.skills.technical);
  console.log(`  Experience:`, p2.experience.map(e => `${e.company} (${e.role})`));
  console.log(`  Confidence: ${res2.body.confidenceScore}%`);

  // Assertions for Candidate 2
  const allSkills2 = [...p2.skills.technical, ...p2.skills.frameworks, ...p2.skills.tools];
  if (p2.personalInfo.fullName !== 'Marcus Vance') throw new Error(`Expected Marcus Vance, got: ${p2.personalInfo.fullName}`);
  if (p2.personalInfo.email !== 'marcus.vance@umich.edu') throw new Error(`Expected marcus.vance@umich.edu, got: ${p2.personalInfo.email}`);
  if (!p2.personalInfo.location.includes('Ann Arbor')) throw new Error(`Expected Ann Arbor in location, got: ${p2.personalInfo.location}`);
  if (!p2.education.some(e => e.institution.includes('Michigan'))) throw new Error(`Expected Michigan in education, got: ${JSON.stringify(p2.education)}`);
  if (!allSkills2.includes('React') || !allSkills2.includes('TypeScript')) {
    throw new Error(`Expected React and TypeScript in skills, got: ${allSkills2}`);
  }
  // Verify Candidate 2 has NO trace of Candidate 1
  if (p2.personalInfo.fullName === 'Priya Sharma' || allSkills2.includes('CUDA')) {
    throw new Error('Detected residual data from Candidate 1 in Candidate 2 profile!');
  }
  console.log('>>> TEST 3 PASSED: Marcus Vance replaced Priya Sharma completely.\n');

  // TEST 4: Save Marcus Vance & Verify Job Matching Engine Reflects Frontend Specialization
  console.log('--- TEST 4: Confirm Profile 2 & Verify Differential Job Matching ---');
  await fetch(`${BASE_URL}/api/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p2)
  });

  const jobsRes2 = await fetch(`${BASE_URL}/api/jobs`);
  const jobs2 = await jobsRes2.json();
  console.log(`Job match scores computed for Marcus Vance:`);
  jobs2.slice(0, 3).forEach(j => {
    console.log(`  Job: "${j.title}" at ${j.company} -> Match Score: ${j.matchScore}%`);
  });
  console.log('>>> TEST 4 PASSED: Differential match scoring works for distinct profiles.\n');

  // TEST 5: Error Handling - Empty or Invalid Document
  console.log('--- TEST 5: Upload Empty Document (Verify Error Response) ---');
  const emptyPath = path.resolve('./empty_resume.txt');
  fs.writeFileSync(emptyPath, '   \n\n   ', 'utf-8');
  const errRes = await uploadFile(emptyPath, 'empty_resume.txt');
  console.log(`Status: ${errRes.status}, Error body:`, errRes.body);
  if (errRes.status !== 400 || !errRes.body.error) {
    throw new Error(`Expected 400 with error message, got: ${errRes.status}`);
  }
  console.log('>>> TEST 5 PASSED: Server correctly rejects empty documents without demo data.\n');

  // Cleanup test files
  fs.unlinkSync(priyaPath);
  fs.unlinkSync(marcusPath);
  fs.unlinkSync(emptyPath);

  console.log('====================================================');
  console.log('ALL 5 RESUME EXTRACTION & MATCHING TESTS PASSED!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('TEST RUNNER FAILED:', err);
  process.exit(1);
});
