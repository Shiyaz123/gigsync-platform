import fs from 'fs';
import path from 'path';
import { Document, Packer, Paragraph, TextRun } from 'docx';

async function testDocxUpload() {
  console.log('--- Generating real binary .docx resume for Dr. Aris Thorne ---');
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ children: [new TextRun({ text: 'Dr. Aris Thorne', bold: true, size: 28 })] }),
        new Paragraph({ children: [new TextRun('aris.thorne@cmu.edu | (412) 268-2000 | Pittsburgh, PA')] }),
        new Paragraph({ children: [new TextRun('github.com/aris-thorne | linkedin.com/in/aris-thorne')] }),
        new Paragraph({ children: [new TextRun({ text: 'EDUCATION', bold: true })] }),
        new Paragraph({ children: [new TextRun('Carnegie Mellon University')] }),
        new Paragraph({ children: [new TextRun('Master of Science in Robotics and Systems Engineering')] }),
        new Paragraph({ children: [new TextRun('2021 - 2024')] }),
        new Paragraph({ children: [new TextRun({ text: 'SKILLS', bold: true })] }),
        new Paragraph({ children: [new TextRun('C++, Python, ROS, Linux, Docker, Git, OpenCV, CUDA')] }),
        new Paragraph({ children: [new TextRun({ text: 'EXPERIENCE', bold: true })] }),
        new Paragraph({ children: [new TextRun('Carnegie Robotics LLC (Jun 2023 - Aug 2023)')] }),
        new Paragraph({ children: [new TextRun('Robotics Systems Engineering Intern')] }),
        new Paragraph({ children: [new TextRun('• Developed real-time stereo vision pipelines in C++.')] }),
        new Paragraph({ children: [new TextRun({ text: 'PROJECTS', bold: true })] }),
        new Paragraph({ children: [new TextRun('Autonomous Rover Navigation')] }),
        new Paragraph({ children: [new TextRun('• Integrated LiDAR SLAM and path planning in ROS.')] })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const docxPath = path.resolve('./aris_thorne_resume.docx');
  fs.writeFileSync(docxPath, buffer);
  console.log(`Generated binary .docx (${buffer.length} bytes) at ${docxPath}`);

  // Test multipart/form-data upload
  console.log('Uploading binary .docx to http://localhost:5000/api/parser/upload...');
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const formData = new FormData();
  formData.append('resume', blob, 'aris_thorne_resume.docx');

  const res = await fetch('http://localhost:5000/api/parser/upload', {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (res.status !== 200 || !data.success) {
    console.error('Binary DOCX upload failed:', res.status, data);
    process.exit(1);
  }

  const p = data.extractedProfile;
  console.log('Extracted from binary .docx:');
  console.log(`  Name: "${p.personalInfo.fullName}"`);
  console.log(`  Email: "${p.personalInfo.email}"`);
  console.log(`  Location: "${p.personalInfo.location}"`);
  console.log(`  Education:`, p.education);
  console.log(`  Skills:`, [...p.skills.technical, ...p.skills.frameworks, ...p.skills.tools]);
  console.log(`  Experience:`, p.experience.map(e => `${e.company} (${e.role})`));
  console.log(`  Confidence: ${data.confidenceScore}%`);

  // Assertions
  if (!p.personalInfo.fullName.includes('Aris Thorne')) {
    throw new Error(`Expected Aris Thorne, got: ${p.personalInfo.fullName}`);
  }
  if (p.personalInfo.email !== 'aris.thorne@cmu.edu') {
    throw new Error(`Expected aris.thorne@cmu.edu, got: ${p.personalInfo.email}`);
  }
  if (!p.personalInfo.location.includes('Pittsburgh')) {
    throw new Error(`Expected Pittsburgh, got: ${p.personalInfo.location}`);
  }
  if (!p.education.some(e => e.institution.includes('Carnegie Mellon'))) {
    throw new Error(`Expected Carnegie Mellon, got: ${JSON.stringify(p.education)}`);
  }
  const allSkills = [...p.skills.technical, ...p.skills.frameworks, ...p.skills.tools];
  if (!allSkills.includes('C++') || !allSkills.includes('Python')) {
    throw new Error(`Expected C++ and Python, got: ${allSkills}`);
  }

  // Cleanup
  fs.unlinkSync(docxPath);
  console.log('\n>>> BINARY DOCX PARSER TEST PASSED SUCCESSFULLY!');
}

testDocxUpload().catch(err => {
  console.error('DOCX TEST FAILED:', err);
  process.exit(1);
});
