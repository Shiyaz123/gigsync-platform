import test from 'node:test';
import assert from 'node:assert/strict';
import { parseResumeText } from '../services/parserService';

test('ResumeExtraction: parses ZAINAB_RAKIAH (1).pdf layout accurately', () => {
  const nemathResumeText = `
NEMATH MIYAN
Computer Science & Engineering Student
+91 74114 78395 | nemathmiyan78@gmail.com

PROFESSIONAL SUMMARY
Computer Science and Engineering student at Ghousia College of Engineering with an interest in software development, artificial intelligence, and innovative technology solutions.

EDUCATION
Ghousia College of Engineering
2023 – 2027
B.E. in Computer Science & Engineering
CGPA: 7.0

PROJECTS
BLOOM – Pregnancy Companion Application
Personal Project
• Developed a pregnancy companion app concept designed to help users follow pregnancy progress and access pregnancy-related information.
• Planned features include a pregnancy timeline, baby growth tracking, wellness chat, photo gallery, community interaction, and emergency assistance.
• Focused on creating a user-friendly experience that brings pregnancy tracking and useful resources together.

DROPBOX – Offline Local File Sharing
Personal Project
• Designed an offline file-sharing application concept that allows users on the same Wi-Fi network or mobile hotspot to exchange files without internet access.
• Focused on local-network communication to transfer files directly between connected devices.
• Aimed to support sharing documents, images, videos, and other files without relying on cloud storage.

MOODYFY – Mood-Based Music Player
Personal Project | 2024
• Developed a mood-based music player concept using facial expression recognition to identify emotions such as happiness, sadness, anger, and neutrality.
• Explored computer vision and deep learning using Python, OpenCV, and TensorFlow/Keras for emotion classification and personalised music recommendations.
• Designed the application around real-time facial analysis and music playback integration.

TECHNICAL SKILLS
Basic Python, Basic Java, JavaScript, C, HTML, CSS, React.js, Node.js, Express.js, REST APIs
Machine Learning Fundamentals, OpenCV, TensorFlow, Keras, Scikit-learn, Facial Recognition, Prompt Engineering
MySQL, MongoDB, Git, GitHub, VS Code, Data Structures & Algorithms, Computer Vision
`;

  const parsed = parseResumeText(nemathResumeText);
  const profile = parsed.extractedProfile;

  // 1. Candidate Full Name
  assert.equal(profile.personalInfo.fullName, 'NEMATH MIYAN');

  // 2. Contact Coordinates
  assert.equal(profile.personalInfo.email, 'nemathmiyan78@gmail.com');
  assert.equal(profile.personalInfo.phone, '+91 74114 78395');
  assert.equal(profile.personalInfo.title, 'Computer Science & Engineering Student');
  assert.equal(profile.personalInfo.location, '', 'Location should be empty as it is not stated');

  // 3. Education (No blank cards!)
  assert.equal(profile.education.length, 1);
  assert.equal(profile.education[0].institution, 'Ghousia College of Engineering');
  assert.equal(profile.education[0].degree, 'B.E.');
  assert.equal(profile.education[0].fieldOfStudy, 'Computer Science & Engineering');
  assert.equal(profile.education[0].startDate, '2023');
  assert.equal(profile.education[0].endDate, '2027');
  assert.equal(profile.education[0].gpa, '7.0');

  // 4. Skills (Normalized and deduplicated)
  assert.ok(profile.skills.technical.includes('Python'));
  assert.ok(profile.skills.technical.includes('JavaScript'));
  assert.ok(profile.skills.technical.includes('Java'));
  assert.ok(profile.skills.technical.includes('C'));
  assert.ok(profile.skills.frameworks.includes('React'));
  assert.ok(profile.skills.frameworks.includes('Node.js'));
  assert.ok(profile.skills.frameworks.includes('Express'));
  assert.ok(profile.skills.frameworks.includes('REST APIs'));
  assert.ok(profile.skills.tools.includes('MySQL'));
  assert.ok(profile.skills.tools.includes('Git'));

  // 5. Projects
  assert.equal(profile.projects.length, 3);
  assert.equal(profile.projects[0].title, 'BLOOM');
  assert.equal(profile.projects[0].bullets.length, 3);
  assert.equal(profile.projects[1].title, 'DROPBOX');
  assert.equal(profile.projects[2].title, 'MOODYFY');

  // 6. Work Experience (Must be 0 for this student resume, NOT synthetic)
  assert.equal(profile.experience.length, 0);

  // 7. Meaningful Evidence Score
  assert.ok(parsed.confidenceScore >= 85, `Confidence score should be high based on evidence, got ${parsed.confidenceScore}`);
});

test('ResumeExtraction: parses ZAINAB_RAKIAH.pdf layout accurately', () => {
  const zainabResumeText = `
Zainab Rakiah
Bangalore, Karnataka
+91 8861044384 zainabrakiah2018@gmail.com
github.com/ZainabRakiah linkedin.com/in/zainab-rakiah

EDUCATION
Ghousia College of Engineering 2023–2027
B.E. in Computer Science Engineering (AI & ML) CGPA: 8.41
Mount Carmel PU College 83%
Trillium Public School 97.92%

PROJECTS
Pothole Detection System (Ongoing)
• Developing a computer vision-based pothole detection system using Python and image processing techniques.
• Working on feature extraction and model training for real-world road conditions.
• Focused on improving detection accuracy and optimizing performance for dynamic environments.

SafeWalk
• Developed an application to suggest safer walking and travel routes during nighttime.
• Implemented safety scoring using street lighting, traffic density, and user-reported incidents.
• Integrated features such as real-time alerts and live location sharing.

Skin Cancer (Melanoma) Detection
• Built a CNN-based image classification model for skin lesion detection.
• Worked on feature extraction, model optimization, and handling imbalanced datasets.
• Evaluated model performance using standard machine learning metrics.

TECHNICAL SKILLS
Languages: Python, Java, C, SQL
Databases & Tools: PostgreSQL, MongoDB, Git, Linux
`;

  const parsed = parseResumeText(zainabResumeText);
  const profile = parsed.extractedProfile;

  assert.equal(profile.personalInfo.fullName, 'Zainab Rakiah');
  assert.equal(profile.personalInfo.location, 'Bangalore, Karnataka');
  assert.equal(profile.personalInfo.email, 'zainabrakiah2018@gmail.com');
  assert.equal(profile.personalInfo.phone, '+91 8861044384');

  assert.ok(profile.education.length >= 1);
  assert.equal(profile.education[0].institution, 'Ghousia College of Engineering');
  assert.equal(profile.education[0].degree, 'B.E.');
  assert.equal(profile.education[0].fieldOfStudy, 'Computer Science Engineering (AI & ML)');
  assert.equal(profile.education[0].endDate, '2027');
  assert.equal(profile.education[0].gpa, '8.41');

  assert.equal(profile.projects.length, 3);
  assert.equal(profile.projects[0].title, 'Pothole Detection System (Ongoing)');
  assert.equal(profile.projects[1].title, 'SafeWalk');
  assert.equal(profile.projects[2].title, 'Skin Cancer (Melanoma) Detection');

  assert.ok(profile.skills.technical.includes('Python'));
  assert.ok(profile.skills.technical.includes('SQL'));
  assert.ok(profile.skills.tools.includes('PostgreSQL'));
  assert.ok(profile.skills.tools.includes('Git'));
  assert.ok(profile.skills.tools.includes('Linux'));

  assert.equal(profile.experience.length, 0);
  assert.ok(parsed.confidenceScore >= 85);
});

test('ResumeExtraction: zero technical skills resume has no fabricated skills', () => {
  const nonTechResume = `
Eleanor Vance
eleanor.vance@example.com | (555) 234-5678 | Chicago, IL

PROFESSIONAL SUMMARY
Experienced Sales Director and Corporate Account Executive with 8+ years leading enterprise partnerships, contract negotiations, and revenue growth.

EDUCATION
Northwestern University
Bachelor of Arts in Communications, 2012 - 2016

EXPERIENCE
Apex Media Group - Senior Account Director
Chicago, IL | Jan 2018 - Present
• Closed $4.2M in annual recurring advertising contracts across Midwest territories.
• Led a high-performing sales team of 8 regional account executives.
`;

  const parsed = parseResumeText(nonTechResume);
  const profile = parsed.extractedProfile;

  assert.equal(profile.personalInfo.fullName, 'Eleanor Vance');
  assert.equal(profile.personalInfo.email, 'eleanor.vance@example.com');
  assert.equal(profile.personalInfo.location, 'Chicago, IL');

  // Verify ZERO technical skills were fabricated
  assert.deepEqual(profile.skills.technical, []);
  assert.deepEqual(profile.skills.frameworks, []);
  assert.deepEqual(profile.skills.tools, []);

  // Verify education
  assert.equal(profile.education.length, 1);
  assert.equal(profile.education[0].institution, 'Northwestern University');
  assert.equal(profile.education[0].degree, 'Bachelor of Arts');

  // Verify experience
  assert.equal(profile.experience.length, 1);
  assert.equal(profile.experience[0].company, 'Apex Media Group');
  assert.equal(profile.experience[0].role, 'Senior Account Director');
});

test('ResumeExtraction: handles missing fields cleanly with flags', () => {
  const minimalResume = `
Marcus Aurelius
marcus@philosophy.org

EDUCATION
Athens Academy
Bachelor in Philosophy, 2019 - 2023
`;

  const parsed = parseResumeText(minimalResume);
  const profile = parsed.extractedProfile;

  assert.equal(profile.personalInfo.fullName, 'Marcus Aurelius');
  assert.equal(profile.personalInfo.email, 'marcus@philosophy.org');
  assert.equal(profile.personalInfo.phone, '', 'Phone should be empty');
  assert.equal(profile.personalInfo.location, '', 'Location should be empty');

  // Verify flags indicate review needed for missing fields
  const phoneFlag = parsed.flags.find(f => f.field === 'phone');
  assert.ok(phoneFlag?.needsReview, 'Phone flag must indicate review needed');

  const locFlag = parsed.flags.find(f => f.field === 'location');
  assert.ok(locFlag?.needsReview, 'Location flag must indicate review needed');

  // Verify empty education card is NOT generated when no education is detected
  const noEduResume = `
Just A Name
test@example.com | (555) 123-4567
`;
  const noEduParsed = parseResumeText(noEduResume);
  assert.equal(noEduParsed.extractedProfile.education.length, 0, 'No education card when none in text');
});
